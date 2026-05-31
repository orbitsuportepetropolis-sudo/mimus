/**
 * Agente 3: Customer Success (Gabi)
 * Focado na retenção e reengajamento de clientes inativas na plataforma Mimus.
 */

const SYSTEM_PROMPT = `[PAPEL]
Você é a "Gabi", Customer Success Manager da Mimus. Seu objetivo é reconectar lojistas e clínicas de estética que estão "frias" (inativas há mais de 5 dias) na plataforma, oferecendo dicas de negócios aplicáveis para que elas voltem a usar o sistema Mimus e diminuam o risco de cancelamento (Churn).

[DIRETRIZES DE LINGUAGEM]
- Tom acolhedor, focado no sucesso do cliente, empático e de mentoria.
- Evite parecer que está cobrando o uso da plataforma; fale sob a perspectiva de ajudá-la a faturar mais.
- Mensagens de tamanho médio (máximo 5 linhas).

[DIRETRIZES DE SAÍDA]
- Comece com uma saudação rápida e uma pergunta de interesse real sobre a rotina da clínica.
- Ofereça uma dica prática de marketing ou gestão de estética (ex: "campanha de recuperação de clientes inativos" ou "combos promocionais para dias fracos").
- Feche convidando-a a ver como aplicar essa dica usando uma função específica no painel do Mimus (ex: Cadastro de Clientes, Painel de Vendas, etc.).`;

/**
 * Geração de mensagens de reengajamento para clientes inativos
 * @param {Object} customer
 * @param {string} customer.name - Nome da lojista / dona
 * @param {string} customer.store_name - Nome da loja / clínica
 * @param {number} customer.days_inactive - Quantos dias sem acesso
 * @param {string} [customer.segment] - Segmento (ex: manicure, esteticista, salão)
 * @returns {Promise<Object>} Resposta gerada para envio via WhatsApp
 */
async function runCsAgent(customer) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do DeepSeek não configurada (DEEPSEEK_API_KEY).');
  }

  if (!customer || !customer.name) {
    throw new Error('Detalhes do cliente inativo não fornecidos.');
  }

  const promptContent = `
Gere uma abordagem de sucesso de cliente para:
- Nome da Lojista: ${customer.name}
- Nome da Loja/Clínica: ${customer.store_name}
- Dias sem atividade: ${customer.days_inactive} dias
- Segmento da Loja: ${customer.segment || 'Estética/Cosméticos'}

Lembre-se de ser empática, dar uma dica valiosa para o negócio dela e chamá-la a testar a funcionalidade no Mimus.
`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API do DeepSeek: ${response.statusText}`);
    }

    const resJson = await response.json();
    const content = resJson.candidates?.[0]?.message?.content || resJson.choices?.[0]?.message?.content || '';

    return {
      success: true,
      message: content.trim(),
      customerName: customer.name,
      daysInactive: customer.days_inactive
    };
  } catch (error) {
    console.error('[csAgent] Erro ao gerar mensagem CS:', error);
    throw error;
  }
}

module.exports = {
  runCsAgent
};
