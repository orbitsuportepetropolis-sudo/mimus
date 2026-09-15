'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  RefreshCw, 
  DollarSign, 
  Package, 
  Boxes, 
  X, 
  Check, 
  Info,
  ChevronRight,
  TrendingDown
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string | null
  category: string | null
  sku: string | null
  barcode: string | null
  cost_price: number
  sale_price: number
  quantity_in_stock: number
  min_stock_alert: number
  image_url: string | null
  active?: boolean
}

interface StockMovement {
  id: string
  quantity: number
  type: string
  reason: string
  created_at: string
  products: any
}

interface CountItemState {
  counted: string // string representation for input
  writeOffQty: string // quantity to deduct
  reason: string
  customNotes?: string
}

export default function StockInventoryTab() {
  const supabase = createClient()

  // Tab mode within Estoque
  const [subTab, setSubTab] = useState<'audit' | 'history'>('audit')

  // Products & movements
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_stock' | 'zero_stock' | 'with_writeoff'>('all')

  // State for the physical count per product ID
  const [countStates, setCountStates] = useState<Record<string, CountItemState>>({})
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  // Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [submittingWriteOff, setSubmittingWriteOff] = useState(false)
  const [writeOffSuccessMessage, setWriteOffSuccessMessage] = useState<string | null>(null)
  const [writeOffErrorMessage, setWriteOffErrorMessage] = useState<string | null>(null)
  const [generalReason, setGeneralReason] = useState('Contagem / Inventário')
  const [generalObservation, setGeneralObservation] = useState('')
  const [writeOffDate, setWriteOffDate] = useState(new Date().toISOString().split('T')[0])
  const [registerInFinance, setRegisterInFinance] = useState(true)

  // Single adjustment modal state
  const [singleModalOpen, setSingleModalOpen] = useState(false)
  const [singleProductId, setSingleProductId] = useState('')
  const [singleQty, setSingleQty] = useState('')
  const [singleType, setSingleType] = useState<'entry' | 'exit'>('exit')
  const [singleReason, setSingleReason] = useState('manual_adjustment')
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleError, setSingleError] = useState<string | null>(null)

  // Unique categories and brands
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => { if (p.category) cats.add(p.category) })
    return Array.from(cats).sort()
  }, [products])

  const brands = useMemo(() => {
    const brs = new Set<string>()
    products.forEach(p => { if (p.brand) brs.add(p.brand) })
    return Array.from(brs).sort()
  }, [products])

  // Load initial data
  useEffect(() => {
    loadStockData(true)

    const handleRefresh = () => {
      loadStockData(false)
    }

    window.addEventListener('dashboard-refresh', handleRefresh)
    return () => window.removeEventListener('dashboard-refresh', handleRefresh)
  }, [])

  async function loadStockData(showSpinner = false) {
    try {
      if (showSpinner) setLoading(true)
      else setRefreshing(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const currentStoreId = profile.store_id
      setStoreId(currentStoreId)

      // Fetch products
      let { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, image_url, active')
        .eq('store_id', currentStoreId)
        .eq('active', true)
        .order('name', { ascending: true })

      if (prodsErr && prodsErr.code === '42703') {
        const fallback = await supabase
          .from('products')
          .select('id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, image_url')
          .eq('store_id', currentStoreId)
          .order('name', { ascending: true })
        prods = fallback.data as any
      }

      if (prods) {
        setProducts(prods.filter((p: any) => p.active !== false))
      } else {
        setProducts([])
      }

      // Fetch movements
      const { data: moves } = await supabase
        .from('stock_movements')
        .select('id, quantity, type, reason, created_at, products(name)')
        .eq('store_id', currentStoreId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (moves) {
        setMovements(moves)
      } else {
        setMovements([])
      }
    } catch (err) {
      console.error('Erro ao carregar dados de estoque:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle user entering physical count
  const handlePhysicalCountChange = (productId: string, value: string, currentStock: number) => {
    const trimmed = value.trim()
    const currentItemState = countStates[productId] || {
      counted: '',
      writeOffQty: '',
      reason: 'Contagem / Inventário'
    }

    if (trimmed === '') {
      // Clear
      const nextStates = { ...countStates }
      delete nextStates[productId]
      setCountStates(nextStates)

      const nextSelected = new Set(selectedProductIds)
      nextSelected.delete(productId)
      setSelectedProductIds(nextSelected)
      return
    }

    const countedNumber = parseInt(trimmed, 10)
    let calculatedWriteOff = ''

    if (!isNaN(countedNumber) && countedNumber >= 0) {
      // If counted is less than current stock, difference is write-off
      if (countedNumber < currentStock) {
        calculatedWriteOff = String(currentStock - countedNumber)
      } else {
        calculatedWriteOff = '0'
      }
    }

    const nextStates = {
      ...countStates,
      [productId]: {
        ...currentItemState,
        counted: trimmed,
        writeOffQty: calculatedWriteOff
      }
    }
    setCountStates(nextStates)

    // Automatically check or uncheck
    const nextSelected = new Set(selectedProductIds)
    if (parseInt(calculatedWriteOff, 10) > 0) {
      nextSelected.add(productId)
    } else {
      nextSelected.delete(productId)
    }
    setSelectedProductIds(nextSelected)
  }

  // Handle user directly entering write-off quantity
  const handleWriteOffQtyChange = (productId: string, value: string, currentStock: number) => {
    const trimmed = value.trim()
    const currentItemState = countStates[productId] || {
      counted: '',
      writeOffQty: '',
      reason: 'Contagem / Inventário'
    }

    if (trimmed === '' || trimmed === '0') {
      const nextStates = { ...countStates }
      if (trimmed === '0') {
        nextStates[productId] = {
          ...currentItemState,
          writeOffQty: '0',
          counted: String(currentStock)
        }
      } else {
        delete nextStates[productId]
      }
      setCountStates(nextStates)

      const nextSelected = new Set(selectedProductIds)
      nextSelected.delete(productId)
      setSelectedProductIds(nextSelected)
      return
    }

    const writeOffNum = parseInt(trimmed, 10)
    let calculatedCounted = ''

    if (!isNaN(writeOffNum) && writeOffNum > 0) {
      calculatedCounted = String(Math.max(0, currentStock - writeOffNum))
    }

    const nextStates = {
      ...countStates,
      [productId]: {
        ...currentItemState,
        writeOffQty: trimmed,
        counted: calculatedCounted
      }
    }
    setCountStates(nextStates)

    const nextSelected = new Set(selectedProductIds)
    if (writeOffNum > 0) {
      nextSelected.add(productId)
    } else {
      nextSelected.delete(productId)
    }
    setSelectedProductIds(nextSelected)
  }

  // Handle reason change per item
  const handleItemReasonChange = (productId: string, reason: string) => {
    const currentItemState = countStates[productId] || {
      counted: '',
      writeOffQty: '',
      reason: 'Contagem / Inventário'
    }
    setCountStates({
      ...countStates,
      [productId]: {
        ...currentItemState,
        reason
      }
    })
  }

  // Toggle selection
  const handleToggleSelect = (productId: string, currentStock: number) => {
    const nextSelected = new Set(selectedProductIds)
    if (nextSelected.has(productId)) {
      nextSelected.delete(productId)
    } else {
      nextSelected.add(productId)
      // If not populated, populate with 1 un or current state
      if (!countStates[productId]?.writeOffQty || parseInt(countStates[productId].writeOffQty, 10) <= 0) {
        setCountStates(prev => ({
          ...prev,
          [productId]: {
            counted: String(Math.max(0, currentStock - 1)),
            writeOffQty: '1',
            reason: prev[productId]?.reason || 'Contagem / Inventário'
          }
        }))
      }
    }
    setSelectedProductIds(nextSelected)
  }

  // Quick action: Clear all counts
  const handleClearAllCounts = () => {
    if (Object.keys(countStates).length > 0 || selectedProductIds.size > 0) {
      if (confirm('Deseja limpar todos os campos de contagem e baixas preenchidos?')) {
        setCountStates({})
        setSelectedProductIds(new Set())
      }
    }
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      const s = search.toLowerCase()
      const matchesSearch = 
        p.name.toLowerCase().includes(s) ||
        (p.sku && p.sku.toLowerCase().includes(s)) ||
        (p.barcode && p.barcode.includes(s)) ||
        (p.brand && p.brand.toLowerCase().includes(s))

      if (!matchesSearch) return false

      // Category
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false

      // Brand
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false

      // Status Filter
      if (statusFilter === 'with_stock' && p.quantity_in_stock <= 0) return false
      if (statusFilter === 'zero_stock' && p.quantity_in_stock > 0) return false
      if (statusFilter === 'with_writeoff') {
        const state = countStates[p.id]
        const hasQty = state && parseInt(state.writeOffQty, 10) > 0
        if (!hasQty && !selectedProductIds.has(p.id)) return false
      }

      return true
    })
  }, [products, search, categoryFilter, brandFilter, statusFilter, countStates, selectedProductIds])

  // Computed summary for items marked to write off
  const writeOffSummary = useMemo(() => {
    let totalItems = 0
    let totalUnits = 0
    let totalFinancialCost = 0
    const list: Array<{
      product: Product
      quantity: number
      unitCost: number
      subtotalCost: number
      reason: string
    }> = []

    selectedProductIds.forEach(id => {
      const product = products.find(p => p.id === id)
      const state = countStates[id]
      const qty = state ? parseInt(state.writeOffQty, 10) : 0

      if (product && !isNaN(qty) && qty > 0) {
        const unitCost = Number(product.cost_price) || 0
        const subtotal = qty * unitCost

        totalItems += 1
        totalUnits += qty
        totalFinancialCost += subtotal

        list.push({
          product,
          quantity: qty,
          unitCost,
          subtotalCost: subtotal,
          reason: state?.reason || generalReason
        })
      }
    })

    return {
      totalItems,
      totalUnits,
      totalFinancialCost,
      list
    }
  }, [selectedProductIds, countStates, products, generalReason])

  // KPI calculations for all products
  const stockKpis = useMemo(() => {
    let totalUnits = 0
    let totalCostVal = 0
    let lowStockCount = 0

    products.forEach(p => {
      const q = p.quantity_in_stock || 0
      totalUnits += q
      totalCostVal += q * (Number(p.cost_price) || 0)
      if (q <= (p.min_stock_alert || 5)) {
        lowStockCount += 1
      }
    })

    return {
      totalProducts: products.length,
      totalUnits,
      totalCostVal,
      lowStockCount
    }
  }, [products])

  // Process bulk write-off submission
  async function handleConfirmBulkWriteOff() {
    if (writeOffSummary.list.length === 0) {
      alert('Nenhum produto selecionado para baixa.')
      return
    }

    setSubmittingWriteOff(true)
    setWriteOffErrorMessage(null)

    try {
      if (!storeId) throw new Error('Identificador da loja não encontrado.')

      // 1. Prepare and insert movements for each product
      const movementsPayload = writeOffSummary.list.map(item => ({
        store_id: storeId,
        product_id: item.product.id,
        quantity: -Math.abs(item.quantity), // negative quantity for exit
        type: 'exit',
        reason: 'loss' // canonical reason supported in DB triggers/constraints
      }))

      const { error: smError } = await supabase
        .from('stock_movements')
        .insert(movementsPayload)

      if (smError) throw smError

      // 2. Insert into financial_transactions as 'Baixa de Estoque'
      if (registerInFinance && writeOffSummary.totalFinancialCost > 0) {
        const sampleNames = writeOffSummary.list.slice(0, 2).map(i => i.product.name).join(', ')
        const remaining = writeOffSummary.list.length - 2
        const itemsDesc = remaining > 0 ? `${sampleNames} e +${remaining} outro(s)` : sampleNames
        const fullDescription = generalObservation.trim() 
          ? `Baixa de Estoque: ${itemsDesc} (${generalObservation.trim()})`
          : `Baixa de Estoque - Contagem de Inventário: ${itemsDesc}`

        const { error: finError } = await supabase
          .from('financial_transactions')
          .insert([{
            store_id: storeId,
            type: 'expense',
            category: 'Baixa de Estoque',
            description: fullDescription,
            value: Number(writeOffSummary.totalFinancialCost.toFixed(2)),
            date: writeOffDate
          }])

        if (finError) {
          console.error('Erro ao lançar transação no financeiro:', finError)
          // Even if finance logging returns an error, stock was moved, so inform the user
          alert('Aviso: O estoque foi baixado, mas ocorreu um erro ao registrar no financeiro: ' + finError.message)
        }
      }

      // 3. Clear states
      setCountStates({})
      setSelectedProductIds(new Set())
      setConfirmModalOpen(false)
      setGeneralObservation('')

      // 4. Success message
      setWriteOffSuccessMessage(
        `Baixa de ${writeOffSummary.totalUnits} unidades realizada com sucesso! ` +
        (registerInFinance && writeOffSummary.totalFinancialCost > 0 
          ? `Lançado no financeiro: -R$ ${writeOffSummary.totalFinancialCost.toFixed(2)} (Baixa de Estoque).`
          : '')
      )
      setTimeout(() => setWriteOffSuccessMessage(null), 7000)

      // 5. Reload data & notify dashboard
      await loadStockData(false)
      window.dispatchEvent(new CustomEvent('dashboard-refresh'))

    } catch (err: any) {
      console.error(err)
      setWriteOffErrorMessage(err.message || 'Erro ao processar baixa de estoque.')
    } finally {
      setSubmittingWriteOff(false)
    }
  }

  // Handle single item quick adjustment
  async function handleSingleAdjustmentSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSingleLoading(true)
    setSingleError(null)

    if (!singleProductId) {
      setSingleError('Selecione um produto.')
      setSingleLoading(false)
      return
    }

    const qty = parseInt(singleQty, 10)
    if (isNaN(qty) || qty <= 0) {
      setSingleError('A quantidade deve ser um número maior que zero.')
      setSingleLoading(false)
      return
    }

    try {
      if (!storeId) throw new Error('Loja não encontrada')

      const finalQuantity = singleType === 'entry' ? qty : -qty

      // Save movement
      const { error } = await supabase
        .from('stock_movements')
        .insert([{
          store_id: storeId,
          product_id: singleProductId,
          quantity: finalQuantity,
          type: singleType,
          reason: singleReason
        }])

      if (error) throw error

      // If exit and reason is loss / manual_adjustment and user wants to log finance:
      if (singleType === 'exit') {
        const prod = products.find(p => p.id === singleProductId)
        const unitCost = Number(prod?.cost_price) || 0
        const totalCost = unitCost * qty

        if (totalCost > 0) {
          await supabase
            .from('financial_transactions')
            .insert([{
              store_id: storeId,
              type: 'expense',
              category: 'Baixa de Estoque',
              description: `Baixa de Estoque: ${prod?.name || 'Material'} (${qty} un)`,
              value: Number(totalCost.toFixed(2)),
              date: new Date().toISOString().split('T')[0]
            }])
        }
      }

      setSingleModalOpen(false)
      setSingleProductId('')
      setSingleQty('')
      setSingleReason('manual_adjustment')
      await loadStockData(false)
      window.dispatchEvent(new CustomEvent('dashboard-refresh'))
    } catch (err: any) {
      setSingleError(err.message || 'Erro ao registrar ajuste.')
    } finally {
      setSingleLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-rose-500" /> Controle de Estoque & Contagem de Material
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Realize a contagem física do seu estoque, identifique divergências e dê baixa em massa com débito automático no Financeiro.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadStockData(false)}
            disabled={refreshing}
            title="Atualizar dados"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-500' : ''}`} />
          </button>

          <button
            onClick={() => setSingleModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-rose-500" /> Ajuste Pontual
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {writeOffSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{writeOffSuccessMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total em Estoque */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Estoque no Sistema</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              {stockKpis.totalUnits.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">peças</span>
            </h4>
          </div>
        </div>

        {/* Patrimônio em Estoque */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Patrimônio (Custo)</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              R$ {stockKpis.totalCostVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        {/* Selecionados para Baixa */}
        <div className={`p-4 rounded-2xl border transition-all shadow-sm flex items-center gap-3.5 ${
          writeOffSummary.totalUnits > 0
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
            : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            writeOffSummary.totalUnits > 0
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
          }`}>
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Marcados p/ Baixa</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              {writeOffSummary.totalUnits} <span className="text-xs font-normal text-slate-400">un. ({writeOffSummary.totalItems} prod.)</span>
            </h4>
          </div>
        </div>

        {/* Impacto no Financeiro */}
        <div className={`p-4 rounded-2xl border transition-all shadow-sm flex items-center gap-3.5 ${
          writeOffSummary.totalFinancialCost > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
            : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            writeOffSummary.totalFinancialCost > 0
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Saída no Financeiro</span>
            <h4 className={`text-lg font-bold ${
              writeOffSummary.totalFinancialCost > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'
            }`}>
              -R$ {writeOffSummary.totalFinancialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>
      </div>

      {/* Sub tabs: Contagem vs Movimentações */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pt-2">
        <div className="flex gap-4">
          <button
            onClick={() => setSubTab('audit')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              subTab === 'audit'
                ? 'border-rose-600 text-rose-600 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
            }`}
          >
            <Boxes className="w-4 h-4" /> Contagem Física & Baixa em Massa
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              subTab === 'history'
                ? 'border-rose-600 text-rose-600 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
            }`}
          >
            <History className="w-4 h-4" /> Histórico de Movimentações ({movements.length})
          </button>
        </div>

        {subTab === 'audit' && (
          <div className="hidden sm:flex items-center gap-2 pb-2">
            {selectedProductIds.size > 0 && (
              <button
                onClick={handleClearAllCounts}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-zinc-400 transition-colors"
              >
                Limpar seleção ({selectedProductIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: Contagem Física e Baixa em Massa */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, SKU, código de barras ou marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="w-full md:w-44">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="all">Todas as Marcas</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Quick Status */}
              <div className="w-full md:w-52">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 focus:outline-none font-medium"
                >
                  <option value="all">Todos os Itens</option>
                  <option value="with_stock">Apenas com Estoque</option>
                  <option value="zero_stock">Com Estoque Zerado</option>
                  <option value="with_writeoff">Com Baixa Marcada ({selectedProductIds.size})</option>
                </select>
              </div>
            </div>

            {/* Hint Guide */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/60 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-zinc-800/60">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  <strong>Como contar:</strong> Digite a quantidade contada no campo <em>Contagem Real</em> (a baixa é calculada automaticamente) ou preencha diretamente na coluna <em>Qtd. Baixa</em>.
                </span>
              </span>
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                {filteredProducts.length} produto(s) exibido(s)
              </span>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                <span className="text-xs text-slate-400">Carregando catálogo de estoque...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-zinc-500 text-xs">
                Nenhum produto encontrado com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                          onChange={(e) => {
                            const next = new Set(selectedProductIds)
                            if (e.target.checked) {
                              filteredProducts.forEach(p => {
                                if (p.quantity_in_stock > 0) {
                                  next.add(p.id)
                                  if (!countStates[p.id]?.writeOffQty) {
                                    setCountStates(prev => ({
                                      ...prev,
                                      [p.id]: {
                                        counted: '0',
                                        writeOffQty: String(p.quantity_in_stock),
                                        reason: 'Contagem / Inventário'
                                      }
                                    }))
                                  }
                                }
                              })
                            } else {
                              filteredProducts.forEach(p => next.delete(p.id))
                            }
                            setSelectedProductIds(next)
                          }}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                      </th>
                      <th className="py-3 px-3">Produto</th>
                      <th className="py-3 px-3">Preço Custo</th>
                      <th className="py-3 px-3 text-center">Estoque Sistema</th>
                      <th className="py-3 px-3 text-center bg-slate-100/50 dark:bg-zinc-850/50">
                        Contagem Real (Físico)
                      </th>
                      <th className="py-3 px-3 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">
                        Qtd. Baixa (Saída)
                      </th>
                      <th className="py-3 px-3 text-right">Subtotal Baixa</th>
                      <th className="py-3 px-4">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {filteredProducts.map(p => {
                      const state = countStates[p.id] || { counted: '', writeOffQty: '', reason: 'Contagem / Inventário' }
                      const writeOffNum = parseInt(state.writeOffQty, 10) || 0
                      const isMarked = selectedProductIds.has(p.id) || writeOffNum > 0
                      const costPrice = Number(p.cost_price) || 0
                      const subtotal = writeOffNum * costPrice

                      return (
                        <tr 
                          key={p.id} 
                          className={`transition-colors ${
                            isMarked
                              ? 'bg-rose-50/40 dark:bg-rose-950/15 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                              : 'hover:bg-slate-50/60 dark:hover:bg-zinc-950/30'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isMarked}
                              onChange={() => handleToggleSelect(p.id, p.quantity_in_stock)}
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                          </td>

                          {/* Product Info */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0 max-w-xs">
                                <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate" title={p.name}>
                                  {p.name}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500">
                                  {p.brand && <span>{p.brand}</span>}
                                  {p.brand && p.category && <span>•</span>}
                                  {p.category && <span>{p.category}</span>}
                                  {p.sku && <span>(SKU: {p.sku})</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Unit Cost */}
                          <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 font-mono">
                            R$ {costPrice.toFixed(2)}
                            {costPrice === 0 && (
                              <span className="block text-[9px] text-amber-500">sem custo cad.</span>
                            )}
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                              p.quantity_in_stock <= 0
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                : p.quantity_in_stock <= (p.min_stock_alert || 5)
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200'
                            }`}>
                              {p.quantity_in_stock} un.
                            </span>
                          </td>

                          {/* Counted Physical Stock Input */}
                          <td className="py-3 px-3 text-center bg-slate-50/50 dark:bg-zinc-950/30">
                            <input
                              type="number"
                              min="0"
                              placeholder={String(p.quantity_in_stock)}
                              value={state.counted}
                              onChange={(e) => handlePhysicalCountChange(p.id, e.target.value, p.quantity_in_stock)}
                              className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 transition-all"
                            />
                          </td>

                          {/* Write-off Quantity Input */}
                          <td className="py-3 px-3 text-center bg-rose-50/30 dark:bg-rose-950/10">
                            <input
                              type="number"
                              min="0"
                              max={p.quantity_in_stock > 0 ? p.quantity_in_stock : undefined}
                              placeholder="0"
                              value={state.writeOffQty}
                              onChange={(e) => handleWriteOffQtyChange(p.id, e.target.value, p.quantity_in_stock)}
                              className={`w-20 px-2 py-1 text-center font-extrabold text-xs rounded-lg border transition-all ${
                                writeOffNum > 0
                                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300'
                                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white'
                              } focus:outline-none focus:border-rose-500`}
                            />
                          </td>

                          {/* Subtotal Baixa (Custo) */}
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {writeOffNum > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400">
                                -R$ {subtotal.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-zinc-600">R$ 0,00</span>
                            )}
                          </td>

                          {/* Reason */}
                          <td className="py-3 px-4">
                            <select
                              value={state.reason || 'Contagem / Inventário'}
                              onChange={(e) => handleItemReasonChange(p.id, e.target.value)}
                              disabled={writeOffNum <= 0}
                              className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 disabled:opacity-40 focus:outline-none"
                            >
                              <option value="Contagem / Inventário">Contagem / Inventário</option>
                              <option value="Avaria / Danificado">Avaria / Danificado</option>
                              <option value="Vencimento / Validade">Vencimento / Validade</option>
                              <option value="Uso Interno / Tester">Uso Interno / Tester</option>
                              <option value="Perda / Extravio">Perda / Extravio</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Floating / Bottom Sticky Action Bar */}
          {writeOffSummary.totalUnits > 0 && (
            <div className="sticky bottom-4 z-20 bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-4 text-xs">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <span>{writeOffSummary.totalItems} produto(s) com baixa</span>
                    <span className="text-slate-400">•</span>
                    <span>Total de {writeOffSummary.totalUnits} un.</span>
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    Saída a debitar no Financeiro:{' '}
                    <strong className="text-rose-400 text-sm">
                      R$ {writeOffSummary.totalFinancialCost.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClearAllCounts}
                  className="px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors w-full sm:w-auto text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all w-full sm:w-auto"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Confirmar Baixa em Massa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Histórico de Movimentações */}
      {subTab === 'history' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-rose-500" /> Histórico de Movimentações (Entradas e Saídas)
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Últimas movimentações registradas por vendas, compras, ajustes ou baixas de material.
              </p>
            </div>
          </div>

          {movements.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              Nenhuma movimentação de estoque registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500">
                    <th className="py-2.5">Data / Hora</th>
                    <th className="py-2.5">Produto</th>
                    <th className="py-2.5">Operação</th>
                    <th className="py-2.5 text-center">Quantidade</th>
                    <th className="py-2.5">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {movements.map(m => {
                    const isEntry = m.type === 'entry'
                    const prodName = m.products 
                      ? (Array.isArray(m.products) ? m.products[0]?.name : m.products.name) || 'Produto Excluído'
                      : 'Produto Excluído'

                    const formattedReason = 
                      m.reason === 'sale' ? 'Venda PDV' :
                      m.reason === 'purchase' ? 'Entrada / Compra' :
                      m.reason === 'loss' ? 'Baixa de Estoque / Perda' :
                      m.reason === 'manual_adjustment' ? 'Ajuste Manual' : m.reason

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20">
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {new Date(m.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 font-bold text-slate-700 dark:text-zinc-300">
                          {prodName}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            isEntry ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isEntry ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                            {isEntry ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="py-3 text-center font-extrabold">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            isEntry 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50'
                          }`}>
                            {isEntry ? '+' : ''}{m.quantity} un.
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 dark:text-zinc-400">
                          {formattedReason}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL: BAIXA EM MASSA COM DÉBITO NO FINANCEIRO */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Confirmar Baixa de Estoque
                  </h3>
                  <span className="text-xs text-slate-400">
                    Ajuste físico com lançamento de despesa no Financeiro
                  </span>
                </div>
              </div>

              <button
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {writeOffErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                {writeOffErrorMessage}
              </div>
            )}

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/80 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Produtos</span>
                <p className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {writeOffSummary.totalItems}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Peças</span>
                <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                  -{writeOffSummary.totalUnits} un.
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Saída Financeiro</span>
                <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                  -R$ {writeOffSummary.totalFinancialCost.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Selected Items List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                Itens que terão baixa de estoque:
              </label>
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
                {writeOffSummary.list.map(item => (
                  <div key={item.product.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate max-w-[14rem]">
                        {item.product.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Motivo: {item.reason} • Custo unit.: R$ {item.unitCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-600 block">
                        -{item.quantity} un.
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Subtotal: -R$ {item.subtotalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                      Debitar no Financeiro como "Baixa de Estoque"
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      Gera uma saída de R$ {writeOffSummary.totalFinancialCost.toFixed(2)} na categoria <strong>Baixa de Estoque</strong>.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={registerInFinance}
                  onChange={(e) => setRegisterInFinance(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                    Data do Lançamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={writeOffDate}
                    onChange={(e) => setWriteOffDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                    Categoria no Financeiro
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Baixa de Estoque"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-850 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                  Observações / Detalhes (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contagem física do estoque do mês de Março..."
                  value={generalObservation}
                  onChange={(e) => setGeneralObservation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={submittingWriteOff}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkWriteOff}
                disabled={submittingWriteOff}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                {submittingWriteOff && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar e Dar Baixa
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SINGLE QUICK ADJUSTMENT MODAL */}
      {singleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ajuste Pontual de Estoque</h3>
              <button onClick={() => setSingleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {singleError && (
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">{singleError}</div>
            )}

            <form onSubmit={handleSingleAdjustmentSubmit} className="space-y-4 text-xs font-medium">
              
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Selecionar Produto *</label>
                <select
                  required
                  value={singleProductId}
                  onChange={(e) => setSingleProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Atual: {p.quantity_in_stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Operação *</label>
                  <select
                    value={singleType}
                    onChange={(e) => setSingleType(e.target.value as 'entry' | 'exit')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                  >
                    <option value="exit">Saída (-)</option>
                    <option value="entry">Entrada (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={singleQty}
                    onChange={(e) => setSingleQty(e.target.value)}
                    placeholder="Qtd."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Motivo do Ajuste *</label>
                <select
                  value={singleReason}
                  onChange={(e) => setSingleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                >
                  <option value="manual_adjustment">Ajuste Manual</option>
                  <option value="loss">Perda de Estoque / Baixa</option>
                  <option value="purchase">Entrada de Compra / Fornecedor</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={singleLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
                >
                  {singleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Ajuste
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
