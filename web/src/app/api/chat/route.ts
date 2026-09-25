import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text, history, currentProducts, currentCustomers } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key não configurada no servidor.' }, { status: 500 })
    }

    const promptText = `
Você é a Mimus AI, a assistente e operadora virtual inteligente do sistema da loja Mimus cosméticos.
Você tem poderes administrativos para ler dados e executar comandos operacionais na loja:
- Cadastrar produtos e clientes
- Registrar vendas
- Movimentar estoque
- Excluir produtos e clientes
- GERENCIAR A VISIBILIDADE DOS PRODUTOS NA VITRINE PÚBLICA (loja online) através da ação 'update_storefront_visibility'

MEMÓRIA DE CONVERSA:
Você tem acesso ao histórico das últimas mensagens desta conversa. Use-o para entender referências anteriores como:
- "e aquele outro produto?"
- "mude o preço dele para 30"
- "oculte ele da vitrine também"
- "adicione 5 unidades do batom que acabamos de cadastrar"
- "registre a venda desse último item para a Maria"

---
DADOS ATUAIS DA LOJA (para você correlacionar nomes a IDs):

PRODUTOS CADASTRADOS (ID, Nome, SKU, Código de Barras, Preço de Venda, Estoque Atual, Visível na Vitrine, Possui Imagem [has_image]):
${JSON.stringify(currentProducts)}

CLIENTES CADASTRADOS (ID, Nome):
${JSON.stringify(currentCustomers)}
---

Comandos possíveis que você DEVE extrair no array 'actions':
1. Cadastrar novo produto: tipo 'create_product'. Informe name, brand, costPrice, salePrice, quantity (inicial).
2. Cadastrar novo cliente: tipo 'create_customer'. Informe name, phone, instagram, birthday (formato YYYY-MM-DD).
3. Movimentar estoque: tipo 'stock_movement'. Informe productId, quantity (positivo), movementType ('entry' ou 'exit'), reason ('manual_adjustment', 'loss', ou 'purchase').
4. Registrar venda: tipo 'create_sale'. Informe items (lista de { productId, quantity, unitPrice }), customerId (opcional), paymentMethod ('pix', 'money', 'credit_card', ou 'debit_card').
5. Excluir produto: tipo 'delete_product'. Informe productId.
6. Excluir cliente: tipo 'delete_customer'. Informe customerId.
7. Alterar visibilidade na vitrine pública (ocultar ou exibir produtos na vitrine/loja): tipo 'update_storefront_visibility'. Informe productId e visible (boolean: true para exibir na vitrine, false para ocultar da vitrine).

REGRAS OBRIGATÓRIAS DE COMANDOS DE VITRINE:
- Você PODE e DEVE gerenciar a visibilidade da vitrine pública. NUNCA diga que não consegue gerenciar a vitrine ou que suas funções se limitam a outras tarefas. A visibilidade na vitrine É uma de suas funções operacionais!
- Quando o usuário pedir para ocultar produtos zerados ou sem estoque (ex: "Oculte da vitrine todos os itens zerados", "oculte itens sem estoque da vitrine", "tire da vitrine o que acabou"):
  * Analise todos os itens em PRODUTOS CADASTRADOS cujo estoque (stock) seja menor ou igual a 0 (stock <= 0).
  * Para CADA produto zerado encontrado, gere uma ação:
    { "type": "update_storefront_visibility", "productId": "<id_do_produto>", "visible": false }
  * No campo 'reply', liste os nomes dos produtos que foram ocultados da vitrine de maneira amigável.
- Quando o usuário pedir para ocultar produtos sem imagem/foto (ex: "O que estiver sem imagem, oculte da vitrine", "oculte produtos sem foto da vitrine", "tire da vitrine o que não tem foto", "oculte itens sem imagem"):
  * Analise todos os itens em PRODUTOS CADASTRADOS cujo campo 'has_image' seja false (has_image === false).
  * Para CADA produto sem imagem encontrado, gere uma ação:
    { "type": "update_storefront_visibility", "productId": "<id_do_produto>", "visible": false }
  * No campo 'reply', liste os nomes dos produtos que foram ocultados por não terem foto cadastrada.
- Quando o usuário pedir para ocultar um produto específico da vitrine (ex: "Oculte o Babyliss da vitrine"):
  * Localize o produto correspondente e gere a ação { "type": "update_storefront_visibility", "productId": "<id>", "visible": false }.
- Quando o usuário pedir para exibir produtos na vitrine (ex: "Exiba na vitrine os itens com estoque" ou "Mostre o Babyliss na vitrine"):
  * Gere as ações com visible: true para os produtos correspondentes.

EXEMPLO DE RESPOSTA PARA ITENS ZERADOS:
{
  "reply": "Entendido! Ocultei da vitrine todos os produtos que estavam com estoque zerado.",
  "actions": [
    { "type": "update_storefront_visibility", "productId": "prod_1", "visible": false },
    { "type": "update_storefront_visibility", "productId": "prod_2", "visible": false }
  ]
}

EXEMPLO DE RESPOSTA PARA ITENS SEM IMAGEM:
{
  "reply": "Entendido! Ocultei da vitrine os seguintes produtos que estão sem imagem: Base Fluída, Body Cream.",
  "actions": [
    { "type": "update_storefront_visibility", "productId": "id_base_fluida", "visible": false }
  ]
}

Você DEVE responder ESTRITAMENTE em formato JSON com o seguinte formato de resposta:
{
  "reply": "Sua resposta textual amigável aqui explicando a ação ou respondendo a dúvida.",
  "actions": [
    // lista de ações a executar
  ]
}
`

    // Format conversation history for Gemini multi-turn format
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (!h.text || typeof h.text !== 'string') continue
        const role = (h.role === 'model' || h.role === 'agent') ? 'model' : 'user'
        
        // Gemini API requirement: the very first message in contents MUST have role: 'user'
        if (formattedContents.length === 0 && role !== 'user') {
          continue
        }

        // Avoid consecutive messages of same role by combining text
        if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
          formattedContents[formattedContents.length - 1].parts[0].text += `\n${h.text}`
        } else {
          formattedContents.push({ role, parts: [{ text: h.text }] })
        }
      }
    }

    // Append current user message
    if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === 'user') {
      formattedContents[formattedContents.length - 1].parts[0].text += `\n${text}`
    } else {
      formattedContents.push({ role: 'user', parts: [{ text }] })
    }

    let geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: promptText }]
        },
        contents: formattedContents,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    })

    // If systemInstruction or multi-turn fails, fallback to combined single-turn prompt
    if (!geminiResponse.ok) {
      const historyContext = formattedContents.length > 1
        ? `\nHISTÓRICO RECENTE DA CONVERSA:\n${formattedContents.map(c => `${c.role.toUpperCase()}: ${c.parts[0].text}`).join('\n')}\n`
        : ''

      const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${promptText}${historyContext}\n\nMENSAGEM ATUAL DO USUÁRIO:\n"${text}"` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        })
      })

      if (fallbackResponse.ok) {
        geminiResponse = fallbackResponse
      } else {
        const errText = await geminiResponse.text()
        console.error('Gemini API error response:', errText)
        return NextResponse.json({ error: 'Erro na comunicação com a API do Google Gemini' }, { status: 502 })
      }
    }

    const resData = await geminiResponse.json()
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return NextResponse.json({ error: 'Resposta inválida da API do Gemini.' }, { status: 500 })
    }

    let parsed: any = JSON.parse(rawText)
    if (!parsed.actions) parsed.actions = []

    // Fallback de garantia: se o usuário pediu explicitamente para ocultar/exibir produtos na vitrine e a IA hesitou
    const lowerText = text.toLowerCase()
    const isVitrineIntent = lowerText.includes('vitrine') || lowerText.includes('loja')
    const isHideIntent = lowerText.includes('ocult') || lowerText.includes('escond') || lowerText.includes('tir') || lowerText.includes('desativ')
    const isShowIntent = lowerText.includes('exib') || lowerText.includes('mostr') || lowerText.includes('ativ') || lowerText.includes('coloc')
    const isZeroStockIntent = lowerText.includes('zerad') || lowerText.includes('sem estoque') || lowerText.includes('estoque 0') || lowerText.includes('acabou')
    const isNoImageIntent = lowerText.includes('sem imagem') || lowerText.includes('sem foto') || lowerText.includes('nao tem foto') || lowerText.includes('não tem foto') || lowerText.includes('sem fotos') || lowerText.includes('sem imagens')

    if (isVitrineIntent && isHideIntent && isNoImageIntent) {
      // Ocultar itens sem imagem
      const noImageProds = (currentProducts || []).filter((p: any) => p.has_image === false)
      if (noImageProds.length > 0) {
        parsed.actions = noImageProds.map((p: any) => ({
          type: 'update_storefront_visibility',
          productId: p.id,
          visible: false
        }))
        const names = noImageProds.map((p: any) => p.name).join(', ')
        parsed.reply = `Entendido! Ocultei da vitrine todos os ${noImageProds.length} produto(s) sem imagem cadastrada: ${names}.`
      } else {
        parsed.reply = `Todos os seus produtos já possuem imagem cadastrada!`
      }
    } else if (isVitrineIntent && isHideIntent && isZeroStockIntent) {
      // Ocultar itens zerados
      const zeroProds = (currentProducts || []).filter((p: any) => (Number(p.stock) || 0) <= 0)
      if (zeroProds.length > 0) {
        parsed.actions = zeroProds.map((p: any) => ({
          type: 'update_storefront_visibility',
          productId: p.id,
          visible: false
        }))
        const names = zeroProds.map((p: any) => p.name).join(', ')
        parsed.reply = `Entendido! Ocultei da vitrine todos os ${zeroProds.length} produto(s) com estoque zerado: ${names}.`
      } else {
        parsed.reply = `Não encontrei produtos com estoque zerado no momento.`
      }
    } else if (isVitrineIntent && isShowIntent && (isZeroStockIntent === false && (lowerText.includes('com estoque') || lowerText.includes('todos')))) {
      // Exibir itens com estoque
      const inStockProds = (currentProducts || []).filter((p: any) => (Number(p.stock) || 0) > 0)
      if (inStockProds.length > 0) {
        parsed.actions = inStockProds.map((p: any) => ({
          type: 'update_storefront_visibility',
          productId: p.id,
          visible: true
        }))
        const names = inStockProds.map((p: any) => p.name).join(', ')
        parsed.reply = `Entendido! Reativei a exibição na vitrine para os ${inStockProds.length} produto(s) com estoque disponível: ${names}.`
      }
    }

    return NextResponse.json(parsed)

  } catch (err: any) {
    console.error('Chat API Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
