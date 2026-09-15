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
  Bell,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  MessageCircle,
  Boxes,
  Clock,
  Star,
  Layers,
  Heart,
  Store,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [activeFeatureTab, setActiveFeatureTab] = useState<'vitrine' | 'pdv' | 'stock' | 'ai'>('vitrine')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [activeAICommand, setActiveAICommand] = useState(0)
  const [comparisonMode, setComparisonMode] = useState<'before' | 'after'>('after')

  const aiCommands = [
    {
      label: 'Cadastrar Produto',
      command: 'Cadastre o Gloss Labial Aura Glow por R$ 39,90 com 15 unidades',
      response: '✨ Gloss Labial Aura Glow cadastrado com sucesso! Preço: R$ 39,90. Estoque: 15 un. Já visível na sua vitrine virtual! 🌸',
      tag: 'Catálogo'
    },
    {
      label: 'Registrar Venda PDV',
      command: 'Vendi 2 Gloss Aura Glow para @Camila no Pix',
      response: '✅ Venda de R$ 79,80 registrada! Estoque atualizado automaticamente de 15 para 13 unidades.',
      tag: 'PDV Balcão'
    },
    {
      label: 'Alerta de Estoque',
      command: 'Mimus, quais cosméticos precisam de reposição?',
      response: '⚠️ 2 produtos no limite crítico: Batom Velvet BT (1 un.) e Bruma Fixadora Glow (0 un.). Lista de compras gerada!',
      tag: 'Estoque'
    },
    {
      label: 'Resumo Financeiro',
      command: 'Quanto a loja faturou hoje?',
      response: '📊 Faturamento hoje: R$ 1.485,20 (18 vendas). Lucro líquido estimado: R$ 682,40.',
      tag: 'Financeiro'
    }
  ]

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

  // Autoplay AI commands
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAICommand((prev) => (prev + 1) % aiCommands.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [aiCommands.length])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 font-sans selection:bg-rose-500 selection:text-white transition-colors duration-300">
      
      {/* BACKGROUND GLOWS (MANYCHAT STYLE SUBTLE RADIAL AMBIENCE) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10rem] left-1/2 -translate-x-1/2 w-[70rem] h-[35rem] bg-gradient-to-b from-rose-500/10 via-pink-500/5 to-transparent blur-[120px] dark:from-rose-600/15 dark:via-fuchsia-600/10" />
        <div className="absolute top-[45rem] right-[-10rem] w-[45rem] h-[45rem] bg-gradient-to-l from-rose-400/8 via-pink-400/5 to-transparent blur-[140px] dark:from-rose-950/20" />
        <div className="absolute top-[100rem] left-[-15rem] w-[50rem] h-[50rem] bg-gradient-to-r from-violet-500/8 via-fuchsia-400/5 to-transparent blur-[150px] dark:from-purple-950/20" />
      </div>

      {/* TOP FLOATING PILL NAVBAR (MANYCHAT INSPIRATION) */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 max-w-7xl mx-auto">
        <nav className="rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-lg shadow-slate-900/5 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Mimus<span className="text-rose-500 group-hover:scale-125 inline-block transition-transform">.</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
              Cosmetics Hub
            </span>
          </Link>

          {/* Desktop Navigation Links (Uppercase pill style like Manychat) */}
          <div className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            <a href="#recursos" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Recursos</a>
            <a href="#ecossistema" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Canais</a>
            <a href="#comparativo" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Antes & Depois</a>
            <a href="#demonstracao" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Demonstração</a>
            <a href="#precos" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Preços</a>
            <a href="#depoimentos" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">FAQ</a>
          </div>

          {/* Navbar Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Alternar tema claro/escuro"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Login Link */}
            <Link 
              href="/login" 
              className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 transition-colors"
            >
              Entrar
            </Link>

            {/* CTA Pill Button (Manychat style rounded-full) */}
            <Link
              href="/register"
              className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wide shadow-md shadow-rose-600/25 hover:shadow-rose-600/40 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Comece já</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </nav>
      </div>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-20 z-40 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl lg:hidden flex flex-col gap-4 text-sm font-semibold uppercase tracking-wider"
          >
            <a href="#recursos" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Recursos</a>
            <a href="#ecossistema" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Canais de Venda</a>
            <a href="#comparativo" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Antes & Depois</a>
            <a href="#demonstracao" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Demonstração</a>
            <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Planos & Preços</a>
            <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Depoimentos</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-zinc-800">Perguntas Frequentes</a>
            
            <div className="pt-2 flex flex-col gap-2.5">
              <Link 
                href="/login" 
                className="w-full py-2.5 text-center font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-800 rounded-full"
              >
                Entrar na minha conta
              </Link>
              <Link 
                href="/register" 
                className="w-full py-2.5 text-center font-bold text-xs uppercase tracking-wider text-white bg-rose-600 rounded-full shadow-lg shadow-rose-600/30"
              >
                Criar loja grátis agora
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION (MANYCHAT HIGH-IMPACT ARCHITECTURE) */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          {/* Social Proof Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 shadow-sm"
          >
            <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 fill-rose-500" />
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Amado por centenas de lojistas e marcas de beleza
            </span>
          </motion.div>

          {/* Headline Manychat Style: bold, emotional, punchy */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]"
          >
            Faça cada produto, venda e cliente <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent">valer a pena</span>.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            A plataforma tudo-em-um para lojas de cosméticos e maquiagem. Tenha controle total do estoque, venda no balcão e no WhatsApp com vitrine virtual, e acompanhe seu lucro real com inteligência artificial.
          </motion.p>

          {/* Dual Pill CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-rose-600/30 hover:shadow-rose-600/45 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Comece já gratuitamente</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#demonstracao"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current text-rose-500" />
              <span>Ver demonstração</span>
            </a>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 dark:text-zinc-400"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Grátis para começar
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Vitrine no ar em 2 minutos
            </span>
          </motion.div>

        </div>

        {/* HERO INTERACTIVE SHOWCASE (MANYCHAT STYLE PRODUCT HERO FRAME) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-6xl mx-auto mt-12 sm:mt-16 relative"
        >
          {/* Outer glow frame */}
          <div className="rounded-[2.5rem] p-2 sm:p-4 bg-gradient-to-b from-slate-200/80 via-slate-100/40 to-transparent dark:from-zinc-800/80 dark:via-zinc-900/40 border border-slate-200/60 dark:border-zinc-800 shadow-2xl">
            <div className="rounded-[2rem] bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-inner p-4 sm:p-8 space-y-6">
              
              {/* Fake Window Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs font-bold text-slate-400 font-mono">app.mimus.com.br/dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Loja Aberta • 100% Sincronizado
                  </span>
                </div>
              </div>

              {/* Showcase Grid inside Mockup */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Live AI Assistant Simulator */}
                <div className="lg:col-span-7 bg-slate-50/70 dark:bg-zinc-900/60 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">Mimus AI Assistente</h4>
                        <span className="text-[10px] text-slate-400">Comandos inteligentes por texto e áudio</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {aiCommands[activeAICommand].tag}
                    </span>
                  </div>

                  {/* Chat interaction simulation */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 justify-end">
                      <div className="max-w-md p-3 rounded-2xl rounded-tr-none bg-rose-600 text-white text-xs font-medium shadow-sm">
                        💬 "{aiCommands[activeAICommand].command}"
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <div className="max-w-md p-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs shadow-sm space-y-1">
                        <p>{aiCommands[activeAICommand].response}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Command selectors */}
                  <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-200/60 dark:border-zinc-800">
                    {aiCommands.map((cmd, idx) => (
                      <button
                        key={cmd.label}
                        onClick={() => setActiveAICommand(idx)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                          activeAICommand === idx
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
                        }`}
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Live Floating Widgets (Sales, Stock, Vitrine) */}
                <div className="lg:col-span-5 space-y-3.5">
                  
                  {/* Widget 1: Faturamento Hoje */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Faturamento Hoje</span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">R$ 1.485,20</h4>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      +28% vs ontem
                    </span>
                  </div>

                  {/* Widget 2: Alerta de Estoque Crítico */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Controle de Estoque</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Gloss Labial Aura Glow</h4>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      12 un. em estoque
                    </span>
                  </div>

                  {/* Widget 3: Pedido Recebido via Vitrine */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-200/70 dark:border-rose-900/40 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-rose-600 dark:text-rose-400">Novo Pedido na Vitrine!</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">R$ 119,80 • Letícia F.</h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Pix Pago
                    </span>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* ECOSYSTEM / CHANNELS SECTION ("ENCONTRE SUAS CLIENTES ONDE ELAS ESTIVEREM") */}
      <section id="ecossistema" className="py-20 md:py-28 px-4 sm:px-6 border-t border-slate-200/60 dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Ecossistema Completo de Vendas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Tudo o que a sua loja de beleza precisa em um só lugar.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400">
              Chega de usar três aplicativos diferentes e uma planilha que vive travando. O Mimus integra cada etapa do seu negócio.
            </p>
          </div>

          {/* 6 Core Channels Grid (Manychat style card grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Vitrine Virtual */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Instagram & WhatsApp</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Vitrine Virtual na Bio</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Catálogo online com fotos em alta qualidade, preços, variações de tons e botão de pedido direto no seu WhatsApp pronto para envio.
              </p>
            </div>

            {/* Card 2: PDV de Balcão */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-600">Venda Rápida</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">PDV em 5 Segundos</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Atenda sua cliente no balcão sem filas. Leitor de código de barras, cálculo de troco, Pix automático e comprovante personalizado.
              </p>
            </div>

            {/* Card 3: Estoque Inteligente */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Contagem & Baixa</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Controle de Estoque & Baixa</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Faça a contagem física dos seus materiais, identifique divergências e dê baixa em massa refletindo instantaneamente no Financeiro.
              </p>
            </div>

            {/* Card 4: Financeiro */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Fluxo de Caixa</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Financeiro & Lucro Real</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Lançamento rápido de receitas e despesas, controle de fornecedores, fretes e painel de faturamento diário sem segredos contábeis.
              </p>
            </div>

            {/* Card 5: Mimus AI */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Inteligência Artificial</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Mimus AI Integrada</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Cadastre batons, paletas e perfumes apenas enviando um áudio ou foto. A inteligência artificial preenche título, preço e categoria.
              </p>
            </div>

            {/* Card 6: CRM de Clientes */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Fidelização</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Histórico & Recompra</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Saiba quais clientes mais compram, quais produtos estão acabando e receba lembretes para reengajar no WhatsApp com novidades.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* BEFORE & AFTER COMPARISON SECTION ("SUA LOJA: ANTES & DEPOIS" - MANYCHAT SIGNATURE STYLE) */}
      <section id="comparativo" className="py-20 md:py-28 px-4 sm:px-6 bg-slate-100/70 dark:bg-zinc-900/40 border-y border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              A Virada de Chave
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Sua loja: antes & depois do Mimus
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Veja o que muda na sua rotina quando você troca o caderno pela gestão inteligente.
            </p>
          </div>

          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Antes: O Caos do Caderno */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full">
                  Sem o Mimus
                </span>
                <span className="text-xs text-slate-400 font-semibold">Só dor de cabeça</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Caderno rasurado, produtos vencendo e incerteza no lucro
              </h3>

              <ul className="space-y-4 text-xs text-slate-600 dark:text-zinc-400">
                <li className="flex items-start gap-3">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Você anota vendas em folhas de papel e perde o controle do fiado.</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Cliente pede produto no WhatsApp e você precisa ir correndo na caixa ver se tem.</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Descobre que cosméticos venceram ou sumiram sem saber quem vendeu.</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Passa o domingo inteiro somando notinhas para tentar saber quanto sobrou.</span>
                </li>
              </ul>
            </div>

            {/* Depois: A Paz com o Mimus */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-rose-50/60 via-white to-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 border-2 border-rose-500/80 shadow-xl shadow-rose-600/10 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-rose-100 dark:border-zinc-800 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-white bg-rose-600 px-3 py-1 rounded-full shadow-sm">
                  Com o Mimus
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Mais lucro e liberdade</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Vitrine vendendo 24h, estoque sincronizado e financeiro no azul
              </h3>

              <ul className="space-y-4 text-xs text-slate-700 dark:text-zinc-300">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Sua vitrine virtual no Instagram vende enquanto você descansa.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Estoque baixa sozinho no momento em que a venda é concluída.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Contagem física e baixa de estoque em massa lançada direto no Financeiro.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Painel exibe faturamento, despesas e lucro líquido com precisão de centavos.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* INTERACTIVE TOUR / DEMO SECTION ("VEJA COMO FUNCIONA NA PRÁTICA") */}
      <section id="demonstracao" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Interface Intuitiva
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Veja o Mimus funcionando na prática
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Desenvolvido especificamente para ser fácil e rápido no celular ou computador.
            </p>
          </div>

          {/* Tour Tabs Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <button
              onClick={() => setActiveFeatureTab('vitrine')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all ${
                activeFeatureTab === 'vitrine'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              1. Vitrine & Catálogo
            </button>
            <button
              onClick={() => setActiveFeatureTab('pdv')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all ${
                activeFeatureTab === 'pdv'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              2. Venda Rápida (PDV)
            </button>
            <button
              onClick={() => setActiveFeatureTab('stock')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all ${
                activeFeatureTab === 'stock'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              3. Estoque & Baixa
            </button>
            <button
              onClick={() => setActiveFeatureTab('ai')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all ${
                activeFeatureTab === 'ai'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              4. Inteligência Artificial
            </button>
          </div>

          {/* Interactive Screen Preview */}
          <div className="p-4 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl max-w-4xl mx-auto">
            {activeFeatureTab === 'vitrine' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vitrine Virtual na Bio do Instagram</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Sua loja 24h no ar com link direto para o WhatsApp</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    www.appmimus.com.br/store/sua-loja
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="h-32 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 font-bold text-xs">
                      Gloss Aura Glow
                    </div>
                    <span className="font-bold text-xs block text-slate-800 dark:text-white">Gloss Labial Aura Glow</span>
                    <span className="text-rose-600 font-extrabold text-xs block">R$ 39,90</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="h-32 rounded-xl bg-pink-100/60 dark:bg-pink-950/40 flex items-center justify-center text-pink-500 font-bold text-xs">
                      Batom Velvet BT
                    </div>
                    <span className="font-bold text-xs block text-slate-800 dark:text-white">Batom Líquido Velvet BT</span>
                    <span className="text-rose-600 font-extrabold text-xs block">R$ 49,90</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="h-32 rounded-xl bg-purple-100/60 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 font-bold text-xs">
                      Bruma Fixadora
                    </div>
                    <span className="font-bold text-xs block text-slate-800 dark:text-white">Bruma Fixadora Iluminadora</span>
                    <span className="text-rose-600 font-extrabold text-xs block">R$ 55,00</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'pdv' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">PDV Balcão Ágil</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Finalize vendas em segundos sem complicações</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Leitor de Barras Ativo</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">Itens no Carrinho (2 un.)</span>
                    <strong className="text-base text-slate-800 dark:text-white">Gloss Aura Glow + Batom Velvet</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total a Pagar</span>
                    <strong className="text-lg text-emerald-600">R$ 89,80</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button className="py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs text-center">Pix (QR Code)</button>
                  <button className="py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs text-center">Cartão Crédito</button>
                  <button className="py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs text-center">Dinheiro</button>
                </div>
              </div>
            )}

            {activeFeatureTab === 'stock' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contagem Física & Baixa em Massa</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Divergências ajustadas com débito automático no Financeiro</p>
                  </div>
                  <span className="text-xs font-extrabold text-rose-600">Baixa de Estoque</span>
                </div>

                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 p-2.5 bg-slate-100 dark:bg-zinc-850 font-bold text-slate-500">
                    <span>Produto</span>
                    <span className="text-center">Estoque Sistema</span>
                    <span className="text-center">Contagem Real</span>
                    <span className="text-right">Saída Financeiro</span>
                  </div>
                  <div className="grid grid-cols-4 p-3 border-t border-slate-100 dark:border-zinc-800 items-center">
                    <span className="font-bold">Base Líquida Matte Vivai</span>
                    <span className="text-center">24 un.</span>
                    <span className="text-center font-bold text-rose-600">20 un. (-4 un.)</span>
                    <span className="text-right font-bold text-rose-600">-R$ 40,00</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mimus AI Assistente 24h</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Cadastre produtos e consulte números pelo WhatsApp</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600">Gemini Pro Integrado</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-2">
                  <p className="font-bold text-rose-700 dark:text-rose-300">
                    🎙️ Você envia um áudio no WhatsApp:
                  </p>
                  <p className="italic text-slate-600 dark:text-zinc-400">
                    "Oi Mimus, chegaram 10 batons BT na cor Bruna por 45 reais cada um."
                  </p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    ✨ Mimus AI responde em 2 segundos: "Produto cadastrado com sucesso e estoque atualizado!"
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 3 STEPS ONBOARDING (MANYCHAT STYLE "TUDO RODANDO EM 3 PASSOS") */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-slate-100/60 dark:bg-zinc-900/30 border-t border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Facilidade Absoluta
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Tudo no ar e rodando em apenas 3 passos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Você não precisa de técnico nem de semanas de treinamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4 relative">
              <span className="w-10 h-10 rounded-full bg-rose-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-rose-600/30">
                1
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Crie sua conta grátis
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Leva menos de 1 minuto com seu e-mail ou Google. Sem necessidade de cartão de crédito.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4 relative">
              <span className="w-10 h-10 rounded-full bg-rose-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-rose-600/30">
                2
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Cadastre seus cosméticos
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Adicione seus produtos com foto e preço, importe por planilha CSV ou use nossa IA por áudio.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4 relative">
              <span className="w-10 h-10 rounded-full bg-rose-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-rose-600/30">
                3
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Comece a faturar
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Cole o link da vitrine na bio do seu Instagram, use o PDV de balcão e veja suas vendas crescerem.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* TESTIMONIALS / SOCIAL PROOF (MANYCHAT INFLUENCER/CREATOR CARD STYLE) */}
      <section id="depoimentos" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Histórias de Sucesso
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              O que dizem as lojistas de beleza
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Empreendedoras reais que transformaram suas lojas com o Mimus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Testimonial 1 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-black text-sm flex items-center justify-center">
                  TD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Toque Delicado</h4>
                  <span className="text-[10px] text-slate-400">@toquedelicado • Cosméticos & Make</span>
                </div>
              </div>
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                "O Mimus mudou a nossa vida na loja. Eu perdia noites somando papel e ainda tinha produto sumindo do estoque. Hoje a vitrine vende no WhatsApp e eu sei o lucro de cada dia!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 text-white font-black text-sm flex items-center justify-center">
                  AG
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Aura Glow Beauty</h4>
                  <span className="text-[10px] text-slate-400">@auraglow.make • 38k seguidores</span>
                </div>
              </div>
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                "A baixa de estoque em massa e o reflexo automático no financeiro são sensacionais. Nós economizamos mais de R$ 2.500 no mês só evitando perdas e compras desnecessárias."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 text-white font-black text-sm flex items-center justify-center">
                  BC
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bella Cosméticos</h4>
                  <span className="text-[10px] text-slate-400">@bellacosmeticos • Loja Física e Online</span>
                </div>
              </div>
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                "O PDV é muito rápido. No balcão eu finalizo a venda em 5 segundos no celular e o comprovante já vai pelo WhatsApp. Minhas clientes adoram o capricho da vitrine!"
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* PRICING PLANS (MANYCHAT PRICING ARCHITECTURE) */}
      <section id="precos" className="py-20 md:py-28 px-4 sm:px-6 bg-slate-100/60 dark:bg-zinc-900/40 border-t border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Planos Transparentes
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Sem contratos de fidelidade. Cancele ou altere seu plano quando quiser.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm mt-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <span>Anual</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500 text-white">
                  -20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Plan 1: Gratuito */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gratuito</span>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">R$ 0</span>
                  <span className="text-xs text-slate-400 font-semibold"> /mês</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Ideal para quem está começando a vender e precisa de organização inicial.
                </p>

                <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Até 25 produtos cadastrados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Vitrine Virtual básica
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> PDV Balcão simplificado
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Controle de estoque essencial
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 font-bold text-xs uppercase tracking-wider text-center transition-colors"
              >
                Começar Grátis
              </Link>
            </div>

            {/* Plan 2: Pro (Featured Manychat Style) */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-rose-500 shadow-2xl shadow-rose-600/15 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-widest shadow-md">
                Mais Escolhido
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Plano Pro</span>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    R$ {billingCycle === 'monthly' ? '49,90' : '39,90'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold"> /mês</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  A solução completa para lojistas que querem vender mais e ter controle total.
                </p>

                <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-200 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-500" /> <strong>Produtos ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-500" /> <strong>Vitrine Virtual Personalizada</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-500" /> PDV Completo com Pix e Recibo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-500" /> Baixa em Massa no Estoque & Financeiro
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-500" /> <strong>Mimus AI Assistente 24h</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-500" /> Suporte Prioritário no WhatsApp
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider text-center shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
              >
                Testar 14 Dias Grátis
              </Link>
            </div>

            {/* Plan 3: Equipe / Elite */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipe / Elite</span>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    R$ {billingCycle === 'monthly' ? '97,00' : '79,00'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold"> /mês</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Para franquias e lojas com múltiplos operadores e vendedoras.
                </p>

                <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Tudo do Plano Pro incluso
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Até 5 operadores de equipe
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Controle de permissões por funcionário
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Relatórios gerenciais avançados
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 font-bold text-xs uppercase tracking-wider text-center transition-colors"
              >
                Contratar Equipe
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION (MANYCHAT ACCORDION PATTERN) */}
      <section id="faq" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Perguntas frequentes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Respostas claras para as principais dúvidas de quem está começando com o Mimus.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Preciso cadastrar cartão de crédito para testar?',
                a: 'Não! Você pode criar sua conta gratuitamente sem informar dados de cartão. O teste do plano Pro é liberado de imediato e sem nenhum compromisso.'
              },
              {
                q: 'Como funciona a vitrine virtual para vender no WhatsApp?',
                a: 'Você recebe um link exclusivo (ex: appmimus.com.br/store/sualoja) para colocar na sua bio do Instagram. As clientes escolhem os produtos, tons e quantidades, e o pedido chega formatado direto no seu WhatsApp pronto para envio e cobrança.'
              },
              {
                q: 'Como funciona a baixa de estoque com reflexo no financeiro?',
                a: 'Na aba Estoque, você realiza a contagem física dos produtos. Havendo divergência, você confirma a baixa em massa e o sistema subtrai o estoque e gera a despesa correspondente na categoria "Baixa de Estoque" no Financeiro.'
              },
              {
                q: 'Posso usar o Mimus no celular?',
                a: 'Sim! A plataforma é 100% responsiva e otimizada para funcionar perfeitamente em celulares (Android e iPhone), tablets e computadores, sem precisar instalar nada pesado.'
              },
              {
                q: 'Consigo importar meus produtos por planilha?',
                a: 'Sim! Você pode importar em lote por arquivo CSV ou adicionar produtos instantaneamente por voz ou texto usando a Mimus AI.'
              },
              {
                q: 'Como funciona o cancelamento?',
                a: 'Você tem total liberdade. Não há fidelidade nem multas. Pode cancelar ou alterar seu plano a qualquer momento pelo painel.'
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-rose-600' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* FINAL HIGH-IMPACT CTA BANNER (MANYCHAT SIGNATURE ENDING) */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-zinc-900 to-rose-950 text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Pronta para o próximo nível?
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Transforme a gestão da sua loja de beleza hoje mesmo.
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Junte-se a centenas de lojistas que abandonaram o caderno e ganharam tempo, controle e faturamento com o Mimus.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Criar minha loja grátis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm uppercase tracking-wider transition-all text-center"
              >
                Já sou cliente
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 px-4 sm:px-6 text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              Mimus<span className="text-rose-500">.</span>
            </span>
            <span>• A plataforma inteligente para lojas de cosméticos.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <Link href="/termos" className="hover:text-rose-600 transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-rose-600 transition-colors">Privacidade</Link>
            <Link href="/suporte" className="hover:text-rose-600 transition-colors">Suporte</Link>
            <Link href="/login" className="hover:text-rose-600 transition-colors">Entrar</Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 mt-6 border-t border-slate-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} Mimus Tecnologia. Todos os direitos reservados.</span>
          <span>Feito com 💖 para empreendedoras de beleza.</span>
        </div>
      </footer>

    </div>
  )
}
