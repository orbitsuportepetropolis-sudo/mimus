import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

let supabaseAdminInstance: any = null
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase URL ou Service Role Key ausente nas variáveis de ambiente.')
    }
    supabaseAdminInstance = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }
  return supabaseAdminInstance
}

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''
const ASAAS_ENV = process.env.NEXT_PUBLIC_ASAAS_ENV || 'production'
const ASAAS_BASE_URL = ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/v3'

async function asaasFetch(url: string, apiKey: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'access_token': apiKey
    }
  })
  const text = await response.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch (err) {
    throw new Error(`Asaas API retornou resposta não-JSON (${response.status}): ${text.substring(0, 150)}`)
  }
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || `Erro Asaas API (Status ${response.status})`)
  }
  return data
}

// Lock em memória para evitar race conditions simultâneas no mesmo store_id
const activeCheckouts = new Map<string, Promise<any>>()

export async function POST(request: Request) {
  try {
    // 1. Validação de autenticação de sessão
    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado. Faça login para continuar.' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, email, name, paymentMethod, cpfCnpj, phone, usePromo, creditCard } = body

    if (!storeId || !email || !name || !paymentMethod || !cpfCnpj) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 })
    }

    // 2. Validação de autorização multi-tenant (apenas admin da loja ou super admin)
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('store_id, role')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isStoreAdmin = profile?.store_id === storeId && profile?.role === 'admin'

    if (!isSuperAdmin && !isStoreAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores desta loja podem alterar faturamento.' }, { status: 403 })
    }

    // Se já houver um checkout em execução para este storeId, aguardar
    if (activeCheckouts.has(storeId)) {
      console.log(`[Checkout Lock] Aguardando checkout concorrente para loja ${storeId}...`)
      try {
        const prevResult = await activeCheckouts.get(storeId)
        return prevResult
      } catch (e) {
        // Se a chamada anterior falhou, prosseguir com nova tentativa
      }
    }

    const checkoutExecution = (async () => {
      const price = 49.00
      const supabaseAdmin = getSupabaseAdmin()

      // Log auditável do início do checkout
      try {
        await supabaseAdmin.from('security_logs').insert({
          action: 'billing_checkout_started',
          store_id: storeId,
          details: {
            paymentMethod,
            email,
            price,
            origin: 'web_checkout'
          }
        })
      } catch (logErr) {
        console.warn('[Checkout Log Error]:', logErr)
      }

      // =========================================================================
      // 1. MOCK MODE (Apenas se a chave do Asaas não estiver configurada)
      // =========================================================================
      const isMock = !ASAAS_API_KEY || ASAAS_API_KEY === 'sua_chave_do_asaas_aqui' || ASAAS_API_KEY.startsWith('seu_')
      if (isMock) {
        console.log('[Checkout] Executando em modo MOCK...')
        const mockSubId = 'asaas_sub_mock_' + Math.random().toString(36).substr(2, 9)
        const mockCustId = 'asaas_cus_mock_' + Math.random().toString(36).substr(2, 9)

        try {
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              store_id: storeId,
              plan_id: 'pro',
              status: paymentMethod === 'CREDIT_CARD' ? 'ACTIVE' : 'TRIAL',
              amount: price,
              billing_cycle: 'monthly',
              payment_provider: 'asaas',
              external_customer_id: mockCustId,
              external_subscription_id: mockSubId,
              updated_at: new Date().toISOString()
            }, { onConflict: 'store_id' })
        } catch (e: any) {
          console.warn('subscriptions upsert error:', e.message)
        }

        await supabaseAdmin
          .from('stores')
          .update({
            asaas_customer_id: mockCustId,
            asaas_subscription_id: mockSubId
          })
          .eq('id', storeId)

        if (paymentMethod === 'PIX') {
          const mockPixKey = `00020126580014br.gov.bcb.pix0136mimuspay-${price}-mock-subscription-620705033906304CA38`
          return NextResponse.json({
            success: true,
            mock: true,
            subscriptionId: mockSubId,
            billingType: 'PIX',
            pixCopyPaste: mockPixKey,
            pixQrCodeBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="white"/><rect x="15" y="15" width="40" height="40" fill="%23b5127b"/><rect x="25" y="25" width="20" height="20" fill="white"/><rect x="95" y="15" width="40" height="40" fill="%23b5127b"/><rect x="105" y="25" width="20" height="20" fill="white"/><rect x="15" y="95" width="40" height="40" fill="%23b5127b"/><rect x="25" y="105" width="20" height="20" fill="white"/><rect x="65" y="65" width="20" height="20" fill="%23b5127b"/></svg>'
          })
        }

        return NextResponse.json({
          success: true,
          mock: true,
          subscriptionId: mockSubId,
          billingType: 'CREDIT_CARD'
        })
      }

      // =========================================================================
      // 2. MODO REAL ASAAS COM PROTEÇÃO CONTRA DUPLICAÇÃO
      // =========================================================================
      console.log('[Checkout] Processando assinatura real no Asaas...')

      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')

      // Consultar referências existentes na loja e na tabela subscriptions
      const { data: localSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id, external_subscription_id, external_customer_id, status, plan_id')
        .eq('store_id', storeId)
        .maybeSingle()

      const { data: storeData } = await supabaseAdmin
        .from('stores')
        .select('id, asaas_customer_id, asaas_subscription_id')
        .eq('id', storeId)
        .single()

      let customerId = localSub?.external_customer_id || storeData?.asaas_customer_id
      const existingSubId = localSub?.external_subscription_id || storeData?.asaas_subscription_id

      // Se ainda não temos customerId, pesquisar no Asaas por CPF/CNPJ
      if (!customerId) {
        const searchUrl = `${ASAAS_BASE_URL}/customers?cpfCnpj=${cleanCpfCnpj}`
        const searchData = await asaasFetch(searchUrl, ASAAS_API_KEY, { method: 'GET' })
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id
          console.log(`[Checkout] Cliente Asaas localizado por CPF: ${customerId}`)
        }
      }

      // -----------------------------------------------------------------------
      // REGRA FUNDAMENTAL: NÃO CRIAR SE JÁ EXISTIR ASSINATURA ATIVA/VÁLIDA
      // -----------------------------------------------------------------------
      let reusableSub: any = null

      // Verificar subscription já vinculada à loja
      if (existingSubId) {
        try {
          const subInfo = await asaasFetch(`${ASAAS_BASE_URL}/subscriptions/${existingSubId}`, ASAAS_API_KEY, { method: 'GET' })
          if (subInfo && subInfo.status === 'ACTIVE') {
            reusableSub = subInfo
            console.log(`[Checkout] Assinatura existente ${existingSubId} está ACTIVE no Asaas. Reutilizando.`)
          }
        } catch (e: any) {
          console.warn('[Checkout] Verificação de subscription vinculada falhou:', e.message)
        }
      }

      // Se não encontrou pela vinculada, mas temos customerId, pesquisar assinaturas ativas do cliente
      if (!reusableSub && customerId) {
        try {
          const custSubs = await asaasFetch(`${ASAAS_BASE_URL}/subscriptions?customer=${customerId}&status=ACTIVE`, ASAAS_API_KEY, { method: 'GET' })
          if (custSubs.data && custSubs.data.length > 0) {
            reusableSub = custSubs.data[0]
            console.log(`[Checkout] Assinatura ativa encontrada para o cliente Asaas: ${reusableSub.id}. Reutilizando.`)
          }
        } catch (e: any) {
          console.warn('[Checkout] Verificação de subscriptions do cliente falhou:', e.message)
        }
      }

      // Se encontramos uma assinatura válida e reutilizável:
      if (reusableSub) {
        // Persistir referências locais
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            store_id: storeId,
            plan_id: 'pro',
            amount: reusableSub.value || price,
            billing_cycle: 'monthly',
            payment_provider: 'asaas',
            external_customer_id: customerId || reusableSub.customer,
            external_subscription_id: reusableSub.id,
            updated_at: new Date().toISOString()
          }, { onConflict: 'store_id' })

        await supabaseAdmin
          .from('stores')
          .update({
            asaas_customer_id: customerId || reusableSub.customer,
            asaas_subscription_id: reusableSub.id
          })
          .eq('id', storeId)

        // Log auditável de reaproveitamento
        try {
          await supabaseAdmin.from('security_logs').insert({
            action: 'billing_subscription_reused',
            store_id: storeId,
            details: {
              external_subscription_id: reusableSub.id,
              external_customer_id: customerId || reusableSub.customer,
              reason: 'subscription_already_active'
            }
          })
        } catch (logErr) {}

        // Se pagamento via PIX, buscar cobrança PENDING para exibir QR Code
        if (paymentMethod === 'PIX') {
          const paymentsUrl = `${ASAAS_BASE_URL}/payments?subscription=${reusableSub.id}&status=PENDING`
          const paymentsData = await asaasFetch(paymentsUrl, ASAAS_API_KEY, { method: 'GET' })
          const pendingPayment = paymentsData.data?.[0]
          if (pendingPayment) {
            const pixUrl = `${ASAAS_BASE_URL}/payments/${pendingPayment.id}/pixQrCode`
            const pixData = await asaasFetch(pixUrl, ASAAS_API_KEY, { method: 'GET' })
            return NextResponse.json({
              success: true,
              reused: true,
              subscriptionId: reusableSub.id,
              billingType: 'PIX',
              pixCopyPaste: pixData.payload,
              pixQrCodeBase64: `data:image/png;base64,${pixData.encodedImage}`
            })
          }
        }

        return NextResponse.json({
          success: true,
          reused: true,
          subscriptionId: reusableSub.id,
          billingType: reusableSub.billingType || paymentMethod
        })
      }

      // -----------------------------------------------------------------------
      // CRIAR CLIENTE NO ASAAS SE NECESSÁRIO
      // -----------------------------------------------------------------------
      if (!customerId) {
        console.log('[Checkout] Criando novo cliente no Asaas...')
        const createCustomerUrl = `${ASAAS_BASE_URL}/customers`
        const customerPayload = {
          name,
          email,
          cpfCnpj: cleanCpfCnpj,
          mobilePhone: phone || undefined
        }

        const customerData = await asaasFetch(createCustomerUrl, ASAAS_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerPayload)
        })

        customerId = customerData.id
      }

      // -----------------------------------------------------------------------
      // CRIAR NOVA ASSINATURA RECORRENTE NO ASAAS
      // -----------------------------------------------------------------------
      const todayStr = new Date().toISOString().split('T')[0]
      const subscriptionPayload: any = {
        customer: customerId,
        billingType: paymentMethod,
        value: price,
        nextDueDate: todayStr,
        cycle: 'MONTHLY',
        description: 'Assinatura Mimus Pro'
      }

      if (paymentMethod === 'CREDIT_CARD' && creditCard) {
        const expiryYearFull = String(creditCard.expiryYear).length === 2
          ? '20' + creditCard.expiryYear
          : creditCard.expiryYear

        subscriptionPayload.creditCard = {
          holderName: creditCard.holderName,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: expiryYearFull,
          ccv: creditCard.ccv
        }

        subscriptionPayload.creditCardHolderInfo = {
          name: creditCard.holderName,
          email,
          cpfCnpj: cleanCpfCnpj,
          postalCode: '25620000',
          addressNumber: '100',
          phone: phone || '24999999999'
        }
      }

      console.log('[Checkout] Criando assinatura no Asaas...')
      const createSubUrl = `${ASAAS_BASE_URL}/subscriptions`
      const subData = await asaasFetch(createSubUrl, ASAAS_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionPayload)
      })

      const subscriptionId = subData.id
      console.log(`[Checkout] Assinatura Asaas criada com sucesso: ${subscriptionId}`)

      // FASE 6: SALVAR IDs IMEDIATAMENTE ANTES DE PROSSEGUIR
      try {
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            store_id: storeId,
            plan_id: 'pro',
            status: (paymentMethod === 'CREDIT_CARD' && subData.status === 'ACTIVE') ? 'ACTIVE' : 'TRIAL',
            amount: price,
            billing_cycle: 'monthly',
            payment_provider: 'asaas',
            external_customer_id: customerId,
            external_subscription_id: subscriptionId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'store_id' })
      } catch (e: any) {
        console.warn('[Checkout] subscriptions update error:', e.message)
      }

      await supabaseAdmin
        .from('stores')
        .update({
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionId
        })
        .eq('id', storeId)

      // Log auditável de criação de assinatura
      try {
        await supabaseAdmin.from('security_logs').insert({
          action: 'billing_subscription_created',
          store_id: storeId,
          details: {
            external_subscription_id: subscriptionId,
            external_customer_id: customerId,
            payment_provider: 'asaas',
            amount: price,
            billingType: paymentMethod,
            origin: 'web_checkout'
          }
        })
      } catch (logErr) {}

      // Se PIX, buscar dados do QR Code da primeira cobrança
      if (paymentMethod === 'PIX') {
        await new Promise(resolve => setTimeout(resolve, 1200))

        const paymentsUrl = `${ASAAS_BASE_URL}/payments?subscription=${subscriptionId}`
        const paymentsData = await asaasFetch(paymentsUrl, ASAAS_API_KEY, { method: 'GET' })
        const firstPayment = paymentsData.data?.[0]
        if (!firstPayment) {
          throw new Error('Cobrança inicial da assinatura não encontrada no Asaas.')
        }

        const paymentId = firstPayment.id
        const pixUrl = `${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`
        const pixData = await asaasFetch(pixUrl, ASAAS_API_KEY, { method: 'GET' })

        return NextResponse.json({
          success: true,
          subscriptionId,
          billingType: 'PIX',
          pixCopyPaste: pixData.payload,
          pixQrCodeBase64: `data:image/png;base64,${pixData.encodedImage}`
        })
      }

      return NextResponse.json({
        success: true,
        subscriptionId,
        billingType: 'CREDIT_CARD'
      })
    })()

    // Registrar lock e retornar execução
    activeCheckouts.set(storeId, checkoutExecution)
    try {
      return await checkoutExecution
    } finally {
      activeCheckouts.delete(storeId)
    }

  } catch (err: any) {
    console.error('[Checkout API Error]:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor de checkout' }, { status: 500 })
  }
}
