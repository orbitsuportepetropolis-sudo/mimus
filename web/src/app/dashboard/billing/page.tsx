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
  AlertCircle
} from 'lucide-react'

export default function BillingPage() {
  const supabase = createClient()
  
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free')
  const [productCount, setProductCount] = useState(0)
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Checkout Modal States
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successUpgrade, setSuccessUpgrade] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)

  const pixKey = "00020126580014br.gov.bcb.pix0136mimuspay-39-prod-cosmetics-03125802BR5913Mimus SaaS6009Sao Paulo620705033906304CA38"

  useEffect(() => {
    loadBillingData()
  }, [])

  async function loadBillingData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setStoreId(profile.store_id)

        // Fetch store details (plan)
        const { data: store } = await supabase
          .from('stores')
          .select('plan')
          .eq('id', profile.store_id)
          .single()

        if (store) {
          setCurrentPlan(store.plan as 'free' | 'pro')
        }

        // Fetch products count
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        setProductCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Trigger Pix Payment Copy
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixKey)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  // Confirm Simulated Payment
  async function handleConfirmPayment() {
    setCheckoutLoading(true)
    
    // Simulate transaction clearing (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500))

    try {
      // Update database store plan to 'pro'
      const { error } = await supabase
        .from('stores')
        .update({ plan: 'pro' })
        .eq('id', storeId)

      if (error) throw error

      setSuccessUpgrade(true)
      setCurrentPlan('pro')
      
      // Page reload after 3 seconds to sync navigation headers
      setTimeout(() => {
        setCheckoutOpen(false)
        setSuccessUpgrade(false)
        window.location.reload()
      }, 3000)

    } catch (err) {
      alert('Erro ao processar upgrade. Tente novamente.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const productsPercentage = Math.min(100, (productCount / 50) * 100)

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

      {/* Plan Usage Card (for Free users) */}
      {currentPlan === 'free' && (
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
          currentPlan === 'free' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-zinc-850'
        }`}>
          {currentPlan === 'free' && (
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
          currentPlan === 'pro' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-zinc-850'
        }`}>
          {currentPlan === 'pro' && (
            <span className="absolute top-4 right-4 bg-rose-500 text-white font-extrabold text-[8px] tracking-wider uppercase px-2 py-1 rounded-full">
              Ativo
            </span>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plano Mimus Pro</h3>
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Para lojas físicas e online escalarem sem restrições ou limites.</p>
            <div className="flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">R$ 39</span>
              <span className="text-xs text-slate-400 ml-1">/mês</span>
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

          {currentPlan === 'free' && (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
            >
              Assinar Plano Pro R$ 39/mês
            </button>
          )}
        </div>

      </div>

      {/* Checkout Modal Dialog */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Assinatura Mimus Pro</h3>
              <button 
                onClick={() => !checkoutLoading && setCheckoutOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
                disabled={checkoutLoading}
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            {successUpgrade ? (
              <div className="space-y-4 py-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-850 dark:text-white">Assinatura Ativada!</h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Parabéns! Sua loja agora é Pro. Atualizando a plataforma...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500 leading-normal">
                  Pague o valor de <span className="font-bold text-slate-800 dark:text-white">R$ 39,00</span> via PIX para liberar o acesso instantâneo ao plano Pro.
                </p>

                {/* Simulated QR Code (SVG styled) */}
                <div className="bg-slate-100 dark:bg-zinc-950 p-6 rounded-xl flex items-center justify-center w-40 h-40 mx-auto border border-slate-200/50 dark:border-zinc-900">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-rose-600 fill-current">
                    <rect x="0" y="0" width="100" height="100" fill="transparent" />
                    {/* QR Code pattern cubes */}
                    <rect x="10" y="10" width="25" height="25" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" />
                    
                    <rect x="65" y="10" width="25" height="25" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" />

                    <rect x="10" y="65" width="25" height="25" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" />
                    
                    <rect x="45" y="45" width="10" height="10" />
                    <rect x="50" y="10" width="5" height="15" />
                    <rect x="40" y="25" width="10" height="5" />
                    <rect x="65" y="45" width="15" height="5" />
                    <rect x="45" y="65" width="5" height="20" />
                    <rect x="75" y="70" width="15" height="15" />
                  </svg>
                </div>

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

                <button
                  onClick={handleConfirmPayment}
                  disabled={checkoutLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verificando pagamento...
                    </>
                  ) : (
                    'Confirmar Pagamento PIX'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
