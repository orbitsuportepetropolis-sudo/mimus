import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint não disponível em produção.' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    // Buscar perfil e loja
    const { data: profile } = await supabase
      .from('profiles')
      .select('store_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.store_id) {
      return NextResponse.json({ error: 'Loja não configurada.' }, { status: 400 })
    }

    const storeId = profile.store_id

    const body = await request.json()
    const { 
      message, 
      sessionId, 
      mentionedProduct, 
      imageUrl, 
      currentTheme 
    } = body

    if (!message && !imageUrl) {
      return NextResponse.json({ error: 'Mensagem ou imagem necessária.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key não configurada.' }, { status: 500 })
    }

    // Carregar catálogo atual para resolução de contexto
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, sku, barcode, cost_price, sale_price, quantity_in_stock, visible_in_storefront, is_launch, image_url')
      .eq('store_id', storeId)
      .eq('active', true)
      .limit(60)

    const systemPrompt = `
Você é o "Mimus Work Agent" (Motor Agêntico Co-Work do Mimus).
Seu papel é atuar como um co-piloto operacional da loja, com foco em:
1. "IA -> Vitrine": cadastrar produtos de forma autônoma (extraindo nome, SKU, custo, venda, estoque inicial, categoria).
2. Gerenciar produtos existentes com menção @ (vincular foto, marcar como lançamento, mudar preço ou estoque).
3. Personalizar o layout e tema da Vitrine Studio (cores, banners, títulos e badges).

CATÁLOGO ATUAL DA LOJA (para você correlacionar ou atualizar):
${JSON.stringify(existingProducts || [], null, 2)}

PRODUTO SELECIONADO VIA @ (SE HOUVER):
${mentionedProduct ? JSON.stringify(mentionedProduct, null, 2) : 'Nenhum'}

FOTO/ANEXO ENVIADO (SE HOUVER):
${imageUrl || 'Nenhum'}

TEMA ATUAL DA VITRINE:
${JSON.stringify(currentTheme || {}, null, 2)}

AÇÕES QUE VOCÊ PODE EXECUTAR NO ARRAY "actions":
- type: "upsert_product"
  payload: {
    "name": string (obrigatório),
    "brand": string | null,
    "category": string | null,
    "sku": string (se o usuário não der, gere um inteligente ex: BAT-01),
    "barcode": string | null,
    "cost_price": number (padrão 0 se não informado),
    "sale_price": number (obrigatório),
    "quantity_in_stock": number (padrão 1 se não informado),
    "image_url": string | null (se fornecido imagem ou se o usuário pediu),
    "description": string | null (gere uma descrição comercial encantadora para a vitrine),
    "visible_in_storefront": boolean (padrão true),
    "is_launch": boolean (true se o usuário mencionar novidade ou lançamento)
  }

- type: "update_product_photo"
  payload: {
    "productId": string (obrigatório),
    "image_url": string (obrigatório),
    "visible_in_storefront": boolean,
    "is_launch": boolean
  }

- type: "adjust_stock"
  payload: {
    "productId": string,
    "quantity_change": number (positivo para entrada, negativo para saída),
    "reason": string
  }

- type: "update_storefront_theme"
  payload: {
    "primary_color": string (hex color ex: "#E11D48", "#2563EB", "#059669"),
    "banner_title": string,
    "banner_subtitle": string,
    "featured_badge": string
  }

REGRAS:
1. Responda em português brasileiro com tom ágil, prestativo e profissional de co-piloto.
2. No campo "reply", informe claramente o que foi realizado ou o que o usuário precisa confirmar.
3. Se o usuário mandar uma foto junto com um produto marcado com @ (ou nome do produto), gere a ação 'update_product_photo'.
4. Se o usuário passar uma lista ou lote de produtos (ex: "Chegaram 5 Batons Matte a R$ 40... e 3 Perfumes a R$ 120..."), gere um item "upsert_product" para cada um!
5. Se o usuário pedir para mudar as cores ou banners da vitrine, gere a ação "update_storefront_theme".

DEVOLVA EXCLUSIVAMENTE UM JSON NO FORMATO:
{
  "reply": "Texto explicativo...",
  "actions": [
    { "type": "...", "payload": { ... } }
  ]
}
`

    // Chamada ao Gemini 2.5 Flash / 2.0 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    
    const geminiPayload: any = {
      contents: [{
        role: "user",
        parts: [
          { text: `${systemPrompt}\n\nCOMANDO DO LOJISTA:\n"${message || 'Analise a imagem enviada para o produto'}"` }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    }

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Mimus Work Gemini API Error:', errText)
      return NextResponse.json({ error: 'Falha ao processar com a IA do Mimus Work' }, { status: 502 })
    }

    const resJson = await geminiRes.json()
    const contentText = resJson.candidates?.[0]?.content?.parts?.[0]?.text

    let parsedResult: { reply: string; actions: any[] } = {
      reply: 'Comando processado com sucesso pelo Mimus Work.',
      actions: []
    }

    try {
      parsedResult = JSON.parse(contentText)
    } catch (e) {
      console.error('Erro ao interpretar JSON da IA:', e, contentText)
      parsedResult.reply = contentText || 'Ação registrada.'
    }

    // Executar as ações geradas no Supabase
    const executedActions: any[] = []

    for (const act of (parsedResult.actions || [])) {
      if (act.type === 'upsert_product' && act.payload?.name) {
        const prodData = {
          store_id: storeId,
          name: act.payload.name,
          brand: act.payload.brand || null,
          category: act.payload.category || null,
          sku: act.payload.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: act.payload.barcode || null,
          cost_price: Number(act.payload.cost_price || 0),
          sale_price: Number(act.payload.sale_price || 0),
          quantity_in_stock: Number(act.payload.quantity_in_stock || 1),
          min_stock_alert: 2,
          image_url: act.payload.image_url || imageUrl || null,
          description: act.payload.description || null,
          visible_in_storefront: act.payload.visible_in_storefront !== false,
          is_launch: !!act.payload.is_launch,
          active: true
        }

        const { data: inserted, error: insErr } = await supabase
          .from('products')
          .insert(prodData)
          .select()
          .single()

        if (!insErr && inserted) {
          executedActions.push({ type: 'product_created', data: inserted })
        }
      } else if (act.type === 'update_product_photo' && (act.payload?.productId || mentionedProduct?.id)) {
        const targetId = act.payload?.productId || mentionedProduct?.id
        const newImg = act.payload?.image_url || imageUrl

        if (targetId && newImg) {
          const { data: updated, error: upErr } = await supabase
            .from('products')
            .update({
              image_url: newImg,
              visible_in_storefront: true,
              is_launch: act.payload.is_launch ?? true
            })
            .eq('id', targetId)
            .eq('store_id', storeId)
            .select()
            .single()

          if (!upErr && updated) {
            executedActions.push({ type: 'product_photo_updated', data: updated })
          }
        }
      } else if (act.type === 'update_storefront_theme' && act.payload) {
        const { data: updatedStore, error: storeErr } = await supabase
          .from('stores')
          .update({
            storefront_theme: {
              ...(currentTheme || {}),
              ...act.payload
            }
          })
          .eq('id', storeId)
          .select('storefront_theme')
          .single()

        if (!storeErr && updatedStore) {
          executedActions.push({ type: 'theme_updated', data: updatedStore.storefront_theme })
        }
      } else if (act.type === 'adjust_stock' && (act.payload?.productId || mentionedProduct?.id)) {
        const targetId = act.payload?.productId || mentionedProduct?.id
        const qtyChange = Number(act.payload.quantity_change || 0)

        if (targetId && qtyChange !== 0) {
          const { data: currentProd } = await supabase
            .from('products')
            .select('quantity_in_stock')
            .eq('id', targetId)
            .single()

          if (currentProd) {
            const newQty = Math.max(0, (currentProd.quantity_in_stock || 0) + qtyChange)
            await supabase
              .from('products')
              .update({ quantity_in_stock: newQty })
              .eq('id', targetId)

            executedActions.push({ 
              type: 'stock_adjusted', 
              data: { productId: targetId, newQuantity: newQty, change: qtyChange } 
            })
          }
        }
      }
    }

    // Registrar Telemetria em ai_usage_logs (silencioso e seguro)
    const usageMetadata = resJson.usageMetadata || {}
    const promptTokens = usageMetadata.promptTokenCount || 400
    const completionTokens = usageMetadata.candidatesTokenCount || 200
    const totalTokens = usageMetadata.totalTokenCount || (promptTokens + completionTokens)
    // Custo estimado do Gemini 2.5 Flash (~$0.075 / 1M input, $0.30 / 1M output -> ~R$ 0.0006)
    const estimatedCostBrl = ((promptTokens * 0.075 + completionTokens * 0.30) / 1000000) * 5.8

    try {
      await supabase.from('ai_usage_logs').insert({
        store_id: storeId,
        user_id: user.id,
        action_type: executedActions.map(a => a.type).join(',') || 'general_cowork',
        model: 'gemini-2.5-flash',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost_brl: estimatedCostBrl
      })
    } catch (telemetryErr) {
      // Falha de telemetria não trava a resposta
      console.warn('Telemetria AI log ignorada:', telemetryErr)
    }

    return NextResponse.json({
      reply: parsedResult.reply,
      executedActions
    })

  } catch (error: any) {
    console.error('Erro na rota /api/work/agent:', error)
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 })
  }
}
