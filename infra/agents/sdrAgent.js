/**
 * Agente 1: SDR / Inside Sales (Manu)
 * Focado em prospecção ativa, qualificação de leads e conversão via WhatsApp e Instagram.
 */

// Lista de CNAEs permitidos do mercado de beleza para prospecção ativa
const BEAUTY_CNAES = [
  '4772-5/00', // Comércio varejista de cosméticos, produtos de perfumaria e higiene pessoal
  '9602-5/02', // Atividades de estética e outros serviços de cuidados com a beleza
  '4789-0/01', // Comércio varejista de suvenires, bijuterias e artesanatos (pincéis, cílios, etc.)
  '4772-5/02', // Comércio varejista de artigos de armarinho (acessórios de cabelo, skin prep)
  '4791-8/00', // Comércio varejista por internet (e-commerces de maquiagem)
  '4793-4/00'  // Comércio varejista ambulante (porta a porta ou catálogos Avon/Natura)
];

const SYSTEM_PROMPTS = {
  whatsapp: `[PAPEL]
Você é a "Manu", SDR / Pré-vendedora da Mimus (plataforma SaaS de gestão e marketing para clínicas de estética e salões de beleza). Seu objetivo é engajar leads via WhatsApp, qualificar o interesse delas e levá-las a agendar uma demonstração gratuita do Mimus.

[DIRETRIZES DE LINGUAGEM]
- Tom humano, caloroso, empático e extremamente natural. Evite formalidades excessivas.
- Use gírias leves do mundo da beleza e estética (ex: "glow up", "maravilhosa", "miga", "estética de milhões", "skin care", "mimos").
- Escreva mensagens curtas (máximo de 3 linhas por mensagem). Use emojis de forma moderada.
- Adapte-se à linguagem de lojistas, esteticistas, manicures e donas de clínicas de estética.

[DIRETRIZES DE SAÍDA]
- Responda apenas à última mensagem do cliente.
- Sempre termine com uma pergunta aberta e curta que incentive a resposta.
- Nunca mande blocos longos de texto. Se for preciso explicar algo, pergunte se pode enviar um áudio ou link.`,

  instagram: `[PAPEL]
Você é a "Manu", SDR da Mimus, engajando leads que comentaram ou mandaram mensagem direta (DM) no Instagram. Seu objetivo no Instagram é fazer uma qualificação super rápida e amigável e trazer a lojista para o WhatsApp para apresentar a demonstração.

[DIRETRIZES DE LINGUAGEM]
- Linguagem extremamente natural, rápida e descontraída de rede social.
- Use gírias leves de cosméticos e autocuidado.
- Mensagens de no máximo 2 linhas (evite textos longos que assustam no direct).

[DIRETRIZES DE SAÍDA]
- Demonstre muito entusiasmo com o perfil/loja dela.
- Identifique rapidamente a principal dor dela (vendas, estoque, controle).
- Tente obter o número de WhatsApp dela de forma sutil, oferecendo enviar um material exclusivo ou o link direto de demonstração por lá.`
};

/**
 * Filtra e valida se o CNAE de um novo MEI é do ramo da beleza
 * @param {string} cnae 
 * @returns {boolean}
 */
function isValidBeautyCnae(cnae) {
  if (!cnae) return false;
  // Remove caracteres não numéricos para comparação padronizada se necessário
  const cleanCnae = cnae.replace(/[^\d/]/g, '').trim();
  return BEAUTY_CNAES.includes(cleanCnae);
}

/**
 * Função principal do Agente SDR
 * @param {Object} params
 * @param {string} params.text - Mensagem recebida do usuário (caso inbound)
 * @param {string} [params.channel='whatsapp'] - Canal da conversa ('whatsapp' ou 'instagram')
 * @param {Array} [params.history=[]] - Histórico de mensagens anteriores [{ role: 'user'|'assistant', content: '' }]
 * @param {Object} [params.meiDetails] - Detalhes do MEI (caso outbound/prospecção MEI)
 * @param {string} [params.meiDetails.razao_social]
 * @param {string} [params.meiDetails.cnae]
 * @param {string} [params.meiDetails.nome_empreendedora]
 * @returns {Promise<Object>} Resposta gerada e metadados
 */
async function runSdrAgent({ text, channel = 'whatsapp', history = [], meiDetails = null }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do DeepSeek não configurada (DEEPSEEK_API_KEY).');
  }

  // Caso 1: Prospecção Ativa de Novo MEI (Outbound)
  if (meiDetails) {
    const { cnae, razao_social, nome_empreendedora } = meiDetails;

    // Validação estrita do CNAE
    if (!isValidBeautyCnae(cnae)) {
      return {
        success: false,
        reason: `CNAE ${cnae} não pertence ao nicho de beleza/estética cadastrado. Prospecção descartada.`,
        shouldSend: false
      };
    }

    const promptMei = `
Você é a "Manu", SDR da Mimus. Acabamos de detectar um novo MEI cadastrado na área da beleza e estética.
Dados da nova empresa:
- Razão Social: ${razao_social}
- Proprietária: ${nome_empreendedora || 'Empreendedora'}
- CNAE: ${cnae}

Crie uma mensagem inicial de boas-vindas calorosa e curta para o WhatsApp da empreendedora.
Diretrizes:
- Dê os parabéns pela conquista de abrir a própria empresa de beleza!
- Ofereça 7 dias totalmente grátis na plataforma Mimus para ajudá-la a organizar o novo estoque e vendas nesse início de jornada.
- Seja humana, use gírias leves (glow up, maravilhosa) e termine com uma pergunta curta e engajadora sobre como ela planeja gerenciar a loja.
- Limite máximo: 4 linhas.
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
            { role: 'system', content: SYSTEM_PROMPTS.whatsapp },
            { role: 'user', content: promptMei }
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
        content: content.trim(),
        shouldSend: true,
        channel: 'whatsapp',
        metadata: { cnae, razao_social, type: 'mei_active_outbound' }
      };
    } catch (error) {
      console.error('[sdrAgent] Erro ao processar MEI:', error);
      throw error;
    }
  }

  // Caso 2: Resposta a Mensagens de Chat Ativas (Inbound WhatsApp/Instagram)
  const systemPrompt = SYSTEM_PROMPTS[channel] || SYSTEM_PROMPTS.whatsapp;
  const messagesPayload = [
    { role: 'system', content: systemPrompt },
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
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API do DeepSeek: ${response.statusText}`);
    }

    const resJson = await response.json();
    const content = resJson.candidates?.[0]?.message?.content || resJson.choices?.[0]?.message?.content || '';

    return {
      success: true,
      content: content.trim(),
      shouldSend: true,
      channel,
      metadata: { type: 'chat_reply' }
    };
  } catch (error) {
    console.error('[sdrAgent] Erro ao processar chat reply:', error);
    throw error;
  }
}

module.exports = {
  runSdrAgent,
  isValidBeautyCnae
};
