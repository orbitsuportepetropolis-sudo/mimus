'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  AlertTriangle,
  Calendar,
  X,
  Upload
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
  expiration_date: string | null
  image_url: string | null
  description: string | null
  promotional_price?: number | null
  has_free_shipping?: boolean
}

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [storePlan, setStorePlan] = useState<'free' | 'pro'>('free')
  const [planStatus, setPlanStatus] = useState<string>('trial')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Batch import states
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchTab, setBatchTab] = useState<'manual' | 'csv'>('manual')
  const [batchRows, setBatchRows] = useState<any[]>([
    { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' },
    { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' },
    { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' }
  ])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  
  // Search & Filter state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [alertFilter, setAlertFilter] = useState('all') // 'low_stock', 'expiring', 'all'

  // Form State
  const [formName, setFormName] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formBarcode, setFormBarcode] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('0.00')
  const [formSalePrice, setFormSalePrice] = useState('0.00')
  const [formStock, setFormStock] = useState('0')
  const [formMinStock, setFormMinStock] = useState('5')
  const [formExpDate, setFormExpDate] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPromotionalPrice, setFormPromotionalPrice] = useState('')
  const [formHasFreeShipping, setFormHasFreeShipping] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Categories & Brands for filters
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  // Add a blank row to batch list
  function addBatchRow() {
    setBatchRows([
      ...batchRows,
      { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' }
    ])
  }

  // Remove a row from batch list
  function removeBatchRow(index: number) {
    setBatchRows(batchRows.filter((_, i) => i !== index))
  }

  // Handle cell changes in batch editing
  function handleBatchCellChange(index: number, field: string, value: string) {
    const updated = [...batchRows]
    updated[index][field] = value
    setBatchRows(updated)
  }

  // Parse and handle CSV uploads
  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setBatchError(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      
      reader.onload = (event) => {
        const text = event.target?.result as string
        if (text) {
          try {
            const parsed = parseCSV(text)
            if (parsed.length === 0) {
              setBatchError('Nenhuma linha válida identificada no CSV. Verifique os cabeçalhos das colunas.')
            } else {
              setBatchRows(parsed)
            }
          } catch (err) {
            setBatchError('Erro ao processar o arquivo CSV. Verifique a formatação do arquivo.')
          }
        }
      }
      reader.readAsText(file, 'UTF-8')
    }
  }

  // Simple CSV parser
  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) return []
    
    const headerLine = lines[0]
    const delimiter = headerLine.includes(';') ? ';' : ','
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const rows: any[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      let values: string[] = []
      let currentVal = ''
      let insideQuotes = false
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex]
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === delimiter && !insideQuotes) {
          values.push(currentVal.trim())
          currentVal = ''
        } else {
          currentVal += char
        }
      }
      values.push(currentVal.trim())
      
      const row = {
        name: '', brand: '', category: '', sku: '', barcode: '',
        cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0',
        min_stock_alert: '5', expiration_date: '', description: ''
      }
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        const cleanedVal = value.replace(/"/g, '')
        
        if (header.includes('nome') || header.includes('name') || header.includes('produto')) {
          row.name = cleanedVal
        } else if (header.includes('marca') || header.includes('brand')) {
          row.brand = cleanedVal
        } else if (header.includes('categoria') || header.includes('category')) {
          row.category = cleanedVal
        } else if (header.includes('sku')) {
          row.sku = cleanedVal
        } else if (header.includes('barra') || header.includes('barcode') || header.includes('ean')) {
          row.barcode = cleanedVal
        } else if (header.includes('custo') || header.includes('cost')) {
          row.cost_price = cleanedVal
        } else if (header.includes('venda') || header.includes('price') || header.includes('valor')) {
          row.sale_price = cleanedVal
        } else if (header.includes('estoque') || header.includes('quantity') || header.includes('qtd')) {
          row.quantity_in_stock = cleanedVal
        } else if (header.includes('minimo') || header.includes('alerta') || header.includes('min')) {
          row.min_stock_alert = cleanedVal
        } else if (header.includes('validade') || header.includes('expiration') || header.includes('vence')) {
          row.expiration_date = cleanedVal
        } else if (header.includes('descricao') || header.includes('description')) {
          row.description = cleanedVal
        }
      })
      
      if (row.name) {
        rows.push(row)
      }
    }
    return rows
  }

  // Handle batch saving to Supabase
  async function handleBatchSave() {
    setBatchLoading(true)
    setBatchError(null)

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

      const validRows = batchRows.filter(row => row.name && row.name.trim().length > 0)
      if (validRows.length === 0) {
        throw new Error('Preencha o Nome de pelo menos um produto.')
      }

      const getTrialDaysLeft = () => {
        if (!trialEndsAt) return 0
        const diff = new Date(trialEndsAt).getTime() - Date.now()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      }
      const isTrialActive = planStatus === 'trial' && getTrialDaysLeft() > 0
      const isPro = storePlan === 'pro' || isTrialActive

      if (!isPro && products.length + validRows.length > 50) {
        throw new Error(`A importação excede o limite de 50 produtos do Plano Free. Total atual: ${products.length}. Você está tentando importar ${validRows.length}. Faça o upgrade para o Plano Pro!`)
      }

      const productsToInsert = validRows.map(row => ({
        store_id,
        name: row.name,
        brand: row.brand || null,
        category: row.category || null,
        sku: row.sku || null,
        barcode: row.barcode || null,
        cost_price: parseFloat(row.cost_price) || 0,
        sale_price: parseFloat(row.sale_price) || 0,
        quantity_in_stock: 0,
        min_stock_alert: parseInt(row.min_stock_alert) || 5,
        expiration_date: row.expiration_date || null,
        description: row.description || null
      }))

      const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select()

      if (insertError) throw insertError

      if (insertedProducts && insertedProducts.length > 0) {
        const stockMovements = insertedProducts
          .filter(p => {
            const originalRow = validRows.find(row => row.name === p.name)
            return originalRow && parseInt(originalRow.quantity_in_stock) > 0
          })
          .map(p => {
            const originalRow = validRows.find(row => row.name === p.name)
            const qty = originalRow ? parseInt(originalRow.quantity_in_stock) : 0
            return {
              store_id,
              product_id: p.id,
              quantity: qty,
              type: 'entry',
              reason: 'purchase'
            }
          })

        if (stockMovements.length > 0) {
          const { error: smError } = await supabase
            .from('stock_movements')
            .insert(stockMovements)

          if (smError) console.error('Erro ao cadastrar movimentações de estoque:', smError)
        }
      }

      await loadProducts()
      setBatchModalOpen(false)
      setBatchRows([
        { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' },
        { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' },
        { name: '', brand: '', category: '', sku: '', barcode: '', cost_price: '0.00', sale_price: '0.00', quantity_in_stock: '0', min_stock_alert: '5', expiration_date: '', description: '' }
      ])
    } catch (err: any) {
      setBatchError(err.message || 'Erro ao importar produtos. Verifique se os dados estão corretos.')
    } finally {
      setBatchLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()

    // Listen to global dashboard updates (e.g. from AI Agent)
    window.addEventListener('dashboard-refresh', loadProducts)
    return () => window.removeEventListener('dashboard-refresh', loadProducts)
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
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

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        setProducts(data)
        
        // Extract unique categories and brands for filters
        const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean))) as string[]
        const bnds = Array.from(new Set(data.map(p => p.brand).filter(Boolean))) as string[]
        setCategories(cats)
        setBrands(bnds)
      } else {
        setProducts([])
        setCategories([])
        setBrands([])
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Opens form for adding or editing
  function openModal(prod: Product | null = null) {
    setFormError(null)
    setImageFile(null)
    setImagePreview(null)

    // Enforce 50 products limit for Free Plan users when registering a NEW product
    const getTrialDaysLeft = () => {
      if (!trialEndsAt) return 0
      const diff = new Date(trialEndsAt).getTime() - Date.now()
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }
    const isTrialActive = planStatus === 'trial' && getTrialDaysLeft() > 0
    const isPro = storePlan === 'pro' || isTrialActive

    if (!prod && !isPro && products.length >= 50) {
      alert('Limite de 50 produtos atingido no Plano Free. Faça o upgrade para o Plano Pro por apenas R$39/mês para liberar cadastros ilimitados!')
      return
    }

    if (prod) {
      setEditingProduct(prod)
      setFormName(prod.name)
      setFormBrand(prod.brand || '')
      setFormCategory(prod.category || '')
      setFormSku(prod.sku || '')
      setFormBarcode(prod.barcode || '')
      setFormCostPrice(prod.cost_price.toFixed(2))
      setFormSalePrice(prod.sale_price.toFixed(2))
      setFormStock(String(prod.quantity_in_stock))
      setFormMinStock(String(prod.min_stock_alert))
      setFormExpDate(prod.expiration_date || '')
      setFormDescription(prod.description || '')
      setFormPromotionalPrice(prod.promotional_price ? prod.promotional_price.toFixed(2) : '')
      setFormHasFreeShipping(!!prod.has_free_shipping)
      setImagePreview(prod.image_url)
    } else {
      setEditingProduct(null)
      setFormName('')
      setFormBrand('')
      setFormCategory('')
      setFormSku('')
      setFormBarcode('')
      setFormCostPrice('0.00')
      setFormSalePrice('0.00')
      setFormStock('0')
      setFormMinStock('5')
      setFormExpDate('')
      setFormDescription('')
      setFormPromotionalPrice('')
      setFormHasFreeShipping(false)
    }
    setModalOpen(true)
  }

  // Image Selection Handle
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Upload image file to Supabase Storage
  async function uploadProductImage(storeId: string): Promise<string | null> {
    if (!imageFile) return null

    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${storeId}/${Date.now()}.${fileExt}`
      
      // Upload using Supabase storage client
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        // If bucket doesn't exist, log it and return public fallback
        console.error('Erro storage upload (tentando criar bucket):', error)
        return null
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (err) {
      console.error('Falha de upload da imagem:', err)
      return null
    }
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      // Get the profile to match store_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')
      const store_id = profile.store_id

      let finalImageUrl = imagePreview

      // Upload if new file selected
      if (imageFile) {
        const uploadedUrl = await uploadProductImage(store_id)
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        }
      }

      const productPayload: any = {
        store_id,
        name: formName,
        brand: formBrand || null,
        category: formCategory || null,
        sku: formSku || null,
        barcode: formBarcode || null,
        cost_price: parseFloat(formCostPrice) || 0,
        sale_price: parseFloat(formSalePrice) || 0,
        promotional_price: formPromotionalPrice ? parseFloat(formPromotionalPrice) : null,
        has_free_shipping: formHasFreeShipping,
        quantity_in_stock: editingProduct ? (parseInt(formStock) || 0) : 0,
        min_stock_alert: parseInt(formMinStock) || 5,
        expiration_date: formExpDate || null,
        image_url: finalImageUrl,
        description: formDescription || null
      }

      if (editingProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id)
          .eq('store_id', store_id)

        if (error) throw error
      } else {
        // Insert product
        const { data: newProd, error } = await supabase
          .from('products')
          .insert([productPayload])
          .select()

        if (error) throw error

        // If stock > 0, log an initial stock entry in movements
        if (newProd && newProd[0] && parseInt(formStock) > 0) {
          await supabase.from('stock_movements').insert([{
            store_id,
            product_id: newProd[0].id,
            quantity: parseInt(formStock),
            type: 'entry',
            reason: 'purchase'
          }])
        }
      }

      await loadProducts()
      setModalOpen(false)
    } catch (err: any) {
      if (err.code === '42703') {
        setFormError('Colunas necessárias não existem na tabela de produtos. Por favor, execute a seguinte query no SQL Editor do Supabase:\n\nALTER TABLE public.products ADD COLUMN IF NOT EXISTS promotional_price numeric(10,2);\nALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_free_shipping boolean NOT NULL DEFAULT false;')
      } else {
        setFormError(err.message || 'Erro ao salvar produto. Preencha todos os campos corretamente.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Delete product
  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
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

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('store_id', store_id)

        if (error) throw error
        await loadProducts()
      } catch (err: any) {
        alert('Não foi possível excluir o produto. Certifique-se de que ele não possui registros de vendas vinculados.')
      }
    }
  }

  // Filter products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search))

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    const matchesBrand = brandFilter === 'all' || p.brand === brandFilter

    let matchesAlert = true
    if (alertFilter === 'low_stock') {
      matchesAlert = p.quantity_in_stock <= p.min_stock_alert
    } else if (alertFilter === 'expiring') {
      if (!p.expiration_date) {
        matchesAlert = false
      } else {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        const expDate = new Date(p.expiration_date)
        matchesAlert = expDate <= thirtyDaysFromNow && expDate >= new Date()
      }
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesAlert
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Cadastro de Produtos</h1>
            {storePlan === 'free' && (
              <span className="text-[10px] text-amber-650 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full font-bold border border-amber-100 dark:border-amber-905/30">
                Plano Free ({products.length}/50 un.)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Adicione, edite e controle o estoque dos seus produtos de beleza.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={() => setBatchModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150"
          >
            <Upload className="w-4 h-4" /> Importar em Lote (NF / CSV)
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-4.5 h-4.5" /> Adicionar Produto
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs transition-all duration-150"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Category Select */}
            <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1 bg-slate-50/50 dark:bg-zinc-950/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Cat:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">Todas</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Brand Select */}
            <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1 bg-slate-50/50 dark:bg-zinc-950/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Marca:</span>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">Todas</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Alerts Filter */}
            <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1 bg-slate-50/50 dark:bg-zinc-950/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Status:</span>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">Normal</option>
                <option value="low_stock">Estoque Baixo</option>
                <option value="expiring">Vencimento Próximo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-12 text-center">
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Nenhum produto cadastrado ou correspondente aos filtros.</p>
          <button 
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-500"
          >
            Adicionar o primeiro produto <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria / Marca</th>
                  <th className="px-6 py-4">Preço Venda</th>
                  <th className="px-6 py-4">Estoque</th>
                  <th className="px-6 py-4">Validade</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40 text-xs">
                {filteredProducts.map((p) => {
                  const isLowStock = p.quantity_in_stock <= p.min_stock_alert
                  const isExpiring = p.expiration_date && (() => {
                    const limit = new Date()
                    limit.setDate(limit.getDate() + 30)
                    return new Date(p.expiration_date) <= limit && new Date(p.expiration_date) >= new Date()
                  })()

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-950/10">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200/50 dark:border-zinc-800">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 dark:text-zinc-200">{p.name}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{p.sku || 'Sem SKU'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{p.category || 'Outros'}</span>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">{p.brand || 'Sem marca'}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">
                        R$ {p.sale_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                            {p.quantity_in_stock} un.
                          </span>
                          {isLowStock && (
                            <span title="Estoque abaixo do recomendado!"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.expiration_date ? (
                          <div className="flex items-center gap-1">
                            <span className={isExpiring ? 'text-pink-600 font-semibold' : 'text-slate-500 dark:text-zinc-400'}>
                              {new Date(p.expiration_date).toLocaleDateString('pt-BR')}
                            </span>
                            {isExpiring && <span title="Maquiagem vencendo em menos de 30 dias!"><Calendar className="w-3.5 h-3.5 text-pink-500" /></span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-100 dark:border-rose-900/30">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Corretivo Liquido BT"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ex: Bruna Tavares"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Maquiagem, Skin Care"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Ex: CORR-BT-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="EAN-13"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPromotionalPrice}
                    onChange={(e) => setFormPromotionalPrice(e.target.value)}
                    placeholder="Deixe em branco se não houver"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={formHasFreeShipping}
                      onChange={(e) => setFormHasFreeShipping(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 border-slate-200 focus:ring-rose-500 cursor-pointer"
                    />
                    <span>Ativar etiqueta de Frete Grátis</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Quantidade em Estoque *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingProduct} // manual stock adjustment has its own page/triggers
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Aviso Mínimo Estoque *</label>
                  <input
                    type="number"
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Data de Validade</label>
                  <input
                    type="date"
                    value={formExpDate}
                    onChange={(e) => setFormExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Descrição do Produto</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descrição detalhada do cosmético (modo de uso, benefícios, ingredientes, etc.)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Photo Upload */}
                <div className="col-span-2 space-y-2">
                  <label className="block text-slate-400 dark:text-zinc-500">Foto do Produto</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 hover:border-rose-500 rounded-xl cursor-pointer text-xs font-semibold hover:text-rose-500 transition-colors">
                      <Upload className="w-4 h-4" /> Selecionar Foto
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-50 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                  Salvar Produto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Importação de Produtos em Lote</h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">Adicione múltiplos produtos ao mesmo tempo via tabela ou planilha CSV.</p>
              </div>
              <button 
                onClick={() => {
                  setBatchModalOpen(false)
                  setBatchError(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-100 dark:border-rose-900/30">
                {batchError}
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-zinc-800 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBatchTab('manual')
                  setBatchError(null)
                }}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  batchTab === 'manual'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                }`}
              >
                Digitação de Lote / NF
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchTab('csv')
                  setBatchError(null)
                }}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  batchTab === 'csv'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                }`}
              >
                Importar Planilha CSV
              </button>
            </div>

            {batchTab === 'csv' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/50 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-800 dark:text-zinc-200">Como deve ser seu arquivo CSV:</p>
                  <p>O arquivo deve possuir cabeçalhos. São aceitos os seguintes nomes de colunas (em português ou inglês):</p>
                  <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                    <li><strong>Nome / Produto / Name:</strong> Nome do produto (obrigatório)</li>
                    <li><strong>Marca / Brand:</strong> Marca do fabricante</li>
                    <li><strong>Categoria / Category:</strong> Categoria do item</li>
                    <li><strong>SKU:</strong> Código de estoque interno</li>
                    <li><strong>Código de Barras / Barcode / EAN:</strong> Código EAN do produto</li>
                    <li><strong>Preço de Custo / Cost Price:</strong> Valor decimal de custo</li>
                    <li><strong>Preço de Venda / Price:</strong> Valor decimal de venda</li>
                    <li><strong>Quantidade / Qtd / Quantity:</strong> Estoque inicial</li>
                    <li><strong>Mínimo / Alerta / Min:</strong> Quantidade mínima para alertas</li>
                    <li><strong>Validade / Expiration:</strong> Data no formato AAAA-MM-DD</li>
                    <li><strong>Descrição / Description:</strong> Detalhes e descrição do produto</li>
                  </ul>
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-350 dark:border-zinc-800 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-950/20 dark:hover:bg-zinc-950/40 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="mb-1 text-xs text-slate-550 dark:text-zinc-450 font-semibold">Clique para selecionar ou arraste o arquivo CSV</p>
                      <p className="text-[10px] text-slate-450">Formatos aceitos: .csv (separado por vírgula ou ponto-e-vírgula)</p>
                    </div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleCsvUpload} 
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Batch Table Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Produtos a Importar ({batchRows.length})</span>
                {batchTab === 'manual' && (
                  <button
                    type="button"
                    onClick={addBatchRow}
                    className="px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-950/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 font-bold text-[10px] transition-colors"
                  >
                    + Adicionar Linha
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
                <table className="w-full border-collapse text-left text-[11px] min-w-[1400px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <th className="px-3 py-2.5 w-[220px]">Nome *</th>
                      <th className="px-3 py-2.5 w-[130px]">Marca</th>
                      <th className="px-3 py-2.5 w-[130px]">Categoria</th>
                      <th className="px-3 py-2.5 w-[110px]">SKU</th>
                      <th className="px-3 py-2.5 w-[130px]">Cód. Barras</th>
                      <th className="px-3 py-2.5 w-[90px]">Custo (R$) *</th>
                      <th className="px-3 py-2.5 w-[90px]">Venda (R$) *</th>
                      <th className="px-3 py-2.5 w-[80px]">Qtd *</th>
                      <th className="px-3 py-2.5 w-[80px]">Alerta Mín. *</th>
                      <th className="px-3 py-2.5 w-[130px]">Validade</th>
                      <th className="px-3 py-2.5 w-[200px]">Descrição</th>
                      <th className="px-3 py-2.5 text-center w-[50px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 bg-white dark:bg-zinc-900/50">
                    {batchRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-zinc-950/5">
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={row.name} 
                            onChange={(e) => handleBatchCellChange(idx, 'name', e.target.value)} 
                            placeholder="Nome do produto"
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={row.brand} 
                            onChange={(e) => handleBatchCellChange(idx, 'brand', e.target.value)} 
                            placeholder="Marca"
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={row.category} 
                            onChange={(e) => handleBatchCellChange(idx, 'category', e.target.value)} 
                            placeholder="Categoria"
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={row.sku} 
                            onChange={(e) => handleBatchCellChange(idx, 'sku', e.target.value)} 
                            placeholder="SKU"
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={row.barcode} 
                            onChange={(e) => handleBatchCellChange(idx, 'barcode', e.target.value)} 
                            placeholder="Cód. Barras"
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={row.cost_price} 
                            onChange={(e) => handleBatchCellChange(idx, 'cost_price', e.target.value)} 
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={row.sale_price} 
                            onChange={(e) => handleBatchCellChange(idx, 'sale_price', e.target.value)} 
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={row.quantity_in_stock} 
                            onChange={(e) => handleBatchCellChange(idx, 'quantity_in_stock', e.target.value)} 
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={row.min_stock_alert} 
                            onChange={(e) => handleBatchCellChange(idx, 'min_stock_alert', e.target.value)} 
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="date" 
                            value={row.expiration_date} 
                            onChange={(e) => handleBatchCellChange(idx, 'expiration_date', e.target.value)} 
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={row.description} 
                            onChange={(e) => handleBatchCellChange(idx, 'description', e.target.value)} 
                            placeholder="Descrição"
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeBatchRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-550 rounded"
                            title="Remover linha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-50 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setBatchModalOpen(false)
                  setBatchError(null)
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBatchSave}
                disabled={batchLoading || batchRows.length === 0}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5"
              >
                {batchLoading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                Confirmar Importação
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
