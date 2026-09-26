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

export type StorePlan = 'free' | 'pro' | 'enterprise' | 'premium'

export type StoreEnvironment = 'PRODUCTION' | 'TEST' | 'INTERNAL' | 'DEMO' | 'PENDING_REVIEW'

export type PlanFeature = 
  | 'unlimited_products'    // Free tem limite de 10 produtos; Pro é ilimitado
  | 'team_members'         // Free tem limite de 1 usuário (admin); Pro ilimitado
  | 'custom_domain'        // Domínio próprio na vitrine
  | 'integrations'         // Integrações com e-commerce e gateways
  | 'advanced_reports'     // Relatórios de margem e DRE
  | 'priority_support'     // Suporte prioritário
  | 'mimus_work'           // Acesso ao workspace agêntico Co-Work
  | 'vitrine_studio'       // Editor de vitrine com IA

export interface StoreAccessContext {
  plan?: string | null
  status?: string | null
  trial_ends_at?: string | null
  subscription_ends_at?: string | null
  environment?: StoreEnvironment | string | null
}

/**
 * Avalia se o status e data de trial conferem acesso Pro ativo
 * (Plano Premium herda todas as regalias do Pro)
 */
export function hasProAccess(context?: StoreAccessContext | null): boolean {
  if (!context) return false

  const status = (context.status || 'FREE').toUpperCase()
  const plan = (context.plan || 'free').toLowerCase()

  // 1. Conta com cortesia administrativa concedida pelo Super Admin
  if (status === 'COURTESY') {
    return true
  }

  // 2. Assinatura ativa paga no plano Pro/Enterprise/Premium
  if ((status === 'ACTIVE' || status === 'PRO' || status === 'PENDING') && (plan === 'pro' || plan === 'enterprise' || plan === 'premium')) {
    return true
  }

  // 3. Qualquer plano Pro/Premium que não esteja explicitamente cancelado, expirado ou inadimplente
  if ((plan === 'pro' || plan === 'premium') && status !== 'CANCELED' && status !== 'EXPIRED' && status !== 'PAST_DUE') {
    return true
  }

  // 4. Período de avaliação (Trial) ativo e não expirado
  if (status === 'TRIAL' || status === 'TRIAL_CUSTOM') {
    if (!context.trial_ends_at || status === 'TRIAL_CUSTOM') return true // Trial customizado sem expiração estrita
    const ends = new Date(context.trial_ends_at).getTime()
    return ends > Date.now()
  }

  // 5. Se estiver vencido (PAST_DUE), expirado ou cancelado, bloqueia
  if (status === 'PAST_DUE' || status === 'EXPIRED' || status === 'CANCELED') {
    return false
  }

  return false
}

/**
 * Avalia se a loja tem acesso ao plano Premium (R$ 109) - Mimus Work & Vitrine Studio
 */
export function hasPremiumAccess(context?: StoreAccessContext | null): boolean {
  if (!context) return false

  const status = (context.status || 'FREE').toUpperCase() as SubscriptionStatus
  const plan = (context.plan || 'free').toLowerCase()

  if (status === 'ACTIVE' && (plan === 'premium' || plan === 'enterprise')) {
    return true
  }

  if (status === 'COURTESY') {
    return true
  }

  if (status === 'TRIAL') {
    if (!context.trial_ends_at) return true
    const ends = new Date(context.trial_ends_at).getTime()
    return ends > Date.now()
  }

  return false
}

/**
 * Verifica se a loja pode utilizar uma funcionalidade específica
 */
export function canUseFeature(context: StoreAccessContext | null | undefined, feature: PlanFeature): boolean {
  const isPro = hasProAccess(context)
  const isPremium = hasPremiumAccess(context)

  switch (feature) {
    case 'unlimited_products':
    case 'team_members':
    case 'custom_domain':
    case 'integrations':
    case 'advanced_reports':
    case 'priority_support':
      return isPro

    case 'mimus_work':
    case 'vitrine_studio':
      return isPremium

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
    maxProducts: isPro ? Infinity : 10,
    maxTeamMembers: isPro ? Infinity : 1,
    canUseCustomDomain: isPro,
    canUseIntegrations: isPro,
    canUseAdvancedReports: isPro
  }
}
