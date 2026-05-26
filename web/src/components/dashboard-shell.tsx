'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  ArrowLeftRight, 
  Users, 
  DollarSign, 
  Globe, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Sparkles, 
  Bell,
  AlertTriangle,
  CreditCard,
  Settings
} from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  profile: { name: string; role: string } | null
  store: { name: string; plan?: string } | null
  lowStockCount: number
}

export default function DashboardShell({ children, profile, store, lowStockCount }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)

  // Sync dark mode state with document.documentElement class
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

  const toggleDarkMode = () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'PDV / Vendas', href: '/dashboard/sales', icon: ShoppingBag },
    { name: 'Produtos', href: '/dashboard/products', icon: Package },
    { name: 'Estoque', href: '/dashboard/stock', icon: ArrowLeftRight },
    { name: 'Clientes', href: '/dashboard/customers', icon: Users },
    { name: 'Financeiro', href: '/dashboard/finance', icon: DollarSign },
    { name: 'Personalizar', href: '/dashboard/settings', icon: Settings },
    { name: 'Integrações', href: '/dashboard/integrations', icon: Globe },
    { name: 'Equipe', href: '/dashboard/team', icon: Users },
    { name: 'Mensalidade', href: '/dashboard/billing', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      
      {/* MOBILE HEADER */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            Mimus<span className="text-rose-500">.</span>
          </span>
          <span className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5">
            {store?.name || 'Loja'}
            <span className={`px-1 rounded text-[8px] font-extrabold uppercase ${
              store?.plan === 'pro' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {store?.plan === 'pro' ? 'Pro' : 'Free'}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-slate-100 dark:border-zinc-800 flex-shrink-0 z-20">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-50 dark:border-zinc-800/40 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              Mimus<span className="text-rose-500">.</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 tracking-wider uppercase font-semibold mt-1 flex items-center gap-1.5">
              {store?.name || 'Minha Loja'}
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                store?.plan === 'pro' 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {store?.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </span>
          </div>
          <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User profile & Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">
              {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {profile?.name || 'Operadora'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {profile?.role === 'admin' ? 'Administradora' : 'Operadora'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800/40 pt-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-200 flex items-center justify-center flex-1"
              title="Alternar Tema"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors duration-200 flex items-center justify-center flex-1"
              title="Sair"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          
          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-white dark:bg-zinc-900 shadow-2xl p-6 z-10 animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between mb-8">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                Mimus<span className="text-rose-500">.</span>
              </span>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    {profile?.name || 'Operadora'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {store?.name || 'Minha Loja'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-rose-100 dark:border-rose-950/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">
              Painel de Controle
            </h2>
            <span className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              {store?.name || 'Loja de Beleza'}
              <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                store?.plan === 'pro' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {store?.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Alertas / Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowAlerts(!showAlerts)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                {lowStockCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {showAlerts && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xl rounded-xl p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800/40 pb-2 mb-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Notificações</span>
                    {lowStockCount > 0 && (
                      <span className="text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-950/40 px-2 py-0.5 rounded-full font-medium">
                        {lowStockCount} alertas
                      </span>
                    )}
                  </div>
                  {lowStockCount > 0 ? (
                    <div className="flex gap-2.5 items-start p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Estoque Baixo!</span>
                        <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">Você tem {lowStockCount} produtos com quantidade abaixo do limite mínimo recomendado.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 dark:text-zinc-500 py-4">Tudo sob controle! Nenhum alerta de estoque.</p>
                  )}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-100 dark:bg-zinc-800" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-zinc-500">Logado como</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{profile?.name}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

    </div>
  )
}
