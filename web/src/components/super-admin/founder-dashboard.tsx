'use client'

import React, { useState } from 'react'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ShoppingBag, 
  Store as StoreIcon, 
  Eye, 
  Percent, 
  AlertCircle,
  HelpCircle,
  Layers,
  Filter,
  CheckCircle2
} from 'lucide-react'

export interface SaaSMetrics {
  mrr: number
  contractedMrr: number
  pastDueMrr: number
  pastDueStoresCount: number
  totalRevenueCollected: number
  confirmedPaymentsCount: number
  payingStoresCount: number
  activeTrialsCount: number
  newStoresCount: number
  conversionTrialRate: number | null // null = 'N/A'
  churnRate: number | null // null = 'N/A'
  arpu: number
}

export interface StoreEconomyMetrics {
  gmv: number
  totalOrders: number
  ticketMedioPedidos: number
  storesWithSalesCount: number
  publishedCatalogsCount: number
  totalVisits: number | null
}

interface FounderDashboardProps {
  saasMetrics: SaaSMetrics
  storeEconomyMetrics: StoreEconomyMetrics
  environmentFilter: string
  setEnvironmentFilter: (env: string) => void
  periodFilter: '7d' | '30d' | '90d' | 'all'
  setPeriodFilter: (p: '7d' | '30d' | '90d' | 'all') => void
}

export function FounderDashboard({
  saasMetrics,
  storeEconomyMetrics,
  environmentFilter,
  setEnvironmentFilter,
  periodFilter,
  setPeriodFilter
}: FounderDashboardProps) {

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Filter Bar: Environment and Period Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-300">Base de Dados:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setEnvironmentFilter('PRODUCTION')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                environmentFilter === 'PRODUCTION'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Apenas Produção (Real)
            </button>
            <button
              onClick={() => setEnvironmentFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                environmentFilter === 'ALL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas as Lojas
            </button>
            <button
              onClick={() => setEnvironmentFilter('TEST')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                environmentFilter === 'TEST'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Testes & Interno
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Período:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  periodFilter === p
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : 'Todo Período'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOCO 1: RECEITA DO MIMUS (SAAS METRICS) */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100">Receita do Mimus (SaaS)</h2>
              <p className="text-xs text-slate-400">Métricas financeiras de assinaturas e faturamento da plataforma.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saasMetrics.contractedMrr > 0 && (
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                MRR Contratado: {saasMetrics.contractedMrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Assinaturas Pro
            </span>
          </div>
        </div>

        {/* Notificação de Inadimplência se houver fatura em atraso */}
        {saasMetrics.pastDueStoresCount > 0 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <span className="font-bold text-amber-300">
                  {saasMetrics.pastDueStoresCount} {saasMetrics.pastDueStoresCount === 1 ? 'loja com mensalidade vencida' : 'lojas com mensalidade vencida'} ({saasMetrics.pastDueMrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}):
                </span>{' '}
                <span className="text-amber-200/80">
                  A loja foi rebaixada imediatamente para o plano Grátis. Assim que a fatura for confirmada no Asaas, ela retorna automaticamente ao Pro.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* MRR Ativo (Em Dia) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MRR Em Dia</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {saasMetrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            {saasMetrics.pastDueMrr > 0 ? (
              <p className="text-[11px] text-amber-400 font-semibold leading-tight">
                +{saasMetrics.pastDueMrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em atraso <span className="text-slate-500 font-normal">(Contratado: {saasMetrics.contractedMrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 leading-tight">
                Soma estrita de assinaturas <strong className="text-emerald-400">PAGAS</strong> e <strong className="text-emerald-400">ATIVAS</strong>.
              </p>
            )}
          </div>

          {/* Receita Recebida (Caixa Real) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receita Recebida (Caixa)</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {saasMetrics.totalRevenueCollected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight flex items-center justify-between">
              <span>{saasMetrics.confirmedPaymentsCount} {saasMetrics.confirmedPaymentsCount === 1 ? 'recebimento confirmado' : 'recebimentos confirmados'}</span>
              <span className="text-emerald-400/90 font-bold">Compensado Asaas</span>
            </p>
          </div>

          {/* Inadimplência / Em Aberto */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em Atraso / Pendente</span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400">
              {saasMetrics.pastDueMrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {saasMetrics.pastDueStoresCount > 0 ? (
                <span className="text-amber-400 font-medium">
                  {saasMetrics.pastDueStoresCount} {saasMetrics.pastDueStoresCount === 1 ? 'loja aguardando renovação' : 'lojas aguardando renovação'}
                </span>
              ) : (
                'Nenhuma fatura em atraso no período.'
              )}
            </p>
          </div>

          {/* Lojas Pagantes / Clientes */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lojas Pagantes</span>
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100 flex items-baseline gap-2">
              <span>{saasMetrics.payingStoresCount}</span>
              {saasMetrics.pastDueStoresCount > 0 && (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  +{saasMetrics.pastDueStoresCount} vencida
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {saasMetrics.payingStoresCount + saasMetrics.pastDueStoresCount} {saasMetrics.payingStoresCount + saasMetrics.pastDueStoresCount === 1 ? 'cliente Pro contratado' : 'clientes Pro contratados'}.
            </p>
          </div>

        </div>

        {/* Linha Secundária SaaS: Trials, ARPU, Conversão Trial, Novas Lojas, Churn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Trials Ativos</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {saasMetrics.activeTrialsCount}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">ARPU (Médio)</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {saasMetrics.arpu.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Novas Lojas</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {saasMetrics.newStoresCount}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-slate-900 text-slate-400">
              <StoreIcon className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Conversão Trial</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {saasMetrics.conversionTrialRate !== null ? `${saasMetrics.conversionTrialRate.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-slate-900 text-slate-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Churn Rate</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {saasMetrics.churnRate !== null ? `${saasMetrics.churnRate.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-slate-900 text-slate-400">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOCO 2: ECONOMIA DAS LOJAS */}
      {/* ===================================================================== */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100">Economia das Lojas</h2>
              <p className="text-xs text-slate-400">Volume transacionado e movimentação operacional dos lojistas clientes.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
            Vendas dos Lojistas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* GMV */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">GMV (Volume de Vendas)</span>
              <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-pink-400">
              {storeEconomyMetrics.gmv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Soma dos pedidos válidos das lojas no período.
            </p>
          </div>

          {/* Pedidos */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos</span>
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {storeEconomyMetrics.totalOrders.toLocaleString('pt-BR')}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Quantidade de pedidos concluídos pelas lojas.
            </p>
          </div>

          {/* Ticket Médio dos Pedidos */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Médio dos Pedidos</span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400">
              {storeEconomyMetrics.ticketMedioPedidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Valor médio por pedido de cliente (GMV / Pedidos).
            </p>
          </div>

        </div>

        {/* Linha Secundária Economia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Lojas com Vendas (Ativas)</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {storeEconomyMetrics.storesWithSalesCount}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-slate-900 text-slate-400">
              <StoreIcon className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Vitrines Publicadas c/ Catálogo</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {storeEconomyMetrics.publishedCatalogsCount}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-slate-900 text-slate-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Visitas às Vitrines</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {storeEconomyMetrics.totalVisits !== null ? storeEconomyMetrics.totalVisits.toLocaleString('pt-BR') : 'Em mensuração'}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-slate-900 text-slate-400">
              <Eye className="w-4 h-4" />
            </span>
          </div>

        </div>
      </div>

    </div>
  )
}
