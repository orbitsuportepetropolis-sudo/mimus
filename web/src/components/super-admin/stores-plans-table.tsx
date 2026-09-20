'use client'

import React, { useState, useMemo } from 'react'
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
  Gift
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

export function StoresPlansTable({ stores, onSelectStore, onQuickChangeEnvironment }: StoresPlansTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [envFilter, setEnvFilter] = useState<string>('all')

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = store.name.toLowerCase().includes(query)
        const matchesResp = store.responsibleName.toLowerCase().includes(query)
        const matchesEmail = store.email ? store.email.toLowerCase().includes(query) : false
        if (!matchesName && !matchesResp && !matchesEmail) return false
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

      return true
    })
  }, [stores, searchQuery, statusFilter, envFilter])

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

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            Mostrando <strong>{filteredStores.length}</strong> de <strong>{stores.length}</strong> lojas
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
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Loja / Responsável</th>
                <th className="py-3 px-4">Contato (WhatsApp / Email)</th>
                <th className="py-3 px-4">Ambiente</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trial / Próxima Cobrança</th>
                <th className="py-3 px-4 text-right">Valor Assinatura</th>
                <th className="py-3 px-4 text-right">Último Pgto</th>
                <th className="py-3 px-4 text-right">Pedidos 30d</th>
                <th className="py-3 px-4 text-right">GMV 30d</th>
                <th className="py-3 px-4 text-center">Ações</th>
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
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Cadastrada em {new Date(store.createdAt).toLocaleDateString('pt-BR')}
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
