import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received Asaas Webhook payload:', body)

    const event = body.event
    const payment = body.payment
    const subscriptionId = payment?.subscription || body.subscription

    if (!subscriptionId) {
      return NextResponse.json({ received: true, message: 'Nenhum ID de assinatura encontrado no payload.' })
    }

    // 1. Find store matching subscription ID
    const { data: store, error: fetchErr } = await supabaseAdmin
      .from('stores')
      .select('id, plan, plan_status')
      .eq('asaas_subscription_id', subscriptionId)
      .maybeSingle()

    if (fetchErr || !store) {
      console.log(`Store com a assinatura ${subscriptionId} não foi encontrada no banco.`)
      return NextResponse.json({ received: true, message: 'Store correspondente não encontrada.' })
    }

    let planUpdate: any = {}

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        // Update plan status to active and extend subscription ends date
        const newEndsDate = new Date()
        newEndsDate.setDate(newEndsDate.getDate() + 30) // extend by 30 days
        
        planUpdate = {
          plan: 'pro',
          plan_status: 'active',
          subscription_ends_at: newEndsDate.toISOString()
        }
        break

      case 'PAYMENT_OVERDUE':
        // Subscription payment is overdue, mark store status as overdue
        planUpdate = {
          plan_status: 'overdue',
          // Optionally downgrade to free immediately or wait for grace period
          plan: 'free' 
        }
        break

      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_CANCELED':
        // Subscription canceled, mark as canceled and revert plan to free
        planUpdate = {
          plan: 'free',
          plan_status: 'canceled'
        }
        break

      default:
        console.log(`Evento ${event} não tratado pelo webhook.`)
        break
    }

    if (Object.keys(planUpdate).length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from('stores')
        .update(planUpdate)
        .eq('id', store.id)

      if (updateErr) {
        throw new Error(`Erro ao atualizar plano no Supabase: ${updateErr.message}`)
      }
      console.log(`Plano da loja ${store.id} atualizado com sucesso via webhook. Status: ${planUpdate.plan_status}`)
    }

    return NextResponse.json({ success: true, message: 'Webhook processado com sucesso.' })

  } catch (err: any) {
    console.error('Webhook Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no processamento do webhook' }, { status: 500 })
  }
}
