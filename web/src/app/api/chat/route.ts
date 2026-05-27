import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text, currentProducts, currentCustomers } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key não configurada no servidor.' }, { status: 500 })
    }

    const promptText = `
Você é a Mimus AI, a assistente virtual inteligente da loja de cosméticos.
Sua tarefa é analisar a mensagem do usuário e decidir se ela representa comandos do banco de dados para executar na loja, ou apenas uma conversa/pergunta geral.

---
DADOS ATUAIS DA LOJA (para você correlacionar nomes a IDs):

PRODUTOS CADASTRADOS (ID, Nome, SKU, Código de Barras, Preço de Venda, Estoque Atual):
${JSON.stringify(currentProducts)}

CLIENTES CADASTRADOS (ID, Nome):
${JSON.stringify(currentCustomers)}
---

Comandos possíveis que você pode extrair no array 'actions':
1. Cadastrar novo produto: tipo 'create_product'. Informe name, brand, costPrice, salePrice, quantity (inicial).
2. Cadastrar novo cliente: tipo 'create_customer'. Informe name, phone, instagram, birthday (formato YYYY-MM-DD).
3. Movimentar estoque: tipo 'stock_movement'. Informe productId, quantity (positivo), movementType ('entry' ou 'exit'), reason ('manual_adjustment', 'loss', ou 'purchase').
4. Registrar venda: tipo 'create_sale'. Informe items (lista de { productId, quantity, unitPrice }), customerId (opcional), paymentMethod ('pix', 'money', 'credit_card', ou 'debit_card').
5. Excluir produto: tipo 'delete_product'. Informe productId.
6. Excluir cliente: tipo 'delete_customer'. Informe customerId.

Regras importantes de mapeamento:
- Se o usuário falar de um produto ou cliente que já existe, mesmo com pequenas diferenças na grafia, encontre a correspondência exata no cadastro fornecido e use o ID correto.
- Se o usuário pedir para excluir uma lista de produtos, gere uma ação 'delete_product' para cada um dos produtos correspondentes.
- Se for uma mensagem informativa, pergunta geral, ou você precisar de mais informações, responda amigavelmente no campo 'reply' e não adicione ações.
- Se você gerar ações, explique amigavelmente no campo 'reply' o que está fazendo, por exemplo: "Entendido! Estou registrando a venda de..." ou "Excluindo os produtos selecionados...".

Você DEVE responder ESTRITAMENTE em formato JSON com o seguinte formato de resposta:
{
  "reply": "Sua resposta textual amigável aqui explicando a ação ou respondendo a dúvida.",
  "actions": [
    // lista de ações a executar
  ]
}
`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${promptText}\n\nMENSAGEM DO USUÁRIO:\n"${text}"` }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error response:', errText)
      return NextResponse.json({ error: 'Erro na comunicação com a API do Google Gemini' }, { status: 502 })
    }

    const resData = await geminiResponse.json()
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return NextResponse.json({ error: 'Resposta inválida da API do Gemini.' }, { status: 500 })
    }

    const parsed = JSON.parse(rawText)
    return NextResponse.json(parsed)

  } catch (err: any) {
    console.error('Chat API Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
