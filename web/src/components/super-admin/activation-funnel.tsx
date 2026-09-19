'use client'

import React, { useState } from 'react'
import { 
  Users, 
  Store, 
  Package, 
  Globe, 
  ShoppingBag, 
  Clock, 
  CreditCard,
  ArrowRight,
  TrendingDown
} from 'lucide-react'

export interface FunnelStep {
  name: string
  key: string
  count: number
  conversionRate: number // % em relação ao passo anterior (100% no primeiro)
  overallConversionRate: number // % em relação ao topo do funil (Cadastros)
  icon: any
  color: string
}

interface ActivationFunnelProps {
  steps: FunnelStep[]
  period: '7d' | '30d' | '90d' | 'all'
  setPeriod: (p: '7d' | '30d' | '90d' | 'all') => void
}

export function ActivationFunnel({ steps, period, setPeriod }: ActivationFunnelProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header com Seletor de Período */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" /> Funil de Ativação do SaaS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe a jornada completa desde o cadastro de usuários até a conversão em clientes pagantes.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === p
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : 'Todo Período'}
            </button>
          ))}
        </div>
      </div>

      {/* Visualização Sequencial do Funil */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div 
              key={step.key} 
              className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 relative group hover:border-slate-700 transition-all"
            >
              {/* Top: Step order badge & Icon */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">
                  #{index + 1}
                </span>
                <span className={`p-2 rounded-xl bg-slate-900 ${step.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>

              {/* Title & Count */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {step.name}
                </span>
                <div className="text-2xl font-black text-slate-100 mt-0.5">
                  {step.count.toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Conversion Stats */}
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[10px]">
                {index > 0 ? (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Etapa anterior:</span>
                    <strong className={step.conversionRate > 50 ? 'text-emerald-400' : 'text-amber-400'}>
                      {step.conversionRate.toFixed(1)}%
                    </strong>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-0.5">Topo do Funil</div>
                )}
                {index > 0 && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Do total:</span>
                    <span>{step.overallConversionRate.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* Conector visual horizontal em telas maiores */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-700 pointer-events-none">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tabela Comparativa de Taxas de Conversão */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Detalhamento das Conversões por Etapa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Etapa</th>
                <th className="py-2.5 px-3">Quantidade</th>
                <th className="py-2.5 px-3">Conversão Passo Anterior</th>
                <th className="py-2.5 px-3">Conversão Global</th>
                <th className="py-2.5 px-3">Perda / Gargalo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {steps.map((step, idx) => {
                const prevCount = idx > 0 ? steps[idx - 1].count : step.count
                const dropCount = prevCount - step.count
                const dropRate = prevCount > 0 ? (dropCount / prevCount) * 100 : 0
                return (
                  <tr key={step.key} className="hover:bg-slate-900/30">
                    <td className="py-3 px-3 font-bold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${step.color.replace('text-', 'bg-')}`} />
                      {step.name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-100">
                      {step.count.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {idx === 0 ? '100%' : `${step.conversionRate.toFixed(1)}%`}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {`${step.overallConversionRate.toFixed(1)}%`}
                    </td>
                    <td className="py-3 px-3">
                      {idx > 0 && dropCount > 0 ? (
                        <span className="text-rose-400 font-mono text-[10px]">
                          -{dropCount} ({dropRate.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
