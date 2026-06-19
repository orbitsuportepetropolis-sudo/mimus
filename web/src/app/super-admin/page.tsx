'use client'

import React, { useState, useEffect } from 'react'
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
  Settings
} from 'lucide-react'

type Tab = 'metrics' | 'stores' | 'users' | 'sales' | 'logs'

interface UserView {
  id: string
  store_id: string | null
  name: string
  role: string
  status: string
  created_at: string
  email: string | null
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

export default function SuperAdminPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('metrics')
  const [loading, setLoading] = useState(true)

  // Data states
  const [users, setUsers] = useState<UserView[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [sales, setSales] = useState<GlobalSale[]>([])
  const [logs, setLogs] = useState<SecurityLog[]>([])

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
  const [newAdminRole, setNewAdminRole] = useState('admin')
  const [newAdminStoreId, setNewAdminStoreId] = useState('')
  const [formLoading, setFormLoading] = useState(false)

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
      
      if (activeTab === 'metrics') {
        const [usersRes, storesRes, salesRes] = await Promise.all([
          supabase.from('profiles').select('id, name, role', { count: 'exact' }),
          supabase.from('stores').select('id, name, plan', { count: 'exact' }),
          supabase.from('sales').select('id, total_value')
        ])

        // Query profiles directly to get users list
        const { data: usersView } = await supabase
          .from('profiles')
          .select('*, stores(name)')
          .order('created_at', { ascending: false })
          .limit(10)

        // Query stores to show recent
        const { data: storesList } = await supabase
          .from('stores')
          .select('id, name, plan, plan_status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        if (usersView) {
          const formatted = usersView.map((u: any) => ({
            id: u.id,
            store_id: u.store_id,
            name: u.name,
            role: u.role,
            status: u.status,
            created_at: u.created_at,
            email: u.email,
            store_name: u.stores?.name || null
          }))
          setUsers(formatted)
        }
        if (storesList) setStores(storesList as any)
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
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (data) setLogs(data)
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

  const handleUpdateUserRole = async (userId: string, nextRole: string) => {
    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', userId, role: nextRole })
      })

      if (!response.ok) throw new Error('Erro ao atualizar cargo')
      
      alert('Cargo atualizado com sucesso!')
      setIsUserModalOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message)
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

  return (
    <div className="space-y-6">
      
      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'metrics', label: 'Crescimento', icon: TrendingUp },
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
            </button>
          )
        })}
      </div>

      {/* METRICAS TAB */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total de Lojas</span>
                <p className="text-2xl font-extrabold text-slate-100 mt-1">{stores.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Assinaturas Pro</span>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  {stores.filter(s => s.plan === 'pro').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total de Usuários</span>
                <p className="text-2xl font-extrabold text-slate-100 mt-1">{users.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Faturamento Global</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  R$ {sales.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Stores */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" /> Lojas Criadas Recentemente
              </h3>
              <div className="divide-y divide-slate-800 text-xs">
                {stores.slice(0, 5).map(store => (
                  <div key={store.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <span className="font-semibold text-slate-300">{store.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        store.plan === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {store.plan}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(store.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-500" /> Ações Rápidas do Administrador
                </h3>
                <p className="text-xs text-slate-400">Gerencie a infraestrutura principal do sistema de forma instantânea.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setIsCreateAdminOpen(true)}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-200 text-xs font-semibold text-left flex flex-col gap-2 transition-all"
                >
                  <Plus className="w-5 h-5 text-rose-500" />
                  <span>Cadastrar Administrador</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('logs')
                  }}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-200 text-xs font-semibold text-left flex flex-col gap-2 transition-all"
                >
                  <Lock className="w-5 h-5 text-amber-500" />
                  <span>Verificar Logs Segurança</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEARCH BAR FOR LISTS */}
      {activeTab !== 'metrics' && activeTab !== 'logs' && activeTab !== 'sales' && (
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
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {store.plan_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                        {store.custom_domain || 'Vitrine Padrão'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {store.trial_ends_at ? new Date(store.trial_ends_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenStoreModal(store)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-semibold flex items-center gap-1.5 inline-flex"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar Plano
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
                            onClick={() => {
                              setSelectedUser(u)
                              setIsUserModalOpen(true)
                            }}
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
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Data / Hora</th>
                    <th className="px-5 py-3.5">Ação Realizada</th>
                    <th className="px-5 py-3.5">Endereço IP</th>
                    <th className="px-5 py-3.5">Dispositivo / User-Agent</th>
                    <th className="px-5 py-3.5">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/10">
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-200">{log.action}</td>
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">{log.ip}</td>
                      <td className="px-5 py-4 text-slate-400 max-w-xs truncate" title={log.user_agent || ''}>
                        {log.user_agent}
                      </td>
                      <td className="px-5 py-4 font-mono text-[9px] text-slate-500 max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <Key className="w-5 h-5 text-amber-500" /> Nível de Acesso (RBAC) - {selectedUser.name}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Selecione o Cargo / Papel</label>
                <select
                  defaultValue={selectedUser.role}
                  onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                >
                  <option value="super_admin">Super Admin (Acesso Total)</option>
                  <option value="admin">Administrador (Lojista)</option>
                  <option value="operator">Operador (Acesso Limitado)</option>
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold"
                >
                  Fechar
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
