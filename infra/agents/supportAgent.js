/**
 * Agente 4: Suporte Nível 1 (FAQ e Ajuda Operacional)
 * Resolve dúvidas didáticas do aplicativo Mimus baseando-se estritamente na FAQ e
 * escala problemas financeiros ou técnicos severos para o dev chefe Adriano.
 */

const SYSTEM_PROMPT = `[PAPEL]
Você é o Assistente Virtual do Suporte Nível 1 da Mimus. Seu papel é sanar dúvidas operacionais de clientes lojistas sobre o uso do aplicativo e da plataforma web Mimus, baseando-se estritamente no documento de FAQ fornecido no contexto do usuário.

[DIRETRIZES DE LINGUAGEM]
- Tom educado, prestativo, claro e com vocabulário simples e didático.
- Não utilize jargões técnicos difíceis de entender.

[DIRETRIZES DE SAÍDA]
- Se a resposta exigir mais de 2 passos, estruture as etapas em uma lista ordenada numericamente (1, 2, 3...).
- Caso a dúvida seja sobre um recurso inexistente na documentação ou necessite de intervenção técnica, informe calmamente que o ticket foi escalado e que um humano entrará em contato em breve.

[REGRA DE SEGURANÇA CRÍTICA - ESCALONAMENTO]
- Se o usuário mencionar qualquer assunto relacionado a DINHEIRO, COBRANÇA, MENSALIDADE, REEMBOLSO, PIX NÃO PROCESSADO ou FALHAS SEVERAS DO SISTEMA (ex: tela travada, erro de banco de dados, falha de login), você DEVE interromper a resposta padrão e responder estritamente:
  "Entendido. Por se tratar de um assunto crítico de [financeiro/sistema], eu acabei de abrir um chamado de prioridade máxima diretamente para o nosso desenvolvedor-chefe (Adriano). Ele entrará em contato com você o mais rápido possível para solucionar isso."`;

/**
 * Filtra e verifica se a mensagem exige escalonamento automático de segurança
 * @param {string} text 
 * @returns {boolean}
 */
function checkEscalationRequired(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Palavras-chave críticas para escalonamento automático
  const criticalKeywords = [
    'cobrança', 'cobranca', 'mensalidade', 'reembolso', 'pagamento', 'paguei', 'pix',
    'banco de dados', 'db', 'bug', 'travado', 'não abre', 'nao abre', 'tela preta',
    'erro 500', 'dinheiro', 'estorno', 'financeiro', 'quebrado', 'crash'
  ];

  return criticalKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Executa o agente de suporte N1
 * @param {Object} params
 * @param {string} params.text - Dúvida do usuário
 * @param {string} [params.faqContext=""] - Base de conhecimento em texto injetado
 * @param {Array} [params.history=[]] - Histórico de mensagens
 * @returns {Promise<Object>} Resposta gerada
 */
async function runSupportAgent({ text, faqContext = "", history = [] }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do DeepSeek não configurada (DEEPSEEK_API_KEY).');
  }

  // 1. Verificação local preventiva de escalonamento para agilizar o fluxo e garantir consistência total
  if (checkEscalationRequired(text)) {
    const isFinancial = text.toLowerCase().match(/(cobrança|cobranca|mensalidade|reembolso|pagamento|paguei|pix|dinheiro|estorno|financeiro)/);
    const category = isFinancial ? 'financeiro' : 'sistema';
    return {
      success: true,
      escalated: true,
      content: `Entendido. Por se tratar de um assunto crítico de ${category}, eu acabei de abrir um chamado de prioridade máxima diretamente para o nosso desenvolvedor-chefe (Adriano). Ele entrará em contato com você o mais rápido possível para solucionar isso.`,
      metadata: { target: 'Adriano', category }
    };
  }

  // 2. Montagem de payload com injeção de contexto de FAQ se não for escalonado
  const messagesPayload = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `[CONTEÚDO DA FAQ DE SUPORTE ADICIONAL]\n${faqContext || 'Nenhuma documentação fornecida.'}` },
    ...history,
    { role: 'user', content: text }
  ];

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messagesPayload,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API do DeepSeek: ${response.statusText}`);
    }

    const resJson = await response.json();
    const content = resJson.candidates?.[0]?.message?.content || resJson.choices?.[0]?.message?.content || '';

    // Verifica se a resposta gerada pela IA acabou caindo na regra de escalonamento interna
    const isEscalatedResponse = content.includes('Adriano');

    return {
      success: true,
      escalated: isEscalatedResponse,
      content: content.trim(),
      metadata: { escalatedByAI: isEscalatedResponse }
    };
  } catch (error) {
    console.error('[supportAgent] Erro ao processar suporte:', error);
    throw error;
  }
}

module.exports = {
  runSupportAgent,
  checkEscalationRequired
};
