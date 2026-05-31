/**
 * Script de Exemplo de Integração Prática (O Sistema Nervoso)
 * Demonstra como integrar os agentes nativos (SDR e DEV) nos eventos reais do backend.
 */

const { runSdrAgent } = require('./sdrAgent');
const { runDevAgent } = require('./devAgent');

// Variáveis de ambiente simuladas (Configure no seu arquivo .env da VPS/Produção)
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'generate_a_secure_api_key_here';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/exemplo';

/**
 * Função auxiliar para disparar mensagens via Evolution API
 * @param {string} instance - Nome da instância do WhatsApp ativa na VPS
 * @param {string} number - Telefone do cliente (formato 5511999999999)
 * @param {string} text - Conteúdo da mensagem de texto
 */
async function sendWhatsAppMessage(instance, number, text) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: number,
        text: text,
        delay: 1200 // Simula digitação humana
      })
    });

    if (!response.ok) {
      console.error(`[Evolution API] Erro ao enviar mensagem para ${number}:`, response.statusText);
    } else {
      console.log(`[Evolution API] Mensagem enviada com sucesso para ${number}`);
    }
  } catch (error) {
    console.error(`[Evolution API] Falha de conexão:`, error);
  }
}

/**
 * Função auxiliar para notificar no Discord
 * @param {string} content - Mensagem estruturada em Markdown
 */
async function sendDiscordNotification(content) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  } catch (error) {
    console.error('[Discord] Falha ao enviar notificação:', error);
  }
}

// ============================================================================
// CENÁRIO 1: Triagem de novos MEIs minerados da lista de CNAEs de beleza
// ============================================================================
async function handleNewMeiDiscovered(meiPayload) {
  console.log(`\n[Evento] Novo MEI minerado: ${meiPayload.razao_social}`);
  
  try {
    // Executa a triagem do CNAE e a geração do prompt de SDR no agente
    const result = await runSdrAgent({
      meiDetails: {
        razao_social: meiPayload.razao_social,
        cnae: meiPayload.cnae,
        nome_empreendedora: meiPayload.nome_empreendedora
      }
    });

    if (!result.success) {
      console.log(`[MEI Triagem] ${result.reason}`);
      return; // CNAE filtrado e ignorado com segurança
    }

    console.log(`[MEI Aprovado] Mensagem de prospecção gerada para ${meiPayload.nome_empreendedora}:`);
    console.log(`"${result.content}"`);

    // Dispara via WhatsApp pela Evolution API na instância de vendas outbound
    await sendWhatsAppMessage('vendas_outbound', meiPayload.telefone, result.content);

  } catch (error) {
    console.error('[MEI Process] Erro no processamento de MEI:', error);
  }
}

// ============================================================================
// CENÁRIO 2: Resposta automática de uma DM do Instagram
// ============================================================================
async function handleInstagramDirectMessage(incomingDm) {
  console.log(`\n[Evento] Nova DM recebida no Instagram de @${incomingDm.username}: "${incomingDm.text}"`);

  // Em um caso de chat de produção, você carregaria o histórico do banco de dados (ex: Supabase)
  const history = [
    { role: 'assistant', content: 'Olá! Sou a Manu, do Mimus. Vi que você tem uma loja de makes incrível!' }
  ];

  try {
    const result = await runSdrAgent({
      text: incomingDm.text,
      channel: 'instagram',
      history: history
    });

    console.log(`[SDR Resposta DM] Enviando resposta para @${incomingDm.username}:`);
    console.log(`"${result.content}"`);

    // Aqui você faria a integração de disparo de direct message da API do Instagram Graph
    // Ex: await sendInstagramDirect(incomingDm.username, result.content);

  } catch (error) {
    console.error('[Instagram Process] Erro ao responder DM:', error);
  }
}

// ============================================================================
// CENÁRIO 3: Try/Catch global de erro 500 no backend para o DevOps AI
// ============================================================================
async function globalErrorHandlerMiddleware(err, req, res, next) {
  console.log('\n[Middleware] Captura de erro crítico 500 no servidor backend');

  // Resposta imediata de segurança para o usuário
  res.status(500).json({ error: 'Erro interno no servidor' });

  // Disparo assíncrono (background) do DevOps Agent (Sem bloquear a requisição do usuário)
  const errorPayload = {
    message: err.message || 'Erro sem mensagem explícita',
    stack: err.stack || 'Stack trace não fornecido',
    file: err.filename || req.url || 'Arquivo de rota desconhecido',
    environment: process.env.NODE_ENV || 'production'
  };

  try {
    const result = await runDevAgent(errorPayload);
    
    if (result.success) {
      console.log('[DevOps AI] Patch corretivo e análise de causa-raiz gerados.');
      // Envia o relatório rico em Markdown com o Git Diff diretamente para o canal do Discord
      await sendDiscordNotification(`## ⚠️ Bug Crítico Detectado!\n\n${result.report}`);
    }
  } catch (agentError) {
    console.error('[DevOps Process] Falha ao rodar o agente de depuração de bugs:', agentError);
  }
}

// ============================================================================
// TESTANDO OS FLUXOS (Demonstração simulada)
// ============================================================================
async function runSimulatedTest() {
  console.log('--- INICIANDO MOCK DE TESTES DOS AGENTES NATIVOS ---');

  // Testando CNAE Válido de Cosméticos
  await handleNewMeiDiscovered({
    razao_social: 'MARIA MAKEUP LTDA',
    cnae: '4772-5/00',
    nome_empreendedora: 'Maria de Souza',
    telefone: '5511999999999'
  });

  // Testando CNAE Inválido (Ex: Construção Civil) - Deve descartar por segurança
  await handleNewMeiDiscovered({
    razao_social: 'JOAO CONSTRUTORA ME',
    cnae: '4120-4/00',
    nome_empreendedora: 'João Silva',
    telefone: '5511988888888'
  });

  // Testando DM do Instagram
  await handleInstagramDirectMessage({
    username: 'esteticadasmaravilhosas',
    text: 'Oi! Como funciona o painel de vocês de estoque?'
  });
}

// Descomente a linha abaixo para rodar o mock localmente se configurar a chave no .env
// runSimulatedTest();

module.exports = {
  handleNewMeiDiscovered,
  handleInstagramDirectMessage,
  globalErrorHandlerMiddleware
};
