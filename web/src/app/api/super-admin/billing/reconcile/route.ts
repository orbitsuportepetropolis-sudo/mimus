import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${ASAAS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...options.headers
    }
  })
  const text = await res.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch (err) {
    throw new Error(`Asaas API retornou resposta não-JSON (${res.status}): ${text.substring(0, 150)}`)
  }
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description || `Erro Asaas API (Status ${res.status})`)
  }
  return data
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Buscar dados locais
    const [storesRes, subsRes, paysRes] = await Promise.all([
      supabaseAdmin.from('stores').select('id, name, plan, plan_status, asaas_customer_id, asaas_subscription_id, environment, created_at'),
      supabaseAdmin.from('subscriptions').select('*'),
      supabaseAdmin.from('subscription_payments').select('*')
    ])

    const stores = storesRes.data || []
    const localSubs = subsRes.data || []
    const localPayments = paysRes.data || []

    // 2. Buscar dados do Asaas
    let asaasCustomers: any[] = []
    let asaasSubscriptions: any[] = []
    let asaasPayments: any[] = []

    if (ASAAS_API_KEY && !ASAAS_API_KEY.startsWith('seu_') && ASAAS_API_KEY !== 'sua_chave_do_asaas_aqui') {
      try {
        const [custData, subData, payData] = await Promise.all([
          asaasFetch('/customers?limit=100'),
          asaasFetch('/subscriptions?limit=100'),
          asaasFetch('/payments?limit=100')
        ])
        asaasCustomers = custData.data || []
        asaasSubscriptions = subData.data || []
        asaasPayments = payData.data || []
      } catch (err: any) {
        console.error('[Reconciliation GET] Erro ao consultar Asaas API:', err.message)
      }
    }

    // 3. Cruzar informações e detectar duplicidades e discrepâncias
    // Agrupar subscriptions por customer
    const subsByCustomer = new Map<string, any[]>()
    asaasSubscriptions.forEach(sub => {
      const list = subsByCustomer.get(sub.customer) || []
      list.push(sub)
      subsByCustomer.set(sub.customer, list)
    })

    const duplicateAlerts: any[] = []
    subsByCustomer.forEach((subs, customerId) => {
      const activeSubs = subs.filter(s => s.status === 'ACTIVE')
      if (activeSubs.length > 1) {
        const customer = asaasCustomers.find((c: any) => c.id === customerId)
        const matchedStore = stores.find((s: any) => s.asaas_customer_id === customerId)
        
        // Determinar canônica (a que possui pagamentos confirmados) e duplicadas
        const subsWithPayments = activeSubs.map((s: any) => {
          const payments = asaasPayments.filter((p: any) => p.subscription === s.id)
          const confirmedPayments = payments.filter((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
          return {
            ...s,
            paymentsCount: payments.length,
            confirmedCount: confirmedPayments.length,
            payments
          }
        })

        // A canônica é aquela com mais pagamentos confirmados ou criada primeiro
        const canonical = subsWithPayments.slice().sort((a: any, b: any) => b.confirmedCount - a.confirmedCount || new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime())[0]
        const duplicates = subsWithPayments.filter((s: any) => s.id !== canonical.id)

        duplicateAlerts.push({
          customerId,
          customerName: customer?.name || 'Cliente Asaas',
          customerEmail: customer?.email || null,
          customerCpf: customer?.cpfCnpj || null,
          storeId: matchedStore?.id || null,
          storeName: matchedStore?.name || 'Loja não vinculada',
          totalActiveSubs: activeSubs.length,
          canonical: {
            id: canonical.id,
            status: canonical.status,
            value: canonical.value,
            dateCreated: canonical.dateCreated,
            confirmedPaymentsCount: canonical.confirmedCount,
            payments: canonical.payments
          },
          duplicates: duplicates.map((d: any) => ({
            id: d.id,
            status: d.status,
            value: d.value,
            dateCreated: d.dateCreated,
            confirmedPaymentsCount: d.confirmedCount,
            payments: d.payments
          }))
        })
      }
    })

    // 4. Detectar pagamentos do Asaas confirmados que ainda não estão em subscription_payments
    const localPaymentIds = new Set(localPayments.map((p: any) => p.external_payment_id))
    const unimportedPayments: any[] = []

    asaasPayments
      .filter((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
      .forEach((p: any) => {
        if (!localPaymentIds.has(p.id)) {
          const matchedStore = stores.find((s: any) => s.asaas_customer_id === p.customer || s.asaas_subscription_id === p.subscription)
          unimportedPayments.push({
            paymentId: p.id,
            subscriptionId: p.subscription,
            customerId: p.customer,
            value: p.value,
            paidDate: p.paymentDate || p.confirmedDate,
            dueDate: p.dueDate,
            storeId: matchedStore?.id || null,
            storeName: matchedStore?.name || 'Loja não vinculada'
          })
        }
      })

    // 5. Detectar assinaturas vencidas (current_period_end < now() sem confirmação de pagamento do novo ciclo)
    const overdueAlerts: any[] = []
    const now = Date.now()

    for (const sub of localSubs) {
      if (sub.status === 'ACTIVE' || sub.status === 'PAST_DUE') {
        const periodEnd = sub.current_period_end || sub.next_billing_at
        if (periodEnd && new Date(periodEnd).getTime() < now) {
          const hasRecentPayment = localPayments.some((p: any) => 
            p.store_id === sub.store_id && 
            p.status === 'confirmed' && 
            new Date(p.paid_at || p.created_at).getTime() >= new Date(periodEnd).getTime() - 24 * 60 * 60 * 1000
          ) || asaasPayments.some((p: any) => 
            (p.subscription === sub.external_subscription_id || p.customer === sub.external_customer_id) &&
            (p.status === 'RECEIVED' || p.status === 'CONFIRMED') &&
            new Date(p.paymentDate || p.confirmedDate).getTime() >= new Date(periodEnd).getTime() - 24 * 60 * 60 * 1000
          )

          if (!hasRecentPayment) {
            const matchedStore = stores.find((s: any) => s.id === sub.store_id)
            const pendingAsaasPayment = asaasPayments.find((p: any) => 
              (p.subscription === sub.external_subscription_id || p.customer === sub.external_customer_id) &&
              p.status === 'PENDING'
            )

            const daysOverdue = (now - new Date(periodEnd).getTime()) / (1000 * 60 * 60 * 24)
            const targetStatus = daysOverdue > 5 ? 'EXPIRED' : 'PAST_DUE'
            const targetPlanStatus = daysOverdue > 5 ? 'expired' : 'past_due'

            overdueAlerts.push({
              storeId: sub.store_id,
              storeName: matchedStore?.name || 'Loja',
              subscriptionId: sub.id,
              externalSubscriptionId: sub.external_subscription_id,
              periodEnd,
              daysOverdue: Math.floor(daysOverdue),
              status: targetStatus,
              pendingInvoiceUrl: pendingAsaasPayment?.invoiceUrl || null,
              pendingPaymentId: pendingAsaasPayment?.id || null,
              pendingValue: pendingAsaasPayment?.value || sub.amount
            })

            // Atualiza status no Supabase se ainda estava gravado como ACTIVE ou plano diferente de free
            if (sub.status !== targetStatus || sub.plan_id !== 'free' || (matchedStore && matchedStore.plan !== 'free')) {
              try {
                await supabaseAdmin
                  .from('subscriptions')
                  .update({ plan_id: 'free', status: targetStatus, updated_at: new Date().toISOString() })
                  .eq('id', sub.id)

                if (matchedStore) {
                  await supabaseAdmin
                    .from('stores')
                    .update({ plan: 'free', plan_status: targetPlanStatus })
                    .eq('id', matchedStore.id)
                }
              } catch (syncErr: any) {
                console.warn('[Reconciliation Overdue Sync Error]:', syncErr.message)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAsaasCustomers: asaasCustomers.length,
        totalAsaasSubscriptions: asaasSubscriptions.length,
        totalAsaasPayments: asaasPayments.length,
        duplicateSubscriptionsCount: duplicateAlerts.length,
        unimportedPaymentsCount: unimportedPayments.length,
        overdueSubscriptionsCount: overdueAlerts.length
      },
      duplicateAlerts,
      unimportedPayments,
      overdueAlerts,
      asaasSubscriptions,
      localSubscriptions: localSubs
    })

  } catch (err: any) {
    console.error('[Reconciliation GET Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { action, subscriptionId, paymentId, storeId } = await request.json()

    // AÇÃO 1: CANCELAR ASSINATURA DUPLICADA NO ASAAS (APENAS COM CONFIRMAÇÃO DO ADMIN)
    if (action === 'cancel_duplicate_subscription') {
      if (!subscriptionId) {
        return NextResponse.json({ error: 'subscriptionId obrigatório para cancelamento.' }, { status: 400 })
      }

      console.log(`[Reconciliation] Cancelando assinatura duplicada no Asaas: ${subscriptionId}`)
      const cancelRes = await asaasFetch(`/subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      })

      // Log auditável
      try {
        await supabaseAdmin.from('security_logs').insert({
          action: 'billing_subscription_canceled',
          store_id: storeId || null,
          details: {
            external_subscription_id: subscriptionId,
            reason: 'manual_duplicate_resolution_super_admin',
            asaas_response: cancelRes
          }
        })
      } catch (logErr) {}

      return NextResponse.json({
        success: true,
        message: `Assinatura ${subscriptionId} cancelada no Asaas com sucesso.`,
        data: cancelRes
      })
    }

    // AÇÃO 2: RECONCILIAR TODOS OS PAGAMENTOS CONFIRMADOS DO ASAAS
    if (action === 'reconcile_all') {
      console.log('[Reconciliation] Executando reconciliação completa com Asaas...')

      // 1. Buscar pagamentos recebidos no Asaas
      const paymentsData = await asaasFetch('/payments?status=RECEIVED&limit=100')
      const confirmedPayments = paymentsData.data || []

      // 2. Buscar lojas e assinaturas locais
      const { data: allStores } = await supabaseAdmin.from('stores').select('*')
      const stores = allStores || []

      let reconciledCount = 0

      for (const p of confirmedPayments) {
        const externalPaymentId = p.id
        const externalSubId = p.subscription
        const customerId = p.customer
        const amount = Number(p.value) || 49.00
        const paidAt = p.paymentDate ? new Date(p.paymentDate).toISOString() : new Date().toISOString()
        const dueDate = p.dueDate

        // Localizar a loja pelo customer_id ou subscription_id
        let store = stores.find((s: any) => s.asaas_customer_id === customerId || s.asaas_subscription_id === externalSubId)

        // Se a cliente for emanuelly penteado, associar diretamente à loja mah cosméticos comprovada
        if (!store && (customerId === 'cus_000195017714' || externalSubId === 'sub_gh0g9q0d5o7ijw12' || externalSubId === 'sub_52zn2eg0x6dir5r2')) {
          store = stores.find((s: any) => s.id === '2cfa2660-665c-4c25-8318-35bf45626a45')
        }

        if (!store) {
          console.warn(`[Reconcile All] Loja não encontrada para customer ${customerId} ou sub ${externalSubId}`)
          continue
        }

        // Buscar assinatura local para obter o UUID de subscriptions
        const { data: localSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle()

        // Inserir ou atualizar na tabela subscription_payments de forma idempotente
        const { data: existingPayment } = await supabaseAdmin
          .from('subscription_payments')
          .select('id')
          .eq('external_payment_id', externalPaymentId)
          .maybeSingle()

        if (!existingPayment) {
          await supabaseAdmin
            .from('subscription_payments')
            .insert({
              store_id: store.id,
              subscription_id: localSub?.id || null,
              provider: 'asaas',
              external_payment_id: externalPaymentId,
              amount,
              status: 'confirmed',
              due_date: dueDate,
              paid_at: paidAt
            })
        }

        // Atualizar tabela subscriptions para ACTIVE
        const nextBilling = new Date(new Date(dueDate || paidAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            store_id: store.id,
            plan_id: 'pro',
            status: 'ACTIVE',
            amount,
            billing_cycle: 'monthly',
            current_period_start: paidAt,
            current_period_end: nextBilling,
            next_billing_at: nextBilling,
            payment_provider: 'asaas',
            external_customer_id: customerId,
            external_subscription_id: externalSubId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'store_id' })

        // Atualizar stores para refletir pro ativo e vincular IDs canônicos
        await supabaseAdmin
          .from('stores')
          .update({
            plan: 'pro',
            plan_status: 'active',
            asaas_customer_id: customerId,
            asaas_subscription_id: externalSubId,
            subscription_ends_at: nextBilling
          })
          .eq('id', store.id)

        // Log auditável
        try {
          await supabaseAdmin.from('security_logs').insert({
            action: 'billing_payment_reconciled',
            store_id: store.id,
            details: {
              external_payment_id: externalPaymentId,
              external_subscription_id: externalSubId,
              customer_id: customerId,
              amount,
              status: 'confirmed'
            }
          })
        } catch (logErr) {}

        reconciledCount++
      }

      return NextResponse.json({
        success: true,
        message: `Reconciliação concluída. ${reconciledCount} pagamento(s) processado(s).`,
        reconciledCount
      })
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })

  } catch (err: any) {
    console.error('[Reconciliation POST Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
