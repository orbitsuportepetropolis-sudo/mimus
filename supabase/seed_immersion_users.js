const fs = require('fs');
const { createClient } = require('../web/node_modules/@supabase/supabase-js');

// Parse .env.local manually
const envPath = 'c:/Users/letic/Documents/PROJETOS/mimus/web/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const mockLojistas = [
  { name: 'Gabriela Costa', email: 'gabriela.costa@mimus.com.br', phone: '(11) 98765-4321', storeName: 'Gabi Makeup & Cia', plan: 'pro', plan_status: 'active' },
  { name: 'Mariana Santos', email: 'mariana.santos@mimus.com.br', phone: '(11) 99888-7766', storeName: 'Mari Cosméticos', plan: 'pro', plan_status: 'trial_custom' },
  { name: 'Amanda Ferreira', email: 'amanda.ferreira@mimus.com.br', phone: '(21) 96655-4433', storeName: 'Amanda Beauty Bar', plan: 'pro', plan_status: 'trial' },
  { name: 'Carla Oliveira', email: 'carla.oliveira@mimus.com.br', phone: '(31) 95544-3322', storeName: 'Carla Make Outlet', plan: 'free', plan_status: 'active' },
  { name: 'Beatriz Silva', email: 'beatriz.silva@mimus.com.br', phone: '(11) 97766-5544', storeName: 'Bia Silva Cosmetics', plan: 'pro', plan_status: 'trial_custom' },
  { name: 'Raiane Lima', email: 'raiane.lima@mimus.com.br', phone: '(81) 98877-6655', storeName: 'Raiani Lima Beauty', plan: 'pro', plan_status: 'trial' },
  { name: 'Fernanda Souza', email: 'fernanda.souza@mimus.com.br', phone: '(19) 97765-4321', storeName: 'Fernanda Make Studio', plan: 'pro', plan_status: 'active' },
  { name: 'Juliana Mendes', email: 'juliana.mendes@mimus.com.br', phone: '(11) 96677-8899', storeName: 'Ju Mendes Maquiagens', plan: 'free', plan_status: 'active' },
  { name: 'Patrícia Rocha', email: 'patricia.rocha@mimus.com.br', phone: '(21) 95566-7788', storeName: 'Clínica Patrícia Rocha', plan: 'pro', plan_status: 'trial_custom' },
  { name: 'Larissa Alencar', email: 'larissa.alencar@mimus.com.br', phone: '(85) 99911-2233', storeName: 'Lari Alencar Store', plan: 'pro', plan_status: 'trial' }
];

const mockProducts = [
  { name: 'Batom Velvet Matte', brand: 'Mimus', cost: 12.00, sale: 29.90 },
  { name: 'Base Líquida HD Alta Cobertura', brand: 'Mimus', cost: 18.50, sale: 45.00 },
  { name: 'Delineador Líquido Carbon Black', brand: 'Ruby Rose', cost: 7.90, sale: 19.90 },
  { name: 'Paleta de Sombras Glitter Glow', brand: 'Mimus', cost: 25.00, sale: 62.50 },
  { name: 'Rímel Volume Máximo à Prova D\'água', brand: 'Boca Rosa', cost: 14.20, sale: 38.00 }
];

const mockCustomers = [
  { name: 'Ana Julia Pinheiro', phone: '(11) 98888-1111', instagram: 'anaju_pinheiro', birthday: '1998-05-15' },
  { name: 'Clara Vasconcelos', phone: '(11) 97777-2222', instagram: 'clara_vasc', birthday: '2001-10-22' }
];

const pages = [
  { path: '/dashboard', name: 'Dashboard Home' },
  { path: '/dashboard/sales', name: 'PDV / Vendas' },
  { path: '/dashboard/products', name: 'Produtos' },
  { path: '/dashboard/stock', name: 'Estoque' },
  { path: '/dashboard/customers', name: 'Clientes' },
  { path: '/dashboard/finance', name: 'Financeiro' },
  { path: '/dashboard/settings', name: 'Configurações' },
  { path: '/dashboard/integrations', name: 'Integrações' },
  { path: '/dashboard/team', name: 'Equipe' }
];

async function seed() {
  console.log('🌸 Iniciando o Seeder de Imersão para Mimus...');
  
  for (let i = 0; i < mockLojistas.length; i++) {
    const lojista = mockLojistas[i];
    console.log(`\n👤 [${i+1}/${mockLojistas.length}] Criando lojista: ${lojista.name}...`);
    
    // 1. Check if user already exists
    const { data: existingUsers } = await supabase.from('profiles').select('id, store_id').eq('email', lojista.email);
    let userId;
    let storeId;
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`   User ${lojista.email} já existe. Ignorando criação e reutilizando dados.`);
      userId = existingUsers[0].id;
      storeId = existingUsers[0].store_id;
    } else {
      // Create Auth User
      const password = 'lojista123';
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: lojista.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: lojista.name,
          phone: lojista.phone,
          store_name: lojista.storeName,
          role: 'admin'
        }
      });
      
      if (authErr) {
        console.error(`   Erro ao criar usuário auth para ${lojista.email}:`, authErr.message);
        continue;
      }
      
      userId = authUser.user.id;
      
      // Delay briefly to allow the PostgreSQL trigger to complete store/profile creation
      await new Promise(r => setTimeout(r, 1000));
      
      // Get the created profile to fetch the automatically created store_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', userId)
        .single();
        
      if (!profileData || !profileData.store_id) {
        console.error(`   Erro: perfil ou loja não criados automaticamente para ${userId}`);
        continue;
      }
      
      storeId = profileData.store_id;
    }
    
    // 2. Update store plan, plan_status, trial_ends_at
    const trialEndsAt = lojista.plan_status === 'trial_custom' ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: storeUpdateErr } = await supabase
      .from('stores')
      .update({
        name: lojista.storeName,
        plan: lojista.plan,
        plan_status: lojista.plan_status,
        trial_ends_at: trialEndsAt
      })
      .eq('id', storeId);
      
    if (storeUpdateErr) {
      console.error(`   Erro ao atualizar a loja:`, storeUpdateErr.message);
    }
    
    // 3. Update profile details
    const { error: profileUpdateErr } = await supabase
      .from('profiles')
      .update({
        name: lojista.name,
        phone: lojista.phone,
        status: 'active'
      })
      .eq('id', userId);
      
    if (profileUpdateErr) {
      console.error(`   Erro ao atualizar perfil:`, profileUpdateErr.message);
    }
    
    // 4. Create products for the store (if they don't exist)
    const { data: currentProducts } = await supabase.from('products').select('id').eq('store_id', storeId);
    let productIds = [];
    
    if (currentProducts && currentProducts.length > 0) {
      productIds = currentProducts.map(p => p.id);
      console.log(`   Loja já possui produtos cadastrados.`);
    } else {
      for (const prod of mockProducts) {
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert([{
            store_id: storeId,
            name: prod.name,
            brand: prod.brand,
            cost_price: prod.cost,
            sale_price: prod.sale,
            quantity_in_stock: Math.floor(Math.random() * 20) + 5,
            min_stock_alert: 5,
            active: true
          }])
          .select('id')
          .single();
          
        if (prodErr) {
          console.error(`   Erro ao criar produto ${prod.name}:`, prodErr.message);
        } else if (newProd) {
          productIds.push(newProd.id);
        }
      }
      console.log(`   5 produtos criados com sucesso.`);
    }
    
    // 5. Create customers for the store (if they don't exist)
    const { data: currentCustomers } = await supabase.from('customers').select('id').eq('store_id', storeId);
    let customerIds = [];
    
    if (currentCustomers && currentCustomers.length > 0) {
      customerIds = currentCustomers.map(c => c.id);
      console.log(`   Loja já possui clientes cadastrados.`);
    } else {
      for (const cust of mockCustomers) {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert([{
            store_id: storeId,
            name: cust.name,
            phone: cust.phone,
            instagram: cust.instagram,
            birthday: cust.birthday
          }])
          .select('id')
          .single();
          
        if (custErr) {
          console.error(`   Erro ao criar cliente ${cust.name}:`, custErr.message);
        } else if (newCust) {
          customerIds.push(newCust.id);
        }
      }
      console.log(`   2 clientes criados com sucesso.`);
    }
    
    // 6. Create sales history (if they don't exist)
    const { data: currentSales } = await supabase.from('sales').select('id').eq('store_id', storeId);
    if (currentSales && currentSales.length > 0) {
      console.log(`   Loja já possui vendas registradas.`);
    } else if (productIds.length > 0 && customerIds.length > 0) {
      const numSales = Math.floor(Math.random() * 5) + 3; // 3 to 7 sales
      for (let s = 0; s < numSales; s++) {
        const randomCustomer = customerIds[Math.floor(Math.random() * customerIds.length)];
        const randomProduct1 = productIds[Math.floor(Math.random() * productIds.length)];
        const randomProduct2 = productIds[Math.floor(Math.random() * productIds.length)];
        
        const price1 = 30.00;
        const price2 = 45.00;
        const total = price1 + price2;
        
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString();
        
        const { data: newSale, error: saleErr } = await supabase
          .from('sales')
          .insert([{
            store_id: storeId,
            customer_id: randomCustomer,
            total_value: total,
            discount: 0,
            payment_method: ['pix', 'credito', 'dinheiro'][Math.floor(Math.random() * 3)],
            status: 'pago',
            created_at: timestamp
          }])
          .select('id')
          .single();
          
        if (saleErr) {
          console.error(`   Erro ao criar venda:`, saleErr.message);
        } else if (newSale) {
          await supabase.from('sale_items').insert([
            { sale_id: newSale.id, product_id: randomProduct1, quantity: 1, unit_price: price1 },
            { sale_id: newSale.id, product_id: randomProduct2, quantity: 1, unit_price: price2 }
          ]);
        }
      }
      console.log(`   Vendas simuladas inseridas com sucesso.`);
    }
    
    // 7. Create Telemetry Security Logs (Page views / Activity logs)
    const { count: logCount } = await supabase
      .from('security_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (logCount && logCount > 10) {
      console.log(`   Usuário já possui histórico de telemetria.`);
    } else {
      const numLogs = Math.floor(Math.random() * 30) + 15; // 15 to 45 page views
      const logsPayload = [];
      
      for (let l = 0; l < numLogs; l++) {
        const randomPage = pages[Math.floor(Math.random() * pages.length)];
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString();
        
        logsPayload.push({
          user_id: userId,
          action: 'page_view',
          ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          details: { path: randomPage.path, feature_name: randomPage.name },
          store_id: storeId,
          created_at: timestamp
        });
      }
      
      const { error: logsErr } = await supabase.from('security_logs').insert(logsPayload);
      if (logsErr) {
        console.error(`   Erro ao inserir telemetria:`, logsErr.message);
      } else {
        console.log(`   ${numLogs} logs de acesso (page_view) simulados.`);
      }
    }
  }
  
  console.log('\n✨ Concluído! 10 lojas ativas, lojistas e telemetria foram populados com sucesso.');
  console.log('💡 As senhas de todos os lojistas criados foram definidas como: lojista123');
}

seed();
