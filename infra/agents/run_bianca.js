/**
 * Script de Execução Autônoma - Bianca (Scout Agent)
 * Executa a qualificação de leads do Instagram via Gemini API.
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

// Dados brutos simulados do Instagram (Bios, seguidores, links e contatos)
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

async function executeScoutRun() {
  console.log('🚀 [Bianca - Scout Agent] Iniciando a qualificação dos leads do Instagram...');
  console.log('------------------------------------------------------------');

  try {
    const result = await runScoutAgent({ rawData: RAW_INSTAGRAM_DATA });

    if (!result.success || !result.leads || result.leads.length === 0) {
      console.log('🔍 [Bianca] Nenhum lead qualificado foi encontrado nesta rodada.');
      return;
    }

    console.log(`✨ [Bianca] Sucesso! Qualificou ${result.leads.length} lojistas no perfil ideal de cliente:\n`);
    
    result.leads.forEach((lead, idx) => {
      console.log(`Lead #${idx + 1}:`);
      console.log(`  - Loja: ${lead.storeName || 'Não informado'}`);
      console.log(`  - Perfil: @${lead.username}`);
      console.log(`  - Seguidores: ${lead.followersCount}`);
      console.log(`  - Contato: ${lead.contact || 'Não encontrado'}`);
      console.log(`  - Cidade: ${lead.city || 'Não especificada'}`);
      console.log(`  - Motivo: ${lead.reason}`);
      console.log('------------------------------------------------------------');
    });

  } catch (error) {
    console.error('❌ Erro na execução da Bianca:', error.message || error);
  }
}

executeScoutRun();
