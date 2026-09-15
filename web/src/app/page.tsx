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
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'sales' | 'stock' | 'catalog' | 'finance'>('sales')
  const [showTestimonial, setShowTestimonial] = useState(true)
  const [activeAICommand, setActiveAICommand] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedResponse, setDisplayedResponse] = useState('')
  const [comparisonMode, setComparisonMode] = useState<'caderno' | 'mimus'>('mimus')
  const [vitrineActiveProduct, setVitrineActiveProduct] = useState<number>(0)
  const [isUserInteracting, setIsUserInteracting] = useState(false)

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

  // Autoplay mockup tabs showcase (moves mouse automatically if user is idle)
  useEffect(() => {
    if (isUserInteracting) return
    const interval = setInterval(() => {
      const tabs: ('sales' | 'stock' | 'catalog' | 'finance')[] = ['sales', 'stock', 'catalog', 'finance']
      const currentIndex = tabs.indexOf(activeTab)
      const nextIndex = (currentIndex + 1) % tabs.length
      setActiveTab(tabs[nextIndex])
    }, 4500)
    return () => clearInterval(interval)
  }, [activeTab, isUserInteracting])

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
      <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-gradient-to-br from-rose-400/20 via-fuchsia-400/10 to-violet-500/5 dark:from-rose-950/30 dark:via-fuchsia-950/10 dark:to-transparent rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[8s]" />
      <div className="absolute top-[30rem] -left-[20rem] w-[50rem] h-[50rem] bg-gradient-to-tr from-violet-500/15 via-pink-400/10 to-transparent dark:from-purple-950/20 dark:via-rose-950/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[80rem] right-0 w-[45rem] h-[45rem] bg-gradient-to-l from-fuchsia-500/10 via-rose-400/5 to-transparent rounded-full blur-[130px] pointer-events-none -z-10" />
      
      {/* FLOATING HEADER */}
      <motion.header 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 transition-colors duration-300"
      >
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
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link 
                href="/register" 
                className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-rose-500/10 block"
              >
                Criar minha loja grátis
              </Link>
            </motion.div>
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
      </motion.header>

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
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-6 overflow-hidden">
        
        {/* Hero Background Image with Blur Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <motion.img 
            src="/hero_beauty_bg.png" 
            alt="Cosmetics boutique background" 
            className="w-full h-full object-cover opacity-[0.08] dark:opacity-[0.12] filter blur-[3px]" 
            animate={{
              scale: [1, 1.04, 1.01, 1.05, 1],
              x: [0, 8, -6, 5, 0],
              y: [0, -5, 8, -4, 0]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-zinc-950" />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-[45rem] h-[45rem] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[130px]"
            animate={{
              scale: [1, 1.15, 0.9, 1.05, 1],
              x: ["-50%", "-46%", "-52%", "-48%", "-50%"],
              y: ["-50%", "-54%", "-48%", "-52%", "-50%"]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            
            {/* Sparkle Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/25"
            >
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">Para Lojas de Beleza e Cosméticos</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white"
            >
              O fim do caderno.<br />A nova era da sua <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">loja de beleza</span>.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-lg leading-relaxed"
            >
              Organize seu estoque de cosméticos, controle suas vendas em segundos e encante suas clientes com uma vitrine virtual impecável. Feito por quem entende o dia a dia da empreendedora de beleza.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link 
                  href="/register" 
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center justify-center gap-2 group"
                >
                  Criar minha loja grátis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <a 
                  href="#preview" 
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  Ver como funciona
                </a>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xs text-slate-500 dark:text-zinc-400 italic font-medium pt-1 text-center lg:text-left w-full"
            >
              ✨ Criado por um founder para organizar a loja da própria esposa — e funcionou.
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-zinc-900 w-full justify-center lg:justify-start"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Plano grátis vitalício</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Visual (Interactive Mockup Showcase) */}
          <div className="lg:col-span-7 w-full flex flex-col">
            
            {/* Monitor Mockup Wrapper */}
            <div className="w-full relative">
              
              {/* PC Monitor Screen frame */}
              <div className="w-full bg-slate-900 rounded-3xl border-8 border-slate-950 dark:border-zinc-850 shadow-2xl p-1 pb-0 relative overflow-hidden">
                
                {/* Browser Mockup Window */}
                <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden transition-all duration-300">
                  
                  {/* Window Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-905 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="bg-slate-200/50 dark:bg-zinc-950 px-8 py-0.5 rounded-lg text-[10px] text-slate-505 dark:text-zinc-400 font-mono select-none">
                      {activeTab === 'catalog' ? 'appmimus.com.br/vitrine/sua-loja' : 'appmimus.com.br/dashboard'}
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Tabs Selector for Mockup (Now inside Browser, styled as screen menu) */}
                  <div className="flex bg-slate-100/80 dark:bg-zinc-950/60 p-1 rounded-xl mx-auto mt-4 border border-slate-200/40 dark:border-zinc-900/60 relative w-max max-w-[95%] overflow-x-auto select-none">
                    
                    {/* Virtual Mouse Pointer */}
                    <motion.div
                      className="absolute pointer-events-none z-20 text-rose-600 dark:text-rose-400 drop-shadow-[0_2px_8px_rgba(244,63,94,0.45)]"
                      initial={{ x: 60, y: 14 }}
                      animate={
                        activeTab === 'sales' ? { x: 40, y: 14, scale: [1, 0.82, 1] } :
                        activeTab === 'stock' ? { x: 155, y: 14, scale: [1, 0.82, 1] } :
                        activeTab === 'catalog' ? { x: 275, y: 14, scale: [1, 0.82, 1] } :
                        { x: 395, y: 14, scale: [1, 0.82, 1] }
                      }
                      transition={{
                        x: { type: 'spring', stiffness: 100, damping: 15, delay: 0.15 },
                        y: { type: 'spring', stiffness: 100, damping: 15, delay: 0.15 },
                        scale: { duration: 0.35, ease: 'easeInOut', delay: 0.15 }
                      }}
                    >
                      <svg className="w-4 h-4 fill-current rotate-[-15deg] drop-shadow" viewBox="0 0 24 24">
                        <path d="M4.5 3V17.5L9.2 13L13.8 21.5L16.8 19.8L12.2 11.5L17.5 11.5L4.5 3Z" stroke="white" strokeWidth="1.5" />
                      </svg>
                    </motion.div>

                    <button 
                      onClick={() => { setActiveTab('sales'); setIsUserInteracting(true); }}
                      className={`relative px-4 py-2 text-[10px] font-bold rounded-lg transition-colors z-10 ${
                        activeTab === 'sales' 
                          ? 'text-rose-650 dark:text-white font-extrabold' 
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                      }`}
                    >
                      {activeTab === 'sales' && (
                        <motion.span 
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      PDV de Vendas
                    </button>

                    <button 
                      onClick={() => { setActiveTab('stock'); setIsUserInteracting(true); }}
                      className={`relative px-4 py-2 text-[10px] font-bold rounded-lg transition-colors z-10 ${
                        activeTab === 'stock' 
                          ? 'text-rose-650 dark:text-white font-extrabold' 
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                      }`}
                    >
                      {activeTab === 'stock' && (
                        <motion.span 
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      Controle de Estoque
                    </button>

                    <button 
                      onClick={() => { setActiveTab('catalog'); setIsUserInteracting(true); }}
                      className={`relative px-4 py-2 text-[10px] font-bold rounded-lg transition-colors z-10 ${
                        activeTab === 'catalog' 
                          ? 'text-rose-650 dark:text-white font-extrabold' 
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                      }`}
                    >
                      {activeTab === 'catalog' && (
                        <motion.span 
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      Vitrine Virtual
                    </button>

                    <button 
                      onClick={() => { setActiveTab('finance'); setIsUserInteracting(true); }}
                      className={`relative px-4 py-2 text-[10px] font-bold rounded-lg transition-colors z-10 ${
                        activeTab === 'finance' 
                          ? 'text-rose-650 dark:text-white font-extrabold' 
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                      }`}
                    >
                      {activeTab === 'finance' && (
                        <motion.span 
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      Fluxo Financeiro
                    </button>
                  </div>

              {/* Window Content */}
              <div className="p-6 bg-slate-50/40 dark:bg-zinc-950/40 min-h-[340px] flex flex-col justify-between transition-all duration-300 overflow-hidden relative">
                
                <AnimatePresence mode="wait">
                  {activeTab === 'sales' && (
                    <motion.div 
                      key="sales"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full"
                    >
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
                        <button className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 active:scale-[0.98] transition-transform">
                          <ShoppingBag className="w-4 h-4" /> Finalizar Venda
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'stock' && (
                    <motion.div 
                      key="stock"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full"
                    >
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
                            <div className="p-2 bg-rose-100 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 rounded-lg">
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
                    </motion.div>
                  )}

                  {activeTab === 'catalog' && (
                    <motion.div 
                      key="catalog"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full"
                    >
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
                    </motion.div>
                  )}

                  {activeTab === 'finance' && (
                    <motion.div 
                      key="finance"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full"
                    >
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
                          <p className="text-lg font-bold text-rose-650 dark:text-rose-450">R$ 14.850,00</p>
                          <span className="text-[9px] text-slate-400">Meta mensal 75%</span>
                        </div>
                      </div>

                      {/* Miniature chart bar representation */}
                      <div className="flex items-end gap-1.5 h-12 w-full pt-2">
                        <motion.div initial={{ height: 0 }} animate={{ height: "50%" }} transition={{ duration: 0.5 }} className="bg-rose-200 dark:bg-zinc-800 w-full h-6 rounded-md" />
                        <motion.div initial={{ height: 0 }} animate={{ height: "66%" }} transition={{ duration: 0.5, delay: 0.05 }} className="bg-rose-200 dark:bg-zinc-800 w-full h-8 rounded-md" />
                        <motion.div initial={{ height: 0 }} animate={{ height: "33%" }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-rose-200 dark:bg-zinc-800 w-full h-4 rounded-md" />
                        <motion.div initial={{ height: 0 }} animate={{ height: "83%" }} transition={{ duration: 0.5, delay: 0.15 }} className="bg-rose-300 dark:bg-zinc-700 w-full h-10 rounded-md" />
                        <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-rose-600 w-full h-12 rounded-md" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>

          </div>

          {/* Monitor Stand Base */}
          <div className="hidden lg:flex flex-col items-center -mt-1 select-none">
            <div className="w-16 h-10 bg-slate-850 dark:bg-zinc-800 border-x border-slate-800 dark:border-zinc-700" />
            <div className="w-44 h-3 bg-slate-800 dark:bg-zinc-700 rounded-full shadow-md" />
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

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            
            {/* Card 1: Vitrine Virtual (Grande: col-span-2) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="group col-span-1 lg:col-span-2 p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02] flex flex-col md:flex-row justify-between gap-6 overflow-hidden relative"
            >
              <div className="flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold mb-6 group-hover:scale-115 transition-transform duration-300">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sua Vitrine Virtual no WhatsApp</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                    Suas clientes navegam por um catálogo digital impecável (estilo Sephora), adicionam os cosméticos ao carrinho e enviam o pedido fechado direto no seu WhatsApp.
                  </p>
                </div>
                <div className="mt-6">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full">
                    Aparência Profissional
                  </span>
                </div>
              </div>

              {/* Simulated Mobile Vitrine (Right Side) */}
              <div className="flex-shrink-0 w-full md:w-64 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl p-4 border border-slate-200/50 dark:border-zinc-800/50 shadow-inner relative overflow-hidden h-60 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/40 dark:border-zinc-900">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-white">🌸 Sua Vitrine de Beleza</span>
                  <span className="text-[9px] text-slate-400 bg-slate-200/50 dark:bg-zinc-900 px-2 py-0.5 rounded-full">Online</span>
                </div>

                <div className="my-auto space-y-2.5">
                  <div className="flex gap-2 items-center p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-[10px]">BT</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-850 dark:text-zinc-200 truncate">Batom Velvet Matte</p>
                      <p className="text-[9px] text-rose-500 font-semibold">R$ 49,90</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-xl opacity-90">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center text-white font-extrabold text-[10px]">GL</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-850 dark:text-zinc-200 truncate">Gloss Aura Glow</p>
                      <p className="text-[9px] text-rose-500 font-semibold">R$ 39,90</p>
                    </div>
                  </div>
                </div>

                <button className="w-full py-2 bg-emerald-600 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
                  <ShoppingBag className="w-3.5 h-3.5" /> Enviar Pedido via WhatsApp
                </button>
              </div>
            </motion.div>

            {/* Card 2: Estoque Inteligente (Normal: col-span-1) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="group p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02] flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold mb-6 group-hover:scale-115 transition-transform duration-300">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Estoque Sem Erros</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Dê adeus ao sumiço de batons e bases. Cadastre seus cosméticos e o estoque é baixado automaticamente a cada venda do PDV ou WhatsApp.
                </p>
              </div>

              {/* Alert Mockup */}
              <div className="mt-6 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[120px]">Batom Matte Aura</p>
                  <span className="text-[8px] text-rose-500 dark:text-rose-455 font-semibold">Reposição Crítica</span>
                </div>
                <span className="text-[9px] font-bold text-rose-600 bg-rose-500/10 px-2 py-1 rounded-full">
                  1 un. restante
                </span>
              </div>
            </motion.div>

            {/* Card 3: CRM de Ouro (Normal: col-span-1) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="group p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02] flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold mb-6 group-hover:scale-115 transition-transform duration-300">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Relacionamento de Ouro</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Guarde as preferências das suas clientes, como tom favorito de base ou fragrâncias preferidas, e envie cupons no aniversário dela com um clique.
                </p>
              </div>

              {/* Customer Preference Mockup */}
              <div className="mt-6 p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-900 dark:text-white">Letícia Souza</p>
                  <span className="text-[8px] bg-rose-500/10 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">VIP</span>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">✨ Gosto: Tons Matte Nudes • Pele Oleosa</p>
              </div>
            </motion.div>

            {/* Card 4: Calculadora de Lucro (Grande: col-span-2) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="group col-span-1 lg:col-span-2 p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02] flex flex-col md:flex-row justify-between gap-6 overflow-hidden relative"
            >
              <div className="flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold mb-6 group-hover:scale-115 transition-transform duration-300">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Saiba exatamente o seu lucro líquido</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                    Faturamento não é lucro. O Mimus calcula o custo unitário de fornecedores e desconta do preço de venda, mostrando o lucro real e a margem líquida da sua loja automaticamente.
                  </p>
                </div>
                <div className="mt-6">
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full">
                    Gestão Financeira Descomplicada
                  </span>
                </div>
              </div>

              {/* Profit Margin Widget */}
              <div className="flex-shrink-0 w-full md:w-64 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl p-4 border border-slate-200/50 dark:border-zinc-800/50 shadow-inner flex flex-col justify-between h-56">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cálculo de Margem Real</span>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Preço de Venda:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R$ 80,00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-rose-500">
                    <span>Preço de Custo (BT):</span>
                    <span>- R$ 40,00</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-zinc-900 my-1 pt-1 flex items-center justify-between text-xs font-bold text-emerald-600">
                    <span>Lucro Líquido:</span>
                    <span>+ R$ 40,00</span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">Sua Margem: 50.0% Lucro</span>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Sincronização Online (Normal: col-span-1) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="group p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02] flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold mb-6 group-hover:scale-115 transition-transform duration-300">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Estoque Físico & Online</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Conecte o estoque do Mimus com o seu e-commerce da Loja Integrada. Se vendeu no físico ou no online, a quantidade atualiza em tempo real.
                </p>
              </div>

              {/* Connection Status Mockup */}
              <div className="mt-6 p-3 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Sincronizado</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Loja Integrada API</span>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* CADERNO VS MIMUS COMPARISON */}
      <section className="py-20 md:py-28 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 relative overflow-hidden border-t border-slate-100 dark:border-zinc-900">
        <div className="absolute top-1/2 left-1/2 w-[35rem] h-[35rem] bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
          <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">A Escolha é Sua</h2>
          <p className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Como você quer gerenciar sua loja hoje?</p>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-lg mx-auto">Compare a rotina tradicional e exaustiva do caderno com a tranquilidade de usar o Mimus.</p>
          
          {/* Toggle Switch */}
          <div className="inline-flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 mt-4 relative">
            <button 
              onClick={() => setComparisonMode('caderno')}
              className={`relative px-6 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 z-10 flex items-center gap-2 ${
                comparisonMode === 'caderno' 
                  ? 'text-rose-650 dark:text-rose-455' 
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800'
              }`}
            >
              {comparisonMode === 'caderno' && (
                <motion.span 
                  layoutId="activeComparisonIndicator"
                  className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>O Caos do Caderno</span>
            </button>
            <button 
              onClick={() => setComparisonMode('mimus')}
              className={`relative px-6 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 z-10 flex items-center gap-2 ${
                comparisonMode === 'mimus' 
                  ? 'text-white' 
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800'
              }`}
            >
              {comparisonMode === 'mimus' && (
                <motion.span 
                  layoutId="activeComparisonIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-500 rounded-xl shadow-md -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>A Elegância do Mimus</span>
            </button>
          </div>
        </div>

        {/* Content Showcase container */}
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 shadow-xl overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait">
            {comparisonMode === 'caderno' ? (
              <motion.div 
                key="caderno"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="p-8 md:p-12 space-y-6 bg-amber-50/10 dark:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-amber-200/20">
                  <span className="text-2xl">📓</span>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-zinc-200">Rotina no Caderno & Anotações</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Anotando tudo correndo entre um cliente e outro</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-rose-500 text-sm mt-0.5">✖</span>
                      <p className="text-sm text-slate-600 dark:text-zinc-400">
                        <strong>Estoque furado:</strong> Vende um batom na correria do WhatsApp, esquece de dar baixa e depois precisa pedir desculpas para a cliente porque acabou.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-rose-500 text-sm mt-0.5">✖</span>
                      <p className="text-sm text-slate-600 dark:text-zinc-400">
                        <strong>Clientes esquecidas:</strong> O aniversário da sua melhor cliente passa em branco porque a data estava salva em uma folha antiga que você não viu.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-rose-500 text-sm mt-0.5">✖</span>
                      <p className="text-sm text-slate-600 dark:text-zinc-400">
                        <strong>Margem incerta:</strong> Você vê a conta bancária subir e descer, mas não sabe se o preço cobrado cobre o custo real das mercadorias.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-rose-500 text-sm mt-0.5">✖</span>
                      <p className="text-sm text-slate-600 dark:text-zinc-400">
                        <strong>WhatsApp bagunçado:</strong> Perder horas rolando o chat para achar quais cores de esmalte a cliente comprou na última visita.
                      </p>
                    </div>
                  </div>

                  {/* Real Notebook Polaroid Image */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="bg-white dark:bg-zinc-950 p-3 pb-8 rounded-2xl shadow-xl border border-slate-200/50 dark:border-zinc-800/80 rotate-[-3deg] hover:rotate-0 transition-transform duration-300 max-w-[240px]">
                      <div className="w-full h-44 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900">
                        <img 
                          src="/mulher_escrevendo_caderno.png" 
                          alt="Empreendedora escrevendo no caderno"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <p className="text-center font-mono text-[9px] text-slate-400 mt-4 leading-none select-none">
                        ⚠️ Sua rotina atual?
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="mimus"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="p-8 md:p-12 space-y-6 bg-gradient-to-br from-rose-500/[0.02] via-pink-500/[0.01] to-violet-500/[0.02] dark:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-rose-100 dark:border-zinc-800">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Rotina com Mimus</h4>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Gestão integrada e controle absoluto em segundos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 text-sm mt-0.5">✔</span>
                      <p className="text-sm text-slate-655 dark:text-zinc-350">
                        <strong>Baixa automática:</strong> Vendeu? O Mimus atualiza o estoque físico e a Loja Integrada imediatamente. Sem furos, sem estresse.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 text-sm mt-0.5">✔</span>
                      <p className="text-sm text-slate-655 dark:text-zinc-350">
                        <strong>Lembretes inteligentes:</strong> O sistema avisa os aniversários do dia. Mande um cupom de desconto em segundos e garanta uma nova venda.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 text-sm mt-0.5">✔</span>
                      <p className="text-sm text-slate-655 dark:text-zinc-350">
                        <strong>Lucro na tela:</strong> Margem líquida calculada automaticamente. Saiba exatamente qual produto gera mais resultado para sua loja.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 text-sm mt-0.5">✔</span>
                      <p className="text-sm text-slate-655 dark:text-zinc-350">
                        <strong>Histórico unificado:</strong> Um clique no perfil da cliente e você vê tudo o que ela já comprou, preferências de tons de maquiagem e ticket médio.
                      </p>
                    </div>
                  </div>

                  {/* Mimus App Preview Card (Right side) */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="bg-white dark:bg-zinc-950 p-3 pb-8 rounded-2xl shadow-xl border border-slate-200/50 dark:border-zinc-800/80 rotate-[3deg] hover:rotate-0 transition-transform duration-300 max-w-[240px]">
                      <div className="w-full h-44 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900">
                        <img 
                          src="/mulher_usando_sistema.png" 
                          alt="Empreendedora usando o Mimus"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <p className="text-center font-mono text-[9px] text-rose-600 dark:text-rose-455 mt-4 leading-none select-none">
                        ✨ Sua nova realidade!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SIMULATED CLIENT VITRINE */}
      <section id="preview" className="py-20 md:py-28 bg-white dark:bg-zinc-900 transition-colors duration-300 relative border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Interactive info & selectors */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25">
                <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-455" />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-455 tracking-wide uppercase">Vitrine de Alta Conversão</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Sua marca com a presença digital que ela merece.
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed">
                Suas clientes acessam sua vitrine direto pelo celular. Sem precisar baixar aplicativos ou fazer logins complicados. Elas selecionam o produto, montam o carrinho e te mandam o pedido pronto.
              </p>

              {/* Product interactive selectors */}
              <div className="space-y-3 pt-4">
                {[
                  { name: "Batom Velvet Matte", price: "R$ 49,90", desc: "Toque aveludado com secagem confortável." },
                  { name: "Gloss Aura Glow", price: "R$ 39,90", desc: "Brilho holográfico e hidratação intensa." },
                  { name: "Base Fluida Hydra", price: "R$ 89,90", desc: "Acabamento natural com ácido hialurônico." },
                  { name: "Perfume Rose L'Amour", price: "R$ 189,90", desc: "Fragrância importada de longa duração." }
                ].map((prod, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setVitrineActiveProduct(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex justify-between items-center ${
                      vitrineActiveProduct === idx 
                        ? 'border-rose-500 bg-rose-500/[0.03] dark:bg-rose-500/[0.02] shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200 dark:border-zinc-800 dark:hover:border-zinc-800 bg-transparent'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${vitrineActiveProduct === idx ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{prod.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{prod.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Simulated Mobile Mockup */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-[320px] h-[600px] bg-white dark:bg-zinc-950 rounded-[40px] border-[8px] border-slate-900 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* iPhone Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 dark:bg-zinc-800 rounded-full z-30 flex items-center justify-between px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-2.5 h-1 bg-slate-850 rounded-full" />
                </div>

                {/* Store Header */}
                <div className="pt-9 pb-3 px-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs font-extrabold">M</div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-800 dark:text-white">Mimus Beauty Store</h4>
                      <p className="text-[7px] text-emerald-500 font-semibold flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" /> Online agora
                      </p>
                    </div>
                  </div>
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                </div>

                {/* Store Catalog Content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {/* Category tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
                    <span className="text-[8px] font-bold bg-rose-600 text-white px-2.5 py-1 rounded-full whitespace-nowrap">Maquiagem</span>
                    <span className="text-[8px] font-bold bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 px-2.5 py-1 rounded-full whitespace-nowrap">Perfumes</span>
                    <span className="text-[8px] font-bold bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 px-2.5 py-1 rounded-full whitespace-nowrap">Skincare</span>
                  </div>

                  {/* Banner */}
                  <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 p-3.5 rounded-2xl text-white relative overflow-hidden">
                    <span className="text-[6px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-full font-bold">Lançamento</span>
                    <h5 className="text-[11px] font-extrabold mt-1">Coleção Outono Elegante</h5>
                    <p className="text-[7px] text-white/80">Frete grátis em compras acima de R$ 150</p>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Batom Velvet Matte", price: "R$ 49,90", image: "from-pink-400 to-rose-500" },
                      { name: "Gloss Aura Glow", price: "R$ 39,90", image: "from-purple-400 to-pink-500" },
                      { name: "Base Fluida Hydra", price: "R$ 89,90", image: "from-amber-200 to-rose-300" },
                      { name: "Perfume Rose L'Amour", price: "R$ 189,90", image: "from-fuchsia-400 to-violet-600" }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-2xl border transition-all duration-200 ${
                          vitrineActiveProduct === idx 
                            ? 'border-rose-500 bg-rose-500/[0.02] dark:bg-rose-500/[0.01]' 
                            : 'border-slate-100 dark:border-zinc-900'
                        }`}
                      >
                        <div className={`h-20 w-full bg-gradient-to-tr ${item.image} rounded-xl mb-2 flex items-center justify-center text-white/20 font-black text-xl`}>
                          ✨
                        </div>
                        <h6 className="text-[9px] font-bold text-slate-800 dark:text-zinc-200 truncate">{item.name}</h6>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] font-extrabold text-slate-900 dark:text-white">{item.price}</span>
                          <span className="text-[7px] text-rose-600 dark:text-rose-455 font-bold">Ver +</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Floating Cart Drawer */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider font-semibold block">Item Selecionado</span>
                    <span className="text-[9px] font-bold text-slate-800 dark:text-white">
                      {[
                        "Batom Velvet Matte",
                        "Gloss Aura Glow",
                        "Base Fluida Hydra",
                        "Perfume Rose L'Amour"
                      ][vitrineActiveProduct]}
                    </span>
                  </div>
                  <button className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[8px] rounded-lg shadow-sm flex items-center gap-1 active:scale-95 transition-transform">
                    Adicionar no WhatsApp <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>

              </div>
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/register" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Experimentar Mimus AI Grátis <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Right chat simulation */}
          <div className="lg:col-span-7 w-full flex flex-col space-y-4">
            
            {/* Quick Action Tabs */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start relative">
              {aiCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAICommand(idx)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
                    activeAICommand === idx
                      ? 'border-transparent text-white shadow-md shadow-rose-500/10 z-10'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {activeAICommand === idx && (
                    <motion.span
                      layoutId="activeAICommandIndicator"
                      className="absolute inset-0 bg-rose-600 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
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
                    <Sparkles className="w-5 h-5 text-rose-650 dark:text-rose-455 text-rose-600 dark:text-rose-400" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Bianca • Mimus AI</h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">Sua Assistente Virtual Inteligente</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                </div>
              </div>

              {/* Chat Body */}
              <div className="p-6 flex-1 bg-slate-50/20 dark:bg-zinc-950/20 flex flex-col justify-end space-y-4 overflow-hidden">
                
                {/* User Message Bubble */}
                <motion.div 
                  key={`user-msg-${activeAICommand}`}
                  initial={{ opacity: 0, scale: 0.95, y: 15, x: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="self-end max-w-[85%] bg-rose-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md text-sm font-medium"
                >
                  <p className="font-mono text-xs opacity-90 mb-0.5">Sua Mensagem</p>
                  <p className="leading-relaxed">
                    {aiCommands[activeAICommand].command}
                  </p>
                </motion.div>

                {/* AI Response Bubble */}
                <motion.div 
                  key={`ai-msg-${activeAICommand}`}
                  initial={{ opacity: 0, scale: 0.95, y: 15, x: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.15 }}
                  className="self-start max-w-[85%] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-md text-sm min-h-[140px] flex flex-col justify-center"
                >
                  <p className="font-bold text-xs text-rose-500 dark:text-rose-455 mb-1">Bianca</p>
                  
                  {isTyping ? (
                    <div className="flex items-center gap-1.5 py-2">
                      <motion.span
                        className="w-2 h-2 bg-slate-400 dark:bg-zinc-650 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-slate-400 dark:bg-zinc-650 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-slate-400 dark:bg-zinc-650 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }}
                      />
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
                </motion.div>

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
            <motion.div 
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors"
            >
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/register" 
                  className="w-full text-center font-bold text-xs py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-white rounded-xl mt-8 transition-colors block"
                >
                  Ativar Plano Grátis
                </Link>
              </motion.div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(244, 63, 94, 0.15)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-zinc-900 border-2 border-rose-500 dark:border-rose-600 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden transition-colors"
            >
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/register" 
                  className="w-full text-center font-bold text-xs py-3.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl mt-8 transition-colors shadow-lg shadow-rose-500/20 block"
                >
                  Experimentar Versão Pro
                </Link>
              </motion.div>
            </motion.div>

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
