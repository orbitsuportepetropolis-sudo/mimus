'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  Package,
  Globe,
  Share2,
  ArrowRight,
  Loader2,
  Check,
  Plus,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Copy,
  CheckCircle2,
  X,
} from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Store data
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState<string | null>(null)

  // Mission 1: Products
  const [productCount, setProductCount] = useState(0)
  const PRODUCTS_GOAL = 5
  const mission1Done = productCount >= PRODUCTS_GOAL

  // Product quick-add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [prodName, setProdName] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodQty, setProdQty] = useState('10')
  const [addingProduct, setAddingProduct] = useState(false)
  const prodNameRef = useRef<HTMLInputElement>(null)

  // Mission 2: Vitrine published
  const [vitrineOpened, setVitrineOpened] = useState(false)
  const mission2Done = vitrineOpened

  // Mission 3: Shared
  const [shared, setShared] = useState(false)
  const [copied, setCopied] = useState(false)
  const mission3Done = shared

  const allDone = mission1Done && mission2Done && mission3Done

  // Load store on mount
  useEffect(() => {
    async function loadStore() {
      setInitialLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id')
          .eq('id', user.id)
          .single()

        if (!profile?.store_id) return

        setStoreId(profile.store_id)

        const { data: store } = await supabase
          .from('stores')
          .select('name, custom_domain')
          .eq('id', profile.store_id)
          .single()

        if (store?.name) setStoreName(store.name)
        if (store?.custom_domain) setStoreSlug(store.custom_domain)

        // Count existing products
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', profile.store_id)

        setProductCount(count || 0)

        // Restore mission progress from localStorage
        const ls = localStorage.getItem(`mimus_onboarding_missions_${profile.store_id}`)
        if (ls) {
          const saved = JSON.parse(ls)
          if (saved.vitrineOpened) setVitrineOpened(true)
          if (saved.shared) setShared(true)
          if (saved.step) setStep(saved.step)
        }
      } finally {
        setInitialLoading(false)
      }
    }
    loadStore()
  }, [supabase, router])

  // Persist mission state
  useEffect(() => {
    if (!storeId) return
    localStorage.setItem(`mimus_onboarding_missions_${storeId}`, JSON.stringify({
      vitrineOpened,
      shared,
      step,
    }))
  }, [storeId, vitrineOpened, shared, step])

  // Quick-add product handler
  async function handleAddProduct() {
    if (!prodName.trim() || !storeId) return
    setAddingProduct(true)
    try {
      const price = parseFloat(prodPrice) || 0
      const qty = parseInt(prodQty) || 10

      const { error } = await supabase
        .from('products')
        .insert([{
          store_id: storeId,
          name: prodName.trim(),
          sale_price: price,
          cost_price: price > 0 ? Math.round(price * 0.5 * 100) / 100 : 0,
          quantity_in_stock: qty,
          brand: '',
        }])

      if (error) throw error

      setProductCount(c => c + 1)
      setProdName('')
      setProdPrice('')
      setProdQty('10')
      prodNameRef.current?.focus()
    } catch {
      alert('Erro ao cadastrar produto. Tente novamente.')
    } finally {
      setAddingProduct(false)
    }
  }

  // Vitrine URL
  const vitrineUrl = storeId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${storeId}`
    : ''

  function handleOpenVitrine() {
    if (!vitrineUrl) return
    window.open(vitrineUrl, '_blank')
    setVitrineOpened(true)
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(vitrineUrl)
    setCopied(true)
    setShared(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleWhatsappShare() {
    const text = encodeURIComponent(
      `Olá! Confira minha vitrine online: ${vitrineUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShared(true)
  }

  function handleCompleteOnboarding() {
    if (storeId) {
      localStorage.setItem(`mimus_onboarding_completed_${storeId}`, 'true')
    }
    router.push('/dashboard')
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950 overflow-hidden font-sans">
      {/* Background glows */}
      <div className="absolute top-1/4 right-1/4 w-[30rem] h-[30rem] bg-rose-600/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[30rem] h-[30rem] bg-pink-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-tight text-white">
            Mimus<span className="text-rose-500">.</span>
          </span>
        </div>

        {/* ── TELA 1: BOAS-VINDAS ── */}
        {step === 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-300">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/10">
                <Sparkles className="w-10 h-10 text-rose-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-white">
                  Bem-vinda ao Mimus
                  {storeName ? `, ${storeName.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Em 3 passos simples, sua vitrine estará pronta para receber clientes.
                </p>
              </div>

              {/* Mission preview pills */}
              <div className="space-y-2.5 text-left">
                {[
                  { icon: Package,  label: 'Cadastre 5 produtos' },
                  { icon: Globe,    label: 'Publique sua vitrine' },
                  { icon: Share2,   label: 'Compartilhe com uma cliente' },
                ].map(({ icon: Icon, label }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50"
                  >
                    <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">
                      <span className="text-rose-400 font-bold mr-1.5">{i + 1}.</span>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-500/20 active:scale-[0.98]"
              >
                Começar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── TELA 2: MISSÕES ── */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">

            {/* Header */}
            <div className="text-center space-y-1 mb-2">
              <h2 className="text-xl font-extrabold text-white">Sua jornada de ativação</h2>
              <p className="text-zinc-500 text-xs">Complete as 3 missões para ativar sua vitrine</p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3].map(n => {
                const done = n === 1 ? mission1Done : n === 2 ? mission2Done : mission3Done
                return (
                  <React.Fragment key={n}>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                      done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-700 text-zinc-500'
                    }`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : n}
                    </div>
                    {n < 3 && (
                      <div className={`h-0.5 w-8 rounded-full transition-all duration-500 ${
                        (n === 1 && mission1Done) || (n === 2 && mission2Done)
                          ? 'bg-emerald-500'
                          : 'bg-zinc-800'
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* ─── Missão 1 ─── */}
            <div className={`bg-zinc-900 border rounded-3xl p-6 transition-all duration-300 ${
              mission1Done
                ? 'border-emerald-500/30 bg-emerald-950/10'
                : 'border-zinc-800'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all ${
                    mission1Done
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}>
                    {mission1Done
                      ? <Check className="w-4 h-4 text-white" />
                      : <Package className="w-4 h-4 text-rose-400" />
                    }
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">Missão 1</span>
                    <h3 className="text-sm font-extrabold text-white">Cadastre 5 produtos</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black ${
                    mission1Done ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {Math.min(productCount, PRODUCTS_GOAL)}
                    <span className="text-zinc-600 font-bold text-sm">/{PRODUCTS_GOAL}</span>
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((productCount / PRODUCTS_GOAL) * 100, 100)}%` }}
                />
              </div>

              {!mission1Done && (
                <>
                  {!showAddForm ? (
                    <button
                      onClick={() => { setShowAddForm(true); setTimeout(() => prodNameRef.current?.focus(), 50) }}
                      className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar produto
                    </button>
                  ) : (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex gap-2">
                        <input
                          ref={prodNameRef}
                          type="text"
                          value={prodName}
                          onChange={e => setProdName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddProduct()}
                          placeholder="Nome do produto"
                          className="flex-1 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder-zinc-600"
                        />
                        <button
                          onClick={() => { setShowAddForm(false); setProdName(''); setProdPrice(''); }}
                          className="p-2 rounded-xl border border-zinc-700 text-zinc-500 hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">R$</span>
                          <input
                            type="number"
                            value={prodPrice}
                            onChange={e => setProdPrice(e.target.value)}
                            placeholder="0,00"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder-zinc-600"
                          />
                        </div>
                        <div className="relative w-20">
                          <input
                            type="number"
                            value={prodQty}
                            onChange={e => setProdQty(e.target.value)}
                            placeholder="Qtd"
                            className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder-zinc-600"
                          />
                        </div>
                        <button
                          onClick={handleAddProduct}
                          disabled={addingProduct || !prodName.trim()}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-all"
                        >
                          {addingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-600 text-center">Pressione Enter para salvar rapidamente</p>
                    </div>
                  )}
                </>
              )}

              {mission1Done && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Missão completa! {productCount} produtos cadastrados.</span>
                </div>
              )}
            </div>

            {/* ─── Missão 2 ─── */}
            <div className={`bg-zinc-900 border rounded-3xl p-6 transition-all duration-300 ${
              mission2Done
                ? 'border-emerald-500/30 bg-emerald-950/10'
                : !mission1Done
                ? 'border-zinc-800/50 opacity-50 pointer-events-none'
                : 'border-zinc-800'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all ${
                  mission2Done
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  {mission2Done
                    ? <Check className="w-4 h-4 text-white" />
                    : <Globe className="w-4 h-4 text-rose-400" />
                  }
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">Missão 2</span>
                  <h3 className="text-sm font-extrabold text-white">Publique sua vitrine</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Veja como seus clientes vão te encontrar</p>
                </div>
              </div>

              {!mission2Done ? (
                <button
                  onClick={handleOpenVitrine}
                  disabled={!mission1Done}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver minha vitrine <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Vitrine visitada e publicada! ✨</span>
                </div>
              )}
            </div>

            {/* ─── Missão 3 ─── */}
            <div className={`bg-zinc-900 border rounded-3xl p-6 transition-all duration-300 ${
              mission3Done
                ? 'border-emerald-500/30 bg-emerald-950/10'
                : !mission2Done
                ? 'border-zinc-800/50 opacity-50 pointer-events-none'
                : 'border-zinc-800'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all ${
                  mission3Done
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  {mission3Done
                    ? <Check className="w-4 h-4 text-white" />
                    : <Share2 className="w-4 h-4 text-rose-400" />
                  }
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">Missão 3</span>
                  <h3 className="text-sm font-extrabold text-white">Compartilhe com uma cliente</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Envie o link da sua vitrine agora</p>
                </div>
              </div>

              {!mission3Done ? (
                <div className="space-y-2">
                  {/* Vitrine URL display */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-mono truncate flex-1">{vitrineUrl}</span>
                    <button
                      onClick={handleCopyLink}
                      disabled={!mission2Done}
                      className="shrink-0 text-zinc-400 hover:text-white transition-colors p-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleWhatsappShare}
                      disabled={!mission2Done}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 font-bold text-xs transition-all disabled:opacity-40"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={handleCopyLink}
                      disabled={!mission2Done}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all disabled:opacity-40"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar link'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Link compartilhado! Sua primeira cliente pode estar chegando 🚀</span>
                </div>
              )}
            </div>

            {/* CTA final */}
            {allDone ? (
              <button
                onClick={() => setStep(3)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 animate-in fade-in duration-500"
              >
                Ver meu painel <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCompleteOnboarding}
                className="w-full py-3 text-zinc-600 hover:text-zinc-400 text-xs font-medium transition-colors"
              >
                Continuar sem completar →
              </button>
            )}
          </div>
        )}

        {/* ── TELA 3: PARABÉNS ── */}
        {step === 3 && (
          <div className="bg-zinc-900 border border-emerald-500/20 rounded-3xl p-10 shadow-2xl text-center space-y-7 animate-in fade-in zoom-in-95 duration-400">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Sua loja está no ar! 🎉</h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                Você cadastrou seus produtos, publicou sua vitrine e já compartilhou com uma cliente. 
                Agora é hora de acompanhar os resultados.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Produtos', value: String(productCount), icon: Package },
                { label: 'Vitrine', value: 'Ativa', icon: Globe },
                { label: 'Link Enviado', value: '1', icon: Share2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-zinc-950 rounded-2xl p-3 border border-zinc-800 flex flex-col items-center gap-1">
                  <Icon className="w-4 h-4 text-rose-400" />
                  <span className="text-base font-extrabold text-white">{value}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCompleteOnboarding}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-500/20"
            >
              Explorar o Mimus <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
