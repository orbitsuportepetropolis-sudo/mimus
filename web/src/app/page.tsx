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
              Criar Conta Grátis
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
              Criar Conta Grátis
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
              Gestão inteligente para sua loja de <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">beleza</span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-lg leading-relaxed">
              O Mimus ajuda lojistas a controlarem o estoque de maquiagens, realizarem vendas rápidas via PDV moderno, controlarem o fluxo financeiro e exibirem seus produtos em uma vitrine virtual encantadora.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                Começar Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                Acessar Painel
              </Link>
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
                  {activeTab === 'catalog' ? 'mimus.app/vitrine/sua-loja' : 'mimus.app/dashboard'}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">PDV Frente de Caixa Rápido</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Registre as vendas de cosméticos de forma rápida, aplique descontos, adicione clientes e imprima recibos em segundos pelo navegador ou tablet.
              </p>
            </div>

            {/* Feature 2: Smart Stock */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Estoque com Alerta de Validade</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Controle o estoque de batons, bases e pincéis. Receba avisos inteligentes de produtos próximos à data de vencimento e evite perdas financeiras.
              </p>
            </div>

            {/* Feature 3: Digital Catalog */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Vitrine Virtual Integrada</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Crie um catálogo online para sua loja e receba pedidos no WhatsApp. Altere banners, preços e destaque produtos de acordo com a campanha ativa.
              </p>
            </div>

            {/* Feature 4: Financial */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Fluxo de Caixa e Custos</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Visualize seus ganhos diários, lucros e custos de fornecedores em relatórios limpos que ajudam a entender a real margem de lucro da sua loja.
              </p>
            </div>

            {/* Feature 5: Customers */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Histórico de Clientes</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Saiba quais maquiagens suas clientes compram com mais frequência, histórico de compras detalhado e gerencie dados de contato para ações de fidelidade.
              </p>
            </div>

            {/* Feature 6: Integrations */}
            <div className="group p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-950 hover:border-rose-500/20 dark:hover:border-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-6 transition-all duration-300 group-hover:scale-110">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Simplicidade e Performance</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Feito em Next.js e Supabase para oferecer velocidade máxima, segurança ponta a ponta e zero lentidão, mesmo com milhares de registros.
              </p>
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
                  <span className="text-sm text-slate-400 dark:text-zinc-500">/ sempre</span>
                </div>
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Até 50 produtos cadastrados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">1 operador (Administrador)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Vitrine virtual básica</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">PDV moderno e registro de caixa</span>
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
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Operadores e equipe ilimitados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Vitrine virtual premium com subdomínio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Mapeamento de domínio próprio na vitrine</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300">Relatórios avançados e exportações</span>
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
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">99.9%</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Uptime Garantido</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">R$ 0</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Taxa de Adesão</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">10k+</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Vendas Registradas</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">10h</h4>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Economizados/semana</p>
          </div>
        </div>
      </section>

      {/* TRUST CTA SECTION */}
      <section className="py-20 md:py-28 px-6 text-center bg-gradient-to-b from-transparent to-rose-50/20 dark:to-rose-950/10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pronta para profissionalizar seu negócio de beleza?</h2>
          <p className="text-base md:text-lg text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Cadastre-se grátis e tenha o controle total da sua loja. Você não precisa configurar servidores, domínios ou códigos complexos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Criar Minha Loja Agora
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
          
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="hover:text-slate-800 dark:hover:text-zinc-200">Termos de Uso</a>
            <a href="#" className="hover:text-slate-800 dark:hover:text-zinc-200">Políticas de Privacidade</a>
            <a href="#" className="hover:text-slate-800 dark:hover:text-zinc-200">Suporte</a>
          </div>

          <p className="text-[11px]">&copy; {new Date().getFullYear()} Mimus Software Ltda. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
