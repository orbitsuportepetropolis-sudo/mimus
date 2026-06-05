'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowRight, 
  Check, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Smartphone,
  ShieldCheck,
  Zap,
  Globe,
  Bell
} from 'lucide-react'

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'sales' | 'stock' | 'catalog' | 'finance'>('sales')
  const [showTestimonial, setShowTestimonial] = useState(true)
  const [activeAICommand, setActiveAICommand] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedResponse, setDisplayedResponse] = useState('')

  const aiCommands = [
    {
      label: 'Cadastrar Produto',
      command: 'cadastre o produto Gloss Labial Aura Glow por R$ 39,90',
      response: '✨ **Gloss Labial Aura Glow** cadastrado com sucesso! Preço de venda: **R$ 39,90**. Ele já está ativo na sua vitrine virtual! 🌸',
      type: 'success'
    },
    {
      label: 'Registrar Venda',
      command: 'vendi 2 @Gloss Labial Aura Glow para a cliente @Letícia Costa por Pix',
      response: '✅ **Venda Registrada!**\n• Produto: *Gloss Labial Aura Glow* (2 un.)\n• Cliente: *Letícia Costa*\n• Total: *R$ 79,80* (Pix)\n📉 Estoque atualizado automaticamente no Mimus e na Loja Integrada!',
      type: 'sale'
    },
    {
      label: 'Consultar Estoque',
      command: '🎙️ Áudio: "Mimus, quais cosméticos estão com estoque baixo?"',
      response: '⚠️ **Alerta de Estoque Crítico:**\n• *Delineador Holográfico Glow* (0 un. restantes)\n• *Batom Velvet BT* (2 un. restantes)\nPeça: "IA, gere lista de compras de fornecedores"',
      type: 'warning'
    },
    {
      label: 'Ver Faturamento',
      command: 'quanto a loja faturou hoje?',
      response: '📊 **Resumo Financeiro de Hoje:**\n• Faturamento: *R$ 684,20*\n• Lucro Líquido: *R$ 312,45* (+15% em relação a ontem)\n💰 Todas as vendas do PDV e WhatsApp integradas.',
      type: 'finance'
    }
  ]

  // Sync theme with localStorage & document.documentElement class
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Animate chat simulation on activeAICommand change
  useEffect(() => {
    setIsTyping(true)
    setDisplayedResponse('')
    const timer = setTimeout(() => {
      setIsTyping(false)
      setDisplayedResponse(aiCommands[activeAICommand].response)
    }, 1000)

    return () => clearTimeout(timer)
  }, [activeAICommand])

  // Autoplay chat commands simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAICommand((prev) => (prev + 1) % aiCommands.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [activeAICommand])

  const handleSelectAICommand = (index: number) => {
    setActiveAICommand(index)
  }

  const toggleTheme = () => {
    const nextDark = !darkMode
    setDarkMode(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-b from-rose-200/20 via-pink-300/10 to-transparent dark:from-rose-950/20 dark:via-zinc-950/0 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[40rem] left-0 w-[40rem] h-[40rem] bg-gradient-to-t from-violet-200/15 via-rose-300/10 to-transparent dark:from-purple-950/10 dark:via-zinc-950/0 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* FLOATING HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span>Mimus</span><span className="text-rose-600">.</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 transition-colors">Recursos</a>
            <a href="#preview" className="text-sm font-medium text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 transition-colors">Demonstração</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 transition-colors">Planos</a>
            <a href="#stats" className="text-sm font-medium text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 transition-colors">Sobre</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
              aria-label="Alternar tema"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 px-4 py-2 transition-colors"
            >
              Entrar
            </Link>
            
            <Link 
              href="/register" 
              className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-rose-500/10 active:scale-[0.98]"
            >
              Criar minha loja grátis
            </Link>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex md:hidden items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex flex-col bg-white dark:bg-zinc-950 p-6 animate-in slide-in-from-top duration-250">
          <div className="flex items-center justify-between mb-8">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Mimus<span className="text-rose-600">.</span></span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500"><X className="w-6 h-6" /></button>
          </div>
          
          <nav className="flex flex-col gap-6 text-lg font-medium mb-8">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 dark:text-zinc-200">Recursos</a>
            <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 dark:text-zinc-200">Demonstração</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 dark:text-zinc-200">Planos</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 dark:text-zinc-200">Sobre</a>
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-800 rounded-xl"
            >
              Entrar
            </Link>
            <Link 
              href="/register" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center font-semibold text-white bg-rose-600 rounded-xl"
            >
              Criar minha loja grátis
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            
            {/* Sparkle Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/25">
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">Para Lojas de Beleza e Cosméticos</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              Você sabe quanto sua loja <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">lucrou</span> esse mês?
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-lg leading-relaxed">
              Mimus é o sistema simples de controle de estoque, vendas e finanças feito sob medida para pequenas lojistas de beleza e cosméticos.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                Criar minha loja grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href="#preview" 
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                Ver como funciona
              </a>
            </div>

            <div className="text-xs text-slate-500 dark:text-zinc-400 italic font-medium pt-1 text-center lg:text-left w-full">
              ✨ Criado por um fundador para organizar a loja da própria esposa — e funcionou.
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-zinc-900 w-full justify-center lg:justify-start">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Plano grátis vitalício</span>
              </div>
            </div>

          </div>

          {/* Right Hero Visual (Interactive Mockup Showcase) */}
          <div className="lg:col-span-7 w-full flex flex-col">
            
            {/* Tabs Selector for Mockup */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-xl self-center lg:self-end mb-4 border border-slate-200/50 dark:border-zinc-800/40">
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'sales' 
                    ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                PDV de Vendas
              </button>
              <button 
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'stock' 
                    ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Controle de Estoque
              </button>
              <button 
                onClick={() => setActiveTab('catalog')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'catalog' 
                    ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Vitrine Virtual
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'finance' 
                    ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Fluxo Financeiro
              </button>
            </div>

            {/* Browser Mockup Window */}
            <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/70 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all duration-300">
              
              {/* Window Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="bg-slate-200/50 dark:bg-zinc-950 px-8 py-0.5 rounded-lg text-[10px] text-slate-500 dark:text-zinc-400 font-mono select-none">
                  {activeTab === 'catalog' ? 'appmimus.com.br/vitrine/sua-loja' : 'appmimus.com.br/dashboard'}
                </div>
                <div className="w-8" />
              </div>

              {/* Window Content */}
              <div className="p-6 bg-slate-50/40 dark:bg-zinc-950/40 min-h-[340px] flex flex-col justify-between transition-all duration-300">
                
                {activeTab === 'sales' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-900">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">PDV - Registro de Vendas</h4>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-semibold">Caixa Aberto</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Operadora: Letícia Costa</span>
                    </div>

                    {/* Shopping items list */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center font-bold text-pink-500 text-xs">B1</div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Batom Velvet Matte Rose</p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Bruna Tavares • R$ 49,90</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">R$ 49,90</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center font-bold text-purple-500 text-xs">C1</div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Corretivo Hyaluronic Peach</p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Mimis Beauty • R$ 69,90</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">R$ 69,90</span>
                      </div>
                    </div>

                    {/* PDV Total and Checkout */}
                    <div className="p-4 bg-rose-500/5 dark:bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Valor Total</span>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">R$ 119,80</p>
                      </div>
                      <button className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" /> Finalizar Venda
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'stock' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-900">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Gestão e Alertas Críticos</h4>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">Notificações automáticas de reposição</span>
                      </div>
                      <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full font-bold">2 Alertas</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-100 dark:border-rose-900/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Delineador Holográfico Glow</p>
                            <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">Estoque zerado</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">0 un. restantes</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-amber-100 dark:border-amber-900/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Base Fluida Satin 03</p>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Vencimento próximo (12/06/2026)</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">2 un. restantes</span>
                      </div>
                    </div>

                    <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-colors text-center">
                      Registrar Entrada de Lote de Produtos
                    </button>
                  </div>
                )}

                {activeTab === 'catalog' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Vitrine banner */}
                    <div className="h-28 w-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4 flex flex-col justify-center text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-4 -translate-y-4" />
                      <span className="text-[8px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-bold w-max">Promoção de Outono</span>
                      <h5 className="text-base font-extrabold mt-1">Coleção de Pele Perfeita</h5>
                      <p className="text-[10px] text-white/80">Ganhe um pincel exclusivo nas compras acima de R$ 150</p>
                    </div>

                    {/* Products showcase grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between">
                        <div>
                          <div className="h-16 w-full bg-slate-100 dark:bg-zinc-950 rounded-lg flex items-center justify-center mb-2">
                            <Sparkles className="w-6 h-6 text-rose-400" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate">Sérum Renovador Skin</p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50 dark:border-zinc-800/40">
                          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">R$ 89,90</span>
                          <span className="text-[8px] font-bold text-slate-400">Vitrine Ativa</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between">
                        <div>
                          <div className="h-16 w-full bg-slate-100 dark:bg-zinc-950 rounded-lg flex items-center justify-center mb-2">
                            <ShoppingBag className="w-6 h-6 text-rose-400" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate">Batom Satin Hydrate</p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50 dark:border-zinc-800/40">
                          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">R$ 39,90</span>
                          <span className="text-[8px] font-bold text-slate-400">Vitrine Ativa</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'finance' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-900">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Resumo Financeiro Semanal</h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">Fluxo de faturamento integrado</p>
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +15.4% este mês
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Hoje</span>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">R$ 684,20</p>
                        <span className="text-[9px] text-slate-400">8 transações</span>
                      </div>

                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Este Mês</span>
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">R$ 14.850,00</p>
                        <span className="text-[9px] text-slate-400">Meta mensal 75%</span>
                      </div>
                    </div>

                    {/* Miniature chart bar representation */}
                    <div className="flex items-end gap-1.5 h-12 w-full pt-2">
                      <div className="bg-rose-200 dark:bg-zinc-800 h-6 w-full rounded-md" />
                      <div className="bg-rose-200 dark:bg-zinc-800 h-8 w-full rounded-md" />
                      <div className="bg-rose-200 dark:bg-zinc-800 h-4 w-full rounded-md" />
                      <div className="bg-rose-300 dark:bg-zinc-700 h-10 w-full rounded-md" />
                      <div className="bg-rose-600 h-12 w-full rounded-md" />
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-20 md:py-28 bg-white dark:bg-zinc-900 transition-colors duration-300 relative border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16 md:mb-24">
            <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Tudo em um só lugar</h2>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">A estrutura que sua loja precisa para lucrar mais</p>
            <p className="text-slate-500 dark:text-zinc-400 text-sm md:text-base">Módulos perfeitamente integrados e adaptados para o setor de beleza e cosméticos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: PDV */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Registre vendas em segundos, pelo celular</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Esqueça a calculadora. Registre suas vendas pelo celular ou tablet em segundos, calcule o troco e envie o comprovante diretamente pelo WhatsApp da cliente.
              </p>
            </div>

            {/* Feature 2: Smart Stock */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Adeus caderno: controle seu estoque sem complicação</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Saiba exatamente o que tem nas prateleiras. Cadastre seus produtos e o Mimus desconta a quantidade automaticamente a cada venda, avisando antes de acabar.
              </p>
            </div>

            {/* Feature 3: Digital Catalog */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sua vitrine virtual no WhatsApp</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Tenha uma vitrine linda com o seu catálogo de maquiagem e cosméticos. Suas clientes escolhem os produtos online e finalizam o pedido direto no seu WhatsApp.
              </p>
            </div>

            {/* Feature 4: Financial */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Saiba exatamente quanto você lucrou</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Saiba para onde está indo o dinheiro da sua loja. Controle o custo de fornecedores e veja o lucro líquido das suas vendas sem precisar de planilhas complicadas.
              </p>
            </div>

            {/* Feature 5: Customers */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ache qualquer cliente em um clique</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Salve o histórico de compras de cada cliente. Saiba o que ela mais gosta e envie mensagens personalizadas no aniversário para vender mais.
              </p>
            </div>

            {/* Feature 6: Integrations */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sincronização com a Loja Integrada</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Conecte sua loja física à sua loja online. O Mimus sincroniza o estoque automaticamente e importa suas vendas via webhook da Loja Integrada em tempo real.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* MIMUS AI SECTION */}
      <section id="mimus-ai" className="py-20 md:py-28 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 relative overflow-hidden border-t border-slate-100 dark:border-zinc-900">
        
        {/* Glow decoration */}
        <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left details */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25">
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">Diferencial Exclusivo</span>
            </div>

            <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              Sua loja gerenciada apenas por <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">comando de voz ou texto</span>
            </h2>
            
            <p className="text-base text-slate-600 dark:text-zinc-400 max-w-lg leading-relaxed">
              O Mimus AI é a forma mais rápida de controlar sua loja no dia a dia corrido. Sem formulários longos ou tabelas confusas: basta enviar uma mensagem como se estivesse no WhatsApp.
            </p>

            <div className="space-y-4 w-full">
              <div className="flex gap-3 text-left">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">🎙️ Suporte a Comandos de Voz</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Grave áudios rápidos registrando vendas ou entradas enquanto atende sua cliente.</p>
                </div>
              </div>

              <div className="flex gap-3 text-left">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">🏷️ Marcações Inteligentes</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Use @ para marcar produtos e clientes e associar transações de forma precisa.</p>
                </div>
              </div>

              <div className="flex gap-3 text-left">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">📊 Resumos de Negócios na Hora</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Pergunte quanto faturou, o lucro do mês ou quais produtos estão acabando.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Experimentar Mimus AI Grátis <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right chat simulation */}
          <div className="lg:col-span-7 w-full flex flex-col space-y-4">
            
            {/* Quick Action Tabs */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {aiCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAICommand(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    activeAICommand === idx
                      ? 'bg-rose-600 border-rose-650 text-white shadow-md shadow-rose-500/10'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {cmd.label}
                </button>
              ))}
            </div>

            {/* Chatbot Window */}
            <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800 shadow-2xl overflow-hidden min-h-[380px] flex flex-col justify-between">
              
              {/* Window Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center relative">
                    <Sparkles className="w-5 h-5 text-rose-650 dark:text-rose-450 text-rose-600 dark:text-rose-400" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Mimus AI</h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">Assistente Virtual da Loja</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                </div>
              </div>

              {/* Chat Body */}
              <div className="p-6 flex-1 bg-slate-50/20 dark:bg-zinc-950/20 flex flex-col justify-end space-y-4">
                
                {/* User Message Bubble */}
                <div className="self-end max-w-[85%] bg-rose-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md text-sm font-medium animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="font-mono text-xs opacity-90 mb-0.5">Sua Mensagem</p>
                  <p className="leading-relaxed">
                    {aiCommands[activeAICommand].command}
                  </p>
                </div>

                {/* AI Response Bubble */}
                <div className="self-start max-w-[85%] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-md text-sm animate-in fade-in slide-in-from-left-4 duration-300 min-h-[140px] flex flex-col justify-center">
                  <p className="font-bold text-xs text-rose-500 dark:text-rose-400 mb-1">Mimus AI</p>
                  
                  {isTyping ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <div className="leading-relaxed whitespace-pre-line text-xs md:text-sm font-medium">
                      {displayedResponse.split('\n').map((line, lIdx) => {
                        const isBullet = line.trim().startsWith('•')
                        
                        return (
                          <div key={lIdx} className={isBullet ? 'pl-3' : ''}>
                            {line.split('**').map((part, pIdx) => {
                              if (pIdx % 2 === 1) {
                                return <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-white">{part}</strong>
                              }
                              return part.split('*').map((subpart, sIdx) => {
                                if (sIdx % 2 === 1) {
                                  return <em key={sIdx} className="font-semibold italic text-rose-600 dark:text-rose-455 font-mono text-xs">{subpart}</em>
                                }
                                return subpart
                              })
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Chat Input Mockup */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-3">
                <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-4 py-2.5 rounded-2xl text-xs text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                  <span>Experimente digitar um comando...</span>
                  <Sparkles className="w-4 h-4 text-slate-350 dark:text-zinc-700" />
                </div>
                <button className="w-10 h-10 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/10 active:scale-95 transition-all">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* TESTIMONIAL SECTION */}
      <section id="testimonials" className="py-20 md:py-28 px-6 bg-rose-500/[0.02] dark:bg-rose-500/[0.01] transition-colors duration-300 border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Histórias Reais</h2>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Quem usa o Mimus aprova</p>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">Veja a experiência de quem transformou a gestão da sua loja de beleza.</p>
          </div>

          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-xl space-y-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 flex items-center justify-center bg-slate-50 dark:bg-zinc-950 max-h-[300px] shadow-inner">
              <img 
                src="/leticia_aura_glow.png" 
                onError={(e) => {
                  // Fallback visual elegance if the generated image is not loaded
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'w-full h-full min-h-[220px] bg-gradient-to-tr from-pink-500 to-rose-600 flex flex-col items-center justify-center text-white p-6 text-center';
                    fallbackDiv.innerHTML = '<span class="text-3xl mb-2">✨</span><span class="text-sm font-bold">Aura Glow Cosméticos</span><span class="text-[10px] opacity-80">Sucesso com o Mimus</span>';
                    parent.appendChild(fallbackDiv);
                  }
                }}
                alt="Letícia Costa - Aura Glow" 
                className="w-full h-full object-cover aspect-square" 
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4 text-left">
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Caso de Sucesso 🏆
              </span>
              <p className="text-sm text-slate-650 dark:text-zinc-350 leading-relaxed italic">
                "O Mimus salvou a minha rotina de vendas na Aura Glow. Antes eu perdia muito tempo anotando tudo em cadernos e esquecia de dar baixa no estoque. Agora eu controlo minhas vendas e finanças em segundos pelo celular, e minhas clientes amam comprar pela vitrine do WhatsApp! O assistente por inteligência artificial é surreal de prático."
              </p>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Letícia Costa</h4>
                <p className="text-xs text-slate-400 font-medium">Proprietária da Aura Glow • Petrópolis - RJ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 md:py-28 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16 md:mb-20">
            <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Valores Justos</h2>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Planos simples para o seu tamanho</p>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">Comece de graça e faça o upgrade apenas quando sua loja crescer.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Free Plan */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.01]">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Plano Grátis</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Essencial para iniciar seu negócio</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">R$ 0</span>
                  <span className="text-sm text-slate-400 dark:text-zinc-500">/ sempre grátis</span>
                </div>
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Até 10 produtos cadastrados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">1 usuária (você)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Vitrine virtual básica</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">PDV e controle de estoque essenciais</span>
                  </div>
                </div>
              </div>
              <Link 
                href="/register" 
                className="w-full text-center font-bold text-xs py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-white rounded-xl mt-8 transition-colors"
              >
                Ativar Plano Grátis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-rose-500 dark:border-rose-600 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.01]">
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] uppercase tracking-widest font-extrabold px-5 py-1.5 rounded-bl-xl">
                Mais Recomendado
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Plano Pro</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Aceleração total para sua loja</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">R$ 49,00</span>
                  <span className="text-sm text-slate-400 dark:text-zinc-500">/ mês</span>
                </div>
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Produtos cadastrados ilimitados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Equipe e colaboradoras ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Vitrine premium com banners personalizados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Domínio personalizado para a vitrine</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Relatórios avançados de lucro e vendas</span>
                  </div>
                </div>
              </div>
              <Link 
                href="/register" 
                className="w-full text-center font-bold text-xs py-3.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl mt-8 transition-colors shadow-lg shadow-rose-500/20"
              >
                Experimentar Versão Pro
              </Link>
            </div>

          </div>

        </div>
      </section>
       {/* STATS SECTION */}
      <section id="stats" className="py-20 md:py-24 bg-white dark:bg-zinc-900 border-y border-slate-100 dark:border-zinc-900 text-slate-800 dark:text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">100%</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Feito para Você</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">R$ 0</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Para começar</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">+ Prático</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Que o caderno</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">10h</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Salvas por semana</p>
          </div>
        </div>
      </section>

      {/* TRUST CTA SECTION */}
      <section className="py-20 md:py-28 px-6 text-center bg-gradient-to-b from-transparent to-rose-50/20 dark:to-rose-950/10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pronta para profissionalizar seu negócio de beleza?</h2>
          <p className="text-base md:text-lg text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Cadastre-se grátis e tenha o controle total da sua loja. É simples, rápido e feito para você organizar a sua rotina de vendas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Criar minha loja grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </section>


      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-500 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800 dark:text-white">Mimus<span className="text-rose-600">.</span></span>
            <span className="text-xs text-slate-400 dark:text-zinc-600">| Gestão para Cosméticos e Maquiagem</span>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/terms" className="hover:text-rose-600 dark:hover:text-rose-450 transition-colors">Termos de Uso</Link>
            <Link href="/privacy" className="hover:text-rose-600 dark:hover:text-rose-450 transition-colors">Políticas de Privacidade</Link>
            <Link href="/suporte" className="hover:text-rose-600 dark:hover:text-rose-450 transition-colors">Suporte</Link>
          </div>

          <p className="text-[11px]">&copy; {new Date().getFullYear()} Mimus Software Ltda. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
