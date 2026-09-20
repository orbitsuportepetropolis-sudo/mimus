'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  UserX, 
  UserCheck, 
  Key, 
  Trash2, 
  Search, 
  Activity, 
  Database, 
  Edit3, 
  CreditCard,
  Plus,
  Loader2,
  ExternalLink,
  Lock,
  Globe,
  Settings,
  Target,
  Share2,
  Percent,
  Heart,
  Check,
  X,
  MessageCircle,
  UserPlus,
  ChevronDown,
  Package,
  Clock,
  RefreshCw,
  ShieldAlert,
  Store as StoreIcon
} from 'lucide-react'
import { FounderDashboard, SaaSMetrics, StoreEconomyMetrics } from '@/components/super-admin/founder-dashboard'
import { ActivationFunnel, FunnelStep } from '@/components/super-admin/activation-funnel'
import { StoresPlansTable, StoreRowData } from '@/components/super-admin/stores-plans-table'
import { StoreDetailsModal } from '@/components/super-admin/store-details-modal'
import { AsaasReconciliation } from '@/components/super-admin/asaas-reconciliation'
import { SubscriptionStatus, StoreEnvironment } from '@/lib/permissions'

type Tab = 'metrics' | 'funnel' | 'leads' | 'stores' | 'users' | 'sales' | 'logs' | 'reconciliation'

interface Lead {
  id: string
  name: string
  whatsapp: string | null
  instagram: string | null
  loja: string | null
  origem: string | null
  dor_principal: string | null
  demo: boolean
  conta_criada: boolean
  ativado: boolean
  ultimo_contato: string | null
  proxima_acao: string | null
  status: string
  notes: string | null
  created_at: string
}

interface UserView {
  id: string
  store_id: string | null
  name: string
  role: string
  status: string
  created_at: string
  email: string | null
  phone: string | null
  instagram?: string | null
  store_name: string | null
}

interface Store {
  id: string
  name: string
  plan: string
  plan_status: string
  trial_ends_at: string | null
  custom_domain: string | null
  created_at: string
}

interface SecurityLog {
  id: string
  created_at: string
  user_id: string | null
  affected_user_id: string | null
  action: string
  ip: string | null
  user_agent: string | null
  details: any
  store_id: string | null
  profiles?: { name: string } | null
  stores?: { name: string } | null
}

interface GlobalSale {
  id: string
  store_id: string
  total_value: number
  payment_method: string
  created_at: string
  store_name?: string
  customer_name?: string
}

interface DashboardMetrics {
  mrr: number
  mrrGrowth: number
  ticketMedio: number
  
  newStores30Days: number
  conversionRate: number
  leadSources: { name: string; percentage: number; count: number }[]
  
  churnCount: number
  churnRate: number
  avgTenure: number
  ltv: number
  
  eanRate: number
  eanCount: number
  activeStoresCount: number
  publishedCatalogs: number
  avgProductsPerClient: number
  
  totalVisits: number
  totalOrders: number
  gmv: number
  storesWithOrders30Days: number
}

interface FunnelUser {
  id: string
  name: string
  email: string | null
  storeName: string
  createdAt: string
  hasProduct: boolean
  hasPublishedVitrine: boolean
  hasShared: boolean
  returnedNextWeek: boolean
}

export default function SuperAdminPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('metrics')
  const [loading, setLoading] = useState(true)

  // Filters for Founder Dashboard and Funnel
  const [environmentFilter, setEnvironmentFilter] = useState<string>('PRODUCTION')
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Real SaaS and Store Economy Metrics
  const [saasMetrics, setSaasMetrics] = useState<SaaSMetrics>({
    mrr: 0,
    contractedMrr: 0,
    pastDueMrr: 0,
    pastDueStoresCount: 0,
    totalRevenueCollected: 0,
    confirmedPaymentsCount: 0,
    payingStoresCount: 0,
    activeTrialsCount: 0,
    newStoresCount: 0,
    conversionTrialRate: null,
    churnRate: null,
    arpu: 0
  })

  const [storeEconomyMetrics, setStoreEconomyMetrics] = useState<StoreEconomyMetrics>({
    gmv: 0,
    totalOrders: 0,
    ticketMedioPedidos: 0,
    storesWithSalesCount: 0,
    publishedCatalogsCount: 0,
    totalVisits: null
  })

  // Funnel steps
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([])

  // Stores Row Data for Stores & Plans Table
  const [storesRowData, setStoresRowData] = useState<StoreRowData[]>([])
  const [selectedStoreRow, setSelectedStoreRow] = useState<StoreRowData | null>(null)
  const [isStoreDetailsModalOpen, setIsStoreDetailsModalOpen] = useState(false)

  // Data states
  const [users, setUsers] = useState<UserView[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [sales, setSales] = useState<GlobalSale[]>([])
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [founderMetrics, setFounderMetrics] = useState<DashboardMetrics | null>(null)
  const [funnelUsers, setFunnelUsers] = useState<FunnelUser[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [savingLead, setSavingLead] = useState<string | null>(null)
  const [addingLead, setAddingLead] = useState(false)
  const cellInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserView | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false)

  // Form states for creating new admin
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminPhone, setNewAdminPhone] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('admin')
  const [newAdminStoreId, setNewAdminStoreId] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Edit user states
  const [editUserName, setEditUserName] = useState('')
  const [editUserPhone, setEditUserPhone] = useState('')
  const [editUserRole, setEditUserRole] = useState('admin')

  // Telemetry & Activity states
  const [featureUsage, setFeatureUsage] = useState<{ name: string; count: number }[]>([])
  const [recentActivities, setRecentActivities] = useState<SecurityLog[]>([])

  // Edit store states
  const [editStorePlan, setEditStorePlan] = useState('free')
  const [editStorePlanStatus, setEditStorePlanStatus] = useState('trial')
  const [editStoreCustomDomain, setEditStoreCustomDomain] = useState('')
  const [duplicateAlertsCount, setDuplicateAlertsCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [activeTab, environmentFilter, periodFilter])

  async function loadData() {
    try {
      setLoading(true)

      // Checagem de integridade e duplicidades no Asaas
      fetch('/api/super-admin/billing/reconcile')
        .then(r => r.json())
        .then(d => {
          if (d.duplicateAlerts) {
            setDuplicateAlertsCount(d.duplicateAlerts.length)
          }
        })
        .catch(() => {})
      
      if (activeTab === 'leads') {
        const { data } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
        if (data) setLeads(data as Lead[])
      }

      else if (activeTab === 'metrics' || activeTab === 'funnel' || activeTab === 'stores') {
        // Determinar limite de data pelo período selecionado
        const now = new Date()
        let periodDate = new Date(0) // all
        if (periodFilter === '7d') {
          periodDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (periodFilter === '30d') {
          periodDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (periodFilter === '90d') {
          periodDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }

        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const [usersRes, storesRes, salesRes, logsRes, productsRes, subsRes, paysRes] = await Promise.all([
          supabase.from('profiles').select('id, store_id, name, email, phone, role, status, created_at').order('created_at', { ascending: false }),
          supabase.from('stores').select('*').order('created_at', { ascending: false }),
          supabase.from('sales').select('id, total_value, store_id, payment_method, status, created_at').order('created_at', { ascending: false }),
          supabase.from('security_logs').select('action, store_id, created_at, user_id, details').gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('products').select('id, store_id, active'),
          supabase.from('subscriptions').select('*'),
          supabase.from('subscription_payments').select('*').order('created_at', { ascending: false })
        ])

        const allStores = storesRes.data || []
        const allProfiles = usersRes.data || []
        const allSales = (salesRes.data || []).map((s: any) => ({
          ...s,
          total_value: Number(s.total_value) || 0
        }))
        const allProducts = productsRes.data || []
        const allSubs = subsRes.data || []
        const allPayments = paysRes.data || []

        setStores(allStores)

        // 1. Mapeamento de Linhas para a Tabela de Lojas & Planos
        const mappedStoreRows: StoreRowData[] = allStores.map((s: any) => {
          const respProfile = allProfiles.find((p: any) => p.store_id === s.id && (p.role === 'admin' || !p.role)) || allProfiles.find((p: any) => p.store_id === s.id)
          const sub = allSubs.find((item: any) => item.store_id === s.id)
          const storeSales = allSales.filter((sale: any) => sale.store_id === s.id && sale.status !== 'cancelado')
          const storeSales30d = storeSales.filter((sale: any) => new Date(sale.created_at) >= thirtyDaysAgo)
          
          const storePayments = allPayments.filter((p: any) => p.store_id === s.id && p.status === 'confirmed')
          const latestPayment = storePayments.length > 0 
            ? storePayments.sort((a: any, b: any) => new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime())[0]
            : null

          const rawStatus = (sub?.status || s.plan_status || 'FREE').toUpperCase()
          let subscriptionStatus: SubscriptionStatus = 'FREE'

          const periodEnd = sub?.current_period_end || s.subscription_ends_at || sub?.next_billing_at
          const isPeriodExpired = periodEnd ? new Date(periodEnd).getTime() < Date.now() : false
          const hasRecentPayment = isPeriodExpired && storePayments.some((p: any) => 
            new Date(p.paid_at || p.created_at).getTime() >= new Date(periodEnd!).getTime() - 24 * 60 * 60 * 1000
          )

          if (rawStatus === 'ACTIVE') {
            if (isPeriodExpired && !hasRecentPayment) {
              const daysOverdue = (Date.now() - new Date(periodEnd!).getTime()) / (1000 * 60 * 60 * 24)
              subscriptionStatus = daysOverdue > 5 ? 'EXPIRED' : 'PAST_DUE'
            } else {
              subscriptionStatus = 'ACTIVE'
            }
          }
          else if (rawStatus === 'TRIAL' || rawStatus === 'TRIAL_CUSTOM') subscriptionStatus = 'TRIAL'
          else if (rawStatus === 'COURTESY') subscriptionStatus = 'COURTESY'
          else if (rawStatus === 'PAST_DUE' || rawStatus === 'OVERDUE') subscriptionStatus = 'PAST_DUE'
          else if (rawStatus === 'CANCELED') subscriptionStatus = 'CANCELED'
          else if (rawStatus === 'EXPIRED') subscriptionStatus = 'EXPIRED'

          const rawEnv = s.environment || 'PENDING_REVIEW'
          const environment: StoreEnvironment = rawEnv as StoreEnvironment

          const subAmount = sub ? Number(sub.amount) : (s.plan === 'pro' && s.plan_status === 'active' && environment === 'PRODUCTION' ? 49.00 : 0.00)

          return {
            id: s.id,
            name: s.name,
            responsibleName: respProfile?.name || 'Não informado',
            email: respProfile?.email || null,
            phone: respProfile?.phone || null,
            createdAt: s.created_at,
            lastActivity: storeSales.length > 0 ? storeSales[0].created_at : s.created_at,
            environment,
            plan: (subscriptionStatus === 'PAST_DUE' || subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELED') ? 'free' : (sub?.plan_id || s.plan || 'free'),
            subscriptionStatus,
            trialEndsAt: sub?.trial_ends_at || s.trial_ends_at || null,
            subscriptionAmount: subAmount,
            nextBillingAt: sub?.next_billing_at || sub?.current_period_end || s.subscription_ends_at || null,
            pendingInvoiceUrl: (s.asaas_customer_id === 'cus_000195017714') ? 'https://www.asaas.com/i/ufqrw8r8t15xkqvz' : null,
            lastPayment: latestPayment ? { amount: Number(latestPayment.amount), paidAt: latestPayment.paid_at || latestPayment.created_at } : null,
            orders30Days: storeSales30d.length,
            gmv30Days: storeSales30d.reduce((sum: number, sale: any) => sum + sale.total_value, 0)
          }
        })

        setStoresRowData(mappedStoreRows)

        // 2. Filtragem de Lojas pelo Ambiente Selecionado
        const filteredByEnv = mappedStoreRows.filter(store => {
          if (environmentFilter === 'PRODUCTION') {
            return store.environment === 'PRODUCTION'
          }
          if (environmentFilter === 'TEST') {
            return store.environment === 'TEST' || store.environment === 'INTERNAL' || store.environment === 'DEMO'
          }
          if (environmentFilter === 'PENDING_REVIEW') {
            return store.environment === 'PENDING_REVIEW'
          }
          return true // 'ALL'
        })

        const matchingStoreIds = new Set(filteredByEnv.map(s => s.id))

        // 3. CÁLCULO ESTRITO DE MÉTRICAS SAAS (Receita do Mimus)
        // Regra: MRR Em Dia = assinaturas estritamente PAGAS e ATIVAS
        const payingStores = filteredByEnv.filter(s => s.subscriptionStatus === 'ACTIVE' && s.subscriptionAmount > 0)
        const mrr = payingStores.reduce((sum, s) => sum + s.subscriptionAmount, 0)
        const payingStoresCount = payingStores.length

        // Lojas com mensalidade em atraso (PAST_DUE com valor contratado)
        const pastDueStores = filteredByEnv.filter(s => s.subscriptionStatus === 'PAST_DUE' && s.subscriptionAmount > 0)
        const pastDueMrr = pastDueStores.reduce((sum, s) => sum + s.subscriptionAmount, 0)
        const pastDueStoresCount = pastDueStores.length

        // MRR Contratado total (ativos + em atraso aguardando renovação)
        const contractedMrr = mrr + pastDueMrr

        // Caixa Real: Receita de Assinaturas Confirmadas recebida no período
        const periodPayments = allPayments.filter(p => 
          matchingStoreIds.has(p.store_id) && 
          p.status === 'confirmed' &&
          (periodFilter === 'all' || new Date(p.paid_at || p.created_at) >= periodDate)
        )
        const totalRevenueCollected = periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        const confirmedPaymentsCount = periodPayments.length

        const activeTrials = filteredByEnv.filter(s => s.subscriptionStatus === 'TRIAL')
        const activeTrialsCount = activeTrials.length

        const newStoresCount = filteredByEnv.filter(s => new Date(s.createdAt) >= periodDate).length
        
        // ARPU: Se houver pagantes ativos calcula mrr / pagantes, senão se houver clientes Pro calcula pelo contratado
        const totalProClients = payingStoresCount + pastDueStoresCount
        const arpu = payingStoresCount > 0 
          ? mrr / payingStoresCount 
          : (totalProClients > 0 ? contractedMrr / totalProClients : 0)

        // Churn & Conversão
        const canceledStores = filteredByEnv.filter(s => s.subscriptionStatus === 'CANCELED')
        const churnRate = payingStoresCount > 0 ? (canceledStores.length / (payingStoresCount + canceledStores.length)) * 100 : null

        // Conversão de Trial: lojas que já pagaram ou que contrataram o Pro
        const eligibleEndedTrials = filteredByEnv.filter(s => s.subscriptionStatus !== 'TRIAL')
        const convertedTrials = filteredByEnv.filter(s => 
          s.subscriptionStatus === 'ACTIVE' || 
          s.subscriptionStatus === 'PAST_DUE' || 
          (s.lastPayment && s.lastPayment.amount > 0)
        )
        const conversionTrialRate = eligibleEndedTrials.length > 0 ? (convertedTrials.length / eligibleEndedTrials.length) * 100 : null

        setSaasMetrics({
          mrr,
          contractedMrr,
          pastDueMrr,
          pastDueStoresCount,
          totalRevenueCollected,
          confirmedPaymentsCount,
          payingStoresCount,
          activeTrialsCount,
          newStoresCount,
          conversionTrialRate,
          churnRate,
          arpu
        })

        // 4. CÁLCULO ESTRITO DA ECONOMIA DAS LOJAS
        const validSales = allSales.filter(sale => 
          matchingStoreIds.has(sale.store_id) && 
          sale.status !== 'cancelado' &&
          new Date(sale.created_at) >= periodDate
        )

        const gmv = validSales.reduce((sum, sale) => sum + sale.total_value, 0)
        const totalOrders = validSales.length
        const ticketMedioPedidos = totalOrders > 0 ? gmv / totalOrders : 0

        const storesWithSalesIds = new Set(validSales.map(s => s.store_id))
        const storesWithSalesCount = storesWithSalesIds.size

        const storesWithProductsIds = new Set(
          allProducts
            .filter((p: any) => matchingStoreIds.has(p.store_id) && p.active !== false)
            .map((p: any) => p.store_id)
        )
        const publishedCatalogsCount = storesWithProductsIds.size

        setStoreEconomyMetrics({
          gmv,
          totalOrders,
          ticketMedioPedidos,
          storesWithSalesCount,
          publishedCatalogsCount,
          totalVisits: null // Em mensuração real
        })

        // 5. CÁLCULO DO FUNIL DE ATIVAÇÃO
        const periodProfiles = allProfiles.filter((p: any) => new Date(p.created_at) >= periodDate)
        const periodStores = filteredByEnv.filter(s => new Date(s.createdAt) >= periodDate)
        const periodActivatedStores = periodStores.filter(s => storesWithProductsIds.has(s.id))
        const periodPublishedCatalogs = periodActivatedStores // catálogo no ar
        const periodStoresWithSales = periodStores.filter(s => storesWithSalesIds.has(s.id))
        const periodTrials = periodStores.filter(s => s.subscriptionStatus === 'TRIAL' || s.subscriptionStatus === 'ACTIVE')
        const periodPaying = periodStores.filter(s => s.subscriptionStatus === 'ACTIVE' && s.subscriptionAmount > 0)

        const step1Count = Math.max(periodProfiles.length, periodStores.length)
        const step2Count = periodStores.length
        const step3Count = periodActivatedStores.length
        const step4Count = periodPublishedCatalogs.length
        const step5Count = periodStoresWithSales.length
        const step6Count = periodTrials.length
        const step7Count = periodPaying.length

        const calcConv = (current: number, prev: number) => prev > 0 ? (current / prev) * 100 : 0
        const calcOverall = (current: number) => step1Count > 0 ? (current / step1Count) * 100 : 0

        const rawFunnelSteps: FunnelStep[] = [
          {
            name: 'Cadastros',
            key: 'signups',
            count: step1Count,
            conversionRate: 100,
            overallConversionRate: 100,
            icon: Users,
            color: 'text-blue-400'
          },
          {
            name: 'Lojas Criadas',
            key: 'stores_created',
            count: step2Count,
            conversionRate: calcConv(step2Count, step1Count),
            overallConversionRate: calcOverall(step2Count),
            icon: StoreIcon,
            color: 'text-indigo-400'
          },
          {
            name: 'Lojas Ativadas',
            key: 'stores_activated',
            count: step3Count,
            conversionRate: calcConv(step3Count, step2Count),
            overallConversionRate: calcOverall(step3Count),
            icon: Package,
            color: 'text-purple-400'
          },
          {
            name: 'Vitrines Publicadas',
            key: 'vitrines_published',
            count: step4Count,
            conversionRate: calcConv(step4Count, step3Count),
            overallConversionRate: calcOverall(step4Count),
            icon: Globe,
            color: 'text-pink-400'
          },
          {
            name: 'Lojas c/ Pedidos',
            key: 'stores_with_orders',
            count: step5Count,
            conversionRate: calcConv(step5Count, step4Count),
            overallConversionRate: calcOverall(step5Count),
            icon: ShoppingBag,
            color: 'text-rose-400'
          },
          {
            name: 'Trial',
            key: 'trial',
            count: step6Count,
            conversionRate: calcConv(step6Count, step5Count),
            overallConversionRate: calcOverall(step6Count),
            icon: Clock,
            color: 'text-amber-400'
          },
          {
            name: 'Pagantes',
            key: 'paying',
            count: step7Count,
            conversionRate: calcConv(step7Count, step6Count),
            overallConversionRate: calcOverall(step7Count),
            icon: CreditCard,
            color: 'text-emerald-400'
          }
        ]

        setFunnelSteps(rawFunnelSteps)
      } 
      
      else if (activeTab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('*, stores(name)')
          .order('created_at', { ascending: false })
        if (data) {
          const formatted = data.map((u: any) => ({
            id: u.id,
            store_id: u.store_id,
            name: u.name,
            role: u.role,
            status: u.status,
            created_at: u.created_at,
            email: u.email,
            phone: u.phone || null,
            instagram: u.instagram || null,
            store_name: u.stores?.name || null
          }))
          setUsers(formatted)
        }
      } 
      
      else if (activeTab === 'sales') {
        // Fetch sales with store details
        const { data: salesList } = await supabase
          .from('sales')
          .select('id, store_id, total_value, payment_method, created_at, stores(name), customers(name)')
          .order('created_at', { ascending: false })

        if (salesList) {
          const formattedSales = salesList.map((sale: any) => ({
            id: sale.id,
            store_id: sale.store_id,
            total_value: sale.total_value,
            payment_method: sale.payment_method,
            created_at: sale.created_at,
            store_name: sale.stores?.name || 'Desconhecida',
            customer_name: sale.customers?.name || 'Consumidor Final'
          }))
          setSales(formattedSales)
        }
      } 
      
      else if (activeTab === 'logs') {
        const { data } = await supabase
          .from('security_logs')
          .select('*, profiles(name), stores(name)')
          .order('created_at', { ascending: false })
          .limit(100)
        if (data) setLogs(data as any)
      }
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle impersonation
  const handleImpersonate = (userId: string) => {
    if (confirm('Deseja personificar esta conta? Você será redirecionado ao dashboard com as permissões deste usuário.')) {
      window.location.href = `/api/super-admin/impersonate?userId=${userId}`
    }
  }

  // Handle user updates
  const handleUpdateUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const confirmMsg = nextStatus === 'suspended' 
      ? 'Tem certeza de que deseja suspender este usuário? Ele perderá acesso ao painel.' 
      : 'Deseja reativar este usuário?'
      
    if (!confirm(confirmMsg)) return

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', userId, status: nextStatus })
      })

      if (!response.ok) throw new Error('Erro ao atualizar usuário')
      
      alert('Usuário atualizado com sucesso!')
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleOpenUserModal = (u: UserView) => {
    setSelectedUser(u)
    setEditUserName(u.name || '')
    setEditUserPhone(u.phone || '')
    setEditUserRole(u.role || 'admin')
    setIsUserModalOpen(true)
  }

  const handleSaveUserDetails = async () => {
    if (!selectedUser) return
    setFormLoading(true)

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          userId: selectedUser.id,
          name: editUserName,
          phone: editUserPhone,
          role: editUserRole,
          status: selectedUser.status
        })
      })

      if (!response.ok) throw new Error('Erro ao atualizar dados do usuário')
      
      alert('Usuário atualizado com sucesso!')
      setIsUserModalOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ATENÇÃO: Excluir este usuário deletará permanentemente suas credenciais e perfil. Confirmar exclusão?')) return

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId })
      })

      if (!response.ok) throw new Error('Erro ao deletar usuário')
      
      alert('Usuário excluído com sucesso!')
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Handle new admin creation
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
          phone: newAdminPhone,
          role: newAdminRole,
          storeId: newAdminStoreId || undefined
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao criar administrador')

      alert('Administrador criado com sucesso!')
      setIsCreateAdminOpen(false)
      // Reset form
      setNewAdminName('')
      setNewAdminEmail('')
      setNewAdminPassword('')
      setNewAdminPhone('')
      setNewAdminRole('admin')
      setNewAdminStoreId('')
      loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle store updates
  const handleOpenStoreModal = (store: Store) => {
    setSelectedStore(store)
    setEditStorePlan(store.plan)
    setEditStorePlanStatus(store.plan_status)
    setEditStoreCustomDomain(store.custom_domain || '')
    setIsStoreModalOpen(true)
  }

  const handleUpdateStore = async () => {
    if (!selectedStore) return

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          plan: editStorePlan,
          plan_status: editStorePlanStatus,
          custom_domain: editStoreCustomDomain || null
        })
        .eq('id', selectedStore.id)

      if (error) throw error

      alert('Configurações da loja atualizadas com sucesso!')
      setIsStoreModalOpen(false)
      loadData()
    } catch (err: any) {
      alert('Erro: ' + err.message)
    }
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('ATENÇÃO: Excluir esta loja apagará permanentemente todos os produtos, vendas, clientes e configurações associadas! Confirmar exclusão?')) return

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)

      if (error) throw error

      alert('Loja excluída com sucesso!')
      loadData()
    } catch (err: any) {
      alert('Erro ao excluir loja: ' + err.message)
    }
  }

  // Filter actions
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.store_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStores = stores.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.custom_domain?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLeads = leads.filter(l =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loja?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.instagram?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Lead CRM handlers
  async function handleSaveLeadCell(leadId: string, field: string, value: any) {
    setSavingLead(leadId)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ [field]: value })
        .eq('id', leadId)
      if (error) throw error
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l))
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setSavingLead(null)
      setEditingCell(null)
    }
  }

  async function handleToggleLeadBool(leadId: string, field: 'demo' | 'conta_criada' | 'ativado', current: boolean) {
    await handleSaveLeadCell(leadId, field, !current)
  }

  async function handleAddLead() {
    setAddingLead(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ name: 'Novo Lead', status: 'Ativo', origem: 'Instagram' }])
        .select()
        .single()
      if (error) throw error
      setLeads(prev => [data as Lead, ...prev])
      setEditingCell({ leadId: data.id, field: 'name' })
      setEditingValue('Novo Lead')
    } catch (err: any) {
      alert('Erro: ' + err.message)
    } finally {
      setAddingLead(false)
    }
  }

  async function handleDeleteLead(leadId: string) {
    if (!confirm('Remover este lead? Essa ação é irreversível.')) return
    const { error } = await supabase.from('leads').delete().eq('id', leadId)
    if (!error) setLeads(prev => prev.filter(l => l.id !== leadId))
  }

  function startEdit(leadId: string, field: string, currentValue: any) {
    setEditingCell({ leadId, field })
    setEditingValue(currentValue ?? '')
    setTimeout(() => (cellInputRef.current as HTMLInputElement | null)?.focus(), 30)
  }

  function commitEdit() {
    if (!editingCell) return
    handleSaveLeadCell(editingCell.leadId, editingCell.field, editingValue)
  }

  return (
    <div className="space-y-6">
      
      {/* BANNER DE ALERTA DE DUPLICIDADE NO ASAAS */}
      {duplicateAlertsCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-200">
                Alerta Crítico: {duplicateAlertsCount} Assinatura Duplicada Detectada no Asaas
              </h4>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                A cliente emanuelly penteado (mah cosméticos) possui 2 assinaturas ativas com cobrança recorrente simultânea.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 shadow-md shadow-rose-600/20 transition-all"
          >
            Ver Reconciliação
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'metrics', label: 'Dashboard do Fundador', icon: TrendingUp },
          { id: 'funnel', label: 'Funil de Ativação', icon: Target },
          { id: 'leads', label: 'Controle de Leads', icon: UserPlus },
          { id: 'stores', label: 'Lojas & Planos', icon: Globe },
          { id: 'reconciliation', label: 'Reconciliação Asaas', icon: RefreshCw },
          { id: 'users', label: 'Usuários & RBAC', icon: Users },
          { id: 'sales', label: 'Vendas Globais', icon: ShoppingBag },
          { id: 'logs', label: 'Logs de Segurança', icon: Lock },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab)
                setSearchQuery('')
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-rose-500/10'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
              {tab.id === 'leads' && leads.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[9px] font-black">{leads.length}</span>
              )}
              {tab.id === 'reconciliation' && duplicateAlertsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black animate-pulse">
                  {duplicateAlertsCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'metrics' && (
        <FounderDashboard
          saasMetrics={saasMetrics}
          storeEconomyMetrics={storeEconomyMetrics}
          environmentFilter={environmentFilter}
          setEnvironmentFilter={setEnvironmentFilter}
          periodFilter={periodFilter}
          setPeriodFilter={setPeriodFilter}
        />
      )}

      {activeTab === 'funnel' && (
        <ActivationFunnel
          steps={funnelSteps}
          period={periodFilter}
          setPeriod={setPeriodFilter}
        />
      )}

      {activeTab === 'reconciliation' && (
        <AsaasReconciliation onReconciledSuccess={loadData} />
      )}

      {/* LEADS TAB */}
      {activeTab === 'leads' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-500" /> Controle de Leads
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Pipeline de conversão — clique em qualquer célula para editar</p>
            </div>
            <button
              onClick={handleAddLead}
              disabled={addingLead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/15 disabled:opacity-60"
            >
              {addingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Novo Lead
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, loja ou Instagram..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: leads.length, color: 'text-slate-300' },
              { label: 'Ativos', value: leads.filter(l => l.status === 'Ativo').length, color: 'text-emerald-400' },
              { label: 'Convertidos', value: leads.filter(l => l.status === 'Convertido').length, color: 'text-blue-400' },
              { label: 'Inativo/Lost', value: leads.filter(l => l.status === 'Inativo' || l.status === 'Lost').length, color: 'text-rose-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-950 rounded-xl border border-slate-800 px-4 py-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className={`text-xl font-extrabold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '1100px' }}>
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3.5 sticky left-0 bg-slate-900/90 z-10 min-w-[140px]">Lead</th>
                    <th className="px-4 py-3.5 min-w-[110px]">WhatsApp</th>
                    <th className="px-4 py-3.5 min-w-[110px]">Instagram</th>
                    <th className="px-4 py-3.5 min-w-[120px]">Loja</th>
                    <th className="px-4 py-3.5 min-w-[100px]">Origem</th>
                    <th className="px-4 py-3.5 min-w-[130px]">Dor Principal</th>
                    <th className="px-4 py-3.5 text-center min-w-[90px]">Demo</th>
                    <th className="px-4 py-3.5 text-center min-w-[100px]">Conta Criada</th>
                    <th className="px-4 py-3.5 text-center min-w-[80px]">Ativado</th>
                    <th className="px-4 py-3.5 min-w-[100px]">Últ. Contato</th>
                    <th className="px-4 py-3.5 min-w-[130px]">Próxima Ação</th>
                    <th className="px-4 py-3.5 min-w-[110px]">Status</th>
                    <th className="px-4 py-3.5 min-w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-5 py-10 text-center text-slate-500 italic">
                        {leads.length === 0 ? 'Nenhum lead cadastrado. Clique em "Novo Lead" para começar.' : 'Nenhum resultado encontrado.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map(lead => {
                      const isSaving = savingLead === lead.id

                      function EditableText({ field, value, placeholder, wide }: { field: string; value: string | null; placeholder?: string; wide?: boolean }) {
                        const isEditing = editingCell?.leadId === lead.id && editingCell?.field === field
                        if (isEditing) {
                          return (
                            <input
                              ref={cellInputRef as React.RefObject<HTMLInputElement>}
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null) }}
                              className={`${wide ? 'w-40' : 'w-28'} px-2 py-1 rounded-lg bg-slate-800 border border-rose-500/60 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500`}
                            />
                          )
                        }
                        return (
                          <span
                            onClick={() => startEdit(lead.id, field, value)}
                            className="block px-2 py-1 rounded-lg hover:bg-slate-800/70 cursor-text text-slate-300 transition-colors min-h-[26px] group relative"
                          >
                            {value || <span className="text-slate-600 italic">{placeholder || '—'}</span>}
                            <Edit3 className="w-2.5 h-2.5 text-slate-600 absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )
                      }

                      const STATUS_OPTS = ['Ativo', 'Em contato', 'Demonstração', 'Convertido', 'Inativo', 'Lost']
                      const ORIGEM_OPTS = ['Instagram', 'Google', 'Indicação', 'WhatsApp', 'Evento', 'Outro']

                      const statusColors: Record<string, string> = {
                        'Ativo':         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        'Em contato':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        'Demonstração':  'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        'Convertido':    'bg-teal-500/10 text-teal-400 border-teal-500/20',
                        'Inativo':       'bg-slate-700/30 text-slate-500 border-slate-700/30',
                        'Lost':          'bg-rose-500/10 text-rose-400 border-rose-500/20',
                      }

                      return (
                        <tr key={lead.id} className={`hover:bg-slate-900/40 transition-colors ${isSaving ? 'opacity-60' : ''}`}>
                          {/* Name - sticky */}
                          <td className="px-4 py-3 sticky left-0 bg-slate-950 z-10">
                            <EditableText field="name" value={lead.name} placeholder="Nome" wide />
                          </td>

                          {/* WhatsApp */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <EditableText field="whatsapp" value={lead.whatsapp} placeholder="(xx) xxxxx" />
                              {lead.whatsapp && (
                                <a
                                  href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Instagram */}
                          <td className="px-4 py-3">
                            <EditableText field="instagram" value={lead.instagram} placeholder="@usuario" />
                          </td>

                          {/* Loja */}
                          <td className="px-4 py-3">
                            <EditableText field="loja" value={lead.loja} placeholder="Nome da loja" />
                          </td>

                          {/* Origem - select */}
                          <td className="px-4 py-3">
                            {editingCell?.leadId === lead.id && editingCell?.field === 'origem' ? (
                              <select
                                ref={cellInputRef as React.RefObject<HTMLSelectElement>}
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={commitEdit}
                                className="w-28 px-2 py-1 rounded-lg bg-slate-800 border border-rose-500/60 text-slate-100 text-xs focus:outline-none"
                              >
                                {ORIGEM_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <span
                                onClick={() => startEdit(lead.id, 'origem', lead.origem)}
                                className="block px-2 py-1 rounded-lg hover:bg-slate-800/70 cursor-pointer text-slate-300 transition-colors min-h-[26px] group relative"
                              >
                                {lead.origem || <span className="text-slate-600 italic">—</span>}
                                <ChevronDown className="w-2.5 h-2.5 text-slate-600 absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            )}
                          </td>

                          {/* Dor Principal */}
                          <td className="px-4 py-3">
                            <EditableText field="dor_principal" value={lead.dor_principal} placeholder="Ex: Estoque" wide />
                          </td>

                          {/* Demo - toggle */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleLeadBool(lead.id, 'demo', lead.demo)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto border transition-all ${
                                lead.demo
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : 'bg-slate-800/50 border-slate-700 text-slate-600 hover:border-slate-500'
                              }`}
                            >
                              {lead.demo ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                            </button>
                          </td>

                          {/* Conta Criada - toggle */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleLeadBool(lead.id, 'conta_criada', lead.conta_criada)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto border transition-all ${
                                lead.conta_criada
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : 'bg-slate-800/50 border-slate-700 text-slate-600 hover:border-slate-500'
                              }`}
                            >
                              {lead.conta_criada ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                            </button>
                          </td>

                          {/* Ativado - toggle */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleLeadBool(lead.id, 'ativado', lead.ativado)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto border transition-all ${
                                lead.ativado
                                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                                  : 'bg-slate-800/50 border-slate-700 text-slate-600 hover:border-slate-500'
                              }`}
                            >
                              {lead.ativado ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                            </button>
                          </td>

                          {/* Último Contato */}
                          <td className="px-4 py-3">
                            {editingCell?.leadId === lead.id && editingCell?.field === 'ultimo_contato' ? (
                              <input
                                ref={cellInputRef as React.RefObject<HTMLInputElement>}
                                type="date"
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null) }}
                                className="w-32 px-2 py-1 rounded-lg bg-slate-800 border border-rose-500/60 text-slate-100 text-xs focus:outline-none"
                              />
                            ) : (
                              <span
                                onClick={() => startEdit(lead.id, 'ultimo_contato', lead.ultimo_contato || '')}
                                className="block px-2 py-1 rounded-lg hover:bg-slate-800/70 cursor-pointer text-slate-300 transition-colors min-h-[26px]"
                              >
                                {lead.ultimo_contato
                                  ? new Date(lead.ultimo_contato + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                  : <span className="text-slate-600 italic">—</span>
                                }
                              </span>
                            )}
                          </td>

                          {/* Próxima Ação */}
                          <td className="px-4 py-3">
                            <EditableText field="proxima_acao" value={lead.proxima_acao} placeholder="Ex: Follow-up" wide />
                          </td>

                          {/* Status - select badge */}
                          <td className="px-4 py-3">
                            {editingCell?.leadId === lead.id && editingCell?.field === 'status' ? (
                              <select
                                ref={cellInputRef as React.RefObject<HTMLSelectElement>}
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={commitEdit}
                                className="w-32 px-2 py-1 rounded-lg bg-slate-800 border border-rose-500/60 text-slate-100 text-xs focus:outline-none"
                              >
                                {STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <button
                                onClick={() => startEdit(lead.id, 'status', lead.status)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all hover:opacity-80 ${
                                  statusColors[lead.status] || statusColors['Inativo']
                                }`}
                              >
                                {lead.status}
                                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                              </button>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR FOR LISTS */}
      {activeTab !== 'metrics' && activeTab !== 'funnel' && activeTab !== 'leads' && activeTab !== 'logs' && activeTab !== 'sales' && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou domínio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-xs text-slate-100 placeholder-slate-500"
          />
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : (
        <>
          {/* LOJAS TAB */}
          {activeTab === 'stores' && (
            <StoresPlansTable
              stores={storesRowData}
              onSelectStore={(store) => {
                setSelectedStoreRow(store)
                setIsStoreDetailsModalOpen(true)
              }}
            />
          )}

          {/* USUARIOS TAB */}
          {activeTab === 'users' && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Nome / Email</th>
                    <th className="px-5 py-3.5">WhatsApp / Contato</th>
                    <th className="px-5 py-3.5">Nível de Acesso (Role)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Loja Associada</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/10">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{u.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{u.email || 'OAuth/Sem Email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {u.phone ? (
                            <a
                              href={`https://wa.me/${u.phone.replace(/\D/g, '').startsWith('55') ? u.phone.replace(/\D/g, '') : `55${u.phone.replace(/\D/g, '')}`}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 border border-emerald-500/25 transition-all active:scale-[0.98] group"
                              title="Conversar no WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5 fill-current text-emerald-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              <span className="font-mono">{u.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Sem WhatsApp</span>
                          )}

                          {u.instagram && (
                            <a
                              href={`https://instagram.com/${u.instagram.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/25 transition-all"
                              title="Ver Instagram"
                            >
                              <svg className="w-3 h-3 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                              </svg>
                              <span>{u.instagram.startsWith('@') ? u.instagram : `@${u.instagram}`}</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          u.role === 'super_admin' 
                            ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' 
                            : u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          u.status === 'suspended' 
                            ? 'bg-rose-900/30 text-rose-500 border border-rose-900/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {u.store_name || <span className="text-slate-550 italic">Nenhuma (Global)</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleImpersonate(u.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-semibold flex items-center gap-1"
                            title="Entrar nesta conta"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Personificar
                          </button>
                          
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, u.status)}
                            className={`p-1.5 rounded-lg border border-slate-800 transition-colors ${
                              u.status === 'suspended'
                                ? 'bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-450'
                                : 'bg-rose-950/20 hover:bg-rose-900/30 text-rose-450'
                            }`}
                            title={u.status === 'suspended' ? 'Ativar Usuário' : 'Suspender Usuário'}
                          >
                            {u.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-450"
                            title="Configurar Usuário"
                          >
                            <Settings className="w-4 h-4" />
                          </button>

                          {u.role !== 'super_admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg border border-slate-800 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VENDAS GLOBAIS TAB */}
          {activeTab === 'sales' && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">ID Venda</th>
                    <th className="px-5 py-3.5">Loja</th>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Valor Total</th>
                    <th className="px-5 py-3.5">Método Pagamento</th>
                    <th className="px-5 py-3.5">Data da Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-900/10">
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-500">{sale.id.slice(0, 8)}...</td>
                      <td className="px-5 py-4 font-semibold text-slate-200">{sale.store_name}</td>
                      <td className="px-5 py-4 text-slate-300">{sale.customer_name}</td>
                      <td className="px-5 py-4 font-bold text-slate-100">
                        R$ {Number(sale.total_value).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">{sale.payment_method}</td>
                      <td className="px-5 py-4 text-slate-450">
                        {new Date(sale.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LOGS DE SEGURANÇA TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {logs.length > 0 ? (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-5 py-3.5">Data / Hora</th>
                          <th className="px-5 py-3.5">Usuário</th>
                          <th className="px-5 py-3.5">Loja</th>
                          <th className="px-5 py-3.5">Ação Realizada</th>
                          <th className="px-5 py-3.5">Endereço IP</th>
                          <th className="px-5 py-3.5">Dispositivo / User-Agent</th>
                          <th className="px-5 py-3.5">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {logs.map(log => {
                          const userName = log.profiles?.name || 'Sistema/Convidado'
                          const storeName = log.stores?.name || 'Global'

                          return (
                            <tr key={log.id} className="hover:bg-slate-900/10">
                              <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-5 py-4 font-semibold text-slate-350">{userName}</td>
                              <td className="px-5 py-4 text-indigo-400 text-[11px] font-medium">{storeName}</td>
                              <td className="px-5 py-4 font-bold text-slate-200">{log.action}</td>
                              <td className="px-5 py-4 font-mono text-[10px] text-slate-400">{log.ip}</td>
                              <td className="px-5 py-4 text-slate-400 max-w-xs truncate" title={log.user_agent || ''}>
                                {log.user_agent}
                              </td>
                              <td className="px-5 py-4 font-mono text-[9px] text-slate-500 max-w-md truncate">
                                {JSON.stringify(log.details)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-16 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900/40 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-400">Nenhum log de segurança registrado</h3>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      Os logs de segurança são registrados automaticamente pelo sistema quando ações críticas ocorrem (criação de usuários, alterações de plano, acessos suspeitos, etc.).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE NEW ADMIN MODAL */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in scale-in duration-150 text-slate-100">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-rose-500" /> Cadastrar Administrador
            </h3>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Adriano Junior"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">E-mail</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="adriano@mimus.com.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">WhatsApp / Telefone</label>
                <input
                  type="text"
                  required
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Senha Provisória</label>
                <input
                  type="password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role / Cargo</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Admin (Master)</option>
                    <option value="operator">Operador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">ID da Loja (Opcional)</label>
                  <input
                    type="text"
                    value={newAdminStoreId}
                    onChange={(e) => setNewAdminStoreId(e.target.value)}
                    placeholder="UUID da Loja"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER ACCESS UPDATE MODAL */}
      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in scale-in duration-150 text-slate-100">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> Configuração do Usuário
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo / Papel (RBAC)</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                >
                  <option value="super_admin">Super Admin (Acesso Total)</option>
                  <option value="admin">Administrador (Lojista)</option>
                  <option value="operator">Operador (Acesso Limitado)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserDetails}
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-955 font-bold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORE PLAN UPDATE MODAL */}
      {isStoreModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in scale-in duration-150 text-slate-100">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Planos & Assinatura - {selectedStore.name}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Plano</label>
                <select
                  value={editStorePlan}
                  onChange={(e) => setEditStorePlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none"
                >
                  <option value="free">Free (Grátis)</option>
                  <option value="pro">Pro (Profissional)</option>
                  <option value="enterprise">Enterprise (Corporativo)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status da Assinatura</label>
                <select
                  value={editStorePlanStatus}
                  onChange={(e) => setEditStorePlanStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none"
                >
                  <option value="trial">Avaliação Gratuita (Trial)</option>
                  <option value="trial_custom">Avaliação Avulsa (Tempo Indeterminado)</option>
                  <option value="active">Ativa / Pago</option>
                  <option value="expired">Atrasada / Expirada</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Domínio Personalizado</label>
                <input
                  type="text"
                  value={editStoreCustomDomain}
                  onChange={(e) => setEditStoreCustomDomain(e.target.value)}
                  placeholder="Ex: lojadabeleza.com.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStore}
                  className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORE DETAILS & ACTIONS MODAL */}
      <StoreDetailsModal
        store={selectedStoreRow}
        isOpen={isStoreDetailsModalOpen}
        onClose={() => {
          setIsStoreDetailsModalOpen(false)
          setSelectedStoreRow(null)
        }}
        onActionSuccess={() => {
          loadData()
        }}
      />

    </div>
  )
}
