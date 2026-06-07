'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  ShoppingBag, 
  Trash2, 
  UserPlus, 
  Percent, 
  DollarSign, 
  Coins, 
  CreditCard, 
  CheckCircle,
  Plus,
  Minus,
  Loader2,
  X,
  History,
  Calendar,
  Check,
  AlertCircle
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string | null
  sale_price: number
  quantity_in_stock: number
  image_url: string | null
}

interface Customer {
  id: string
  name: string
  phone: string | null
}

interface CartItem {
  product: Product
  quantity: number
}

export default function SalesPage() {
  const supabase = createClient()
  
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'money' | 'credit_card' | 'debit_card'>('pix')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastSaleDetails, setLastSaleDetails] = useState<any>(null)

  // Quick Customer Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustInstagram, setNewCustInstagram] = useState('')
  const [newCustBirthday, setNewCustBirthday] = useState('')
  const [custLoading, setCustLoading] = useState(false)
  const [custError, setCustError] = useState<string | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<'pdv' | 'history'>('pdv')

  // History & Orders state
  const [salesHistory, setSalesHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago' | 'cancelado'>('all')

  // Confirm Payment Modal
  const [paymentConfirmModalOpen, setPaymentConfirmModalOpen] = useState(false)
  const [selectedSaleToConfirm, setSelectedSaleToConfirm] = useState<any | null>(null)
  const [paymentConfirmMethod, setPaymentConfirmMethod] = useState<'pix' | 'money' | 'credit_card' | 'debit_card'>('pix')
  const [paymentConfirmLoading, setPaymentConfirmLoading] = useState(false)

  // Cancel Order Modal
  const [cancelConfirmModalOpen, setCancelConfirmModalOpen] = useState(false)
  const [selectedSaleToCancel, setSelectedSaleToCancel] = useState<any | null>(null)
  const [cancelConfirmLoading, setCancelConfirmLoading] = useState(false)

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<any | null>(null)

  async function loadSalesHistory() {
    try {
      setHistoryLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const storeId = profile.store_id

      let query = supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total_value,
          discount,
          payment_method,
          status,
          delivery_type,
          delivery_address,
          customers(name, phone),
          sale_items(
            id,
            quantity,
            unit_price,
            products(name, brand)
          )
        `)
        .eq('store_id', storeId)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setSalesHistory(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleConfirmPayment() {
    if (!selectedSaleToConfirm) return
    setPaymentConfirmLoading(true)
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          status: 'pago',
          payment_method: paymentConfirmMethod
        })
        .eq('id', selectedSaleToConfirm.id)

      if (error) throw error

      setPaymentConfirmModalOpen(false)
      setSelectedSaleToConfirm(null)
      await loadSalesHistory()
      // Dispatch refresh event to update dashboard widgets
      window.dispatchEvent(new CustomEvent('dashboard-refresh'))
    } catch (err: any) {
      alert('Erro ao confirmar pagamento: ' + err.message)
    } finally {
      setPaymentConfirmLoading(false)
    }
  }

  async function handleCancelOrder() {
    if (!selectedSaleToCancel) return
    setCancelConfirmLoading(true)
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          status: 'cancelado'
        })
        .eq('id', selectedSaleToCancel.id)

      if (error) throw error

      setCancelConfirmModalOpen(false)
      setSelectedSaleToCancel(null)
      await loadSalesHistory()
      window.dispatchEvent(new CustomEvent('dashboard-refresh'))
    } catch (err: any) {
      alert('Erro ao cancelar pedido: ' + err.message)
    } finally {
      setCancelConfirmLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadSalesHistory()
    }
  }, [activeTab, statusFilter])

  useEffect(() => {
    loadPDVData(true)

    const handleRefresh = () => {
      loadPDVData(false)
    }

    window.addEventListener('dashboard-refresh', handleRefresh)
    return () => window.removeEventListener('dashboard-refresh', handleRefresh)
  }, [])

  async function loadPDVData(showSpinner = false) {
    try {
      if (showSpinner) setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const storeId = profile.store_id
      
      // Fetch products in stock
      let { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('id, name, brand, sale_price, quantity_in_stock, image_url, active')
        .eq('store_id', storeId)
        .eq('active', true)
        .gt('quantity_in_stock', 0)
        .order('name', { ascending: true })

      if (prodsErr && prodsErr.code === '42703') {
        const fallback = await supabase
          .from('products')
          .select('id, name, brand, sale_price, quantity_in_stock, image_url')
          .eq('store_id', storeId)
          .gt('quantity_in_stock', 0)
          .order('name', { ascending: true })
        prods = fallback.data as any
      }

      if (prods) {
        setProducts(prods.filter((p: any) => p.active !== false))
      } else {
        setProducts([])
      }

      // Fetch customers
      const { data: custs } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('store_id', storeId)
        .order('name', { ascending: true })

      if (custs) {
        setCustomers(custs)
      } else {
        setCustomers([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Add Item to Cart
  function addToCart(prod: Product) {
    const existing = cart.find(item => item.product.id === prod.id)
    if (existing) {
      if (existing.quantity >= prod.quantity_in_stock) {
        alert(`Estoque máximo atingido (${prod.quantity_in_stock} unidades disponíveis).`)
        return
      }
      setCart(cart.map(item => 
        item.product.id === prod.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ))
    } else {
      setCart([...cart, { product: prod, quantity: 1 }])
    }
  }

  // Decrease quantity
  function decreaseQty(prodId: string) {
    const existing = cart.find(item => item.product.id === prodId)
    if (existing) {
      if (existing.quantity === 1) {
        setCart(cart.filter(item => item.product.id !== prodId))
      } else {
        setCart(cart.map(item => 
          item.product.id === prodId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        ))
      }
    }
  }

  // Remove Item
  function removeFromCart(prodId: string) {
    setCart(cart.filter(item => item.product.id !== prodId))
  }

  // Calculate Totals
  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.sale_price * curr.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercentage / 100) * 100) / 100
  const total = Math.max(0, subtotal - discountAmount)

  // Quick Customer Create
  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault()
    setCustLoading(true)
    setCustError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')

      const { data: newCust, error } = await supabase
        .from('customers')
        .insert([{
          store_id: profile.store_id,
          name: newCustName,
          phone: newCustPhone || null,
          instagram: newCustInstagram || null,
          birthday: newCustBirthday || null
        }])
        .select()

      if (error) throw error

      if (newCust && newCust[0]) {
        setSelectedCustomer(newCust[0])
        setCustomers([newCust[0], ...customers])
        setCustomerModalOpen(false)
        setNewCustName('')
        setNewCustPhone('')
        setNewCustInstagram('')
        setNewCustBirthday('')
      }
    } catch (err: any) {
      setCustError(err.message || 'Erro ao cadastrar cliente.')
    } finally {
      setCustLoading(false)
    }
  }

  // Checkout Finalize
  async function handleCheckout() {
    if (cart.length === 0) {
      alert('Seu carrinho está vazio.')
      return
    }

    setCheckoutLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário deslogado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não identificada')

      const storeId = profile.store_id

      // 1. Insert the Sale (manually in PDV is marked as paid immediately)
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: storeId,
          customer_id: selectedCustomer?.id || null,
          total_value: total,
          discount: discountAmount,
          payment_method: paymentMethod,
          status: 'pago'
        }])
        .select()

      if (saleError) throw saleError
      const sale = saleData[0]

      // 2. Insert Sale Items
      const saleItemsPayload = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.sale_price
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsPayload)

      if (itemsError) throw itemsError

      // Record details for success screen
      setLastSaleDetails({
        id: sale.id,
        total: total,
        payment: paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'money' ? 'Dinheiro' : paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito',
        itemsCount: cart.length
      })

      // Clear PDV state
      setCart([])
      setSelectedCustomer(null)
      setDiscountPercentage(0)
      setSuccessOpen(true)
      
      // Reload product stock list
      await loadPDVData()
    } catch (err: any) {
      alert('Erro ao finalizar venda: ' + err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Filters product lists
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Tab Selector */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('pdv')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'pdv'
              ? 'border-rose-500 text-rose-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Frente de Caixa (PDV)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'history'
              ? 'border-rose-500 text-rose-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <History className="w-4 h-4" /> Pedidos & Histórico
        </button>
      </div>

      {activeTab === 'pdv' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[75vh]">
          
          {/* 1. Left side: Product catalog (Grid list) */}
          <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-500" /> Frente de Caixa / PDV
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Clique nos produtos para adicioná-los ao carrinho.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar maquiagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex-1 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <p className="text-slate-400 dark:text-zinc-500 text-xs">Nenhum produto disponível em estoque.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[65vh] pr-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm text-left hover:border-rose-500 hover:ring-1 hover:ring-rose-500/20 transition-all flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div className="space-y-2">
                      <div className="aspect-square bg-slate-50 dark:bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-zinc-800/60">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase">{p.name.slice(0,3)}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold">{p.brand || 'Cosméticos'}</span>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200 line-clamp-2 leading-tight h-8">{p.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800/40 pt-2 mt-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">R$ {p.sale_price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{p.quantity_in_stock} un.</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Right side: Checkout controls */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between h-fit gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  Carrinho ({cart.reduce((a,c) => a + c.quantity, 0)})
                </h3>
                {cart.length > 0 && (
                  <button 
                    onClick={() => setCart([])}
                    className="text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    Esvaziar
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                  Adicione maquiagens ao carrinho para começar.
                </div>
              ) : (
                <div className="space-y-3 max-h-[25vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/50 text-xs">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-700 dark:text-zinc-300 truncate">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">R$ {item.product.sale_price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => decreaseQty(item.product.id)}
                          className="p-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item.product)}
                          className="p-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Cliente da Compra</label>
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Cadastrar Cliente
                </button>
              </div>
              
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedCustomer.name}</span>
                    {selectedCustomer.phone && <p className="text-[10px] text-slate-400">{selectedCustomer.phone}</p>}
                  </div>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente ou deixar avulso..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none text-xs"
                  />
                  {customerSearch && (
                    <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-lg z-20 text-xs">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c)
                            setCustomerSearch('')
                          }}
                          className="w-full p-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-950 border-b border-slate-50 dark:border-zinc-850 last:border-0"
                        >
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{c.name}</span>
                          {c.phone && <span className="text-[10px] text-slate-400 ml-2">({c.phone})</span>}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="p-2 text-center text-slate-400">Nenhum cliente encontrado.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Desconto Geral (%)</label>
                  {discountPercentage > 0 && <span className="text-[10px] text-rose-500 font-bold">{discountPercentage}% (- R$ {discountAmount.toFixed(2)})</span>}
                </div>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentage || ''}
                    onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none text-xs"
                    placeholder="0 %"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { value: 'pix', label: 'PIX', icon: Coins },
                    { value: 'money', label: 'Dinheiro', icon: DollarSign },
                    { value: 'credit_card', label: 'Crédito', icon: CreditCard },
                    { value: 'debit_card', label: 'Débito', icon: CreditCard }
                  ].map(m => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPaymentMethod(m.value as any)}
                        className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          isSel 
                            ? 'border-rose-500 bg-rose-50/20 text-rose-600 dark:bg-rose-950/20' 
                            : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-zinc-800">
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto ({discountPercentage}%)</span>
                  <span className="font-semibold text-rose-500">- R$ {discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-50 dark:border-zinc-855">
                  <span>Total Geral</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all duration-150 shadow-lg shadow-rose-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                  </span>
                ) : (
                  'Finalizar Venda'
                )}
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-zinc-850 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pedidos e Vendas da Loja</h3>
              <p className="text-[11px] text-slate-400">Gerencie pedidos recebidos do catálogo e acompanhe o histórico de vendas.</p>
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[10px]">
              {[
                { label: 'Todos', value: 'all' },
                { label: 'Pendentes / Novos', value: 'pendente' },
                { label: 'Pagos', value: 'pago' },
                { label: 'Cancelados', value: 'cancelado' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as any)}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                    statusFilter === f.value
                      ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/10'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-850'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-zinc-500">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30 text-rose-500" />
              <p className="text-xs">Nenhum pedido ou venda encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="py-3 px-2">Cliente</th>
                    <th className="py-3 px-2">Data / Hora</th>
                    <th className="py-3 px-2">Valor Total</th>
                    <th className="py-3 px-2">Forma Pgto</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {salesHistory.map(sale => {
                    const custName = sale.customers?.name || 'Cliente Avulso';
                    const custPhone = sale.customers?.phone || '';
                    const formattedDate = new Date(sale.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    const isPaid = sale.status === 'pago';
                    const isCancelled = sale.status === 'cancelado';
                    const isPending = !isPaid && !isCancelled;

                    const paymentLabel = 
                      sale.payment_method === 'pix' ? 'Pix' :
                      sale.payment_method === 'money' ? 'Dinheiro' :
                      sale.payment_method === 'credit_card' ? 'Crédito' :
                      sale.payment_method === 'debit_card' ? 'Débito' : 'Não definido';

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20">
                        <td className="py-3 px-2 max-w-[220px] sm:max-w-[320px]">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 block">{custName}</span>
                          {custPhone && <span className="text-[10px] text-slate-400 block mb-1">{custPhone}</span>}
                          {sale.delivery_type && (
                            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold border mr-1.5 mb-1 ${
                              sale.delivery_type === 'delivery'
                                ? 'bg-amber-50/50 text-amber-600 border-amber-100/30 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/20'
                                : 'bg-blue-50/50 text-blue-600 border-blue-100/30 dark:bg-blue-950/10 dark:text-blue-400 dark:border-blue-900/20'
                            }`}>
                              {sale.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                            </span>
                          )}
                          {sale.sale_items && sale.sale_items.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {sale.sale_items.map((item: any) => (
                                <span 
                                  key={item.id} 
                                  className="inline-flex items-center gap-1 bg-rose-50/50 dark:bg-rose-950/10 text-[9px] text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold border border-rose-100/30 dark:border-rose-900/20"
                                  title={`${item.products?.name} (${item.products?.brand || 'Geral'}) — R$ ${Number(item.unit_price).toFixed(2)}`}
                                >
                                  {item.quantity}x {item.products?.name || 'Produto'}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-400 font-mono">{formattedDate}</td>
                        <td className="py-3 px-2 font-extrabold text-slate-850 dark:text-zinc-150">
                          R$ {Number(sale.total_value).toFixed(2)}
                          {Number(sale.discount) > 0 && (
                            <span className="text-[9px] text-rose-500 block">Desconto: - R$ {Number(sale.discount).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-zinc-400">
                          {isPaid ? (
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{paymentLabel}</span>
                          ) : isCancelled ? (
                            <span className="text-slate-400 line-through">N/A</span>
                          ) : (
                            <span className="text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-bold text-[9px] uppercase tracking-wide">Pendente</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {isPaid ? (
                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">Pago</span>
                          ) : isCancelled ? (
                            <span className="bg-slate-50 text-slate-500 dark:bg-zinc-800/40 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">Cancelado</span>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/30 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">Aguardando</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            <button
                              onClick={() => {
                                setSelectedSaleDetails(sale);
                                setDetailsModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-350 font-extrabold text-[9px] uppercase tracking-wider transition-colors border border-slate-200 dark:border-zinc-700"
                            >
                              Ver Itens
                            </button>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedSaleToConfirm(sale);
                                    setPaymentConfirmMethod('pix');
                                    setPaymentConfirmModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider transition-colors shadow-sm"
                                >
                                  Confirmar Pgto
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSaleToCancel(sale);
                                    setCancelConfirmModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-650 dark:text-zinc-300 font-extrabold text-[9px] uppercase tracking-wider transition-colors border border-slate-200 dark:border-zinc-700"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-300 dark:text-zinc-700 text-[10px] ml-1.5">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Payment Modal */}
      {paymentConfirmModalOpen && selectedSaleToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Check className="w-5 h-5 text-emerald-500" /> Confirmar Pagamento
              </h3>
              <button onClick={() => setPaymentConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-500">
                Confirme a entrada do pagamento do pedido de <strong>{selectedSaleToConfirm.customers?.name || 'Cliente Avulso'}</strong> no valor de <strong>R$ {Number(selectedSaleToConfirm.total_value).toFixed(2)}</strong>.
              </p>
              
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-1.5 font-medium">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Forma de Recebimento</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { value: 'pix', label: 'PIX', icon: Coins },
                    { value: 'money', label: 'Dinheiro', icon: DollarSign },
                    { value: 'credit_card', label: 'Crédito', icon: CreditCard },
                    { value: 'debit_card', label: 'Débito', icon: CreditCard }
                  ].map(method => {
                    const Icon = method.icon;
                    const isSel = paymentConfirmMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentConfirmMethod(method.value as any)}
                        className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs ${
                          isSel 
                            ? 'border-rose-500 bg-rose-50/20 text-rose-600 dark:bg-rose-955' 
                            : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setPaymentConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={paymentConfirmLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {paymentConfirmLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelConfirmModalOpen && selectedSaleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-rose-500" /> Cancelar Pedido
              </h3>
              <button onClick={() => setCancelConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Você tem certeza de que deseja cancelar o pedido de <strong>{selectedSaleToCancel.customers?.name || 'Cliente Avulso'}</strong>?
              Esta ação irá <strong>devolver automaticamente os produtos ao estoque</strong> e remover a transação financeira correspondente.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setCancelConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs"
              >
                Não, manter
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelConfirmLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {cancelConfirmLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar Cancelamento
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Modal */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-900/30">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Venda Concluída!</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">O estoque e financeiro foram atualizados automaticamente.</p>
            </div>

            {lastSaleDetails && (
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/50 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-zinc-900 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="font-bold text-slate-800 dark:text-white">R$ {lastSaleDetails.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pagamento:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">{lastSaleDetails.payment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Produtos:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{lastSaleDetails.itemsCount} itens</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSuccessOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs"
            >
              Iniciar Nova Venda
            </button>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Cadastrar Cliente Rápido</h3>
              <button onClick={() => setCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {custError && (
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg text-[10px]">{custError}</div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Instagram (@)</label>
                <input
                  type="text"
                  value={newCustInstagram}
                  onChange={(e) => setNewCustInstagram(e.target.value)}
                  placeholder="Ex: @bella_makeup"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Data Aniversário</label>
                <input
                  type="date"
                  value={newCustBirthday}
                  onChange={(e) => setNewCustBirthday(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={custLoading}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold flex items-center gap-1"
                >
                  {custLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {detailsModalOpen && selectedSaleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4.5 h-4.5 text-rose-500" /> Detalhes do Pedido
              </h3>
              <button 
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedSaleDetails(null);
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cliente</span>
                  <p className="font-bold text-slate-700 dark:text-zinc-200 mt-0.5">
                    {selectedSaleDetails.customers?.name || 'Cliente Avulso'}
                  </p>
                  {selectedSaleDetails.customers?.phone && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedSaleDetails.customers?.phone}</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Data / Hora</span>
                  <p className="font-bold text-slate-750 dark:text-zinc-250 mt-0.5 font-mono">
                    {new Date(selectedSaleDetails.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status do Pedido</span>
                  <div className="mt-1">
                    {selectedSaleDetails.status === 'pago' ? (
                      <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">
                        Pago
                      </span>
                    ) : selectedSaleDetails.status === 'cancelado' ? (
                      <span className="bg-slate-100 text-slate-500 dark:bg-zinc-800/40 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">
                        Cancelado
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/30 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">
                        Aguardando
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Forma de Pgto</span>
                  <p className="font-bold text-slate-700 dark:text-zinc-300 mt-0.5 uppercase">
                    {selectedSaleDetails.payment_method === 'pix' ? 'Pix' :
                     selectedSaleDetails.payment_method === 'money' ? 'Dinheiro' :
                     selectedSaleDetails.payment_method === 'credit_card' ? 'Crédito' :
                     selectedSaleDetails.payment_method === 'debit_card' ? 'Débito' : 'Não definido'}
                  </p>
                </div>
              </div>

              {/* Delivery / Modality Info */}
              {selectedSaleDetails.delivery_type && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Modalidade de Compra</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                      selectedSaleDetails.delivery_type === 'delivery'
                        ? 'bg-amber-50/50 text-amber-600 border-amber-100/30 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/20'
                        : 'bg-blue-50/50 text-blue-600 border-blue-100/30 dark:bg-blue-950/10 dark:text-blue-400 dark:border-blue-900/20'
                    }`}>
                      {selectedSaleDetails.delivery_type === 'delivery' ? '🛵 Entrega em Domicílio' : '🏪 Retirar na Loja'}
                    </span>
                  </div>
                  {selectedSaleDetails.delivery_type === 'delivery' && selectedSaleDetails.delivery_address && (
                    <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Endereço de Entrega</span>
                      <p className="font-medium text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed break-words font-sans">
                        {selectedSaleDetails.delivery_address}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Products list */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-bold">Produtos Vendidos</span>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/50 max-h-[25vh] overflow-y-auto pr-1">
                  {selectedSaleDetails.sale_items && selectedSaleDetails.sale_items.length > 0 ? (
                    selectedSaleDetails.sale_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-slate-750 dark:text-zinc-200 truncate">{item.products?.name || 'Produto'}</p>
                          <span className="text-[10px] text-slate-400">{item.products?.brand || 'Geral'}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-700 dark:text-zinc-200">
                            {item.quantity}x R$ {Number(item.unit_price).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-rose-500 font-bold font-mono">
                            R$ {(item.quantity * Number(item.unit_price)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4 text-xs">Nenhum produto associado.</p>
                  )}
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    R$ {(Number(selectedSaleDetails.total_value) + Number(selectedSaleDetails.discount)).toFixed(2)}
                  </span>
                </div>
                {Number(selectedSaleDetails.discount) > 0 && (
                  <div className="flex justify-between">
                    <span>Desconto</span>
                    <span className="font-semibold text-rose-500">- R$ {Number(selectedSaleDetails.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span>Total do Pedido</span>
                  <span className="font-mono">R$ {Number(selectedSaleDetails.total_value).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions for Pending orders */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedSaleDetails(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-650 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850"
              >
                Fechar
              </button>
              {selectedSaleDetails.status === 'pendente' && (
                <>
                  <button
                    onClick={() => {
                      setDetailsModalOpen(false);
                      setSelectedSaleToConfirm(selectedSaleDetails);
                      setPaymentConfirmMethod('pix');
                      setPaymentConfirmModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Confirmar Pagamento
                  </button>
                  <button
                    onClick={() => {
                      setDetailsModalOpen(false);
                      setSelectedSaleToCancel(selectedSaleDetails);
                      setCancelConfirmModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Cancelar Pedido
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
