'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  QrCode, 
  Copy,
  AlertCircle,
  Calendar,
  X,
  Smartphone,
  Lock
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  created_at: string
}

export default function BillingPage() {
  const supabase = createClient()
  
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free')
  const [planStatus, setPlanStatus] = useState<string>('trial')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null)
  const [promotionalEndsAt, setPromotionalEndsAt] = useState<string | null>(null)
  
  const [productCount, setProductCount] = useState(0)
  const [storeId, setStoreId] = useState('')
  const [storeEmail, setStoreEmail] = useState('')
  const [storeNameStr, setStoreNameStr] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Checkout Modal States
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form Fields
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [usePromo, setUsePromo] = useState(false)
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [phone, setPhone] = useState('')
  
  // Credit Card Form
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('') // MM/YY
  const [cardCvv, setCardCvv] = useState('')

  // Checkout results
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'payment_details' | 'success'>('form')
  const [pixCopyPaste, setPixCopyPaste] = useState('')
  const [pixQrCode, setPixQrCode] = useState('')

  useEffect(() => {
    loadBillingData()
  }, [])

  // Poll payment status automatically in the background
  useEffect(() => {
    let interval: any
    if (checkoutOpen && checkoutStep === 'payment_details' && storeId) {
      interval = setInterval(async () => {
        try {
          const { data: store } = await supabase
            .from('stores')
            .select('plan, plan_status')
            .eq('id', storeId)
            .single()

          if (store && store.plan_status === 'active') {
            clearInterval(interval)
            setCheckoutStep('success')
            setCurrentPlan('pro')
            setPlanStatus('active')
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

      if (profile) {
        setStoreId(profile.store_id)
        setStoreNameStr(profile.name || 'Lojista')

        // Fetch store details (plan)
        const { data: store } = await supabase
          .from('stores')
          .select('plan, plan_status, trial_ends_at, promotional_ends_at, subscription_ends_at')
          .eq('id', profile.store_id)
          .single()

        if (store) {
          setCurrentPlan(store.plan as 'free' | 'pro')
          setPlanStatus(store.plan_status || 'trial')
          setTrialEndsAt(store.trial_ends_at)
          setSubscriptionEndsAt(store.subscription_ends_at)
          setPromotionalEndsAt(store.promotional_ends_at)
        }

        // Fetch products count
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

  // Calculate remaining trial days
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

  // Submit Asaas subscription request
  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setCheckoutLoading(true)
    setFormError(null)

    try {
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
      if (cleanCpfCnpj.length < 11) {
        throw new Error('Por favor, informe um CPF/CNPJ válido.')
      }

      const expiryParts = cardExpiry.split('/')
      const expiryMonth = expiryParts[0]?.trim() || ''
      const expiryYear = expiryParts[1]?.trim() ? expiryParts[1].trim() : ''

      const checkoutPayload: any = {
        storeId,
        email: storeEmail,
        name: storeNameStr,
        paymentMethod,
        cpfCnpj: cleanCpfCnpj,
        phone,
        usePromo
      }

      if (paymentMethod === 'CREDIT_CARD') {
        if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv) {
          throw new Error('Por favor, preencha todos os dados do cartão de crédito.')
        }
        checkoutPayload.creditCard = {
          holderName: cardHolder,
          number: cardNumber.replace(/\s+/g, ''),
          expiryMonth,
          expiryYear,
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
        throw new Error(res.error || 'Erro ao processar checkout.')
      }

      if (paymentMethod === 'PIX') {
        setPixCopyPaste(res.pixCopyPaste)
        setPixQrCode(res.pixQrCodeBase64)
        setCheckoutStep('payment_details')
      } else {
        setCheckoutStep('success')
        setCurrentPlan('pro')
        setPlanStatus('active')
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

  // Verifies the payment status in Supabase database (after MP Webhook confirmation)
  async function handleVerifyPayment() {
    setCheckoutLoading(true)
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('plan, plan_status')
        .eq('id', storeId)
        .single()

      if (store && store.plan_status === 'active') {
        setCheckoutStep('success')
        setCurrentPlan('pro')
        setPlanStatus('active')
        setCheckoutLoading(false)
        setTimeout(() => {
          setCheckoutOpen(false)
          setCheckoutStep('form')
          window.location.reload()
        }, 3000)
      } else {
        alert('Pagamento ainda não compensado. Se você já pagou, aguarde alguns segundos e clique novamente.')
      }
    } catch (err: any) {
      alert('Erro ao verificar pagamento: ' + err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const productsPercentage = Math.min(100, (productCount / 50) * 100)
  const isTrialActive = planStatus === 'trial' && getTrialDaysLeft() > 0
  const price = 49.00

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
          <CreditCard className="w-6 h-6 text-rose-500" /> Gerenciamento de Plano e Assinatura
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Controle sua mensalidade, verifique seus limites de uso e faça o upgrade da sua conta.
        </p>
      </div>

      {/* Trial Countdown Card */}
      {isTrialActive && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-900 p-6 rounded-2xl border border-rose-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Período de Teste Grátis Ativo</h4>
              <p className="text-[10px] text-slate-550 dark:text-zinc-400 mt-0.5">Sua loja possui acesso total sem limites por mais <span className="font-bold text-rose-600">{getTrialDaysLeft()} dias</span>.</p>
            </div>
          </div>
          <button 
            onClick={() => setCheckoutOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/10"
          >
            Ativar Plano Pro
          </button>
        </div>
      )}

      {/* Pro Active Subscription Status Card */}
      {currentPlan === 'pro' && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-900 p-6 rounded-2xl border border-emerald-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-505 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Assinatura Mimus Pro Ativa</h4>
              <p className="text-[10px] text-slate-550 dark:text-zinc-400 mt-0.5">
                {subscriptionEndsAt ? (
                  <>Sua conta está ativa e segura. Próximo vencimento em: <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(subscriptionEndsAt).toLocaleDateString('pt-BR')}</span>.</>
                ) : (
                  <>Sua conta está ativa e segura no Plano Pro.</>
                )}
              </p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-xl border border-emerald-500/20">
            Assinatura Ativa
          </span>
        </div>
      )}

      {/* Plan Usage Card (for Free users without active trial) */}
      {!isTrialActive && currentPlan === 'free' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-300">Uso do Plano Free (Limite de Cadastro)</span>
            <span className="font-bold text-rose-600">{productCount} / 50 Produtos</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-950 h-3 rounded-full overflow-hidden">
            <div 
              style={{ width: `${productsPercentage}%` }} 
              className="bg-gradient-to-r from-rose-500 to-pink-600 h-full rounded-full transition-all duration-500"
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
            No plano gratuito, você pode cadastrar até 50 produtos. Faça o upgrade para o Pro para cadastrar produtos ilimitados, liberar acesso para sua equipe e sincronizar com lojas online.
          </p>
        </div>
      )}

      {/* Active Sub Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Free Plan */}
        <div className={`bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm relative flex flex-col justify-between ${
          currentPlan === 'free' && !isTrialActive ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-zinc-850'
        }`}>
          {currentPlan === 'free' && !isTrialActive && (
            <span className="absolute top-4 right-4 bg-rose-500 text-white font-extrabold text-[8px] tracking-wider uppercase px-2 py-1 rounded-full">
              Ativo
            </span>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plano Mimus Free</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Para quem está começando a vender e testando a operação.</p>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">R$ 0</span>
              <span className="text-xs text-slate-400 ml-1">/sempre grátis</span>
            </div>
            <div className="h-px bg-slate-50 dark:bg-zinc-800 my-4" />
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Limite de 50 produtos</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 1 usuário (Admin)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Controle de vendas básico (PDV)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Fluxo de caixa básico</li>
            </ul>
          </div>
        </div>

        {/* Card 2: Pro Plan */}
        <div className={`bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm relative flex flex-col justify-between ${
          currentPlan === 'pro' || isTrialActive ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-zinc-850'
        }`}>
          {(currentPlan === 'pro' && (planStatus === 'active' || planStatus === 'pro')) && (
            <span className="absolute top-4 right-4 bg-rose-500 text-white font-extrabold text-[8px] tracking-wider uppercase px-2 py-1 rounded-full">
              Ativo
            </span>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plano Mimus Pro</h3>
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Para lojas físicas e online escalarem sem restrições ou limites.</p>
            <div className="space-y-1">
              <div className="flex items-baseline">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white">R$ 49,00</span>
                <span className="text-xs text-slate-400 ml-1">/mês</span>
              </div>
              <p className="text-[10px] text-slate-400">Acesso completo e ilimitado a todos os recursos da plataforma.</p>
              {currentPlan === 'pro' && subscriptionEndsAt && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Vence em: {new Date(subscriptionEndsAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <div className="h-px bg-slate-50 dark:bg-zinc-800 my-4" />
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
              <li className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400"><Check className="w-4 h-4 text-rose-500 flex-shrink-0" /> Produtos cadastrados ilimitados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Operadoras e equipe ilimitadas</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Integração com Loja Integrada (e futuras)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Relatórios de margem e faturamento</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Suporte humanizado prioritário</li>
            </ul>
          </div>

          {(currentPlan === 'free' && !isTrialActive) && (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
            >
              Assinar Plano Pro
            </button>
          )}
        </div>

      </div>

      {/* Sync tip */}
      <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 flex gap-3 text-xs leading-relaxed text-slate-555 dark:text-zinc-400">
        <Smartphone className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Sincronização com o Mobile (Google Play Billing)</strong>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Se você fez a assinatura diretamente pelo aplicativo utilizando as compras integradas da Google Play Store, sua conta é atualizada instantaneamente nos dois dispositivos.</p>
        </div>
      </div>

      {/* Checkout Modal Dialog */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto relative">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-rose-500" /> Assinatura Mimus Pro
              </h3>
              <button 
                onClick={() => !checkoutLoading && setCheckoutOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
                disabled={checkoutLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            {/* STEP 1: FORM INPUTS */}
            {checkoutStep === 'form' && (
              <form onSubmit={handleCheckout} className="space-y-4 text-xs font-semibold">
                
                {/* Plan Info */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-850/60 flex justify-between items-center h-12">
                  <span className="font-extrabold text-slate-800 dark:text-white text-xs">Plano Mimus Pro</span>
                  <span className="font-black text-rose-600 text-sm">R$ 49,00/mês</span>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-slate-400 dark:text-zinc-500">Forma de Pagamento (Mercado Pago):</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`py-2.5 rounded-xl border font-bold transition-all text-center ${
                        paymentMethod === 'PIX'
                          ? 'border-rose-500 bg-rose-50/10 text-rose-600 ring-2 ring-rose-500/10'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                      }`}
                    >
                      PIX (Instantâneo)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`py-2.5 rounded-xl border font-bold transition-all text-center ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-rose-500 bg-rose-50/10 text-rose-600 ring-2 ring-rose-500/10'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                      }`}
                    >
                      Cartão de Crédito
                    </button>
                  </div>
                </div>

                {/* Billing fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 dark:text-zinc-500 mb-1">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      required
                      placeholder="Apenas números"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-400 dark:text-zinc-500 mb-1">Celular / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(00) 90000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Credit Card Inputs */}
                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-3.5 space-y-3">
                    <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Informações do Cartão
                    </h4>

                    <div>
                      <label className="block text-slate-400 dark:text-zinc-500 mb-1">Titular do Cartão (como no cartão)</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do titular"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 dark:text-zinc-500 mb-1">Número do Cartão</label>
                      <input
                        type="text"
                        required
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 dark:text-zinc-500 mb-1">Validade (MM/AA)</label>
                        <input
                          type="text"
                          required
                          placeholder="12/29"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 dark:text-zinc-500 mb-1">CVV (Código)</label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-transform"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    `Assinar Plano Pro - R$ ${price.toFixed(2)}/mês`
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: PIX QR CODE & DETAILS */}
            {checkoutStep === 'payment_details' && (
              <div className="space-y-4 text-center text-xs">
                <p className="text-slate-500 leading-normal">
                  Escaneie o QR Code abaixo ou copie a chave Pix para ativar sua assinatura.
                </p>

                {pixQrCode && (
                  <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center justify-center w-44 h-44 mx-auto">
                    <img src={pixQrCode} alt="PIX Qr Code" className="w-full h-full object-contain" />
                  </div>
                )}

                <button
                  onClick={copyPixCode}
                  type="button"
                  className="mx-auto flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  {copiedPix ? 'Copiado!' : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Código PIX
                    </>
                  )}
                </button>

                <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex flex-col gap-2">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={checkoutLoading}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-all"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                      </>
                    ) : (
                      'Verificar Pagamento'
                    )}
                  </button>

                  <button
                    onClick={() => { setCheckoutStep('form'); }}
                    className="text-[10px] text-slate-450 hover:underline"
                  >
                    Voltar e alterar dados
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {checkoutStep === 'success' && (
              <div className="space-y-4 py-8 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-850 dark:text-white text-sm">Assinatura Mimus Pro Ativa!</h4>
                  <p className="text-xs text-slate-450 dark:text-zinc-550 mt-1">Parabéns! Sua loja foi promovida ao plano Pro com sucesso. Sincronizando dados...</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
