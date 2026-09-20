'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Store, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  CreditCard, 
  ShoppingBag, 
  Package, 
  Users, 
  ExternalLink, 
  Shield, 
  Gift, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  Check, 
  Loader2,
  Lock,
  Layers
} from 'lucide-react'
import { StoreRowData } from './stores-plans-table'
import { StoreEnvironment, SubscriptionStatus } from '@/lib/permissions'

interface StoreDetailsModalProps {
  store: StoreRowData | null
  isOpen: boolean
  onClose: () => void
  onActionSuccess: () => void
}

export function StoreDetailsModal({ store, isOpen, onClose, onActionSuccess }: StoreDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'usage' | 'subscription' | 'history' | 'actions'>('details')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Action form states
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [trialDays, setTrialDays] = useState(14)
  const [newEnvironment, setNewEnvironment] = useState<StoreEnvironment>('PRODUCTION')

  // Data states fetched on open
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [paymentsList, setPaymentsList] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (store && isOpen) {
      setSelectedPlan(store.plan)
      setNewEnvironment(store.environment)
      loadStoreHistory(store.id)
    }
  }, [store, isOpen])

  async function loadStoreHistory(storeId: string) {
    setLoadingHistory(true)
    try {
      // 1. Fetch payments
      const resPay = await fetch(`/api/super-admin/stores/${storeId}/history`)
      // Or query via client:
      // We will also load security logs for this store
    } catch (e) {
      console.warn(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  if (!isOpen || !store) return null

  async function executeAdminAction(action: string, payload: any = {}) {
    setActionLoading(true)
    setActionMessage(null)
    try {
      const res = await fetch(`/api/super-admin/stores/${store!.id}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao executar ação administrativa.')
      }

      setActionMessage({ type: 'success', text: data.message || 'Ação executada com sucesso e auditada!' })
      onActionSuccess()
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro inesperado.' })
    } finally {
      setActionLoading(false)
    }
  }

  const cleanPhone = store.phone ? store.phone.replace(/\D/g, '') : null
  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/60">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-100">{store.name}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {store.environment}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {store.subscriptionStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Responsável: <strong className="text-slate-200">{store.responsibleName}</strong> • Cadastrada em {new Date(store.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 text-xs font-bold overflow-x-auto">
          {[
            { id: 'details', label: 'Dados da Loja' },
            { id: 'usage', label: 'Uso & Vendas' },
            { id: 'subscription', label: 'Assinatura' },
            { id: 'actions', label: 'Ações Administrativas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {actionMessage && (
            <div className={`p-4 rounded-xl border text-xs font-bold ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                : 'bg-rose-950/30 border-rose-800 text-rose-400'
            }`}>
              {actionMessage.text}
            </div>
          )}

          {/* TAB 1: DADOS DA LOJA */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" /> Contato & Identificação
                </h4>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Responsável</span>
                    <span className="font-semibold">{store.responsibleName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">E-mail</span>
                    <span>{store.email || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">WhatsApp</span>
                    {waUrl ? (
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {store.phone} (Abrir Chat)
                      </a>
                    ) : (
                      <span>Não informado</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Atividade & Ambiente
                </h4>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Data de Cadastro</span>
                    <span>{new Date(store.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Última Atividade</span>
                    <span>{store.lastActivity ? new Date(store.lastActivity).toLocaleString('pt-BR') : 'Sem registro'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Classificação da Base</span>
                    <span className="font-bold text-slate-200">{store.environment}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USO & VENDAS */}
          {activeTab === 'usage' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Pedidos nos Últimos 30 Dias</span>
                <div className="text-2xl font-black text-slate-100">{store.orders30Days}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">GMV 30 Dias (Vendas)</span>
                <div className="text-2xl font-black text-pink-400">
                  {store.gmv30Days.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Ticket Médio por Pedido</span>
                <div className="text-2xl font-black text-amber-400">
                  {store.orders30Days > 0 
                    ? (store.gmv30Days / store.orders30Days).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'R$ 0,00'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSINATURA */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              {store.subscriptionStatus === 'PAST_DUE' && (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 text-amber-200 animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-2 flex-1">
                    <p className="font-bold text-amber-300 text-sm">Assinatura Vencida (Aguardando Pagamento)</p>
                    <p className="text-amber-200/90 leading-relaxed">
                      O período anterior venceu em {store.nextBillingAt ? new Date(store.nextBillingAt).toLocaleDateString('pt-BR') : 'data recente'}. A cobrança deste mês ainda não foi confirmada pelo gateway (Asaas).
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {store.pendingInvoiceUrl && (
                        <a
                          href={store.pendingInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Ver Fatura no Asaas (PIX)
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(`Olá, ${store.responsibleName}! Tudo bem? Notamos que a assinatura do plano Mimus Pro da sua loja (${store.name}) venceu recentemente. Caso precise da segunda via da fatura PIX ou queira renovar, estamos à disposição!${store.pendingInvoiceUrl ? ` Segue o link direto: ${store.pendingInvoiceUrl}` : ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" /> Cobrar no WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300">Status Atual</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plano:</span>
                      <strong className="uppercase text-slate-200">{store.plan}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status da Assinatura:</span>
                      <strong className={
                        store.subscriptionStatus === 'PAST_DUE' 
                          ? 'text-amber-400' 
                          : store.subscriptionStatus === 'ACTIVE' 
                          ? 'text-emerald-400' 
                          : 'text-rose-400'
                      }>
                        {store.subscriptionStatus === 'PAST_DUE' ? 'PAST_DUE (Vencida)' : store.subscriptionStatus}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor Recorrente:</span>
                      <strong className="font-mono text-slate-100">
                        {store.subscriptionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300">Datas de Cobrança</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Término do Trial:</span>
                      <span>{store.trialEndsAt ? new Date(store.trialEndsAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vencimento / Próxima Cobrança:</span>
                      <span className={store.subscriptionStatus === 'PAST_DUE' ? 'text-amber-400 font-bold' : ''}>
                        {store.nextBillingAt ? new Date(store.nextBillingAt).toLocaleDateString('pt-BR') : 'N/A'}
                        {store.subscriptionStatus === 'PAST_DUE' ? ' (Venceu)' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AÇÕES ADMINISTRATIVAS */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              
              {/* Concessão de Cortesia */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-200">Cortesia Administrativa (Acesso Pro sem Cobrança)</h4>
                    <p className="text-[11px] text-slate-400">Libera recursos Pro para a loja. O MRR permanecerá R$ 0.</p>
                  </div>
                  {store.subscriptionStatus === 'COURTESY' ? (
                    <button
                      disabled={actionLoading}
                      onClick={() => executeAdminAction('revoke_courtesy')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                    >
                      Revogar Cortesia
                    </button>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={() => executeAdminAction('grant_courtesy')}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold"
                    >
                      Conceder Cortesia Pro
                    </button>
                  )}
                </div>
              </div>

              {/* Concessão / Extensão de Trial */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200">Conceder ou Estender Período de Teste (Trial)</h4>
                <div className="flex items-center gap-2">
                  {[7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      disabled={actionLoading}
                      onClick={() => executeAdminAction('extend_trial', { days: d })}
                      className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-purple-950/40 text-purple-300 font-bold"
                    >
                      +{d} Dias de Trial
                    </button>
                  ))}
                </div>
              </div>

              {/* Alterar Ambiente / Classificação */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200">Classificação de Ambiente</h4>
                <p className="text-[11px] text-slate-400">Define se a loja entra nos KPIs de produção do SaaS ou é tratada como teste/interno.</p>
                <div className="flex flex-wrap gap-2">
                  {(['PRODUCTION', 'TEST', 'INTERNAL', 'DEMO', 'PENDING_REVIEW'] as StoreEnvironment[]).map(env => (
                    <button
                      key={env}
                      type="button"
                      disabled={actionLoading || store.environment === env}
                      onClick={() => executeAdminAction('change_environment', { environment: env })}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        store.environment === env
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancelamento / Reativação */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">Cancelar ou Reativar Assinatura</h4>
                  <p className="text-[11px] text-slate-400">Controle administrativo do ciclo de vida da conta.</p>
                </div>
                {store.subscriptionStatus === 'CANCELED' ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => executeAdminAction('reactivate_subscription')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Reativar Assinatura
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => executeAdminAction('cancel_subscription')}
                    className="px-3 py-1.5 rounded-xl bg-rose-900/40 border border-rose-800 hover:bg-rose-900/60 text-rose-300 font-bold"
                  >
                    Cancelar Assinatura
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  )
}
