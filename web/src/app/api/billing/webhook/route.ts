import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received webhook payload:', body)

    // 1. CHECK IF IT IS AN ASAAS WEBHOOK
    if (body.event && body.payment) {
      console.log('Processing Asaas Webhook event...')
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
    let paymentId = ''
    if (body.type === 'payment' && body.data?.id) {
      paymentId = String(body.data.id)
    } else if (body.data?.id) {
      paymentId = String(body.data.id)
    } else if (body.resource && (body.topic === 'payment' || body.resource.includes('payments'))) {
      paymentId = body.resource.split('/').pop() || ''
    } else if (body.id && body.topic === 'payment') {
      paymentId = String(body.id)
    }

    if (!paymentId) {
      console.log('No payment ID found in webhook payload. Payload structure:', JSON.stringify(body))
      return NextResponse.json({ received: true, message: 'Nenhum ID de pagamento ou assinatura identificado.' })
    }

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

    // Find the store where asaas_subscription_id matches the payment ID
    const { data: store, error: fetchErr } = await supabaseAdmin
      .from('stores')
      .select('id, plan, plan_status')
      .eq('asaas_subscription_id', paymentId)
      .maybeSingle()

    if (fetchErr || !store) {
      console.log(`Store com a assinatura/pagamento Mercado Pago ${paymentId} não foi encontrada no banco.`)
      return NextResponse.json({ received: true, message: 'Store correspondente não encontrada.' })
    }

    let planUpdate: any = {}

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
