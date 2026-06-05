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
  Upload,
  Save,
  Eye,
  History
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

interface StockEntry {
  id: string
  date: string
  supplier: string | null
  observations: string | null
  total_value: number
  total_items: number
  created_at: string
}

interface EntryItemDetails {
  id: string
  product_name: string
  sku: string | null
  quantity: number
  unit_cost: number
  total_cost: number
}

interface LocalEntryItem {
  productId: string
  productName: string
  quantity: number
  totalCost: number
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

  // Navigation
  const [activeTab, setActiveTab] = useState<'list' | 'entry' | 'history'>('list')

  // Stock Entry Form States
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [entrySupplier, setEntrySupplier] = useState('')
  const [entryObservations, setEntryObservations] = useState('')
  
  // Local list of items for the current stock entry
  const [localEntryItems, setLocalEntryItems] = useState<LocalEntryItem[]>([])
  
  // Selection fields for current item being added
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedQty, setSelectedQty] = useState('1')
  const [selectedTotalCost, setSelectedTotalCost] = useState('0.00')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Save Entry loading/error states
  const [entryLoading, setEntryLoading] = useState(false)
  const [entryError, setEntryError] = useState<string | null>(null)

  // History tab states
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  
  // Details Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null)
  const [entryDetailsItems, setEntryDetailsItems] = useState<EntryItemDetails[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

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

      if (!isPro && products.length + validRows.length > 10) {
        throw new Error(`A importação excede o limite de 10 produtos do Plano Free. Total atual: ${products.length}. Você está tentando importar ${validRows.length}. Faça o upgrade para o Plano Pro!`)
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

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab])

  async function loadHistory() {
    try {
      setHistoryLoading(true)
      setHistoryError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const storeId = profile.store_id

      const { data, error } = await supabase
        .from('stock_entries')
        .select('*')
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          throw new Error('A tabela stock_entries não existe. Por favor, execute o script SQL fornecido nas instruções no editor SQL do Supabase.')
        }
        throw error
      }

      if (data) {
        setStockEntries(data)
      }
    } catch (err: any) {
      console.error(err)
      setHistoryError(err.message || 'Erro ao carregar histórico.')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadEntryDetails(entry: StockEntry) {
    try {
      setSelectedEntry(entry)
      setDetailsLoading(true)
      setDetailsModalOpen(true)
      setEntryDetailsItems([])

      const { data, error } = await supabase
        .from('stock_entry_items')
        .select(`
          id,
          quantity,
          unit_cost,
          total_cost,
          products (
            name,
            sku
          )
        `)
        .eq('entry_id', entry.id)

      if (error) throw error

      if (data) {
        const formatted: EntryItemDetails[] = data.map((item: any) => ({
          id: item.id,
          product_name: item.products?.name || 'Produto Excluído',
          sku: item.products?.sku || null,
          quantity: item.quantity,
          unit_cost: Number(item.unit_cost),
          total_cost: Number(item.total_cost)
        }))
        setEntryDetailsItems(formatted)
      }
    } catch (err: any) {
      console.error(err)
      alert('Erro ao carregar detalhes da entrada: ' + err.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleSaveStockEntry() {
    if (localEntryItems.length === 0) {
      setEntryError('Adicione pelo menos um produto na lista.')
      return
    }

    setEntryLoading(true)
    setEntryError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')
      const storeId = profile.store_id

      const totalValue = localEntryItems.reduce((sum, item) => sum + item.totalCost, 0)
      const totalItems = localEntryItems.reduce((sum, item) => sum + item.quantity, 0)

      // 1. Insert header
      const { data: newEntry, error: entryErr } = await supabase
        .from('stock_entries')
        .insert([{
          store_id: storeId,
          date: entryDate,
          supplier: entrySupplier || null,
          observations: entryObservations || null,
          total_value: totalValue,
          total_items: totalItems
        }])
        .select()
        .single()

      if (entryErr) {
        if (entryErr.code === '42P01') {
          throw new Error('A tabela stock_entries não existe. É necessário executar o script SQL no editor do Supabase primeiro.')
        }
        throw entryErr
      }

      const entryId = newEntry.id

      // 2. Insert detailed items and stock movements, and update product cost
      for (const item of localEntryItems) {
        const unitCost = item.totalCost / item.quantity

        // 2a. Insert stock_entry_items
        const { error: itemErr } = await supabase
          .from('stock_entry_items')
          .insert([{
            entry_id: entryId,
            product_id: item.productId,
            quantity: item.quantity,
            unit_cost: unitCost,
            total_cost: item.totalCost
          }])

        if (itemErr) throw itemErr

        // 2b. Insert stock_movements (this automatically triggers public.update_product_stock() at DB level)
        const { error: movementErr } = await supabase
          .from('stock_movements')
          .insert([{
            store_id: storeId,
            product_id: item.productId,
            quantity: item.quantity,
            type: 'entry',
            reason: 'purchase'
          }])

        if (movementErr) throw movementErr

        // 2c. Update cost price on products table
        const { error: productUpdateErr } = await supabase
          .from('products')
          .update({ cost_price: unitCost })
          .eq('id', item.productId)
          .eq('store_id', storeId)

        if (productUpdateErr) throw productUpdateErr
      }

      // 3. Insert financial transaction (expense)
      const supplierLabel = entrySupplier ? ` - Fornecedor: ${entrySupplier}` : ''
      const { error: financeErr } = await supabase
        .from('financial_transactions')
        .insert([{
          store_id: storeId,
          type: 'expense',
          value: totalValue,
          category: 'supplier',
          description: `Compra de Mercadorias${supplierLabel}`,
          date: entryDate
        }])

      if (financeErr) {
        console.error('Erro ao integrar com financeiro:', financeErr)
      }

      // Reset form
      setLocalEntryItems([])
      setEntrySupplier('')
      setEntryObservations('')
      setEntryDate(new Date().toISOString().split('T')[0])
      
      // Reload lists
      await loadProducts()
      await loadHistory()

      window.dispatchEvent(new CustomEvent('dashboard-refresh'))

      setActiveTab('list')
      alert('Entrada de mercadorias salva com sucesso!')

    } catch (err: any) {
      console.error(err)
      setEntryError(err.message || 'Erro ao salvar a entrada de mercadorias.')
    } finally {
      setEntryLoading(false)
    }
  }

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

    if (!prod && !isPro && products.length >= 10) {
      alert('Limite de 10 produtos atingido no Plano Free. Faça o upgrade para o Plano Pro por apenas R$ 49/mês para liberar cadastros ilimitados!')
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
                Plano Free ({products.length}/10 un.)
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

      {/* Sub navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-rose-600 text-rose-650 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Lista de Produtos
        </button>
        <button
          onClick={() => setActiveTab('entry')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'entry'
              ? 'border-rose-600 text-rose-650 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Entrada de Mercadorias
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-rose-600 text-rose-650 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Histórico de Entradas
        </button>
      </div>

      {/* Conditional rendering based on activeTab */}
      {activeTab === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
        </div>
      )}

      {/* Stock Entry View */}
      {activeTab === 'entry' && (() => {
        const filteredSearchProducts = products.filter(p => 
          !productSearchTerm || p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
          (p.sku && p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
        )

        return (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Registrar Entrada de Mercadorias</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Insira a data, fornecedor e adicione os itens recebidos.</p>
              </div>
            </div>

            {entryError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-100 dark:border-rose-900/30">
                {entryError}
              </div>
            )}

            {/* Grid Dados Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Data da Compra *</label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Fornecedor (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Distribuidora Beleza ou Fabricante"
                  value={entrySupplier}
                  onChange={(e) => setEntrySupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Observações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de lote promocional de batons"
                  value={entryObservations}
                  onChange={(e) => setEntryObservations(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-4">Adicionar Itens</h4>
              
              {/* Form para adicionar item individual à lista local */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/40 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                <div className="md:col-span-6 relative">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Produto *</label>
                  <input
                    type="text"
                    placeholder="Digite o nome do produto cadastrado..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value)
                      setShowProductDropdown(true)
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                  {showProductDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                      {filteredSearchProducts.length === 0 ? (
                        <div className="p-3 text-slate-400 dark:text-zinc-500 text-center">Nenhum produto cadastrado com este nome.</div>
                      ) : (
                        filteredSearchProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProductId(p.id)
                              setProductSearchTerm(p.name)
                              setShowProductDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-zinc-200 flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold truncate">🛍️ {p.name}</span>
                              {p.sku && <span className="text-[9px] text-slate-400 font-mono">{p.sku}</span>}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-2 flex-shrink-0 font-mono">Estoque: {p.quantity_in_stock} un. • Custo: R$ {p.cost_price.toFixed(2)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Qtd Comprada *</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Valor Pago Lote (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={selectedTotalCost}
                    onChange={(e) => setSelectedTotalCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      const qty = parseInt(selectedQty)
                      const cost = parseFloat(selectedTotalCost)
                      if (!selectedProductId) {
                        alert('Selecione um produto cadastrado.')
                        return
                      }
                      if (isNaN(qty) || qty <= 0) {
                        alert('A quantidade deve ser maior que 0.')
                        return
                      }
                      if (isNaN(cost) || cost <= 0) {
                        alert('O valor total pago deve ser maior que 0.')
                        return
                      }

                      if (localEntryItems.some(i => i.productId === selectedProductId)) {
                        alert('Este produto já foi adicionado na lista de entrada.')
                        return
                      }

                      const prod = products.find(p => p.id === selectedProductId)
                      if (prod) {
                        setLocalEntryItems([
                          ...localEntryItems,
                          {
                            productId: selectedProductId,
                            productName: prod.name,
                            quantity: qty,
                            totalCost: cost
                          }
                        ])
                        setSelectedProductId('')
                        setProductSearchTerm('')
                        setSelectedQty('1')
                        setSelectedTotalCost('0.00')
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                  >
                    Adicionar Item
                  </button>
                </div>
              </div>
            </div>

            {/* Grade de Itens Temporários */}
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Itens da Entrada</h4>
              
              {localEntryItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/40 dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Nenhum produto adicionado para esta entrada.</p>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        <th className="px-4 py-3">Produto</th>
                        <th className="px-4 py-3">Quantidade</th>
                        <th className="px-4 py-3">Valor do Lote</th>
                        <th className="px-4 py-3">Custo Unitário</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                      {localEntryItems.map((item, idx) => {
                        const unitCost = item.totalCost / item.quantity
                        return (
                          <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-zinc-950/10">
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">{item.productName}</td>
                            <td className="px-4 py-3 font-mono">{item.quantity} un.</td>
                            <td className="px-4 py-3 font-bold text-slate-850 dark:text-zinc-200">R$ {item.totalCost.toFixed(2)}</td>
                            <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">R$ {unitCost.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setLocalEntryItems(localEntryItems.filter((_, i) => i !== idx))}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                title="Remover item"
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
              )}
            </div>

            {/* Resumo Financeiro & Salvar */}
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 flex gap-6 text-xs w-full sm:w-auto">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Total de Itens</span>
                  <p className="text-base font-bold text-slate-800 dark:text-zinc-200 mt-0.5 font-mono">
                    {localEntryItems.reduce((sum, item) => sum + item.quantity, 0)} un.
                  </p>
                </div>
                <div className="w-px bg-slate-200 dark:bg-zinc-800" />
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Valor Total Pago</span>
                  <p className="text-base font-extrabold text-rose-650 dark:text-rose-450 mt-0.5 font-mono">
                    R$ {localEntryItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setLocalEntryItems([])
                    setActiveTab('list')
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveStockEntry}
                  disabled={entryLoading || localEntryItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-all w-full sm:w-auto"
                >
                  {entryLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Save className="w-4 h-4" /> Salvar Entrada
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Stock Entries History View */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Histórico de Entradas de Mercadorias</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Consulte todas as compras e entradas de lote registradas.</p>
          </div>

          {historyError && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-xl border border-amber-100 dark:border-amber-900/30 flex flex-col gap-2">
              <p>{historyError}</p>
            </div>
          )}

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : stockEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-slate-450 dark:text-zinc-500">Nenhuma entrada de estoque registrada no histórico.</p>
              <button
                onClick={() => setActiveTab('entry')}
                className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-500 flex items-center gap-1 mx-auto"
              >
                Lançar primeira entrada <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <th className="px-6 py-4">Data da Compra</th>
                      <th className="px-6 py-4">Fornecedor</th>
                      <th className="px-6 py-4">Qtd total Itens</th>
                      <th className="px-6 py-4">Valor Pago Total</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                    {stockEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-950/10">
                        <td className="px-6 py-4 font-mono text-slate-700 dark:text-zinc-350">
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-200">
                          {entry.supplier || 'Sem fornecedor'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 font-mono">
                          {entry.total_items} un.
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100 font-mono">
                          R$ {Number(entry.total_value).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => loadEntryDetails(entry)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center justify-center gap-1.5 ml-auto active:scale-95 transition-all shadow-sm bg-white dark:bg-zinc-900"
                          >
                            <Eye className="w-4 h-4" /> Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {/* Details Modal */}
      {detailsModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Detalhes da Entrada</h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">Informações detalhadas sobre a compra de mercadorias.</p>
              </div>
              <button 
                onClick={() => setDetailsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                <p className="text-xs text-slate-400 dark:text-zinc-500">Carregando itens da entrada...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Informações Gerais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/40">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Data da Compra</span>
                      <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
                        {new Date(selectedEntry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Fornecedor</span>
                      <p className="font-semibold text-slate-750 dark:text-zinc-200 mt-0.5">
                        {selectedEntry.supplier || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Observações</span>
                      <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
                        {selectedEntry.observations || 'Nenhuma observação'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Data de Registro</span>
                      <p className="font-semibold text-slate-700 dark:text-zinc-350 mt-0.5">
                        {new Date(selectedEntry.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela de Itens */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase text-[10px] tracking-wider">Produtos Recebidos</h4>
                  
                  {entryDetailsItems.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                      <p className="text-slate-400 dark:text-zinc-500">Nenhum item encontrado nesta entrada.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                              <th className="px-4 py-3">Produto</th>
                              <th className="px-4 py-3">Quantidade</th>
                              <th className="px-4 py-3">Custo Unitário</th>
                              <th className="px-4 py-3 text-right">Valor Pago</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                            {entryDetailsItems.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/20 dark:hover:bg-zinc-950/5">
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.product_name}</span>
                                  {item.sku && (
                                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.sku}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-700 dark:text-zinc-400">
                                  {item.quantity} un.
                                </td>
                                <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">
                                  R$ {item.unit_cost.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                                  R$ {item.total_cost.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumo Financeiro */}
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex justify-between items-center">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Total de itens</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 font-mono">
                        {selectedEntry.total_items} un.
                      </p>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-zinc-800" />
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Valor Total Pago</span>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                        R$ {Number(selectedEntry.total_value).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
