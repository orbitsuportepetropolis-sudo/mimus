import React, { useState, useMemo, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  ExternalLink, 
  MessageCircle, 
  Calendar, 
  DollarSign, 
  Clock, 
  Shield, 
  Edit3, 
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Gift,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react'
import { SubscriptionStatus, StoreEnvironment } from '@/lib/permissions'

export interface StoreRowData {
  id: string
  name: string
  responsibleName: string
  email: string | null
  phone: string | null
  createdAt: string
  lastActivity: string | null
  environment: StoreEnvironment
  plan: string
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
  subscriptionAmount: number
  nextBillingAt: string | null
  lastPayment: {
    amount: number
    paidAt: string
  } | null
  orders30Days: number
  gmv30Days: number
  pendingInvoiceUrl?: string | null
}

interface StoresPlansTableProps {
  stores: StoreRowData[]
  onSelectStore: (store: StoreRowData) => void
  onQuickChangeEnvironment?: (storeId: string, env: StoreEnvironment) => void
}

type SortField = 'name' | 'createdAt' | 'environment' | 'plan' | 'subscriptionStatus' | 'subscriptionAmount' | 'lastPayment' | 'orders30Days' | 'gmv30Days' | null
type SortDirection = 'asc' | 'desc'

export function StoresPlansTable({ stores, onSelectStore, onQuickChangeEnvironment }: StoresPlansTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [envFilter, setEnvFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownSearch, setDropdownSearch] = useState<string>('')

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.column-filter-dropdown') && !target.closest('.column-filter-trigger')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Helpers para Valores Únicos (Excel Checkbox List)
  const getDistinctValues = (colKey: string) => {
    const counts: Record<string, number> = {}
    stores.forEach(s => {
      let val = ''
      if (colKey === 'name') val = s.name
      else if (colKey === 'environment') val = s.environment
      else if (colKey === 'plan') val = s.plan
      else if (colKey === 'subscriptionStatus') val = s.subscriptionStatus
      else if (colKey === 'createdAt') {
        const d = new Date(s.createdAt)
        val = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      }
      if (val) counts[val] = (counts[val] || 0) + 1
    })
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value,
      count
    })).sort((a, b) => a.value.localeCompare(b.value, 'pt-BR'))
  }

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleToggleFilterValue = (colKey: string, value: string) => {
    setColumnFilters(prev => {
      const current = prev[colKey] || []
      const distinct = getDistinctValues(colKey).map(d => d.value)
      let updated: string[]

      if (current.length === 0) {
        // Inicialmente todos estão ativos, desmarcar este remove ele
        updated = distinct.filter(v => v !== value)
      } else if (current.includes(value)) {
        updated = current.filter(v => v !== value)
      } else {
        updated = [...current, value]
        if (updated.length === distinct.length) {
          updated = [] // Todos selecionados equivale a sem filtro
        }
      }
      return { ...prev, [colKey]: updated }
    })
  }

  const handleToggleSelectAll = (colKey: string) => {
    const distinct = getDistinctValues(colKey).map(d => d.value)
    const current = columnFilters[colKey] || []
    if (current.length === 0 || current.length === distinct.length) {
      setColumnFilters(prev => ({ ...prev, [colKey]: ['__NONE__'] }))
    } else {
      setColumnFilters(prev => ({ ...prev, [colKey]: [] }))
    }
  }

  const handleClearColumnFilter = (colKey: string) => {
    setColumnFilters(prev => {
      const copy = { ...prev }
      delete copy[colKey]
      return copy
    })
  }

  const hasAnyFilter = Object.values(columnFilters).some(v => v && v.length > 0) || statusFilter !== 'all' || envFilter !== 'all' || searchQuery.trim().length > 0

  const handleResetAllFilters = () => {
    setColumnFilters({})
    setStatusFilter('all')
    setEnvFilter('all')
    setSearchQuery('')
    setSortField('createdAt')
    setSortDirection('desc')
  }

  const filteredStores = useMemo(() => {
    let result = stores.filter(store => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = store.name.toLowerCase().includes(query)
        const matchesResp = store.responsibleName.toLowerCase().includes(query)
        const matchesEmail = store.email ? store.email.toLowerCase().includes(query) : false
        const matchesPhone = store.phone ? store.phone.includes(query) : false
        if (!matchesName && !matchesResp && !matchesEmail && !matchesPhone) return false
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'free' && store.subscriptionStatus !== 'FREE') return false
        if (statusFilter === 'trial' && store.subscriptionStatus !== 'TRIAL') return false
        if (statusFilter === 'active' && store.subscriptionStatus !== 'ACTIVE') return false
        if (statusFilter === 'past_due' && store.subscriptionStatus !== 'PAST_DUE') return false
        if (statusFilter === 'canceled' && store.subscriptionStatus !== 'CANCELED') return false
        if (statusFilter === 'courtesy' && store.subscriptionStatus !== 'COURTESY') return false
      }

      // 3. Environment Filter
      if (envFilter !== 'all') {
        if (store.environment !== envFilter) return false
      }

      // 4. Column Checkbox Filters (Excel-style)
      for (const [colKey, selectedValues] of Object.entries(columnFilters)) {
        if (selectedValues && selectedValues.length > 0) {
          if (selectedValues.includes('__NONE__')) return false

          let storeVal = ''
          if (colKey === 'name') storeVal = store.name
          else if (colKey === 'environment') storeVal = store.environment
          else if (colKey === 'plan') storeVal = store.plan
          else if (colKey === 'subscriptionStatus') storeVal = store.subscriptionStatus
          else if (colKey === 'createdAt') {
            const d = new Date(store.createdAt)
            storeVal = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          }

          if (storeVal && !selectedValues.includes(storeVal)) {
            return false
          }
        }
      }

      return true
    })

    // 5. Sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0
        if (sortField === 'name') {
          cmp = a.name.localeCompare(b.name, 'pt-BR')
        } else if (sortField === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        } else if (sortField === 'environment') {
          cmp = a.environment.localeCompare(b.environment)
        } else if (sortField === 'plan') {
          cmp = a.plan.localeCompare(b.plan)
        } else if (sortField === 'subscriptionStatus') {
          cmp = a.subscriptionStatus.localeCompare(b.subscriptionStatus)
        } else if (sortField === 'subscriptionAmount') {
          cmp = (a.subscriptionAmount || 0) - (b.subscriptionAmount || 0)
        } else if (sortField === 'lastPayment') {
          const payA = a.lastPayment ? new Date(a.lastPayment.paidAt).getTime() : 0
          const payB = b.lastPayment ? new Date(b.lastPayment.paidAt).getTime() : 0
          cmp = payA - payB
        } else if (sortField === 'orders30Days') {
          cmp = (a.orders30Days || 0) - (b.orders30Days || 0)
        } else if (sortField === 'gmv30Days') {
          cmp = (a.gmv30Days || 0) - (b.gmv30Days || 0)
        }
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [stores, searchQuery, statusFilter, envFilter, columnFilters, sortField, sortDirection])

  // Helpers para Badges
  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-extrabold">ACTIVE</span>
      case 'TRIAL':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-[9px] font-extrabold">TRIAL</span>
      case 'COURTESY':
        return <span className="bg-pink-500/10 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full text-[9px] font-extrabold">COURTESY</span>
      case 'PAST_DUE':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> ATRASADA</span>
      case 'CANCELED':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[9px] font-extrabold">CANCELED</span>
      case 'EXPIRED':
        return <span className="bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full text-[9px] font-extrabold">EXPIRED</span>
      default:
        return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold">FREE</span>
    }
  }

  const getEnvBadge = (env: StoreEnvironment) => {
    switch (env) {
      case 'PRODUCTION':
        return <span className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded-md text-[9px] font-bold">PRODUÇÃO</span>
      case 'TEST':
        return <span className="bg-rose-950/40 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded-md text-[9px] font-bold">TESTE</span>
      case 'INTERNAL':
        return <span className="bg-indigo-950/40 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-md text-[9px] font-bold">INTERNO</span>
      case 'DEMO':
        return <span className="bg-amber-950/40 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-md text-[9px] font-bold">DEMO</span>
      case 'PENDING_REVIEW':
        return <span className="bg-yellow-950/40 text-yellow-300 border border-yellow-800/50 px-2 py-0.5 rounded-md text-[9px] font-bold">PENDENTE REVISÃO</span>
      default:
        return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md text-[9px] font-bold">{env}</span>
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 30) return `há ${diffDays} dias`
    if (diffDays < 60) return 'há 1 mês'
    const diffMonths = Math.floor(diffDays / 30)
    return `há ${diffMonths} meses`
  }

  // Renderizador de Cabeçalho Interativo com Dropdown Estilo Excel
  const renderHeader = (
    label: string, 
    field: SortField, 
    align: 'left' | 'right' | 'center' = 'left',
    isFilterable: boolean = false,
    sortAscLabel = 'Classificar de A a Z',
    sortDescLabel = 'Classificar de Z a A'
  ) => {
    const isSorted = sortField === field
    const activeFilters = field ? (columnFilters[field] || []) : []
    const distinctValues = field && isFilterable ? getDistinctValues(field) : []
    const hasFilter = activeFilters.length > 0
    const isOpen = activeDropdown === field
    const isRight = align === 'right'

    const filteredDistinct = distinctValues.filter(d => 
      d.label.toLowerCase().includes(dropdownSearch.toLowerCase())
    )
    const allSelected = activeFilters.length === 0

    return (
      <th className={`py-3 px-3 relative select-none ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
        <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} group w-full`}>
          {/* Rótulo clicável para alternar ordenação */}
          <div 
            className="inline-flex items-center gap-1 cursor-pointer hover:text-rose-400 transition-colors whitespace-nowrap"
            onClick={() => field && handleToggleSort(field)}
            title={field ? `Clique para ordenar por ${label}` : undefined}
          >
            <span>{label}</span>
            {field && (
              isSorted ? (
                sortDirection === 'asc' ? (
                  <ArrowUp className="w-3 h-3 text-rose-500 font-bold flex-shrink-0" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-rose-500 font-bold flex-shrink-0" />
                )
              ) : (
                <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-80 transition-opacity flex-shrink-0" />
              )
            )}
          </div>

          {/* Botão de Dropdown estilo Excel */}
          {field && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDropdownSearch('')
                setActiveDropdown(isOpen ? null : field)
              }}
              className={`column-filter-trigger p-1 rounded transition-all ${
                hasFilter 
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400' 
                  : isOpen 
                  ? 'bg-slate-800 text-slate-200' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
              }`}
              title={`Filtrar e classificar ${label}`}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Popover Dropdown Estilo Excel */}
        {isOpen && field && (
          <div 
            className={`column-filter-dropdown absolute top-full ${isRight ? 'right-0' : 'left-0'} mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-slate-200 font-normal normal-case text-left`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                <span>{label}</span>
              </div>
              <button 
                type="button"
                onClick={() => setActiveDropdown(null)} 
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Opções de Ordenação (Crescente / Decrescente) */}
            <div className="space-y-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  setSortField(field)
                  setSortDirection('asc')
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  isSorted && sortDirection === 'asc'
                    ? 'bg-rose-500/20 text-rose-400 font-bold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{sortAscLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortField(field)
                  setSortDirection('desc')
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  isSorted && sortDirection === 'desc'
                    ? 'bg-rose-500/20 text-rose-400 font-bold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{sortDescLabel}</span>
              </button>
            </div>

            {/* Limpar filtro desta coluna */}
            {hasFilter && (
              <div className="mb-2 pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => handleClearColumnFilter(field)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 flex-shrink-0" />
                  <span>Limpar Filtro</span>
                </button>
              </div>
            )}

            {/* Checkbox de Valores Únicos (Excel) */}
            {isFilterable && distinctValues.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {/* Campo de Busca no Filtro */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Lista de Checkboxes */}
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  <label className="flex items-center gap-2 px-1 py-1 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200 font-bold text-[11px]">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => handleToggleSelectAll(field)}
                      className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>(Selecionar Tudo)</span>
                  </label>

                  {filteredDistinct.map(item => {
                    const isChecked = allSelected || activeFilters.includes(item.value)
                    return (
                      <label key={item.value} className="flex items-center justify-between px-1 py-1 hover:bg-slate-800/60 rounded cursor-pointer text-slate-300 text-[11px]">
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFilterValue(field, item.value)}
                            className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono ml-1">({item.count})</span>
                      </label>
                    )
                  })}
                </div>

                {/* Botões de Ação */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => handleClearColumnFilter(field)}
                    className="text-[10px] text-slate-400 hover:text-rose-400"
                  >
                    Restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(null)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold shadow-sm"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </th>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Search & Filter Controls */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome da loja, responsável ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Mostrando <strong>{filteredStores.length}</strong> de <strong>{stores.length}</strong> lojas</span>
            {hasAnyFilter && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900 text-xs">
          
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Status:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'free', label: 'Free' },
              { id: 'trial', label: 'Trial' },
              { id: 'active', label: 'Pagantes' },
              { id: 'past_due', label: 'Atrasados' },
              { id: 'canceled', label: 'Cancelados' },
              { id: 'courtesy', label: 'Cortesia' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Environment Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Ambiente:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'PRODUCTION', label: 'Produção' },
              { id: 'TEST', label: 'Testes' },
              { id: 'INTERNAL', label: 'Interno' },
              { id: 'DEMO', label: 'Demo' },
              { id: 'PENDING_REVIEW', label: 'Revisar' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEnvFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  envFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Main Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm">
        <div className="overflow-x-auto min-h-[460px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {renderHeader('Loja / Responsável', 'name', 'left', true, 'Classificar de A a Z', 'Classificar de Z a A')}
                {renderHeader('Data Inscrição', 'createdAt', 'left', true, 'Mais antigo para mais recente', 'Mais recente para mais antigo')}
                <th className="py-3 px-3">Contato (WhatsApp / Email)</th>
                {renderHeader('Ambiente', 'environment', 'left', true, 'Classificar de A a Z', 'Classificar de Z a A')}
                {renderHeader('Plano', 'plan', 'left', true, 'Classificar de A a Z', 'Classificar de Z a A')}
                {renderHeader('Status', 'subscriptionStatus', 'left', true, 'Classificar de A a Z', 'Classificar de Z a A')}
                <th className="py-3 px-3">Trial / Próxima Cobrança</th>
                {renderHeader('Valor Assinatura', 'subscriptionAmount', 'right', false, 'Menor para maior valor', 'Maior para menor valor')}
                {renderHeader('Último Pgto', 'lastPayment', 'right', false, 'Mais antigo para mais recente', 'Mais recente para mais antigo')}
                {renderHeader('Pedidos 30d', 'orders30Days', 'right', false, 'Menor para maior quantidade', 'Maior para menor quantidade')}
                {renderHeader('GMV 30d', 'gmv30Days', 'right', false, 'Menor para maior receita', 'Maior para menor receita')}
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => {
                  const cleanPhone = store.phone ? store.phone.replace(/\D/g, '') : null
                  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null

                  return (
                    <tr 
                      key={store.id} 
                      className="hover:bg-slate-900/30 transition-all cursor-pointer"
                      onClick={() => onSelectStore(store)}
                    >
                      {/* Loja / Responsável */}
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        <div className="text-sm font-extrabold hover:text-rose-400 transition-colors">
                          {store.name}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                          {store.responsibleName}
                        </div>
                      </td>

                      {/* Data Inscrição */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          {new Date(store.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium pl-5 mt-0.5">
                          {formatRelativeTime(store.createdAt)}
                        </div>
                      </td>

                      {/* Contato (WhatsApp & Email) */}
                      <td className="py-3.5 px-4 text-slate-400" onClick={(e) => e.stopPropagation()}>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {store.phone}
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Sem telefone</span>
                        )}
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {store.email || 'Sem email'}
                        </div>
                      </td>

                      {/* Ambiente */}
                      <td className="py-3.5 px-4">
                        {getEnvBadge(store.environment)}
                      </td>

                      {/* Plano */}
                      <td className="py-3.5 px-4">
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

                      {/* Status Assinatura */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(store.subscriptionStatus)}
                      </td>

                      {/* Trial / Próxima Cobrança */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {store.subscriptionStatus === 'TRIAL' && store.trialEndsAt ? (
                          <span className="text-purple-400">
                            Trial até {new Date(store.trialEndsAt).toLocaleDateString('pt-BR')}
                          </span>
                        ) : store.subscriptionStatus === 'PAST_DUE' && store.nextBillingAt ? (
                          <span className="text-amber-400 font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            Venceu em {new Date(store.nextBillingAt).toLocaleDateString('pt-BR')}
                          </span>
                        ) : store.nextBillingAt ? (
                          <span>{new Date(store.nextBillingAt).toLocaleDateString('pt-BR')}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Valor Assinatura */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        {store.subscriptionAmount > 0
                          ? store.subscriptionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'R$ 0,00'}
                      </td>

                      {/* Último Pagamento */}
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                        {store.lastPayment ? (
                          <div>
                            <span className="font-bold text-emerald-400">
                              {store.lastPayment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <div className="text-[9px] text-slate-500">
                              {new Date(store.lastPayment.paidAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">Nenhum</span>
                        )}
                      </td>

                      {/* Pedidos 30d */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        {store.orders30Days}
                      </td>

                      {/* GMV 30d */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-pink-400">
                        {store.gmv30Days.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectStore(store)}
                          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 italic">
                    Nenhuma loja encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
