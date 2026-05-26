import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the direct client wrapper because this runs inside Next.js API routes context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const headersList = request.headers
    
    // Look up webhook token in headers or searchParams to find matching store
    const appToken = headersList.get('X-App-Token') || headersList.get('Authorization')
    
    if (!appToken) {
      return NextResponse.json({ error: 'Token de autorização ausente.' }, { status: 401 })
    }

    // 1. Fetch integration row with matching credentials token
    const { data: integration, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('store_id')
      .eq('credentials->>app_token', appToken)
      .eq('provider', 'loja_integrada')
      .eq('active', true)
      .single()

    if (intError || !integration) {
      return NextResponse.json({ error: 'Integração não cadastrada ou inativa.' }, { status: 404 })
    }

    const storeId = integration.store_id

    // 2. Parse Loja Integrada payload details (standard orders JSON format)
    const orderId = body.numero || body.id
    const totalAmount = parseFloat(body.valor_total || body.total) || 0
    const paymentMethod = body.pagamentos?.[0]?.forma_pagamento?.codigo || 'pix'
    
    // Items
    const items = body.itens || []

    if (items.length === 0) {
      return NextResponse.json({ error: 'Pedido sem itens.' }, { status: 400 })
    }

    // 3. Register sale on Mimus (reusing database triggers for stock decrement & finance logging)
    const { data: saleData, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert([{
        store_id: storeId,
        total_value: totalAmount,
        discount: parseFloat(body.valor_desconto || 0) || 0,
        payment_method: paymentMethod.toLowerCase().includes('pix') ? 'pix' : 
                        paymentMethod.toLowerCase().includes('boleto') ? 'money' : 'credit_card'
      }])
      .select()

    if (saleError) throw saleError
    const saleId = saleData[0].id

    // 4. Look up products by SKU and insert sale items
    for (const item of items) {
      const sku = item.sku || item.codigo
      
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id, sale_price')
        .eq('sku', sku)
        .eq('store_id', storeId)
        .single()

      if (product) {
        await supabaseAdmin.from('sale_items').insert([{
          sale_id: saleId,
          product_id: product.id,
          quantity: parseInt(item.quantidade) || 1,
          unit_price: parseFloat(item.preco_venda || product.sale_price)
        }])
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Pedido #${orderId} processado e estoque sincronizado no Mimus.` 
    })

  } catch (err: any) {
    console.error('Erro no webhook da Loja Integrada:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
