import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''

function detectCardBrand(number: string): string {
  const cleanNumber = number.replace(/\D/g, '')
  if (/^4/.test(cleanNumber)) return 'visa'
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanNumber)) return 'master'
  if (/^3[47]/.test(cleanNumber)) return 'amex'
  if (/^(606282|3841)/.test(cleanNumber)) return 'hipercard'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6278|6362|6363|6504|6516|6550)/.test(cleanNumber)) return 'elo'
  if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'diners'
  return 'visa' // default/fallback
}

export async function POST(request: Request) {
  try {
    const { storeId, email, name, paymentMethod, cpfCnpj, phone, usePromo, creditCard } = await request.json()

    if (!storeId || !email || !name || !paymentMethod || !cpfCnpj) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 })
    }

    const price = 49.00

    // MOCK MODE: If no Mercado Pago Access Token is configured (or set to default placeholder), run simulated checkout
    const isMock = !MERCADO_PAGO_ACCESS_TOKEN || MERCADO_PAGO_ACCESS_TOKEN === 'mock' || MERCADO_PAGO_ACCESS_TOKEN.startsWith('seu_')
    if (isMock) {
      console.log('Running checkout in MOCK mode...')
      
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockSubId = 'mp_sub_mock_' + Math.random().toString(36).substr(2, 9)
      const mockCustId = 'mp_cus_mock_' + Math.random().toString(36).substr(2, 9)

      // Calculate promotional ends date if applicable (6 months from now)
      const promoEndsAt = usePromo ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() : null
      const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // Update store in database
      const { error: updateError } = await supabaseAdmin
        .from('stores')
        .update({
          plan: 'pro',
          plan_status: 'active',
          promotional_ends_at: promoEndsAt,
          asaas_customer_id: mockCustId,
          asaas_subscription_id: mockSubId,
          subscription_ends_at: subscriptionEndsAt
        })
        .eq('id', storeId)

      if (updateError) throw updateError

      if (paymentMethod === 'PIX') {
        const mockPixKey = `00020126580014br.gov.bcb.pix0136mimuspay-${price}-mock-subscription-620705033906304CA38`
        return NextResponse.json({
          success: true,
          mock: true,
          subscriptionId: mockSubId,
          billingType: 'PIX',
          pixCopyPaste: mockPixKey,
          pixQrCodeBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="white"/><rect x="15" y="15" width="40" height="40" fill="%23b5127b"/><rect x="25" y="25" width="20" height="20" fill="white"/><rect x="95" y="15" width="40" height="40" fill="%23b5127b"/><rect x="105" y="25" width="20" height="20" fill="white"/><rect x="15" y="95" width="40" height="40" fill="%23b5127b"/><rect x="25" y="105" width="20" height="20" fill="white"/><rect x="65" y="65" width="20" height="20" fill="%23b5127b"/></svg>'
        })
      }

      return NextResponse.json({
        success: true,
        mock: true,
        subscriptionId: mockSubId,
        billingType: 'CREDIT_CARD'
      })
    }

    // REAL MERCADO PAGO INTEGRATION MODE
    console.log('Running checkout in REAL MERCADO PAGO mode...')

    // Dynamic notification/webhook url depending on request host
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const notificationUrl = `${protocol}://${host}/api/billing/webhook`

    const nameParts = name.trim().split(/\s+/)
    const firstName = nameParts[0] || 'Cliente'
    const lastName = nameParts.slice(1).join(' ') || 'Mimus'

    if (paymentMethod === 'PIX') {
      const paymentPayload = {
        transaction_amount: price,
        description: `Assinatura Mimus Pro - ${name}`,
        payment_method_id: 'pix',
        notification_url: notificationUrl,
        payer: {
          email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: cpfCnpj
          }
        }
      }

      const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `pix-${storeId}-${Date.now()}`
        },
        body: JSON.stringify(paymentPayload)
      })

      const paymentData = await paymentResponse.json()
      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || 'Erro ao criar pagamento Pix no Mercado Pago.')
      }

      const paymentId = String(paymentData.id)

      // Update Supabase Store status to pending (Pix needs confirmation)
      const { error: dbError } = await supabaseAdmin
        .from('stores')
        .update({
          plan_status: 'pending',
          asaas_subscription_id: paymentId,
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', storeId)

      if (dbError) throw dbError

      const qrCode = paymentData.point_of_interaction?.transaction_data?.qr_code
      const qrCodeBase64 = paymentData.point_of_interaction?.transaction_data?.qr_code_base64

      return NextResponse.json({
        success: true,
        subscriptionId: paymentId,
        billingType: 'PIX',
        pixCopyPaste: qrCode,
        pixQrCodeBase64: `data:image/png;base64,${qrCodeBase64}`
      })

    } else if (paymentMethod === 'CREDIT_CARD' && creditCard) {
      // 1. Generate Card Token
      const currentYear = new Date().getFullYear()
      const expiryYearFull = String(creditCard.expiryYear).length === 2 
        ? String(currentYear).substring(0, 2) + creditCard.expiryYear 
        : creditCard.expiryYear

      const cardTokenPayload = {
        card_number: creditCard.number,
        expiration_month: parseInt(creditCard.expiryMonth, 10),
        expiration_year: parseInt(expiryYearFull, 10),
        security_code: creditCard.ccv,
        cardholder: {
          name: creditCard.holderName
        }
      }

      const cardTokenResponse = await fetch('https://api.mercadopago.com/v1/card_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify(cardTokenPayload)
      })

      const cardTokenData = await cardTokenResponse.json()
      if (!cardTokenResponse.ok) {
        throw new Error(cardTokenData.message || 'Dados do cartão de crédito inválidos ou recusados.')
      }

      const cardTokenId = cardTokenData.id

      // 2. Create Charge Payment
      const cardBrand = detectCardBrand(creditCard.number)
      const paymentPayload = {
        token: cardTokenId,
        transaction_amount: price,
        description: `Assinatura Mimus Pro - ${name}`,
        installments: 1,
        payment_method_id: cardBrand,
        notification_url: notificationUrl,
        payer: {
          email,
          identification: {
            type: 'CPF',
            number: cpfCnpj
          }
        }
      }

      const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `card-${storeId}-${Date.now()}`
        },
        body: JSON.stringify(paymentPayload)
      })

      const paymentData = await paymentResponse.json()
      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || 'Erro ao processar pagamento com cartão de crédito.')
      }

      if (paymentData.status !== 'approved') {
        throw new Error(
          paymentData.status_detail === 'cc_rejected_bad_filled_other' 
            ? 'Dados do cartão incorretos.' 
            : `Pagamento não aprovado. Status: ${paymentData.status} (${paymentData.status_detail || ''})`
        )
      }

      const paymentId = String(paymentData.id)
      const promoEndsAt = usePromo ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() : null
      const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // Update Supabase Store status to active (Card approved instantly)
      const { error: dbError } = await supabaseAdmin
        .from('stores')
        .update({
          plan: 'pro',
          plan_status: 'active',
          promotional_ends_at: promoEndsAt,
          asaas_subscription_id: paymentId,
          subscription_ends_at: subscriptionEndsAt
        })
        .eq('id', storeId)

      if (dbError) throw dbError

      return NextResponse.json({
        success: true,
        subscriptionId: paymentId,
        billingType: 'CREDIT_CARD'
      })
    } else {
      throw new Error('Método de pagamento inválido ou dados ausentes.')
    }

  } catch (err: any) {
    console.error('Checkout API Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
