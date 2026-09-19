'use client'

import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  CreditCard, 
  DollarSign, 
  Clock, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react'

interface AsaasReconciliationProps {
  onReconciledSuccess?: () => void
}

export function AsaasReconciliation({ onReconciledSuccess }: AsaasReconciliationProps) {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [selectedSubForCancel, setSelectedSubForCancel] = useState<string | null>(null)

  const loadReconciliationData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/billing/reconcile')
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        alert(json.error || 'Erro ao carregar dados de reconciliação')
      }
    } catch (e: any) {
      console.error('Error fetching reconciliation:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReconciliationData()
  }, [])

  const handleReconcileAll = async () => {
    if (!confirm('Deseja reconciliar todos os pagamentos confirmados do Asaas com a base do Mimus? Isso atualizará o MRR e marcará as lojas pagantes como Pro Ativo.')) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/super-admin/billing/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconcile_all' })
      })
      const json = await res.json()
      if (res.ok) {
        alert(json.message)
        loadReconciliationData()
        onReconciledSuccess?.()
      } else {
        alert(json.error || 'Erro ao reconciliar')
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelDuplicate = async (subscriptionId: string, storeId?: string) => {
    const confirmMsg = `ATENÇÃO CRÍTICA:\n\nVocê está prestes a cancelar a assinatura duplicada (${subscriptionId}) diretamente no Asaas.\nIsso cancelará as cobranças pendentes futuras (20/09 e 20/10) desta assinatura, preservando todo o histórico financeiro.\n\nDeseja confirmar o cancelamento no Asaas?`
    if (!confirm(confirmMsg)) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/super-admin/billing/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_duplicate_subscription',
          subscriptionId,
          storeId
        })
      })
      const json = await res.json()
      if (res.ok) {
        alert(json.message)
        loadReconciliationData()
        onReconciledSuccess?.()
      } else {
        alert(json.error || 'Erro ao cancelar assinatura')
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-950 rounded-2xl border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
        <p className="text-xs text-slate-400 font-semibold">Consultando API do Asaas e cruzando com o banco...</p>
      </div>
    )
  }

  const duplicateAlerts = data?.duplicateAlerts || []
  const unimportedPayments = data?.unimportedPayments || []
  const summary = data?.summary || {}

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Action & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-400" /> Reconciliação Asaas & Detecção de Duplicidades
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditoria em tempo real entre o gateway Asaas e o banco de dados do Mimus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReconciliationData}
            disabled={actionLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleReconcileAll}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Reconciliar Pagamentos ({unimportedPayments.length})
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Clientes Asaas</span>
          <span className="text-2xl font-extrabold text-slate-100">{summary.totalAsaasCustomers || 0}</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Assinaturas Ativas</span>
          <span className="text-2xl font-extrabold text-indigo-400">{summary.totalAsaasSubscriptions || 0}</span>
        </div>
        <div className={`p-4 rounded-xl border ${duplicateAlerts.length > 0 ? 'bg-rose-950/20 border-rose-800/40' : 'bg-slate-950 border-slate-800'}`}>
          <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">Assinaturas Duplicadas</span>
          <span className="text-2xl font-extrabold text-rose-400">{duplicateAlerts.length}</span>
        </div>
        <div className={`p-4 rounded-xl border ${unimportedPayments.length > 0 ? 'bg-amber-950/20 border-amber-800/40' : 'bg-slate-950 border-slate-800'}`}>
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Pagamentos Pendentes Sinc.</span>
          <span className="text-2xl font-extrabold text-amber-400">{unimportedPayments.length}</span>
        </div>
      </div>

      {/* ALERT SECTION: DUPLICATE SUBSCRIPTIONS */}
      {duplicateAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-300">
                    Alerta Crítico: Assinatura Duplicada Detectada no Gateway Asaas
                  </h3>
                  <p className="text-xs text-rose-200/80 mt-1">
                    Foi identificado que a mesma cliente/loja possui mais de uma assinatura simultânea ativa gerando faturas recorrentes no Asaas.
                  </p>
                </div>

                {duplicateAlerts.map((alertItem: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/80 rounded-xl border border-rose-900/50 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-b border-slate-800/80 pb-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente</span>
                        <span className="text-slate-100 font-bold">{alertItem.customerName}</span>
                        <span className="text-[11px] text-slate-400 block">{alertItem.customerEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Loja Mimus</span>
                        <span className="text-slate-100 font-bold">{alertItem.storeName}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">{alertItem.storeId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">ID Cliente Asaas</span>
                        <span className="text-slate-200 font-mono font-semibold">{alertItem.customerId}</span>
                      </div>
                    </div>

                    {/* Comparison Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Canonical */}
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> CANÔNICA (RECOMENDADA)
                          </span>
                          <span className="text-xs font-extrabold text-slate-100">R$ {alertItem.canonical.value}/mês</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-slate-300 font-mono text-[11px]">ID: {alertItem.canonical.id}</p>
                          <p className="text-slate-400 text-[11px]">Criada em: {new Date(alertItem.canonical.dateCreated).toLocaleDateString('pt-BR')}</p>
                          <p className="text-emerald-400 font-bold text-[11px]">
                            ✓ {alertItem.canonical.confirmedPaymentsCount} Pagamento(s) Confirmado(s)
                          </p>
                        </div>
                      </div>

                      {/* Duplicate */}
                      {alertItem.duplicates.map((dup: any) => (
                        <div key={dup.id} className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" /> DUPLICADA (A CANCELAR)
                            </span>
                            <span className="text-xs font-extrabold text-slate-100">R$ {dup.value}/mês</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <p className="text-slate-300 font-mono text-[11px]">ID: {dup.id}</p>
                            <p className="text-slate-400 text-[11px]">Criada em: {new Date(dup.dateCreated).toLocaleDateString('pt-BR')}</p>
                            <p className="text-amber-400 font-semibold text-[11px]">
                              Cobranças pendentes geradas em duplicidade
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              onClick={() => handleCancelDuplicate(dup.id, alertItem.storeId)}
                              disabled={actionLoading}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              Cancelar Assinatura Duplicada no Asaas
                            </button>
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIMPORTED PAYMENTS TABLE */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Pagamentos Confirmados no Asaas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Faturas pagas no Asaas que compõem o MRR real do Mimus.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Loja Vinculada</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data Pagamento</th>
                <th className="px-4 py-3">Status Local</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.asaasSubscriptions?.flatMap((s: any) => 
                (s.payments || []).filter((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
              ).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 italic">
                    Nenhum pagamento confirmado registrado no histórico.
                  </td>
                </tr>
              )}

              {/* Lista dos pagamentos confirmados do Asaas */}
              {unimportedPayments.map((p: any) => (
                <tr key={p.paymentId} className="bg-amber-950/10 hover:bg-amber-950/20">
                  <td className="px-4 py-3 font-mono text-slate-200">{p.paymentId}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{p.subscriptionId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-100">{p.storeName}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400">R$ {Number(p.value).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-300">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pendente Importação
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
