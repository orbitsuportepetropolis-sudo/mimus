/**
 * Script de Prospecção Automática - Bianca & Manu
 * 1. Bianca (Scout Agent) lê dados brutos do Instagram, qualifica as lojistas e extrai contatos.
 * 2. Manu (SDR Agent) gera uma abordagem altamente personalizada no WhatsApp de cada lead qualificada.
 * 3. Envia as mensagens automaticamente via Evolution API (WhatsApp Gateway).
 */

const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente do arquivo infra/.env local
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

const { runScoutAgent } = require('./scoutAgent');
const { runSdrAgent } = require('./sdrAgent');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'generate_a_secure_api_key_here';

/**
 * Dispara mensagens de texto via Evolution API
 */
async function sendWhatsAppMessage(instance, number, text) {
  // Limpa o número de telefone (deixa apenas dígitos)
  const cleanNumber = number.replace(/\D/g, '');
  if (!cleanNumber) return;

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: text,
        delay: 1500 // Simula digitação humana no WhatsApp
      })
    });

    if (!response.ok) {
      console.error(`❌ [Evolution API] Erro ao enviar para ${cleanNumber}:`, response.statusText);
    } else {
      console.log(`✅ [Evolution API] Mensagem enviada com sucesso para ${cleanNumber}`);
    }
  } catch (error) {
    console.error(`❌ [Evolution API] Falha de conexão ao enviar para ${cleanNumber}:`, error.message);
  }
}

// MOCK: Dados brutos simulados vindos de busca ou scraping de bios do Instagram
const RAW_INSTAGRAM_DATA = `
--- PERFIL 1 ---
Username: @estetica_brilho_facial
Store Name: Brilho Facial Cosméticos
Bio: Loja física de Maquiagem e Cosméticos multimarcas! ✨ Batons, bases, iluminadores e skin prep. Enviamos para todo o Brasil. WhatsApp: (24) 99317-3232
Seguidores: 1.250
Último post: 2 dias atrás
Privacidade: Público

--- PERFIL 2 ---
Username: @oboticario_oficial
Store Name: O Boticário
Bio: Canal oficial da marca de cosméticos O Boticário. Encontre nossos revendedores e novidades.
Seguidores: 8.400.000
Último post: 1 hora atrás
Privacidade: Público

--- PERFIL 3 ---
Username: @miga_sua_make
Store Name: Miga Sua Make Petrópolis
Bio: Makes de milhões por precinho de miga! 💖 Atendimento no varejo. Link da sacola: wa.me/5524999991122. Cidade: Petrópolis - RJ
Seguidores: 8.900
Último post: 5 dias atrás
Privacidade: Público

--- PERFIL 4 ---
Username: @ana_costa_personal
Bio: Consultoria e treino funcional. Cuide de sua saúde!
Seguidores: 350
Último post: 35 dias atrás
Privacidade: Público
`;

async function executeProspectionFlow() {
  console.log('🚀 [Fluxo de Prospecção] Iniciando análise de Leads com Bianca...');

  try {
    // 1. Bianca analisa e filtra os perfis elegíveis
    const scoutResult = await runScoutAgent({ rawData: RAW_INSTAGRAM_DATA });
    
    if (!scoutResult.success || !scoutResult.leads || scoutResult.leads.length === 0) {
      console.log('🔍 [Bianca] Nenhum lead qualificado foi encontrado nesta rodada.');
      return;
    }

    console.log(`\n✨ [Bianca] Qualificou ${scoutResult.leads.length} lojistas em potencial!`);
    console.log(JSON.stringify(scoutResult.leads, null, 2));

    // 2. Para cada lojista qualificada, a Manu (SDR) entra em ação
    for (const lead of scoutResult.leads) {
      console.log(`\n💬 [Manu] Processando abordagem para: ${lead.storeName} (@${lead.username})...`);
      
      const promptParams = {
        meiDetails: {
          razao_social: lead.storeName,
          cnae: '4772-5/00', // CNAE padrão de cosméticos para validação interna da Manu
          nome_empreendedora: lead.username
        }
      };

      const sdrResult = await runSdrAgent(promptParams);

      if (sdrResult.success && sdrResult.content) {
        console.log(`📝 [Abordagem Gerada]:`);
        console.log(`"${sdrResult.content}"`);

        // 3. Disparar via WhatsApp usando o Evolution API na instância padrão "vendas_outbound"
        // (Será enviada se a Evolution API local estiver de fato rodando)
        console.log(`📱 Enviando mensagem via WhatsApp para ${lead.contact}...`);
        await sendWhatsAppMessage('vendas_outbound', lead.contact, sdrResult.content);
      } else {
        console.warn(`⚠️ Não foi possível gerar a abordagem da Manu para @${lead.username}`);
      }
    }

    console.log('\n🏁 [Fluxo de Prospecção] Execução concluída.');

  } catch (error) {
    console.error('❌ Erro durante a execução do fluxo:', error);
  }
}

// Executa o fluxo de teste
executeProspectionFlow();
