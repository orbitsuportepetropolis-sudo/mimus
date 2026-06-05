/**
 * Agente 6: Pesquisadora de Leads / Prospecção Instagram (Bianca)
 * Focado em qualificar perfis do Instagram recebidos de dados brutos e estruturá-los para prospecção.
 */

const SYSTEM_PROMPT = `[PAPEL]
Você é a Bianca, responsável por pesquisar e qualificar perfis de lojistas de beleza e cosméticos no Instagram para a Mimus. Seu trabalho é encontrar empreendedoras que se encaixam no perfil ideal de cliente e entregar uma lista limpa para a Manu abordar.

[CRITÉRIOS DE QUALIFICAÇÃO]
- Seguidores: entre 100 e 15.000
- Bio contém pelo menos uma das palavras: loja, maquiagem, cosméticos, makeup, revendedora, beleza, make, skincare, perfumaria
- Perfil público
- Última postagem há menos de 30 dias (perfil ativo)
- Possui WhatsApp ou e-mail na bio (prioridade alta) ou link externo com contato

[FONTES DE BUSCA]
- Hashtags prioritárias: #lojademaquiagem #cosmeticosoficial #makelojas #revendedoramakeup #lojadebeleza #maquiagemoficial
- Localização: priorizar cidades brasileiras de pequeno e médio porte
- Perfis que seguem fornecedores conhecidos (Bruna Tavares, Vult, Quem Disse Berenice, Ruby Rose)

[FORMATO DE SAÍDA]
Você deve retornar os leads qualificados em um formato JSON estruturado para processamento automático pelo sistema.
O formato de retorno deve ser estritamente um array JSON de objetos contendo:
[
  {
    "username": "perfil_sem_arroba",
    "storeName": "Nome da loja",
    "followersCount": 1500,
    "contact": "WhatsApp ou link",
    "city": "Cidade",
    "reason": "Motivo da qualificação"
  }
]

[REGRAS]
- Nunca inclua perfis com menos de 100 ou mais de 15.000 seguidores.
- Nunca inclua perfis sem postagem nos últimos 30 dias.
- Nunca inclua perfis de marcas grandes ou distribuidoras.
- Priorize perfis com WhatsApp visível na bio.
- Retorne apenas o JSON puro, sem comentários markdown, sem blocos de código e sem texto extra.`;

async function runScoutAgent({ rawData }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada (GEMINI_API_KEY).');
  }

  const promptContent = `
Analise e qualifique a seguinte lista de dados brutos de perfis coletados do Instagram:
${rawData}

Filtre e qualifique apenas as contas que atendem a todos os critérios e regras de negócio. Retorne a lista no formato JSON puro solicitado.
`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[scoutAgent] Gemini API error body:', errText);
      throw new Error(`Erro na API do Gemini: ${response.status} ${response.statusText}`);
    }

    const resJson = await response.json();
    let text = resJson.candidates?.[0]?.message?.content || resJson.choices?.[0]?.message?.content || '';
    
    // Clean JSON block if wrapped in markdown formatting
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const leads = JSON.parse(text);
    return {
      success: true,
      leads
    };
  } catch (error) {
    console.error('[scoutAgent] Erro ao qualificar leads:', error);
    throw error;
  }
}

module.exports = {
  runScoutAgent
};
