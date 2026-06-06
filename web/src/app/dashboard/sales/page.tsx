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
  X
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
  const [discount, setDiscount] = useState<number>(0)
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
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, brand, sale_price, quantity_in_stock, image_url')
        .eq('store_id', storeId)
        .eq('active', true)
        .gt('quantity_in_stock', 0)
        .order('name', { ascending: true })

      // Fetch customers
      const { data: custs } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('store_id', storeId)
        .order('name', { ascending: true })

      if (prods) {
        setProducts(prods)
      } else {
        setProducts([])
      }

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
  const total = Math.max(0, subtotal - discount)

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

      // 1. Insert the Sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: storeId,
          customer_id: selectedCustomer?.id || null,
          total_value: total,
          discount: discount,
          payment_method: paymentMethod
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
      setDiscount(0)
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[75vh] animate-in fade-in duration-200">
      
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

      {/* 2. Right side: Checkout controls (Cart & customer selection) */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between h-fit gap-6">
        
        {/* Cart Header */}
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

          {/* Cart list */}
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

        {/* Customer Select */}
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

        {/* Discount & Payment Method */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Desconto Geral (R$)</label>
              {discount > 0 && <span className="text-[10px] text-rose-500 font-bold">- R$ {discount.toFixed(2)}</span>}
            </div>
            <div className="relative">
              <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none text-xs"
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'pix' 
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                }`}
              >
                <Coins className="w-3.5 h-3.5" /> PIX
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('money')}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'money' 
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Dinheiro
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'credit_card' 
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Crédito
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('debit_card')}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'debit_card' 
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Débito
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-zinc-800">
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto</span>
              <span className="font-semibold text-rose-500">- R$ {discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-50 dark:border-zinc-850">
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

    </div>
  )
}
