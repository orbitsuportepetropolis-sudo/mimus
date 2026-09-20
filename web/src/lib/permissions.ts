/**
 * Fonte Central de Permissões e Paywall do Mimus SaaS
 * 
 * Regra de Ouro:
 * - O frontend apenas apresenta o estado e bloqueia visualmente.
 * - O backend e as políticas de segurança validam o acesso real.
 * - NUNCA espalhar `if (plan === 'PRO')` de forma ad-hoc pelo sistema.
 */

export type SubscriptionStatus = 
  | 'FREE' 
  | 'TRIAL' 
  | 'ACTIVE' 
  | 'PAST_DUE' 
  | 'CANCELED' 
  | 'EXPIRED' 
  | 'COURTESY'

export type StorePlan = 'free' | 'pro' | 'enterprise'

export type StoreEnvironment = 'PRODUCTION' | 'TEST' | 'INTERNAL' | 'DEMO' | 'PENDING_REVIEW'

export type PlanFeature = 
  | 'unlimited_products'    // Free tem limite de 50 produtos; Pro é ilimitado
  | 'team_members'         // Free tem limite de 1 usuário (admin); Pro ilimitado
  | 'custom_domain'        // Domínio próprio na vitrine
  | 'integrations'         // Integrações com e-commerce e gateways
  | 'advanced_reports'     // Relatórios de margem e DRE
  | 'priority_support'     // Suporte prioritário

export interface StoreAccessContext {
  plan?: string | null
  status?: string | null
  trial_ends_at?: string | null
  subscription_ends_at?: string | null
  environment?: StoreEnvironment | string | null
}

/**
 * Avalia se o status e data de trial conferem acesso Pro ativo
 */
export function hasProAccess(context?: StoreAccessContext | null): boolean {
  if (!context) return false

  const status = (context.status || 'FREE').toUpperCase() as SubscriptionStatus
  const plan = (context.plan || 'free').toLowerCase()

  // 1. Assinatura ativa paga no plano Pro/Enterprise
  if (status === 'ACTIVE' && (plan === 'pro' || plan === 'enterprise')) {
    return true
  }

  // 2. Conta com cortesia administrativa concedida pelo Super Admin (MRR = R$ 0 mas Pro liberado)
  if (status === 'COURTESY') {
    return true
  }

  // 3. Período de avaliação (Trial) ativo e não expirado
  if (status === 'TRIAL') {
    if (!context.trial_ends_at) return true // Trial customizado sem expiração estrita
    const ends = new Date(context.trial_ends_at).getTime()
    return ends > Date.now()
  }

  // 4. Se estiver vencido (PAST_DUE), expirado ou cancelado, cai imediatamente para o modo grátis
  if (status === 'PAST_DUE' || status === 'EXPIRED' || status === 'CANCELED') {
    return false
  }

  return false
}

/**
 * Verifica se a loja pode utilizar uma funcionalidade específica
 */
export function canUseFeature(context: StoreAccessContext | null | undefined, feature: PlanFeature): boolean {
  const isPro = hasProAccess(context)

  switch (feature) {
    case 'unlimited_products':
    case 'team_members':
    case 'custom_domain':
    case 'integrations':
    case 'advanced_reports':
    case 'priority_support':
      return isPro

    default:
      return true
  }
}

/**
 * Limites quantitativos do plano
 */
export function getPlanLimits(context?: StoreAccessContext | null) {
  const isPro = hasProAccess(context)
  return {
    maxProducts: isPro ? Infinity : 50,
    maxTeamMembers: isPro ? Infinity : 1,
    canUseCustomDomain: isPro,
    canUseIntegrations: isPro,
    canUseAdvancedReports: isPro
  }
}
