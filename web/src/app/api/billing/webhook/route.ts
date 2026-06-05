import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

let supabaseAdminInstance: any = null
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase URL or Key is missing from environment variables.')
    }
    supabaseAdminInstance = createClient(url, key)
  }
  return supabaseAdminInstance
}

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    console.log('Received webhook payload:', body)

    // 1. CHECK IF IT IS AN ASAAS WEBHOOK
    if (body.event && (body.payment || body.subscription || body.event.startsWith('SUBSCRIPTION_'))) {
      console.log('Processing Asaas Webhook event...')
      
      // Validate webhook token if configured
      const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN
      const requestToken = request.headers.get('asaas-access-token')
      if (ASAAS_WEBHOOK_TOKEN && requestToken !== ASAAS_WEBHOOK_TOKEN) {
        console.error('Asaas webhook token verification failed!')
        return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 })
      }

      const subscriptionId = body.payment?.subscription || body.subscription

      if (!subscriptionId) {
        return NextResponse.json({ received: true, message: 'Nenhum ID de assinatura encontrado no payload Asaas.' })
      }

      const { data: store, error: fetchErr } = await supabaseAdmin
        .from('stores')
        .select('id, plan, plan_status')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle()

      if (fetchErr || !store) {
        console.log(`Store com a assinatura Asaas ${subscriptionId} não foi encontrada.`)
        return NextResponse.json({ received: true, message: 'Store correspondente não encontrada.' })
      }

      let planUpdate: any = {}

      switch (body.event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          const newEndsDate = new Date()
          newEndsDate.setDate(newEndsDate.getDate() + 30)
          planUpdate = {
            plan: 'pro',
            plan_status: 'active',
            subscription_ends_at: newEndsDate.toISOString()
          }
          break
        case 'PAYMENT_OVERDUE':
          planUpdate = {
            plan_status: 'overdue',
            plan: 'free' 
          }
          break
        case 'SUBSCRIPTION_DELETED':
        case 'SUBSCRIPTION_CANCELED':
          planUpdate = {
            plan: 'free',
            plan_status: 'canceled'
          }
          break
      }

      if (Object.keys(planUpdate).length > 0) {
        const { error: updateErr } = await supabaseAdmin
          .from('stores')
          .update(planUpdate)
          .eq('id', store.id)
        if (updateErr) throw updateErr
      }

      return NextResponse.json({ success: true, message: 'Asaas Webhook processado.' })
    }

    // 2. CHECK IF IT IS A MERCADO PAGO WEBHOOK
    const signatureHeader = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id') || ''
    const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || ''

    if (MERCADO_PAGO_WEBHOOK_SECRET && signatureHeader) {
      console.log('Validating Mercado Pago webhook signature...')
      const parts = signatureHeader.split(',')
      let ts = ''
      let v1 = ''
      for (const part of parts) {
        const [key, value] = part.split('=')
        if (key?.trim() === 'ts') ts = value?.trim()
        if (key?.trim() === 'v1') v1 = value?.trim()
      }

      if (!ts || !v1) {
        console.error('Mercado Pago signature header missing ts or v1:', signatureHeader)
        return NextResponse.json({ error: 'Assinatura inválida (cabeçalhos ausentes)' }, { status: 401 })
      }

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
        console.error('Mercado Pago signature verification failed!', {
          manifest,
          received: v1,
          calculated: calculatedSignature
        })
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
      }

      console.log('Mercado Pago signature verified successfully!')
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
      console.log('No payment ID or preapproval ID found in webhook payload. Payload structure:', JSON.stringify(body))
      return NextResponse.json({ received: true, message: 'Nenhum ID de pagamento ou assinatura identificado.' })
    }

    let planUpdate: any = {}
    let matchedId = ''

    if (paymentId) {
      console.log(`Fetching details for Mercado Pago payment ${paymentId}...`)

      // Verify payment status directly with Mercado Pago API
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        console.error('Mercado Pago API error fetching payment:', errorData)
        throw new Error(`Erro ao buscar detalhes do pagamento no Mercado Pago: ${paymentResponse.statusText}`)
      }

      const paymentData = await paymentResponse.json()
      console.log(`Mercado Pago payment status for ${paymentId}: ${paymentData.status} (${paymentData.status_detail})`)

      matchedId = paymentId

      if (paymentData.status === 'approved') {
        const newEndsDate = new Date()
        newEndsDate.setDate(newEndsDate.getDate() + 30) // Extend by 30 days
        planUpdate = {
          plan: 'pro',
          plan_status: 'active',
          subscription_ends_at: newEndsDate.toISOString()
        }
      } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
        planUpdate = {
          plan: 'free',
          plan_status: 'canceled'
        }
      } else if (paymentData.status === 'refunded' || paymentData.status === 'charged_back') {
        planUpdate = {
          plan: 'free',
          plan_status: 'canceled'
        }
      }
    } else if (preapprovalId) {
      console.log(`Fetching details for Mercado Pago preapproval ${preapprovalId}...`)

      // Verify preapproval status directly with Mercado Pago API
      const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      })

      if (!preapprovalResponse.ok) {
        const errorData = await preapprovalResponse.json()
        console.error('Mercado Pago API error fetching preapproval:', errorData)
        throw new Error(`Erro ao buscar detalhes da assinatura no Mercado Pago: ${preapprovalResponse.statusText}`)
      }

      const preapprovalData = await preapprovalResponse.json()
      console.log(`Mercado Pago preapproval status for ${preapprovalId}: ${preapprovalData.status}`)

      matchedId = preapprovalId

      if (preapprovalData.status === 'authorized') {
        const nextPaymentDate = preapprovalData.next_payment_date
        const endsDate = nextPaymentDate 
          ? new Date(nextPaymentDate).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        planUpdate = {
          plan: 'pro',
          plan_status: 'active',
          subscription_ends_at: endsDate
        }
      } else if (preapprovalData.status === 'paused') {
        planUpdate = {
          plan_status: 'pending'
        }
      } else if (preapprovalData.status === 'cancelled') {
        planUpdate = {
          plan: 'free',
          plan_status: 'canceled'
        }
      }
    }

    // Find the store where asaas_subscription_id matches the ID
    const { data: store, error: fetchErr } = await supabaseAdmin
      .from('stores')
      .select('id, plan, plan_status')
      .eq('asaas_subscription_id', matchedId)
      .maybeSingle()

    if (fetchErr || !store) {
      console.log(`Store com a assinatura/pagamento Mercado Pago ${matchedId} não foi encontrada no banco.`)
      return NextResponse.json({ received: true, message: 'Store correspondente não encontrada.' })
    }

    if (Object.keys(planUpdate).length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from('stores')
        .update(planUpdate)
        .eq('id', store.id)

      if (updateErr) {
        throw new Error(`Erro ao atualizar plano no Supabase: ${updateErr.message}`)
      }
      console.log(`Plano da loja ${store.id} atualizado com sucesso via Mercado Pago webhook. Status: ${planUpdate.plan_status}`)
    }

    return NextResponse.json({ success: true, message: 'Mercado Pago Webhook processado com sucesso.' })

  } catch (err: any) {
    console.error('Webhook Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no processamento do webhook' }, { status: 500 })
  }
}
