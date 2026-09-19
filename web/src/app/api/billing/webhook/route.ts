import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''

/**
 * Função utilitária para aplicar alterações de assinatura e pagamentos
 * com garantia de idempotência e fonte única da verdade.
 */
async function processConfirmedPayment(
  supabaseAdmin: any,
  params: {
    storeId: string
    subscriptionId?: string | null
    provider: 'asaas' | 'mercadopago' | 'manual'
    externalPaymentId: string
    amount: number
    paidAt?: string
    dueDate?: string
  }
) {
  const { storeId, subscriptionId, provider, externalPaymentId, amount, paidAt, dueDate } = params

  // 1. CHECAGEM DE IDEMPOTÊNCIA: Verifica se o pagamento já foi registrado
  try {
    const { data: existingPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('id, status')
      .eq('external_payment_id', externalPaymentId)
      .maybeSingle()

    if (existingPayment && existingPayment.status === 'confirmed') {
      console.log(`[Webhook Idempotency] Pagamento ${externalPaymentId} já processado anteriormente. Ignorando duplicação.`)
      try {
        await supabaseAdmin.from('security_logs').insert({
          action: 'billing_webhook_duplicate_ignored',
          store_id: storeId,
          details: {
            external_payment_id: externalPaymentId,
            provider,
            reason: 'payment_already_confirmed'
          }
        })
      } catch (logErr) {}
      return { duplicate: true }
    }

    // 2. Buscar UUID local de subscriptions e registrar na tabela subscription_payments
    const { data: localSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('store_id', storeId)
      .maybeSingle()

    const paymentRecord = {
      store_id: storeId,
      subscription_id: localSub?.id || null,
      provider,
      external_payment_id: externalPaymentId,
      amount: amount || 49.00,
      status: 'confirmed',
      due_date: dueDate || new Date().toISOString().split('T')[0],
      paid_at: paidAt || new Date().toISOString()
    }

    if (existingPayment) {
      await supabaseAdmin
        .from('subscription_payments')
        .update(paymentRecord)
        .eq('id', existingPayment.id)
    } else {
      await supabaseAdmin
        .from('subscription_payments')
        .insert(paymentRecord)
    }
  } catch (err: any) {
    console.warn('[Webhook] Tabela subscription_payments não acessível ou pendente de migração:', err.message)
  }

  // 3. Atualizar tabela subscriptions (Fonte da Verdade)
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  try {
    const { error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        store_id: storeId,
        plan_id: 'pro',
        status: 'ACTIVE',
        amount: amount || 49.00,
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_at: periodEnd.toISOString(),
        payment_provider: provider,
        external_subscription_id: subscriptionId || undefined,
        updated_at: now.toISOString()
      }, { onConflict: 'store_id' })

    if (subErr) {
      console.warn('[Webhook] Erro ao atualizar tabela subscriptions:', subErr.message)
    }
  } catch (err: any) {
    console.warn('[Webhook] subscriptions table not ready:', err.message)
  }

  // 4. Espelho retrocompatível em stores
  await supabaseAdmin
    .from('stores')
    .update({
      plan: 'pro',
      plan_status: 'active',
      subscription_ends_at: periodEnd.toISOString(),
      asaas_subscription_id: subscriptionId || undefined
    })
    .eq('id', storeId)

  // 5. Log auditável de pagamento processado
  try {
    await supabaseAdmin.from('security_logs').insert({
      action: 'billing_webhook_processed',
      store_id: storeId,
      details: {
        external_payment_id: externalPaymentId,
        external_subscription_id: subscriptionId,
        provider,
        amount,
        status: 'confirmed'
      }
    })
  } catch (logErr) {}

  return { success: true }
}

async function processPaymentOverdue(
  supabaseAdmin: any,
  params: {
    storeId: string
    provider: 'asaas' | 'mercadopago' | 'manual'
    externalPaymentId?: string
  }
) {
  const { storeId, provider, externalPaymentId } = params

  try {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'PAST_DUE',
        updated_at: new Date().toISOString()
      })
      .eq('store_id', storeId)
  } catch (e: any) {
    console.warn('[Webhook] Error updating subscription to PAST_DUE:', e.message)
  }

  await supabaseAdmin
    .from('stores')
    .update({
      plan_status: 'overdue'
    })
    .eq('id', storeId)

  return { success: true }
}

async function processSubscriptionCanceled(
  supabaseAdmin: any,
  params: {
    storeId: string
  }
) {
  const { storeId } = params

  try {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELED',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('store_id', storeId)
  } catch (e: any) {
    console.warn('[Webhook] Error updating subscription to CANCELED:', e.message)
  }

  await supabaseAdmin
    .from('stores')
    .update({
      plan_status: 'canceled',
      plan: 'free'
    })
    .eq('id', storeId)

  return { success: true }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    console.log('[Webhook Received]:', JSON.stringify(body).slice(0, 300))

    // =========================================================================
    // 1. FLUXO ASAAS
    // =========================================================================
    if (body.event && (body.payment || body.subscription || body.event.startsWith('SUBSCRIPTION_') || body.event.startsWith('PAYMENT_'))) {
      console.log('[Webhook Asaas] Identificado evento Asaas:', body.event)

      // Validação de token se configurado
      const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN
      const requestToken = request.headers.get('asaas-access-token')
      if (ASAAS_WEBHOOK_TOKEN && requestToken !== ASAAS_WEBHOOK_TOKEN) {
        console.error('[Webhook Asaas] Token de acesso Asaas incorreto!')
        return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 })
      }

      const externalSubId = body.payment?.subscription || body.subscription || null
      const externalPaymentId = body.payment?.id || body.id || `asaas_event_${Date.now()}`
      const amount = Number(body.payment?.value) || 49.00
      const dueDate = body.payment?.dueDate || null
      const paidAt = body.payment?.confirmedDate ? new Date(body.payment.confirmedDate).toISOString() : new Date().toISOString()

      // Localiza a loja pelo subscription_id ou asaas_customer_id
      let store: any = null
      if (externalSubId) {
        const { data } = await supabaseAdmin
          .from('stores')
          .select('id, plan, plan_status')
          .eq('asaas_subscription_id', externalSubId)
          .maybeSingle()
        store = data
      }

      if (!store && body.payment?.customer) {
        const { data } = await supabaseAdmin
          .from('stores')
          .select('id, plan, plan_status')
          .eq('asaas_customer_id', body.payment.customer)
          .maybeSingle()
        store = data
      }

      if (!store) {
        console.warn(`[Webhook Asaas] Nenhuma loja encontrada para subscription ${externalSubId} ou cliente ${body.payment?.customer}`)
        return NextResponse.json({ received: true, message: 'Loja não encontrada para os identificadores fornecidos.' })
      }

      switch (body.event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED': {
          const result = await processConfirmedPayment(supabaseAdmin, {
            storeId: store.id,
            subscriptionId: externalSubId,
            provider: 'asaas',
            externalPaymentId,
            amount,
            paidAt,
            dueDate
          })
          if (result.duplicate) {
            return NextResponse.json({ received: true, message: 'Pagamento já processado (idempotência).' })
          }
          break
        }

        case 'PAYMENT_OVERDUE': {
          await processPaymentOverdue(supabaseAdmin, {
            storeId: store.id,
            provider: 'asaas',
            externalPaymentId
          })
          break
        }

        case 'SUBSCRIPTION_DELETED':
        case 'SUBSCRIPTION_CANCELED': {
          await processSubscriptionCanceled(supabaseAdmin, {
            storeId: store.id
          })
          break
        }
      }

      return NextResponse.json({ success: true, message: 'Webhook Asaas processado com sucesso.' })
    }

    // =========================================================================
    // 2. FLUXO MERCADO PAGO
    // =========================================================================
    const signatureHeader = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id') || ''
    const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || ''

    if (MERCADO_PAGO_WEBHOOK_SECRET && signatureHeader) {
      const parts = signatureHeader.split(',')
      let ts = ''
      let v1 = ''
      for (const part of parts) {
        const [key, value] = part.split('=')
        if (key?.trim() === 'ts') ts = value?.trim()
        if (key?.trim() === 'v1') v1 = value?.trim()
      }

      if (ts && v1) {
        const { searchParams } = new URL(request.url)
        const urlDataId = searchParams.get('data.id') || searchParams.get('id')
        const rawId = urlDataId || body.data?.id || body.id || ''
        const lowercaseId = String(rawId).toLowerCase()

        const manifest = `id:${lowercaseId};request-id:${xRequestId};ts:${ts};`
        const calculatedSignature = crypto
          .createHmac('sha256', MERCADO_PAGO_WEBHOOK_SECRET)
          .update(manifest)
          .digest('hex')

        if (calculatedSignature !== v1) {
          console.error('[Webhook MP] Assinatura HMAC inválida!')
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }
      }
    }

    let paymentId = ''
    let preapprovalId = ''

    if (body.type === 'payment' && body.data?.id) {
      paymentId = String(body.data.id)
    } else if (body.type === 'subscription_authorized' || body.type === 'preapproval') {
      preapprovalId = String(body.data?.id || body.id)
    } else if (body.action && (body.action.startsWith('subscription') || body.action.startsWith('preapproval'))) {
      preapprovalId = String(body.data?.id || body.id)
    } else if (body.resource) {
      const parts = body.resource.split('/')
      const resourceId = parts.pop() || ''
      if (body.resource.includes('preapproval')) {
        preapprovalId = resourceId
      } else {
        paymentId = resourceId
      }
    } else if (body.id && body.topic === 'payment') {
      paymentId = String(body.id)
    } else if (body.data?.id) {
      paymentId = String(body.data.id)
    }

    if (!paymentId && !preapprovalId) {
      return NextResponse.json({ received: true, message: 'Nenhum identificador de cobrança/assinatura Mercado Pago.' })
    }

    // Se for pagamento direto do Mercado Pago
    if (paymentId) {
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
      })

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json()
        const externalReference = paymentData.external_reference // Loja ID
        const matchedSubscriptionId = paymentData.metadata?.subscription_id || null

        // Localiza a loja
        let storeId = externalReference
        if (!storeId) {
          const { data: found } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('asaas_subscription_id', paymentId)
            .maybeSingle()
          storeId = found?.id
        }

        if (storeId) {
          if (paymentData.status === 'approved') {
            const result = await processConfirmedPayment(supabaseAdmin, {
              storeId,
              subscriptionId: matchedSubscriptionId,
              provider: 'mercadopago',
              externalPaymentId: paymentId,
              amount: Number(paymentData.transaction_amount) || 49.00,
              paidAt: paymentData.date_approved || new Date().toISOString()
            })
            if (result.duplicate) {
              return NextResponse.json({ received: true, message: 'Pagamento MP já processado (idempotência).' })
            }
          } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
            await processPaymentOverdue(supabaseAdmin, { storeId, provider: 'mercadopago', externalPaymentId: paymentId })
          }
        }
      }
    }

    // Se for assinatura recorrente (preapproval) do Mercado Pago
    if (preapprovalId) {
      const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
      })

      if (preapprovalResponse.ok) {
        const preData = await preapprovalResponse.json()
        const storeId = preData.external_reference

        if (storeId) {
          if (preData.status === 'authorized') {
            await processConfirmedPayment(supabaseAdmin, {
              storeId,
              subscriptionId: preapprovalId,
              provider: 'mercadopago',
              externalPaymentId: `mp_sub_auth_${preapprovalId}`,
              amount: Number(preData.auto_recurring?.transaction_amount) || 49.00
            })
          } else if (preData.status === 'cancelled') {
            await processSubscriptionCanceled(supabaseAdmin, { storeId })
          } else if (preData.status === 'paused') {
            await processPaymentOverdue(supabaseAdmin, { storeId, provider: 'mercadopago', externalPaymentId: preapprovalId })
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Mercado Pago Webhook processado com sucesso.' })

  } catch (err: any) {
    console.error('[Webhook Error]:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no processamento do webhook' }, { status: 500 })
  }
}
