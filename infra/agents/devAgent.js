/**
 * Agente 5: DevOps / Core Developer (DEV Agent)
 * Monitor de bugs que analisa logs brutos, tria a causa-raiz
 * e sugere correções cirúrgicas de código usando o modelo DeepSeek-R1.
 */

const SYSTEM_PROMPT = `[PAPEL]
Você é o DevOps / Core Developer AI da Mimus. Você recebe logs de erro de servidores Node.js/TypeScript e React Native em tempo real e deve gerar um patch cirúrgico ou bloco de código de correção de forma rápida.

[DIRETRIZES DE LINGUAGEM]
- Tom técnico de sênior engenheiro, conciso, focado em código e resoluções.
- Sem introduções explicativas longas.

[DIRETRIZES DE SAÍDA]
- Explique a causa raiz do erro em uma única frase.
- Entregue o patch pronto no formato Git Diff ou como um bloco de substituição de código TypeScript/JS bem delimitado.
- Indique o comando exato necessário para testar a correção localmente (ex: jest, gradle, ts-node).`;

/**
 * Executa a análise de erros com raciocínio profundo
 * @param {Object} errorPayload
 * @param {string} errorPayload.message - Mensagem ou log de erro bruto
 * @param {string} [errorPayload.stack] - Stack trace se disponível
 * @param {string} [errorPayload.file] - Arquivo ou módulo causador se detectado
 * @param {string} [errorPayload.environment='production'] - Ambiente (staging/production)
 * @returns {Promise<Object>} Relatório de patch estruturado em Markdown
 */
async function runDevAgent(errorPayload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada (GEMINI_API_KEY).');
  }

  if (!errorPayload || !errorPayload.message) {
    throw new Error('É necessário fornecer os detalhes do log de erro.');
  }

  const promptContent = `
Analise o seguinte erro do sistema:
- Mensagem de erro: ${errorPayload.message}
- Stack Trace: ${errorPayload.stack || 'Não disponível'}
- Componente/Arquivo afetado: ${errorPayload.file || 'Desconhecido'}
- Ambiente: ${errorPayload.environment || 'Produção'}

Siga as diretrizes de desenvolvedor sênior para gerar o relatório com patch em Markdown.
`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-pro', // Gemini 2.5 Pro com raciocínio profundo
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.2 // Baixa temperatura para manter a precisão técnica
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: ${response.statusText}`);
    }

    const resJson = await response.json();
    const content = resJson.candidates?.[0]?.message?.content || resJson.choices?.[0]?.message?.content || '';

    return {
      success: true,
      report: content.trim(),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[devAgent] Erro ao analisar log de bug:', error);
    throw error;
  }
}

module.exports = {
  runDevAgent
};
