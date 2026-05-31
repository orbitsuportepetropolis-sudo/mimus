/**
 * Agente 2: CFO Virtual (CFO AI)
 * Focado em analisar dados e métricas SaaS, emitindo diagnósticos e relatórios tabulares.
 */

const SYSTEM_PROMPT = `[PAPEL]
Você é o CFO Virtual da Mimus. Sua função é analisar friamente os dados financeiros fornecidos da operação SaaS (MRR, Churn rate, CAC, LTV, Burn rate) e apresentar um diagnóstico de saúde financeira bruto, direto e preciso para os fundadores.

[DIRETRIZES DE LINGUAGEM]
- Linguagem formal, analítica, fria e focada em dados e métricas financeiras.
- Sem saudações amigáveis ou introduções prolixas. Comece diretamente com a análise.
- Apontamento claro de gargalos (ex: CAC desequilibrado vs LTV, LTV/CAC ratio, Churn alto).

[DIRETRIZES DE SAÍDA]
- Toda e qualquer métrica deve ser estruturada em tabelas Markdown com as colunas: | Métrica | Valor Atual | Status/Alerta | Impacto sugerido |.
- Para a coluna "Status/Alerta", utilize rigorosamente semáforos visuais em emojis:
  * 🟢 (Verde: Métricas saudáveis, ex: Churn < 2%, LTV/CAC > 3x, Runway > 18 meses)
  * 🟡 (Amarelo: Atenção, ex: Churn entre 2% e 5%, LTV/CAC entre 2x e 3x, Runway entre 6 e 12 meses)
  * 🔴 (Vermelho: Perigo crítico, ex: Churn > 5%, LTV/CAC < 2x, Burn rate desalinhado com caixa, Runway < 6 meses)
- Conclua com um resumo executivo de 2 frases apontando a ação prioritária imediata.`;

/**
 * Função principal do Agente CFO
 * @param {Object} metrics - JSON contendo dados financeiros do SaaS
 * @param {number} metrics.mrr - MRR atual
 * @param {number} metrics.churn_rate - Churn rate mensal em %
 * @param {number} metrics.cac - CAC (Custo de Aquisição de Clientes)
 * @param {number} metrics.ltv - LTV (Life Time Value)
 * @param {number} metrics.burn_rate - Burn rate mensal em R$
 * @param {number} [metrics.runway] - Tempo de vida do caixa em meses
 * @returns {Promise<Object>} Relatório gerado em Markdown e metadados
 */
async function runCfoAgent(metrics) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do DeepSeek não configurada (DEEPSEEK_API_KEY).');
  }

  if (!metrics) {
    throw new Error('É necessário fornecer as métricas financeiras para análise.');
  }

  const promptContent = `
Por favor, analise a seguinte fatia de dados SaaS da nossa operação Mimus:
- MRR: R$ ${metrics.mrr}
- Churn Rate: ${metrics.churn_rate}%
- CAC: R$ ${metrics.cac}
- LTV: R$ ${metrics.ltv}
- LTV/CAC Ratio: ${(metrics.ltv / (metrics.cac || 1)).toFixed(2)}x
- Burn Rate: R$ ${metrics.burn_rate}
- Runway Estimado: ${metrics.runway || 'Não informado'} meses

Gere o diagnóstico completo do CFO Virtual na tabela Markdown padronizada.
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
        temperature: 0.2 // Baixa temperatura para manter a consistência e frieza analítica
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API do DeepSeek: ${response.statusText}`);
    }

    const resJson = await response.json();
    const content = resJson.candidates?.[0]?.message?.content || resJson.choices?.[0]?.message?.content || '';

    return {
      success: true,
      report: content.trim(),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[cfoAgent] Erro ao processar análise:', error);
    throw error;
  }
}

module.exports = {
  runCfoAgent
};
