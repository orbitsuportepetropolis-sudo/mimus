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
  Settings,
  Send,
  MessageSquare,
  Loader2
} from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  profile: { name: string; role: string; store_id?: string } | null
  store: { 
    name: string; 
    plan?: string; 
    plan_status?: string; 
    trial_ends_at?: string | null 
  } | null
  lowStockCount: number
}

const normalize = (str: string) => 
  str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : ""

export default function DashboardShell({ children, profile, store, lowStockCount }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)

  // AI Agent states
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInputValue, setChatInputValue] = useState('')
  const [messages, setMessages] = useState<any[]>([
    { 
      sender: 'agent', 
      text: 'Olá! Sou o assistente Mimus AI. 🌸\n\nPosso te ajudar a gerenciar sua loja rapidamente! Digite um comando ou experimente usar `@` para marcar produtos e clientes.\n\nExemplos de comandos:\n- *vendi 2 @Batom Velvet para a cliente @Maria por Pix*\n- *adicione 10 unidades de @Delineador*\n- *cadastre o produto Blush Coral por R$ 35*', 
      timestamp: new Date() 
    }
  ])
  const [typing, setTyping] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  
  // Autocomplete states
  const [autocompleteOpen, setAutocompleteOpen] = useState(false)
  const [autocompleteSearch, setAutocompleteSearch] = useState('')
  const [cursorPos, setCursorPos] = useState(0)

  useEffect(() => {
    loadAgentData()
    // Reload cache when a refresh occurs
    window.addEventListener('dashboard-refresh', loadAgentData)
    return () => window.removeEventListener('dashboard-refresh', loadAgentData)
  }, [])

  const plan = store?.plan || 'free'
  const status = store?.plan_status || 'trial'
  const trialEnds = store?.trial_ends_at ? new Date(store.trial_ends_at).getTime() : 0
  const isTrialValid = status === 'trial' && trialEnds > Date.now()
  const isProValid = plan === 'pro' && (status === 'active' || status === 'pending' || status === 'pro')
  const isPro = isTrialValid || isProValid
  const hasAccess = true
  const showBlocker = false

  useEffect(() => {
    if (!store || !profile) return

    async function checkOnboardingDb() {
      const onboardingCompleted = localStorage.getItem(`mimus_onboarding_completed_${profile?.store_id || 'default'}`)
      if (onboardingCompleted) {
        return
      }

      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', profile?.store_id)

      if (count && count > 0) {
        localStorage.setItem(`mimus_onboarding_completed_${profile?.store_id || 'default'}`, 'true')
        return
      }

      if (pathname !== '/onboarding') {
        router.push('/onboarding')
      }
    }

    checkOnboardingDb()
  }, [store, profile, pathname, router])

  async function loadAgentData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const storeId = profile.store_id

      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sku, barcode, sale_price, cost_price, quantity_in_stock')
        .eq('store_id', storeId)
        .eq('active', true)
        .order('name', { ascending: true })

      const { data: custs } = await supabase
        .from('customers')
        .select('id, name')
        .eq('store_id', storeId)
        .order('name', { ascending: true })

      if (prods) setProducts(prods)
      if (custs) setCustomers(custs)
    } catch (err) {
      console.error('Erro ao carregar dados do Agente IA:', err)
    }
  }

  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setChatInputValue(val)
    
    const selectionStart = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, selectionStart)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtPos !== -1 && !textBeforeCursor.slice(lastAtPos, selectionStart).includes(' ')) {
      setAutocompleteOpen(true)
      setAutocompleteSearch(textBeforeCursor.slice(lastAtPos + 1, selectionStart))
      setCursorPos(selectionStart)
    } else {
      setAutocompleteOpen(false)
      setAutocompleteSearch('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey || e.altKey) {
        return
      }
      e.preventDefault()
      if (chatInputValue.trim()) {
        const userText = chatInputValue
        setMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date() }])
        setChatInputValue('')
        setAutocompleteOpen(false)
        setTyping(true)
        processCommand(userText)
      }
    }
  }


  const selectSuggestion = (name: string) => {
    const textBeforeCursor = chatInputValue.slice(0, cursorPos)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtPos !== -1) {
      const beforeAt = chatInputValue.slice(0, lastAtPos)
      const afterCursor = chatInputValue.slice(cursorPos)
      const newValue = `${beforeAt}@${name} ${afterCursor}`
      setChatInputValue(newValue)
      setAutocompleteOpen(false)
    }
  }

  async function processCommand(text: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')
      const store_id = profile.store_id

      // Fetch latest products and customers in real-time to have most updated lists
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sku, barcode, sale_price, cost_price, quantity_in_stock')
        .eq('store_id', store_id)
        .eq('active', true)
        .order('name', { ascending: true })

      const { data: custs } = await supabase
        .from('customers')
        .select('id, name')
        .eq('store_id', store_id)
        .order('name', { ascending: true })

      const currentProducts = prods || []
      const currentCustomers = custs || []

      const response = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          currentProducts: currentProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku || '', barcode: p.barcode || '', price: p.sale_price, stock: p.quantity_in_stock })),
          currentCustomers: currentCustomers.map(c => ({ id: c.id, name: c.name }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na comunicação com o assistente.')
      }

      const parsed = await response.json()
      const reply = parsed.reply || ""
      const actions = parsed.actions || []

      // Execute actions
      for (const action of actions) {
        if (action.type === 'create_product') {
          const { data: newProd, error: insertErr } = await supabase
            .from('products')
            .insert([{
              store_id,
              name: action.name,
              brand: action.brand || 'Mimus',
              cost_price: action.costPrice || 0,
              sale_price: action.salePrice || 0,
              quantity_in_stock: 0,
              min_stock_alert: 5
            }])
            .select()
            .single()

          if (insertErr) throw insertErr

          if (newProd && action.quantity && action.quantity > 0) {
            await supabase.from('stock_movements').insert([{
              store_id,
              product_id: newProd.id,
              quantity: action.quantity,
              type: 'entry',
              reason: 'purchase'
            }])
          }
        } else if (action.type === 'create_customer') {
          const { error: insertErr } = await supabase
            .from('customers')
            .insert([{
              store_id,
              name: action.name,
              phone: action.phone || null,
              instagram: action.instagram || null,
              birthday: action.birthday || null
            }])

          if (insertErr) throw insertErr
        } else if (action.type === 'stock_movement') {
          const { error: smErr } = await supabase
            .from('stock_movements')
            .insert([{
              store_id,
              product_id: action.productId,
              quantity: action.movementType === 'entry' ? action.quantity : -action.quantity,
              type: action.movementType,
              reason: action.reason || 'manual_adjustment'
            }])

          if (smErr) throw smErr
        } else if (action.type === 'create_sale') {
          let customerId = action.customerId
          if (!customerId) {
            const { data: existingAvulso } = await supabase
              .from('customers')
              .select('id')
              .eq('store_id', store_id)
              .eq('name', 'Cliente Avulso')
              .maybeSingle()

            if (existingAvulso) {
              customerId = existingAvulso.id
            } else {
              const { data: newAvulso } = await supabase
                .from('customers')
                .insert([{ store_id, name: 'Cliente Avulso' }])
                .select('id')
                .single()
              customerId = newAvulso?.id
            }
          }

          const totalValue = action.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)

          const { data: newSale, error: saleErr } = await supabase
            .from('sales')
            .insert([{
              store_id,
              customer_id: customerId,
              total_value: totalValue,
              discount: 0,
              payment_method: action.paymentMethod || 'pix'
            }])
            .select('id')
            .single()

          if (saleErr) throw saleErr

          const saleItemsPayload = action.items.map((item: any) => ({
            sale_id: newSale.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice
          }))

          const { error: itemsErr } = await supabase
            .from('sale_items')
            .insert(saleItemsPayload)

          if (itemsErr) throw itemsErr
        } else if (action.type === 'delete_product') {
          const { error: delErr } = await supabase
            .from('products')
            .update({ active: false })
            .eq('id', action.productId)
            .eq('store_id', store_id)

          if (delErr) throw delErr
        } else if (action.type === 'delete_customer') {
          const { error: delErr } = await supabase
            .from('customers')
            .delete()
            .eq('id', action.customerId)
            .eq('store_id', store_id)

          if (delErr) throw delErr
        }
      }

      if (actions.length > 0) {
        window.dispatchEvent(new CustomEvent('dashboard-refresh'))
      }

      if (reply) {
        addAgentMessage(reply)
      } else {
        addAgentMessage("✅ Comando processado com sucesso!")
      }

    } catch (err: any) {
      console.error(err)
      addAgentMessage(`❌ **Erro ao processar:** ${err.message || 'Erro desconhecido.'}`)
    } finally {
      setTyping(false)
    }
  }

  function addAgentMessage(text: string) {
    setMessages(prev => [...prev, { sender: 'agent', text, timestamp: new Date() }])
  }

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputValue.trim()) return

    const userText = chatInputValue
    setMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date() }])
    setChatInputValue('')
    setAutocompleteOpen(false)
    setTyping(true)
    processCommand(userText)
  }

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
              isPro ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {isPro ? 'Pro' : 'Free'}
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
              isPro 
                ? 'bg-rose-500 text-white' 
                : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {isPro ? 'Pro' : 'Free'}
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
                isPro ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isPro ? 'Pro' : 'Free'}
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
          {showBlocker ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-sm text-slate-500">Redirecionando para a página de faturamento...</p>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Chat Widget IA Agente Mimus */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          
          {/* Panel Chat */}
          {chatOpen && (
            <div className="w-[360px] sm:w-[380px] h-[500px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom duration-250 relative">
              
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-rose-600 to-pink-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Mimus AI</h4>
                    <span className="text-[9px] text-rose-100 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Online • Assistente Virtual
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-zinc-950/20 text-xs">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-sm border ${
                      msg.sender === 'user'
                        ? 'bg-rose-600 text-white border-rose-500 rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-100 dark:border-zinc-800/80 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-550 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-zinc-800/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-650 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-650 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-650 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Autocomplete Mention Overlay Popup */}
              {autocompleteOpen && (
                <div className="absolute bottom-[60px] left-4 right-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-[160px] overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                  <div className="p-1.5 bg-slate-50 dark:bg-zinc-950 text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Produtos e Clientes matching "@"</div>
                  
                  {/* Filter products */}
                  {products
                    .filter(p => !autocompleteSearch || normalize(p.name).includes(normalize(autocompleteSearch)) || (p.sku && normalize(p.sku).includes(normalize(autocompleteSearch))))
                    .map(p => (
                      <button
                        key={`p-${p.id}`}
                        type="button"
                        onClick={() => selectSuggestion(p.name)}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-zinc-200 flex items-center justify-between"
                      >
                        <span className="font-semibold truncate">🛍️ {p.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-2 flex-shrink-0">Estoque: {p.quantity_in_stock} un. • R$ {p.sale_price.toFixed(2)}</span>
                      </button>
                    ))}

                  {/* Filter customers */}
                  {customers
                    .filter(c => !autocompleteSearch || normalize(c.name).includes(normalize(autocompleteSearch)))
                    .map(c => (
                      <button
                        key={`c-${c.id}`}
                        type="button"
                        onClick={() => selectSuggestion(c.name)}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-zinc-200 flex items-center"
                      >
                        <span className="font-semibold truncate">👤 {c.name}</span>
                      </button>
                    ))}
                  
                  {products.filter(p => !autocompleteSearch || normalize(p.name).includes(normalize(autocompleteSearch))).length === 0 && 
                   customers.filter(c => !autocompleteSearch || normalize(c.name).includes(normalize(autocompleteSearch))).length === 0 && (
                    <p className="p-3 text-center text-slate-450 dark:text-zinc-550 text-[11px]">Nenhum correspondente encontrado.</p>
                  )}
                </div>
              )}

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
                <textarea
                  value={chatInputValue}
                  onChange={handleChatInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite um comando... use '@' para buscar"
                  rows={1}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs transition-all resize-none max-h-24 overflow-y-auto"
                />
                <button
                  type="submit"
                  disabled={!chatInputValue.trim()}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-rose-500/10 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

          {/* Chat Floating Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-14 h-14 bg-gradient-to-r from-rose-600 to-pink-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20 hover:shadow-rose-500/35 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white dark:border-zinc-800 group relative"
            title="Assistente de IA"
          >
            {chatOpen ? <X className="w-6 h-6 animate-in spin-in-90 duration-200" /> : <MessageSquare className="w-6 h-6 animate-in zoom-in duration-200" />}
            
            {/* Ping indicator */}
            {!chatOpen && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            )}
          </button>

        </div>
      </div>

    </div>
  )
}
