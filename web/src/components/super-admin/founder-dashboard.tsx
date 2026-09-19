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
  Filter
} from 'lucide-react'

export interface SaaSMetrics {
  mrr: number
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
              <p className="text-xs text-slate-400">Métricas exclusivas das assinaturas de software da plataforma.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Assinaturas Pagas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* MRR */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MRR</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {saasMetrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Soma estrita de assinaturas <strong className="text-emerald-400">PAGAS</strong> e <strong className="text-emerald-400">ATIVAS</strong>.
            </p>
          </div>

          {/* Pagantes */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lojas Pagantes</span>
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {saasMetrics.payingStoresCount}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Lojas com assinatura paga ativa no período.
            </p>
          </div>

          {/* Trials Ativos */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trials Ativos</span>
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {saasMetrics.activeTrialsCount}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Lojas dentro do período gratuito de teste.
            </p>
          </div>

          {/* ARPU */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ARPU</span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {saasMetrics.arpu.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Receita média por cliente pagante (MRR / Pagantes).
            </p>
          </div>

        </div>

        {/* Linha Secundária SaaS: Conversão Trial, Churn, Novas Lojas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Novas Lojas Criadas</span>
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
              <span className="text-xs font-bold text-slate-400">Conversão Trial → Pago</span>
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
              <span className="text-xs font-bold text-slate-400">Churn Rate (Cancelamento)</span>
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
