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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await context.params
    const body = await request.json()
    const { action, payload, adminUserId, adminEmail } = body

    if (!storeId || !action) {
      return NextResponse.json({ error: 'Identificador da loja e ação são obrigatórios.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obter estado atual da loja e assinatura
    const { data: currentStore } = await supabaseAdmin
      .from('stores')
      .select('id, name, plan, plan_status, trial_ends_at, subscription_ends_at, environment')
      .eq('id', storeId)
      .single()

    if (!currentStore) {
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 })
    }

    let previousSub: any = null
    try {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle()
      previousSub = sub
    } catch (e: any) {
      // Caso a tabela ainda não tenha sido criada
    }

    let subUpdate: any = {}
    let storeUpdate: any = {}
    let actionDescription = ''

    const now = new Date()

    switch (action) {
      case 'change_plan': {
        const newPlan = payload.plan || 'pro' // 'free' | 'pro' | 'enterprise'
        subUpdate = { plan_id: newPlan, updated_at: now.toISOString() }
        storeUpdate = { plan: newPlan }
        actionDescription = `Plano alterado para ${newPlan}`
        break
      }

      case 'grant_trial':
      case 'extend_trial': {
        const days = Number(payload.days) || 14
        const baseDate = (currentStore.trial_ends_at && new Date(currentStore.trial_ends_at) > now)
          ? new Date(currentStore.trial_ends_at)
          : now
        const newTrialEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

        subUpdate = {
          status: 'TRIAL',
          trial_ends_at: newTrialEnd.toISOString(),
          updated_at: now.toISOString()
        }
        storeUpdate = {
          plan_status: 'trial',
          trial_ends_at: newTrialEnd.toISOString()
        }
        actionDescription = `Trial concedido/estendido em ${days} dias (até ${newTrialEnd.toLocaleDateString('pt-BR')})`
        break
      }

      case 'grant_courtesy': {
        subUpdate = {
          status: 'COURTESY',
          amount: 0.00,
          plan_id: 'pro',
          updated_at: now.toISOString()
        }
        storeUpdate = {
          plan: 'pro',
          plan_status: 'active'
        }
        actionDescription = 'Cortesia Pro concedida (MRR = R$ 0)'
        break
      }

      case 'revoke_courtesy': {
        subUpdate = {
          status: 'FREE',
          amount: 0.00,
          plan_id: 'free',
          updated_at: now.toISOString()
        }
        storeUpdate = {
          plan: 'free',
          plan_status: 'trial'
        }
        actionDescription = 'Cortesia revogada (Retorno ao plano Free)'
        break
      }

      case 'change_environment': {
        const newEnv = payload.environment // 'PRODUCTION' | 'TEST' | 'INTERNAL' | 'DEMO' | 'PENDING_REVIEW'
        storeUpdate = { environment: newEnv }
        actionDescription = `Ambiente da loja alterado para ${newEnv}`
        break
      }

      case 'cancel_subscription': {
        subUpdate = {
          status: 'CANCELED',
          canceled_at: now.toISOString(),
          updated_at: now.toISOString()
        }
        storeUpdate = {
          plan_status: 'canceled',
          plan: 'free'
        }
        actionDescription = 'Assinatura cancelada administrativamente'
        break
      }

      case 'reactivate_subscription': {
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        subUpdate = {
          status: 'ACTIVE',
          amount: 49.00,
          plan_id: 'pro',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_billing_at: periodEnd.toISOString(),
          updated_at: now.toISOString()
        }
        storeUpdate = {
          plan: 'pro',
          plan_status: 'active',
          subscription_ends_at: periodEnd.toISOString()
        }
        actionDescription = 'Assinatura reativada administrativamente'
        break
      }

      default:
        return NextResponse.json({ error: `Ação ${action} não reconhecida.` }, { status: 400 })
    }

    // 2. Executar updates
    if (Object.keys(subUpdate).length > 0) {
      try {
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            store_id: storeId,
            ...subUpdate
          }, { onConflict: 'store_id' })
      } catch (e: any) {
        console.warn('subscriptions update warn:', e.message)
      }
    }

    if (Object.keys(storeUpdate).length > 0) {
      await supabaseAdmin
        .from('stores')
        .update(storeUpdate)
        .eq('id', storeId)
    }

    // 3. REGISTRO DE AUDITORIA OBRIGATÓRIO EM security_logs
    try {
      await supabaseAdmin
        .from('security_logs')
        .insert({
          user_id: adminUserId || null,
          action: 'admin_billing_change',
          store_id: storeId,
          details: {
            action_type: action,
            description: actionDescription,
            admin_email: adminEmail || 'super_admin',
            previous_store_state: currentStore,
            previous_subscription_state: previousSub,
            applied_sub_update: subUpdate,
            applied_store_update: storeUpdate,
            timestamp: now.toISOString()
          }
        })
    } catch (logErr: any) {
      console.warn('Audit log write error:', logErr.message)
    }

    return NextResponse.json({
      success: true,
      message: actionDescription,
      storeUpdate,
      subUpdate
    })

  } catch (err: any) {
    console.error('Super Admin Billing Action Error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao processar ação administrativa.' }, { status: 500 })
  }
}
