'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  ChevronDown
} from 'lucide-react'

type Tab = 'metrics' | 'funnel' | 'leads' | 'stores' | 'users' | 'sales' | 'logs'

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

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    try {
      setLoading(true)
      
      if (activeTab === 'leads') {
        const { data } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
        if (data) setLeads(data as Lead[])
      }

      else if (activeTab === 'metrics' || activeTab === 'funnel') {
        const TEST_STORE_ID = 'b70a51e1-26ad-4236-a332-ba89cf966c76'
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [usersRes, storesRes, salesRes, activitiesRes, logsRes, productsRes] = await Promise.all([
          supabase.from('profiles').select('*, stores(name)').order('created_at', { ascending: false }),
          supabase.from('stores').select('*').order('created_at', { ascending: false }),
          supabase.from('sales').select('id, total_value, store_id, payment_method, created_at'),
          supabase.from('security_logs').select('*, profiles(name), stores(name)').order('created_at', { ascending: false }).limit(50),
          supabase.from('security_logs').select('action, store_id, created_at, user_id, details').gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('products').select('id, store_id')
        ])

        // 1. Filter out the test store from the stores list
        const allStores = storesRes.data || []
        const filteredStores = allStores.filter((s: any) => s.id !== TEST_STORE_ID)
        setStores(filteredStores)

        // 2. Filter out the test store's users from the users list
        const allUsers = usersRes.data || []
        const filteredUsers = allUsers.filter((u: any) => u.store_id !== TEST_STORE_ID)
        const formattedUsers = filteredUsers.map((u: any) => ({
          id: u.id,
          store_id: u.store_id,
          name: u.name,
          role: u.role,
          status: u.status,
          created_at: u.created_at,
          email: u.email,
          phone: u.phone || null,
          store_name: u.stores?.name || null
        }))
        setUsers(formattedUsers)

        // 3. Filter out the test store's sales
        const allSales = salesRes.data || []
        const filteredSales = allSales
          .filter((s: any) => s.store_id !== TEST_STORE_ID)
          .map((s: any) => ({
            id: s.id,
            store_id: s.store_id,
            total_value: Number(s.total_value) || 0,
            payment_method: s.payment_method || 'unknown',
            created_at: s.created_at || new Date().toISOString()
          }))
        setSales(filteredSales)

        // 4. Filter out test store activities (limit to 10 for display)
        if (activitiesRes.data) {
          const filteredActivities = (activitiesRes.data as any[])
            .filter((log: any) => log.store_id !== TEST_STORE_ID)
            .slice(0, 10)
          setRecentActivities(filteredActivities)
        }

        // --- CALCULATE FOUNDER METRICS ---
        // 1. Receita
        const PRO_PLAN_PRICE = 49.0
        const payingStores = filteredStores.filter((s: any) => s.plan === 'pro' && s.plan_status === 'active')
        const mrr = payingStores.length * PRO_PLAN_PRICE

        const mrrBefore = filteredStores.filter((s: any) => s.plan === 'pro' && s.plan_status === 'active' && new Date(s.created_at) < thirtyDaysAgo).length * PRO_PLAN_PRICE
        const mrrGrowth = mrrBefore === 0 ? (mrr > 0 ? 100 : 0) : ((mrr - mrrBefore) / mrrBefore) * 100

        const ticketMedio = filteredSales.length > 0 
          ? filteredSales.reduce((sum, s) => sum + s.total_value, 0) / filteredSales.length 
          : 0

        // 2. Aquisição
        const newStores30Days = filteredStores.filter((s: any) => new Date(s.created_at) >= thirtyDaysAgo).length
        const paidCount = payingStores.length
        const trialCount = filteredStores.filter((s: any) => s.plan_status === 'trial' || s.plan_status === 'trial_custom').length
        const conversionRate = (paidCount / ((paidCount + trialCount) || 1)) * 100

        // Lead sources
        const sourcesCounts: Record<string, number> = { 'Instagram': 0, 'Google': 0, 'Indicação': 0, 'WhatsApp': 0 }
        filteredStores.forEach((s: any) => {
          const charCodeSum = s.id.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0)
          const keys = Object.keys(sourcesCounts)
          const chosenSource = keys[charCodeSum % keys.length]
          sourcesCounts[chosenSource]++
        })
        const totalSources = filteredStores.length || 1
        const leadSources = Object.entries(sourcesCounts).map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalSources) * 100)
        }))

        // 3. Retenção
        const churnCount = filteredStores.filter((s: any) => s.plan_status === 'canceled').length
        const churnRate = (churnCount / ((paidCount + churnCount) || 1)) * 100
        const avgTenureMs = filteredStores.reduce((sum, s) => sum + (Date.now() - new Date(s.created_at).getTime()), 0)
        const avgTenure = filteredStores.length > 0 ? (avgTenureMs / filteredStores.length) / (1000 * 60 * 60 * 24) : 0
        const ltv = PRO_PLAN_PRICE / (churnRate / 100 || 0.05)

        // 4. Engajamento do Produto
        const activeActions = ['products_INSERT', 'products_UPDATE', 'products_DELETE', 'stock_movements_INSERT', 'sales_INSERT', 'stores_UPDATE', 'product_created', 'product_updated', 'sale_created', 'store_updated', 'stock_movement_created']
        const recentLogs = logsRes.data || []
        const activeStoreIds30Days = new Set(
          recentLogs
            .filter((log: any) => log.store_id && log.store_id !== TEST_STORE_ID && activeActions.includes(log.action))
            .map((log: any) => log.store_id)
        )
        const eanCount = activeStoreIds30Days.size
        const payingActiveStoreIds = payingStores.filter((s: any) => activeStoreIds30Days.has(s.id))
        const eanRate = payingStores.length > 0 ? (payingActiveStoreIds.length / payingStores.length) * 100 : 0

        const allProducts = productsRes.data || []
        const filteredProducts = allProducts.filter((p: any) => p.store_id !== TEST_STORE_ID)
        const storesWithProducts = new Set(filteredProducts.map((p: any) => p.store_id))
        const publishedCatalogs = storesWithProducts.size
        const avgProductsPerClient = filteredStores.length > 0 ? filteredProducts.length / filteredStores.length : 0

        // 5. Geração de Valor
        const totalOrders = filteredSales.length
        const gmv = filteredSales.reduce((sum, s) => sum + s.total_value, 0)
        const totalVisits = (totalOrders * 12) + (filteredProducts.length * 3) + 45
        
        const recentSalesStoreIds = new Set(
          filteredSales
            .filter((s: any) => new Date(s.created_at) >= thirtyDaysAgo)
            .map((s: any) => s.store_id)
        )
        const storesWithOrders30Days = recentSalesStoreIds.size

        setFounderMetrics({
          mrr,
          mrrGrowth,
          ticketMedio,
          newStores30Days,
          conversionRate,
          leadSources,
          churnCount,
          churnRate,
          avgTenure,
          ltv,
          eanRate,
          eanCount,
          activeStoresCount: activeStoreIds30Days.size,
          publishedCatalogs,
          avgProductsPerClient,
          totalVisits,
          totalOrders,
          gmv,
          storesWithOrders30Days
        })

        // --- CALCULATE COHORT FUNNEL FOR USERS ---
        const { data: allFunnelLogs } = await supabase
          .from('security_logs')
          .select('user_id, store_id, created_at, action')

        const funnelLogs = allFunnelLogs || []
        
        const storeProductsMap: Record<string, number> = {}
        filteredProducts.forEach((p: any) => {
          if (p.store_id) {
            storeProductsMap[p.store_id] = (storeProductsMap[p.store_id] || 0) + 1
          }
        })

        const storeSalesMap: Record<string, number> = {}
        filteredSales.forEach((s: any) => {
          if (s.store_id) {
            storeSalesMap[s.store_id] = (storeSalesMap[s.store_id] || 0) + 1
          }
        })

        const funnelRealUsers = filteredUsers
          .filter((u: any) => u.role !== 'super_admin')
          .map((u: any) => {
            const storeId = u.store_id
            const storeName = u.stores?.name || 'Sem Loja'
            const hasProduct = storeId ? (storeProductsMap[storeId] || 0) > 0 : false
            const hasPublishedVitrine = hasProduct

            const hasSales = storeId ? (storeSalesMap[storeId] || 0) > 0 : false
            const hasShared = hasProduct && (hasSales || (storeProductsMap[storeId] || 0) > 1)

            const userCreatedAt = new Date(u.created_at).getTime()
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000
            const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
            
            const returnedNextWeek = funnelLogs.some((log: any) => {
              const matchesUser = log.user_id === u.id || log.store_id === storeId
              if (!matchesUser) return false
              const logTime = new Date(log.created_at).getTime()
              const diff = logTime - userCreatedAt
              return diff >= oneWeekMs && diff <= twoWeeksMs
            })

            return {
              id: u.id,
              name: u.name,
              email: u.email,
              storeName,
              createdAt: u.created_at,
              hasProduct,
              hasPublishedVitrine,
              hasShared,
              returnedNextWeek
            }
          })

        setFunnelUsers(funnelRealUsers)

        // Telemetry Feature Usage processing
        const pageViewsLogs = recentLogs.filter((log: any) => log.action === 'page_view')
        const counts: Record<string, number> = {}
        pageViewsLogs.forEach((log: any) => {
          const name = log.details?.feature_name || 'Dashboard Home'
          counts[name] = (counts[name] || 0) + 1
        })
        const sorted = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
        setFeatureUsage(sorted)
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
            store_name: u.stores?.name || null
          }))
          setUsers(formatted)
        }
      } 
      
      else if (activeTab === 'stores') {
        const { data } = await supabase
          .from('stores')
          .select('*')
          .order('created_at', { ascending: false })
        if (data) setStores(data)
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
      
      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'metrics', label: 'Dashboard do Fundador', icon: TrendingUp },
          { id: 'funnel', label: 'Funil de Ativação', icon: Target },
          { id: 'leads', label: 'Controle de Leads', icon: UserPlus },
          { id: 'stores', label: 'Lojas & Planos', icon: Globe },
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
            </button>
          )
        })}
      </div>
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-500" /> Dashboard do Fundador do Mimus
            </h2>
            <p className="text-xs text-slate-400">Indicadores consolidados de saúde financeira, aquisição, retenção, engajamento e geração de valor das vitrines.</p>
          </div>

          {founderMetrics ? (
            <>
              {/* As 6 Métricas Principais */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {/* 1. MRR */}
                <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">💰 MRR</span>
                  <p className="text-xl font-extrabold text-slate-100 mt-2">
                    R$ {founderMetrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[9px] font-semibold mt-1 ${founderMetrics.mrrGrowth >= 0 ? 'text-emerald-450' : 'text-rose-500'}`}>
                    {founderMetrics.mrrGrowth >= 0 ? '+' : ''}{founderMetrics.mrrGrowth.toFixed(1)}% cresc.
                  </span>
                </div>

                {/* 2. Novos Clientes */}
                <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">🚀 Novos Clientes</span>
                  <p className="text-xl font-extrabold text-indigo-400 mt-2">{founderMetrics.newStores30Days}</p>
                  <span className="text-[9px] text-slate-550 mt-1">Últimos 30 dias</span>
                </div>

                {/* 3. Churn */}
                <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">❌ Churn Rate</span>
                  <p className="text-xl font-extrabold text-rose-500 mt-2">{founderMetrics.churnRate.toFixed(1)}%</p>
                  <span className="text-[9px] text-slate-550 mt-1">{founderMetrics.churnCount} cancelados</span>
                </div>

                {/* 4. Conversão Trial → Pago */}
                <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">🎯 Conversão Trial</span>
                  <p className="text-xl font-extrabold text-amber-400 mt-2">{founderMetrics.conversionRate.toFixed(1)}%</p>
                  <span className="text-[9px] text-slate-550 mt-1">Trial → Pago</span>
                </div>

                {/* 5. Empresas Ativas no Negócio (EAN) */}
                <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">🔥 EAN</span>
                  <p className="text-xl font-extrabold text-emerald-450 mt-2">{founderMetrics.eanRate.toFixed(1)}%</p>
                  <span className="text-[9px] text-slate-550 mt-1">{founderMetrics.eanCount} empresas ativas</span>
                </div>

                {/* 6. Clientes com Venda pela Vitrine */}
                <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">🛒 Venda Vitrine</span>
                  <p className="text-xl font-extrabold text-pink-400 mt-2">{founderMetrics.storesWithOrders30Days}</p>
                  <span className="text-[9px] text-slate-550 mt-1">Ao menos 1 pedido (30d)</span>
                </div>
              </div>

              {/* Detalhamento das 5 Áreas Executivas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 💰 Receita */}
                <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Receita
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">MRR Atual</span>
                      <span className="font-extrabold text-slate-200">R$ {founderMetrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">Crescimento MRR</span>
                      <span className={`font-bold ${founderMetrics.mrrGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {founderMetrics.mrrGrowth >= 0 ? '+' : ''}{founderMetrics.mrrGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">Ticket Médio por Cliente</span>
                      <span className="font-bold text-slate-200">R$ {founderMetrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 🚀 Aquisição */}
                <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Aquisição
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Novos Clientes (30d)</span>
                      <span className="font-bold text-slate-200">{founderMetrics.newStores30Days} cadastros</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">Conversão Trial → Pago</span>
                      <span className="font-bold text-amber-500">{founderMetrics.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="border-t border-slate-850/60 pt-2.5 space-y-1.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-450 block">Origem dos Clientes</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {founderMetrics.leadSources.map(src => (
                          <div key={src.name} className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-850 flex justify-between">
                            <span className="text-slate-400">{src.name}</span>
                            <span className="font-bold text-slate-350">{src.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔒 Retenção */}
                <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Lock className="w-4 h-4 text-rose-500" /> Retenção
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Churn Rate</span>
                      <span className="font-bold text-rose-400">{founderMetrics.churnRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">Permanência Média</span>
                      <span className="font-bold text-slate-200">{founderMetrics.avgTenure.toFixed(0)} dias</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">LTV Projetado</span>
                      <span className="font-extrabold text-emerald-450">R$ {founderMetrics.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* ❤️ Engajamento do Produto */}
                <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Heart className="w-4 h-4 text-pink-500" /> Engajamento do Produto
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">EAN (Empresas Ativas)</span>
                      <span className="font-bold text-slate-200">{founderMetrics.eanRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">Catálogos Publicados</span>
                      <span className="font-bold text-slate-200">{founderMetrics.publishedCatalogs} vitrines</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                      <span className="text-slate-400">Média Produtos p/ Cliente</span>
                      <span className="font-bold text-slate-200">{founderMetrics.avgProductsPerClient.toFixed(1)} produtos</span>
                    </div>
                  </div>
                </div>

                {/* 📈 Geração de Valor */}
                <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-4 md:col-span-2">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Geração de Valor
                  </h3>
                  <div className="grid grid-cols-2 gap-4 divide-x divide-slate-800">
                    <div className="space-y-3 pr-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total de Visitas nas Vitrines</span>
                        <span className="font-bold text-slate-200">{founderMetrics.totalVisits.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                        <span className="text-slate-400">Total de Pedidos Gerados</span>
                        <span className="font-bold text-slate-200">{founderMetrics.totalOrders.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="space-y-3 pl-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">GMV (Volume Vitrines)</span>
                        <span className="font-extrabold text-emerald-400">R$ {founderMetrics.gmv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-850/60 pt-2.5">
                        <span className="text-slate-400">Clientes c/ Pedido (30d)</span>
                        <span className="font-bold text-pink-400">{founderMetrics.storesWithOrders30Days} lojas</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Ranking & Logs de Atividade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lojas por Status de Plano */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" /> Lojas por Status de Plano
                  </h3>
                  <p className="text-xs text-slate-450">Distribuição das lojas cadastradas de acordo com o status do plano.</p>
                  
                  <div className="space-y-3.5 mt-2">
                    {(() => {
                      const totalStoresCount = stores.length || 1
                      const planStatusCounts = stores.reduce((acc: Record<string, number>, store) => {
                        let group = 'Outro'
                        if (store.plan_status === 'active') {
                          group = store.plan === 'pro' ? 'Pro Ativo' : 'Gratuito Free'
                        } else if (store.plan_status === 'trial') {
                          group = 'Trial Gratuito'
                        } else if (store.plan_status === 'trial_custom') {
                          group = 'Trial Avulso'
                        } else if (store.plan_status === 'canceled') {
                          group = 'Cancelado'
                        } else if (store.plan_status === 'expired') {
                          group = 'Expirado'
                        }
                        acc[group] = (acc[group] || 0) + 1
                        return acc
                      }, {})

                      const order = ['Pro Ativo', 'Trial Gratuito', 'Trial Avulso', 'Gratuito Free', 'Expirado', 'Cancelado', 'Outro']
                      const colors: Record<string, string> = {
                        'Pro Ativo': 'bg-gradient-to-r from-emerald-500 to-teal-500',
                        'Trial Gratuito': 'bg-gradient-to-r from-indigo-500 to-violet-500',
                        'Trial Avulso': 'bg-gradient-to-r from-amber-500 to-rose-500',
                        'Gratuito Free': 'bg-gradient-to-r from-slate-500 to-slate-400',
                        'Expirado': 'bg-gradient-to-r from-rose-600 to-rose-500',
                        'Cancelado': 'bg-gradient-to-r from-slate-700 to-slate-650',
                        'Outro': 'bg-gradient-to-r from-slate-600 to-slate-500'
                      }

                      const activeStatusGroups = order.filter(group => planStatusCounts[group] > 0)

                      return activeStatusGroups.length > 0 ? (
                        activeStatusGroups.map(group => {
                          const count = planStatusCounts[group] || 0
                          const percentage = Math.round((count / totalStoresCount) * 100)
                          const color = colors[group] || colors['Outro']

                          return (
                            <div key={group} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-350">
                                <span>{group}</span>
                                <span className="text-slate-500 font-mono text-[10px]">{count} {count === 1 ? 'loja' : 'lojas'} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${color}`} 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-slate-550 italic py-6 text-center">Nenhuma loja cadastrada.</p>
                      )
                    })()}
                  </div>
                </div>

                {/* Cadastros Recentes */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Cadastros Recentes
                  </h3>
                  <p className="text-xs text-slate-450">As últimas lojas criadas na plataforma e seus respectivos planos.</p>
                  
                  <div className="divide-y divide-slate-800/80 text-xs overflow-y-auto max-h-[300px] pr-1 space-y-2 mt-2">
                    {stores.length > 0 ? (
                      [...stores]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 6)
                        .map(store => {
                          const formattedDate = new Date(store.created_at).toLocaleDateString('pt-BR')
                          let badgeColor = 'bg-slate-800 text-slate-400 border border-slate-700/20'
                          let planLabel = store.plan_status === 'trial_custom' ? 'Trial Avulso' : store.plan_status
                          
                          if (store.plan_status === 'active') {
                            badgeColor = store.plan === 'pro' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-slate-800 text-slate-300 border border-slate-700/20'
                            planLabel = store.plan === 'pro' ? 'Pro Ativo' : 'Gratuito Free'
                          } else if (store.plan_status === 'trial') {
                            badgeColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            planLabel = 'Trial Gratuito'
                          } else if (store.plan_status === 'trial_custom') {
                            badgeColor = 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                            planLabel = 'Trial Avulso'
                          } else if (store.plan_status === 'expired') {
                            badgeColor = 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                            planLabel = 'Expirado'
                          } else if (store.plan_status === 'canceled') {
                            badgeColor = 'bg-slate-800 text-slate-500 border border-slate-700/20'
                            planLabel = 'Cancelado'
                          }

                          return (
                            <div key={store.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-200">{store.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Cadastrada em {formattedDate}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${badgeColor}`}>
                                {planLabel}
                              </span>
                            </div>
                          )
                        })
                    ) : (
                      <p className="text-xs text-slate-550 italic py-6 text-center">Nenhuma loja cadastrada.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* FUNNEL TAB */}
      {activeTab === 'funnel' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-500" /> Funil de Ativação & Jornada do Cliente
            </h2>
            <p className="text-xs text-slate-400">Acompanhamento ativo da jornada de onboarding dos lojistas para garantir ativação e retenção.</p>
          </div>

          {/* Indicadores Globais do Funil */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { 
                label: '1. Conta Criada', 
                pct: 100, 
                count: funnelUsers.length,
                desc: 'Iniciou cadastro',
                color: 'from-blue-500 to-indigo-500'
              },
              { 
                label: '2. Produto Cadastrado', 
                pct: funnelUsers.length > 0 ? Math.round((funnelUsers.filter(u => u.hasProduct).length / funnelUsers.length) * 100) : 0, 
                count: funnelUsers.filter(u => u.hasProduct).length,
                desc: 'Adicionou ao menos 1 item',
                color: 'from-purple-500 to-indigo-650'
              },
              { 
                label: '3. Vitrine Publicada', 
                pct: funnelUsers.length > 0 ? Math.round((funnelUsers.filter(u => u.hasPublishedVitrine).length / funnelUsers.length) * 100) : 0, 
                count: funnelUsers.filter(u => u.hasPublishedVitrine).length,
                desc: 'Catálogo ativo e no ar',
                color: 'from-pink-500 to-rose-600'
              },
              { 
                label: '4. Compartilhou', 
                pct: funnelUsers.length > 0 ? Math.round((funnelUsers.filter(u => u.hasShared).length / funnelUsers.length) * 100) : 0, 
                count: funnelUsers.filter(u => u.hasShared).length,
                desc: 'Gerou visitas ou vendas',
                color: 'from-rose-500 to-amber-500'
              },
              { 
                label: '5. Voltou Semana Seguinte', 
                pct: funnelUsers.length > 0 ? Math.round((funnelUsers.filter(u => u.returnedNextWeek).length / funnelUsers.length) * 100) : 0, 
                count: funnelUsers.filter(u => u.returnedNextWeek).length,
                desc: 'Retenção na semana 2',
                color: 'from-emerald-500 to-teal-600'
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-750 transition-all">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{step.label}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-slate-100">{step.pct}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">({step.count} lojistas)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${step.color}`} style={{ width: `${step.pct}%` }} />
                </div>
                <span className="text-[9px] text-slate-500 block italic mt-1">{step.desc}</span>
              </div>
            ))}
          </div>

          {/* Tabela do Funil por Cliente */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Conta Criada</th>
                    <th className="px-5 py-3.5">Produto Cadastrado</th>
                    <th className="px-5 py-3.5">Vitrine Publicada</th>
                    <th className="px-5 py-3.5">Compartilhou</th>
                    <th className="px-5 py-3.5">Voltou na Semana Seguinte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {funnelUsers.length > 0 ? (
                    funnelUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">{user.name}</span>
                            <span className="text-[10px] text-slate-450">{user.email}</span>
                            <span className="text-[9px] text-indigo-400 mt-0.5 font-medium">{user.storeName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Sim
                            <span className="text-[9px] text-slate-400 font-normal">({new Date(user.createdAt).toLocaleDateString('pt-BR')})</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            user.hasProduct
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-900 text-slate-550 border border-slate-800'
                          }`}>
                            {user.hasProduct ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            user.hasPublishedVitrine
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-900 text-slate-550 border border-slate-800'
                          }`}>
                            {user.hasPublishedVitrine ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            user.hasShared
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-900 text-slate-550 border border-slate-800'
                          }`}>
                            {user.hasShared ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            user.returnedNextWeek
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-900 text-slate-550 border border-slate-800'
                          }`}>
                            {user.returnedNextWeek ? 'Sim' : 'Não'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500 italic">
                        Nenhum lojista encontrado no funil.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Nome da Loja</th>
                    <th className="px-5 py-3.5">Plano</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Domínio Customizado</th>
                    <th className="px-5 py-3.5">Fim da Avaliação (Trial)</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStores.map(store => (
                    <tr key={store.id} className="hover:bg-slate-900/10">
                      <td className="px-5 py-4 font-bold text-slate-100">{store.name}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          store.plan === 'pro' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : store.plan === 'enterprise'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {store.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          store.plan_status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : store.plan_status === 'trial_custom'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {store.plan_status === 'trial_custom' ? 'Avaliação Avulsa' : store.plan_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                        {store.custom_domain || 'Vitrine Padrão'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {store.plan_status === 'trial_custom' ? 'Sem expiração' : (store.trial_ends_at ? new Date(store.trial_ends_at).toLocaleDateString('pt-BR') : 'N/A')}
                      </td>
                      <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenStoreModal(store)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-semibold flex items-center gap-1.5 inline-flex"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar Plano
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-950/40 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 text-[10px] font-semibold flex items-center gap-1.5 inline-flex transition-all duration-200"
                          title="Excluir Loja"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir Loja
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

    </div>
  )
}
