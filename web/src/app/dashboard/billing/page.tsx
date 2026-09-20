'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  QrCode, 
  Copy, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Calendar,
  Clock,
  HelpCircle,
  ExternalLink,
  Smartphone,
  Gift,
  AlertTriangle,
  XCircle,
  RotateCcw
} from 'lucide-react'
import { hasProAccess, SubscriptionStatus } from '@/lib/permissions'

interface SubscriptionPayment {
  id: string
  amount: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
}

export default function BillingPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeEmail, setStoreEmail] = useState('')
  const [storeNameStr, setStoreNameStr] = useState('')

  // Subscription state
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free')
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('TRIAL')
  const [subAmount, setSubAmount] = useState<number>(0)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null)
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])

  // Usage state
  const [productCount, setProductCount] = useState(0)

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copiedPix, setCopiedPix] = useState(false)

  // Credit card inputs
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  // Checkout response
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'payment_details' | 'success'>('form')
  const [pixCopyPaste, setPixCopyPaste] = useState('')
  const [pixQrCode, setPixQrCode] = useState('')

  useEffect(() => {
    loadBillingData()
  }, [])

  // Poll payment status if awaiting payment details
  useEffect(() => {
    let interval: any
    if (checkoutOpen && checkoutStep === 'payment_details' && storeId) {
      interval = setInterval(async () => {
        try {
          // Check subscriptions
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('status, plan_id')
            .eq('store_id', storeId)
            .maybeSingle()

          if (sub && sub.status === 'ACTIVE') {
            clearInterval(interval)
            setCheckoutStep('success')
            setCurrentPlan('pro')
            setSubStatus('ACTIVE')
            setTimeout(() => {
              setCheckoutOpen(false)
              setCheckoutStep('form')
              window.location.reload()
            }, 3000)
          }
        } catch (e) {
          console.error('Error polling payment status:', e)
        }
      }, 4000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [checkoutOpen, checkoutStep, storeId])

  async function loadBillingData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setStoreEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id, name')
        .eq('id', user.id)
        .single()

      if (profile && profile.store_id) {
        setStoreId(profile.store_id)
        setStoreNameStr(profile.name || 'Lojista')

        // 1. Tenta carregar da tabela subscriptions (Fonte Única da Verdade)
        let foundSub = false
        try {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('store_id', profile.store_id)
            .maybeSingle()

          if (sub) {
            foundSub = true
            setCurrentPlan(sub.plan_id === 'pro' ? 'pro' : 'free')
            setSubStatus(sub.status as SubscriptionStatus)
            setSubAmount(Number(sub.amount) || 0)
            setTrialEndsAt(sub.trial_ends_at)
            setSubscriptionEndsAt(sub.current_period_end || sub.next_billing_at)
          }
        } catch (subErr) {
          console.warn('Subscriptions table query:', subErr)
        }

        // 2. Fallback caso subscriptions ainda não esteja povoada
        if (!foundSub) {
          const { data: store } = await supabase
            .from('stores')
            .select('plan, plan_status, trial_ends_at, subscription_ends_at')
            .eq('id', profile.store_id)
            .single()

          if (store) {
            setCurrentPlan(store.plan as 'free' | 'pro')
            const rawStatus = (store.plan_status || 'trial').toUpperCase()
            setSubStatus(rawStatus === 'ACTIVE' ? 'ACTIVE' : (rawStatus === 'TRIAL_CUSTOM' ? 'TRIAL' : rawStatus as SubscriptionStatus))
            setTrialEndsAt(store.trial_ends_at)
            setSubscriptionEndsAt(store.subscription_ends_at)
          }
        }

        // 3. Carregar histórico de pagamentos
        try {
          const { data: payList } = await supabase
            .from('subscription_payments')
            .select('id, amount, status, due_date, paid_at, created_at')
            .eq('store_id', profile.store_id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (payList) {
            setPayments(payList)
          }
        } catch (payErr) {
          console.warn('Payments table query:', payErr)
        }

        // 4. Quantidade de produtos para limites do Free
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', profile.store_id)

        setProductCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Dias restantes de trial
  const getTrialDaysLeft = () => {
    if (!trialEndsAt) return 0
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCopyPaste)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setCheckoutLoading(true)
    setFormError(null)

    try {
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
      if (cleanCpfCnpj.length < 11) {
        throw new Error('Por favor, informe um CPF ou CNPJ válido.')
      }

      const checkoutPayload: any = {
        storeId,
        email: storeEmail,
        name: storeNameStr,
        paymentMethod,
        cpfCnpj: cleanCpfCnpj,
        phone
      }

      if (paymentMethod === 'CREDIT_CARD') {
        if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv) {
          throw new Error('Por favor, preencha todos os dados do cartão de crédito.')
        }
        const expiryParts = cardExpiry.split('/')
        checkoutPayload.creditCard = {
          holderName: cardHolder,
          number: cardNumber.replace(/\s+/g, ''),
          expiryMonth: expiryParts[0]?.trim() || '',
          expiryYear: expiryParts[1]?.trim() || '',
          ccv: cardCvv
        }
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      })

      const res = await response.json()
      if (!response.ok) {
        throw new Error(res.error || 'Erro ao processar assinatura.')
      }

      if (paymentMethod === 'PIX') {
        setPixCopyPaste(res.pixCopyPaste)
        setPixQrCode(res.pixQrCodeBase64)
        setCheckoutStep('payment_details')
      } else {
        setCheckoutStep('success')
        setCurrentPlan('pro')
        setSubStatus('ACTIVE')
        setTimeout(() => {
          setCheckoutOpen(false)
          setCheckoutStep('form')
          window.location.reload()
        }, 3500)
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao realizar checkout.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const isPro = hasProAccess({ plan: currentPlan, status: subStatus, trial_ends_at: trialEndsAt })
  const isTrial = subStatus === 'TRIAL'
  const isCourtesy = subStatus === 'COURTESY'
  const isPastDue = subStatus === 'PAST_DUE'
  const isCanceled = subStatus === 'CANCELED'
  const isExpired = subStatus === 'EXPIRED'
  const isFree = subStatus === 'FREE' && !isTrial

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-rose-500" /> Plano & Assinatura
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Gerencie a assinatura da sua loja, consulte faturas e desbloqueie recursos ilimitados.
        </p>
      </div>

      {/* BANNER 1: ALERTA DE PAGAMENTO ATRASADO (PAST_DUE) */}
      {isPastDue && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/50 p-6 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Pagamento Pendente</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                Não identificamos a compensação da sua última mensalidade. Regularize seu pagamento para evitar a restrição dos recursos Pro.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCheckoutOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex-shrink-0"
          >
            Regularizar Pagamento
          </button>
        </div>
      )}

      {/* BANNER 2: TRIAL ATIVO */}
      {isTrial && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-900 p-6 rounded-2xl border border-rose-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Período de Teste Grátis</h4>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">TRIAL</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-zinc-400 mt-1">
                Seu teste termina em <strong className="text-rose-600">{getTrialDaysLeft()} dias</strong>
                {trialEndsAt && ` (em ${new Date(trialEndsAt).toLocaleDateString('pt-BR')})`}.
                Aproveite todos os recursos Pro liberados sem limites.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCheckoutOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex-shrink-0"
          >
            Ativar Plano Pro
          </button>
        </div>
      )}

      {/* BANNER 3: CORTESIA ADMINISTRATIVA */}
      {isCourtesy && (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 p-6 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">Acesso Pro por Cortesia</h4>
                <span className="bg-purple-200 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">COURTESY</span>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300/80 mt-0.5">
                Sua loja recebeu acesso completo e irrestrito ao Plano Pro como benefício especial da equipe Mimus.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">R$ 0,00/mês</span>
        </div>
      )}

      {/* BANNER 4: ASSINATURA PAGA ATIVA */}
      {subStatus === 'ACTIVE' && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-900 p-6 rounded-2xl border border-emerald-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Assinatura Mimus Pro Ativa</h4>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-zinc-400 mt-1">
                {subscriptionEndsAt ? (
                  <>Próxima renovação em: <strong className="text-emerald-600 dark:text-emerald-400">{new Date(subscriptionEndsAt).toLocaleDateString('pt-BR')}</strong>.</>
                ) : (
                  <>Sua assinatura está ativa e em dia.</>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">R$ 49,00/mês</div>
          </div>
        </div>
      )}

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Free Plan */}
        <div className={`bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm relative flex flex-col justify-between ${
          isFree ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-zinc-800'
        }`}>
          {isFree && (
            <span className="absolute top-4 right-4 bg-slate-700 text-white font-extrabold text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full">
              Plano Atual
            </span>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plano Mimus Free</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Para quem está iniciando as vendas.</p>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">R$ 0</span>
              <span className="text-xs text-slate-400 ml-1">/sempre grátis</span>
            </div>
            <div className="h-px bg-slate-50 dark:bg-zinc-800 my-4" />
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Limite de até 10 produtos ({productCount}/10 cadastrados)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 1 usuário administrador</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Vitrine virtual pública</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Controle de vendas básico</li>
            </ul>
          </div>
        </div>

        {/* Card 2: Pro Plan */}
        <div className={`bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm relative flex flex-col justify-between ${
          isPro ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-zinc-800'
        }`}>
          {isPro && (
            <span className="absolute top-4 right-4 bg-rose-500 text-white font-extrabold text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full">
              Ativo
            </span>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plano Mimus Pro</h3>
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Acesso completo para escalar sua loja sem limites.</p>
            <div className="space-y-1">
              <div className="flex items-baseline">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white">R$ 49,00</span>
                <span className="text-xs text-slate-400 ml-1">/mês</span>
              </div>
              <p className="text-[10px] text-slate-400">Assinatura mensal recorrente, sem taxa de adesão ou fidelidade.</p>
            </div>
            <div className="h-px bg-slate-50 dark:bg-zinc-800 my-4" />
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
              <li className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400"><Check className="w-4 h-4 text-rose-500 flex-shrink-0" /> Produtos e fotos ilimitados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Usuários e equipe ilimitados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Domínio personalizado próprio</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Integração com Loja Integrada e gateways</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Relatórios financeiros avançados</li>
            </ul>
          </div>

          {!isPro && (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
            >
              Assinar Plano Pro
            </button>
          )}
        </div>

      </div>

      {/* Histórico de Faturas / Pagamentos */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" /> Histórico de Pagamentos de Assinatura
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400">
                  <th className="py-2">Data</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
                {payments.map(p => (
                  <tr key={p.id} className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : (p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '-')}
                    </td>
                    <td className="py-3 font-semibold">
                      {Number(p.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status === 'confirmed' ? 'Confirmado' : p.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      Recibo Digital
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-zinc-800 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Assinar Mimus Pro</h3>
              <button 
                onClick={() => setCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            {checkoutStep === 'form' && (
              <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-300">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'PIX'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-600 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <QrCode className="w-4 h-4" /> PIX Instantâneo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-600 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Cartão de Crédito
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-300">CPF ou CNPJ do Titular *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-300">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(24) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                  />
                </div>

                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-zinc-300">Nome Impresso no Cartão *</label>
                      <input
                        type="text"
                        required
                        placeholder="NOME COMO NO CARTAO"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 dark:text-zinc-300">Número do Cartão *</label>
                      <input
                        type="text"
                        required
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-600 dark:text-zinc-300">Validade (MM/AA) *</label>
                        <input
                          type="text"
                          required
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 dark:text-zinc-300">CVV *</label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Assinatura (R$ 49/mês)'}
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === 'payment_details' && (
              <div className="space-y-4 text-center">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Escaneie o QR Code PIX</h4>
                {pixQrCode && (
                  <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-100 w-48 h-48 mx-auto">
                    <img src={pixQrCode} alt="PIX QR Code" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    onClick={copyPixCode}
                    className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
                  >
                    {copiedPix ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copiedPix ? 'Código PIX Copiado!' : 'Copiar Código Copia e Cola'}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Aguardando confirmação do banco...
                </div>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Assinatura Confirmada!</h4>
                <p className="text-xs text-slate-500">Sua loja já foi atualizada para o Plano Pro. Aproveite!</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
