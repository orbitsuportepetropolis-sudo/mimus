'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  Calendar,
  ChevronRight,
  Plus
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import Link from 'next/link'

interface DashboardStats {
  todaySalesCount: number
  monthlyRevenue: number
  lowStockCount: number
  expiringCount: number
}

interface ProductItem {
  id: string
  name: string
  brand: string
  sale_price: number
  quantity_in_stock: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [storePlan, setStorePlan] = useState<'free' | 'pro'>('free')
  const [planStatus, setPlanStatus] = useState<string>('trial')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    todaySalesCount: 0,
    monthlyRevenue: 0,
    lowStockCount: 0,
    expiringCount: 0
  })
  
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<ProductItem[]>([])
  const [expiringProducts, setExpiringProducts] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  const getTrialDaysLeft = () => {
    if (!trialEndsAt) return 0
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }
  const isTrialActive = (planStatus === 'trial' && getTrialDaysLeft() > 0) || planStatus === 'trial_custom'
  const isProUser = storePlan === 'pro' || isTrialActive

  async function loadDashboardData(showSpinner = false) {
    try {
      if (showSpinner) setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id, stores(plan, plan_status, trial_ends_at)')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const storeId = profile.store_id

      if (profile.stores) {
        const st = profile.stores as any
        setStorePlan(st.plan || 'free')
        setPlanStatus(st.plan_status || 'trial')
        setTrialEndsAt(st.trial_ends_at)
      }

      // 1. Get today's sales and monthly revenue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const { data: salesData } = await supabase
        .from('sales')
        .select('id, total_value, created_at, customers(name)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      // Process sales
      let todayCount = 0
      let monthlySum = 0
      const processedRecentSales: any[] = []

      if (salesData) {
        salesData.forEach((sale: any) => {
          const saleDate = new Date(sale.created_at)
          if (saleDate >= today) {
            todayCount++
          }
          if (saleDate >= firstDayOfMonth) {
            monthlySum += Number(sale.total_value)
          }
          if (processedRecentSales.length < 5) {
            processedRecentSales.push({
              id: sale.id,
              customer: sale.customers?.name || 'Cliente Avulso',
              value: Number(sale.total_value),
              date: saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            })
          }
        })
      }

      setRecentSales(processedRecentSales)

      // 2. Fetch products and count alerts
      let { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('id, name, brand, sale_price, quantity_in_stock, min_stock_alert, expiration_date, active')
        .eq('store_id', storeId)
        .eq('active', true)

      if (prodError && prodError.code === '42703') {
        const fallback = await supabase
          .from('products')
          .select('id, name, brand, sale_price, quantity_in_stock, min_stock_alert, expiration_date')
          .eq('store_id', storeId)
        productsData = fallback.data as any
      }

      let lowStock = 0
      let expiring = 0
      const processedLowStock: ProductItem[] = []
      const processedExpiring: any[] = []

      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      if (productsData) {
        productsData.forEach((prod: any) => {
          if (prod.active === false) return
          // Low stock alert
          if (prod.quantity_in_stock <= prod.min_stock_alert) {
            lowStock++
            if (processedLowStock.length < 5) {
              processedLowStock.push({
                id: prod.id,
                name: prod.name,
                brand: prod.brand || 'Mimus',
                sale_price: Number(prod.sale_price),
                quantity_in_stock: prod.quantity_in_stock
              })
            }
          }

          // Expiration alert
          if (prod.expiration_date) {
            const expDate = new Date(prod.expiration_date)
            if (expDate <= thirtyDaysFromNow && expDate >= new Date()) {
              expiring++
              if (processedExpiring.length < 5) {
                processedExpiring.push({
                  id: prod.id,
                  name: prod.name,
                  brand: prod.brand || 'Mimus',
                  formattedDate: expDate.toLocaleDateString('pt-BR')
                })
              }
            }
          }
        })
      }

      setLowStockProducts(processedLowStock)
      setExpiringProducts(processedExpiring)

      setStats({
        todaySalesCount: todayCount,
        monthlyRevenue: monthlySum,
        lowStockCount: lowStock,
        expiringCount: expiring
      })

      // 3. Process chart data (last 7 days of sales)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0,0,0,0)
        return {
          date: d,
          label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
          value: 0
        }
      })

      if (salesData) {
        salesData.forEach((sale: any) => {
          const saleDate = new Date(sale.created_at)
          const matchingDay = last7Days.find(day => 
            saleDate.getDate() === day.date.getDate() &&
            saleDate.getMonth() === day.date.getMonth() &&
            saleDate.getFullYear() === day.date.getFullYear()
          )
          if (matchingDay) {
            matchingDay.value += Number(sale.total_value)
          }
        })
      }

      setChartData(last7Days.map(item => ({ label: item.label, value: item.value })))

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadDashboardData(true)
    
    const handleRefresh = () => {
      loadDashboardData(false)
    }
    
    window.addEventListener('dashboard-refresh', handleRefresh)
    return () => window.removeEventListener('dashboard-refresh', handleRefresh)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-rose-500/10">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Visão Geral
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Olá, Lojista!</h1>
          <p className="text-white/80 text-sm max-w-md">
            Sua loja está crescendo! Veja os indicadores de hoje e gerencie suas vendas de forma simplificada.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Faturamento Mensal */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Faturamento (Mês)</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Card 2: Vendas Hoje */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Vendas Hoje</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.todaySalesCount}</h3>
          </div>
        </div>

        {/* Card 3: Estoque Baixo */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            stats.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Estoque Baixo</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.lowStockCount}</h3>
          </div>
        </div>

        {/* Card 4: Alerta Validade */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            stats.expiringCount > 0 ? 'bg-pink-500/10 text-pink-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium font-sans">Próximos do Vencimento</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.expiringCount}</h3>
          </div>
        </div>

      </div>

      {/* Main Section: Chart & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart (Recharts) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Desempenho Semanal</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Fluxo de faturamento dos últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> +12% vs. anterior
            </div>
          </div>
          
          <div className="h-72 w-full relative">
            {!isProUser && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl text-center p-4">
                <TrendingUp className="w-8 h-8 text-rose-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Relatórios Avançados de Desempenho</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mt-1 leading-relaxed">
                  Gráficos de faturamento e relatórios detalhados de lucro são exclusivos do **Plano Pro**.
                </p>
                <Link 
                  href="/dashboard/billing"
                  className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/10 transition-colors"
                >
                  Liberar Plano Pro (R$ 49/mês)
                </Link>
              </div>
            )}
            <div className={`w-full h-full ${!isProUser ? 'filter blur-sm select-none pointer-events-none' : ''}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800/60" />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderRadius: '8px', 
                      color: '#FFF', 
                      fontSize: '12px',
                      border: 'none' 
                    }}
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#E11D48" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Últimas Vendas</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Transações realizadas hoje</p>
            </div>
            <Link 
              href="/dashboard/sales" 
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
            >
              Novo PDV <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-4 flex flex-col justify-center">
            {recentSales.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Nenhuma venda realizada hoje.</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-zinc-800/40 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                      {sale.customer.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">{sale.customer}</h4>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{sale.date}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">R$ {sale.value.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Warnings & Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Low Stock alerts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Limites de Estoque Críticos
            </h3>
            <Link href="/dashboard/stock" className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-0.5">
              Ver Estoque <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {lowStockProducts.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Nenhum produto com estoque crítico.</p>
            ) : (
              lowStockProducts.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">{prod.name}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{prod.brand}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      prod.quantity_in_stock === 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50'
                    }`}>
                      {prod.quantity_in_stock} un. restante
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiring Products Alerts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-500" /> Maquiagens Vencendo Próximas
            </h3>
            <Link href="/dashboard/products" className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-0.5">
              Ver Catálogo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {expiringProducts.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Nenhum produto próximo do vencimento.</p>
            ) : (
              expiringProducts.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">{prod.name}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{prod.brand}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 rounded-full">
                      Vence {prod.formattedDate}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
