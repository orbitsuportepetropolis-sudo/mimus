'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Sparkles, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  Loader2, 
  BookOpen, 
  FileSpreadsheet, 
  Monitor, 
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  DollarSign
} from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form values
  const [storeName, setStoreName] = useState('')
  const [segment, setSegment] = useState('Loja de maquiagem')
  const [controlType, setControlType] = useState('')
  const [mainGoal, setMainGoal] = useState('')
  
  // Product Form values
  const [prodName, setProdName] = useState('')
  const [prodQty, setProdQty] = useState(10)
  const [prodPrice, setProdPrice] = useState(49.90)
  const [createdProduct, setCreatedProduct] = useState<any>(null)
  
  // Sale Form values
  const [saleQty, setSaleQty] = useState(1)
  const [createdSale, setCreatedSale] = useState<any>(null)

  // Load profile and store details on mount
  useEffect(() => {
    async function loadStore() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()
        
      if (profile?.store_id) {
        setStoreId(profile.store_id)
        
        const { data: store } = await supabase
          .from('stores')
          .select('name')
          .eq('id', profile.store_id)
          .single()
          
        if (store?.name) {
          setStoreName(store.name)
        }
      }
    }
    loadStore()
  }, [supabase, router])

  // Step 2 Action: Update store name
  async function handleStoreUpdate() {
    if (!storeName.trim() || !storeId) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({ name: storeName })
        .eq('id', storeId)
      if (error) throw error
      setStep(3)
    } catch (err) {
      alert('Erro ao atualizar nome da loja. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Step 6 Action: Create product
  async function handleCreateProduct() {
    if (!prodName.trim() || !storeId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          store_id: storeId,
          name: prodName,
          quantity_in_stock: prodQty,
          sale_price: prodPrice,
          brand: 'Mimus',
          cost_price: Math.round(prodPrice * 0.5 * 100) / 100 // Estimate 50% cost for simulation
        }])
        .select()
        .single()
        
      if (error) throw error
      setCreatedProduct(data)
      setStep(5) // Return to checklist with 33% progress
    } catch (err) {
      alert('Erro ao cadastrar produto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Step 7 Action: Register sale
  async function handleRegisterSale() {
    if (!createdProduct || !storeId) return
    setLoading(true)
    try {
      const totalValue = Math.round(createdProduct.sale_price * saleQty * 100) / 100
      
      // 1. Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: storeId,
          customer_id: null,
          total_value: totalValue,
          discount: 0,
          payment_method: 'pix'
        }])
        .select()
        .single()
        
      if (saleError) throw saleError
      
      // 2. Insert sale item
      const { error: itemError } = await supabase
        .from('sale_items')
        .insert([{
          sale_id: saleData.id,
          product_id: createdProduct.id,
          quantity: saleQty,
          unit_price: createdProduct.sale_price
        }])
        
      if (itemError) throw itemError
      
      setCreatedSale(saleData)
      setStep(5) // Return to checklist with 66% progress
    } catch (err) {
      alert('Erro ao registrar venda. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Final Action: Complete onboarding
  function handleCompleteOnboarding() {
    if (storeId && userId) {
      localStorage.setItem(`mimus_onboarding_completed_${storeId}`, 'true')
    }
    router.push('/dashboard')
  }

  // Progress calculations
  const isProductCreated = !!createdProduct
  const isSaleCreated = !!createdSale
  const progressPercent = isSaleCreated ? 66 : isProductCreated ? 33 : 0

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50 via-slate-50 to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-1/4 right-1/4 w-[35rem] h-[35rem] bg-rose-300/10 dark:bg-rose-950/15 rounded-full blur-[90px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 left-1/4 w-[35rem] h-[35rem] bg-pink-300/15 dark:bg-pink-950/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 transition-all duration-300">
        {/* Logo and Progress bar at the top (only visible after step 1 and not on celebration steps) */}
        {step > 1 && step < 8 && (
          <div className="mb-6 flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-200">
              Mimus<span className="text-rose-600">.</span>
            </span>
            <div className="w-48 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-rose-600 transition-all duration-500 ease-out" 
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ONBOARDING WIZARD CARD */}
        <div className="bg-white/70 dark:bg-zinc-900/80 backdrop-blur-lg rounded-3xl border border-slate-100 dark:border-zinc-800/60 p-8 md:p-10 shadow-2xl shadow-rose-900/5 transition-all">
          
          {/* TELA 1: BOAS-VINDAS */}
          {step === 1 && (
            <div className="text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-bounce">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Bem-vindo ao Mimus
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                  Controle vendas, estoque e finanças da sua loja em poucos minutos.
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl shadow-rose-500/20 active:scale-[0.99]"
              >
                Começar configuração <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TELA 2: CONHECENDO SUA LOJA */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Passo 1 de 3</span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Conhecendo sua loja</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Qual o nome da sua loja?
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Bella Makeup, Mimus Cosméticos"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Qual seu segmento?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Loja de maquiagem',
                      'Loja de cosméticos',
                      'Revendedora de beleza',
                      'Outro nicho'
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSegment(opt)}
                        className={`p-3 border rounded-2xl text-left text-xs font-bold transition-all ${
                          segment === opt
                            ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleStoreUpdate}
                disabled={loading || !storeName.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/15"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'}
              </button>
            </div>
          )}

          {/* TELA 3: COMO VOCÊ CONTROLA HOJE */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Passo 2 de 3</span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Como você controla hoje?</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Como você controla seu estoque e vendas atualmente?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Caderno', icon: BookOpen },
                  { label: 'Excel', icon: FileSpreadsheet },
                  { label: 'Outro sistema', icon: Monitor },
                  { label: 'Não controlo', icon: AlertCircle }
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setControlType(item.label)}
                      className={`p-5 border rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all ${
                        controlType === item.label
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/10'
                          : 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-rose-500" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                Essa informação é valiosa para marketing e produto.
              </p>
              <button
                onClick={() => setStep(4)}
                disabled={!controlType}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center shadow-lg shadow-rose-500/15"
              >
                Continuar
              </button>
            </div>
          )}

          {/* TELA 4: DEFINE SUA META */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Passo 3 de 3</span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Defina sua meta</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Qual seu objetivo principal?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Controlar estoque', icon: Package },
                  { label: 'Controlar vendas', icon: ShoppingBag },
                  { label: 'Controlar finanças', icon: DollarSign },
                  { label: 'Entender meu lucro', icon: PiggyBank }
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setMainGoal(item.label)}
                      className={`p-5 border rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all ${
                        mainGoal === item.label
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/10'
                          : 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-rose-500" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                Isso personaliza a experiência.
              </p>
              <button
                onClick={() => setStep(5)}
                disabled={!mainGoal}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center shadow-lg shadow-rose-500/15"
              >
                Continuar
              </button>
            </div>
          )}

          {/* TELA 5: CHECKLIST DE CONFIGURAÇÃO */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Configure sua loja</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Conclua o checklist rápido para ativar o Mimus.</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-zinc-300">
                  <span>Progresso da configuração</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-zinc-800/40">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-700 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-3.5">
                {/* Item 1 */}
                <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                  isProductCreated 
                    ? 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-500/5 text-slate-700 dark:text-zinc-300' 
                    : 'border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 text-slate-500'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    isProductCreated 
                      ? 'border-emerald-500 bg-emerald-500 text-white' 
                      : 'border-slate-300 dark:border-zinc-700'
                  }`}>
                    {isProductCreated && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-bold ${isProductCreated ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                    Cadastre seu primeiro produto
                  </span>
                </div>

                {/* Item 2 */}
                <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                  isSaleCreated 
                    ? 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-500/5 text-slate-700 dark:text-zinc-300' 
                    : 'border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 text-slate-500'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    isSaleCreated 
                      ? 'border-emerald-500 bg-emerald-500 text-white' 
                      : 'border-slate-300 dark:border-zinc-700'
                  }`}>
                    {isSaleCreated && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-bold ${isSaleCreated ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                    Registre sua primeira venda
                  </span>
                </div>

                {/* Item 3 */}
                <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 text-slate-500`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-300 dark:border-zinc-700">
                    {/* Unchecked */}
                  </div>
                  <span className="text-xs font-bold">
                    Veja seu dashboard
                  </span>
                </div>
              </div>

              {/* Action Button based on progress */}
              {!isProductCreated ? (
                <button
                  onClick={() => setStep(6)}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10"
                >
                  Cadastrar meu primeiro produto <ArrowRight className="w-4 h-4" />
                </button>
              ) : !isSaleCreated ? (
                <button
                  onClick={() => setStep(7)}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10"
                >
                  Registrar minha primeira venda <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setStep(8)}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  Visualizar resultados <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* TELA 6: PRIMEIRO PRODUTO */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Primeiro produto</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Vamos começar pelos seus produtos mais vendidos.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Nome do produto
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ex: Batom Matte Velvet, Base Fluida Glow"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={prodQty}
                      onChange={(e) => setProdQty(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Preço de venda (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateProduct}
                disabled={loading || !prodName.trim() || prodQty <= 0 || prodPrice <= 0}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/15 animate-pulse"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar produto'}
              </button>
            </div>
          )}

          {/* TELA 7: PRIMEIRA VENDA */}
          {step === 7 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Primeira venda</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Agora registre uma venda para ver o Mimus funcionando.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-rose-100 dark:border-rose-950/20 bg-rose-500/5 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold">Produto Selecionado</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">{createdProduct?.name || 'Produto'}</h3>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    R$ {createdProduct?.sale_price.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Quantidade vendida
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={createdProduct?.quantity_in_stock || 10}
                    value={saleQty}
                    onChange={(e) => setSaleQty(Math.min(createdProduct?.quantity_in_stock || 10, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleRegisterSale}
                disabled={loading || saleQty <= 0}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/15"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar venda'}
              </button>
            </div>
          )}

          {/* TELA 8: MOMENTO AHA */}
          {step === 8 && (
            <div className="space-y-8 animate-in fade-in duration-300 text-center">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Aqui está a parte mais importante</span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Metas e Faturamento Atualizados!</h2>
              </div>

              {/* simulated metric cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/60 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500 mb-2" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Faturamento</span>
                  <p className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                    R$ {(createdProduct?.sale_price * saleQty).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50/60 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center">
                  <Package className="w-5 h-5 text-rose-500 mb-2" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Estoque</span>
                  <p className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                    {createdProduct ? createdProduct.quantity_in_stock - saleQty : 0} itens
                  </p>
                </div>
                <div className="bg-slate-50/60 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center">
                  <PiggyBank className="w-5 h-5 text-purple-500 mb-2" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Lucro Est.</span>
                  <p className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                    R$ {((createdProduct?.sale_price - (createdProduct?.cost_price || 0)) * saleQty).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl max-w-sm mx-auto flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Parabéns! Sua loja já está sendo controlada pelo Mimus.
                </p>
              </div>

              <button
                onClick={() => setStep(9)}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-rose-500/15"
              >
                Ir para o painel
              </button>
            </div>
          )}

          {/* TELA 9: ATIVAÇÃO DO TESTE */}
          {step === 9 && (
            <div className="text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-pulse">
                <Sparkles className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">🎉 Seu teste grátis começou</h2>
                <p className="text-slate-500 dark:text-zinc-400 text-xs md:text-sm max-w-xs mx-auto leading-relaxed">
                  Restam 7 dias para explorar todos os recursos e impulsionar suas vendas.
                </p>
              </div>

              <button
                onClick={handleCompleteOnboarding}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-500/10"
              >
                Explorar Mimus
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
