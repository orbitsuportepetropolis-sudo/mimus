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
  profile: { name: string; role: string } | null
  store: { 
    name: string; 
    plan?: string; 
    plan_status?: string; 
    trial_ends_at?: string | null 
  } | null
  lowStockCount: number
}

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
  const isProValid = plan === 'pro' && (status === 'active' || status === 'pending')
  const hasAccess = isTrialValid || isProValid
  const showBlocker = !hasAccess && pathname !== '/dashboard/billing'

  useEffect(() => {
    if (!store) return
    if (!hasAccess && pathname !== '/dashboard/billing') {
      router.push('/dashboard/billing')
    }
  }, [store, pathname, router, hasAccess])

  async function loadAgentData() {
    try {
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sku, barcode, sale_price, cost_price, quantity_in_stock')
        .order('name', { ascending: true })

      const { data: custs } = await supabase
        .from('customers')
        .select('id, name')
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
      const newValue = `${beforeAt}@${name}${afterCursor}`
      setChatInputValue(newValue)
      setAutocompleteOpen(false)
      setAutocompleteSearch('')
    }
  }

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

  async function processCommand(text: string) {
    const normalizedText = normalize(text)

    // 1. Check for batch multi-line product registration
    const lines = text.split('\n')
    const itemsToRegister: { quantity: number; name: string }[] = []
    const itemRegex = /^\s*(\d+)\s*(?:do|da|de|dos|das)?\s+(.+)$/i

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      const match = trimmed.match(itemRegex)
      if (match) {
        const quantity = parseInt(match[1], 10)
        const productName = match[2].trim()
        itemsToRegister.push({ quantity, name: productName })
      }
    }

    const isBatchTrigger = itemsToRegister.length > 0 && (
      lines.length > 1 || 
      normalizedText.includes('lance') || 
      normalizedText.includes('cadastr') || 
      normalizedText.includes('inser') || 
      normalizedText.includes('subir') ||
      normalizedText.includes('lote')
    )

    if (isBatchTrigger) {
      await new Promise(resolve => setTimeout(resolve, 1500))

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

        // Fetch store details to check subscription limits
        const { data: storeData } = await supabase
          .from('stores')
          .select('plan, plan_status, trial_ends_at')
          .eq('id', store_id)
          .single()

        // Fetch latest products from database
        const { data: latestProds } = await supabase
          .from('products')
          .select('id, name, quantity_in_stock')
          .eq('store_id', store_id)

        const latestProducts = (latestProds || []) as any[]

        // Consolidate duplicates from the parsed list
        const groupedItems: { [name: string]: number } = {}
        for (const item of itemsToRegister) {
          const normName = normalize(item.name)
          const matchedKey = Object.keys(groupedItems).find(k => normalize(k) === normName)
          if (matchedKey) {
            groupedItems[matchedKey] += item.quantity
          } else {
            groupedItems[item.name] = item.quantity
          }
        }

        const consolidatedItems = Object.entries(groupedItems).map(([name, quantity]) => ({
          name,
          quantity
        }))

        // Partition into updates and creations
        const itemsToUpdate: { product: any; quantity: number }[] = []
        const itemsToCreate: { name: string; quantity: number }[] = []

        for (const item of consolidatedItems) {
          const existing = latestProducts.find(
            p => normalize(p.name) === normalize(item.name)
          )
          if (existing) {
            itemsToUpdate.push({ product: existing, quantity: item.quantity })
          } else {
            itemsToCreate.push(item)
          }
        }

        // Limit validation for Free tier
        const getTrialDaysLeft = () => {
          if (!storeData?.trial_ends_at) return 0
          const diff = new Date(storeData.trial_ends_at).getTime() - Date.now()
          return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
        }
        const isTrialActive = storeData?.plan_status === 'trial' && getTrialDaysLeft() > 0
        const isPro = storeData?.plan === 'pro' || isTrialActive

        if (!isPro && (latestProducts.length + itemsToCreate.length) > 50) {
          throw new Error(`A importação excede o limite de 50 produtos do Plano Free. Total atual: ${latestProducts.length}. Você está tentando cadastrar ${itemsToCreate.length} novos. Faça o upgrade para o Plano Pro!`)
        }

        // 1. Bulk insert stock movements for existing products
        const updateMovements = itemsToUpdate.map(item => ({
          store_id,
          product_id: item.product.id,
          quantity: item.quantity,
          type: 'entry',
          reason: 'manual_adjustment'
        }))

        if (updateMovements.length > 0) {
          const { error: updateErr } = await supabase
            .from('stock_movements')
            .insert(updateMovements)
          if (updateErr) throw updateErr
        }

        // 2. Bulk insert new products
        if (itemsToCreate.length > 0) {
          const newProductsToInsert = itemsToCreate.map(item => ({
            store_id,
            name: item.name,
            brand: 'Mimus',
            cost_price: 0,
            sale_price: 0,
            quantity_in_stock: 0,
            min_stock_alert: 5
          }))

          const { data: insertedNewProds, error: createErr } = await supabase
            .from('products')
            .insert(newProductsToInsert)
            .select()

          if (createErr) throw createErr

          if (insertedNewProds && insertedNewProds.length > 0) {
            const createMovements = insertedNewProds.map(p => {
              const originalItem = itemsToCreate.find(item => normalize(item.name) === normalize(p.name))
              const qty = originalItem ? originalItem.quantity : p.quantity_in_stock
              return {
                store_id,
                product_id: p.id,
                quantity: qty,
                type: 'entry',
                reason: 'purchase'
              }
            })

            if (createMovements.length > 0) {
              const { error: smErr } = await supabase
                .from('stock_movements')
                .insert(createMovements)
              if (smErr) throw smErr
            }
          }
        }

        // Dispatch refresh so all tables update immediately
        window.dispatchEvent(new CustomEvent('dashboard-refresh'))

        // Format success response
        let successMessage = `✅ **Lançamento em lote concluído com sucesso!**\n\n`

        if (itemsToCreate.length > 0) {
          successMessage += `✨ **Novos produtos cadastrados (${itemsToCreate.length}):**\n`
          itemsToCreate.forEach(item => {
            successMessage += `* ${item.name} (${item.quantity} un.)\n`
          })
          successMessage += `\n`
        }

        if (itemsToUpdate.length > 0) {
          successMessage += `📦 **Estoque atualizado (${itemsToUpdate.length}):**\n`
          itemsToUpdate.forEach(item => {
            const newQty = item.product.quantity_in_stock + item.quantity
            successMessage += `* ${item.product.name}: +${item.quantity} un. (Estoque atual: ${newQty} un.)\n`
          })
        }

        addAgentMessage(successMessage)

      } catch (err: any) {
        console.error(err)
        addAgentMessage(`❌ **Erro ao processar lote:** ${err.message || 'Erro desconhecido.'}`)
      } finally {
        setTyping(false)
      }
      return
    }

    const isDelete = normalizedText.includes('apagar') || 
                     normalizedText.includes('apague') || 
                     normalizedText.includes('deletar') || 
                     normalizedText.includes('delete') || 
                     normalizedText.includes('excluir') || 
                     normalizedText.includes('exclua') || 
                     normalizedText.includes('remover') || 
                     normalizedText.includes('remova') || 
                     normalizedText.includes('limpar') || 
                     normalizedText.includes('limpe')

    if (isDelete) {
      await new Promise(resolve => setTimeout(resolve, 1200))
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

        const isTargetCustomer = normalizedText.includes('cliente') || normalizedText.includes('customer') || normalizedText.includes('fregues') || normalizedText.includes('contato')
        const isBulk = normalizedText.includes('todo') || normalizedText.includes('toda') || normalizedText.includes('tudo') || normalizedText.includes('em massa') || normalizedText.includes('lote')

        // Find exceptions
        let exceptionText = ''
        const exceptionKeywords = ['menos', 'exceto', 'salvo', 'fora', 'diferente de']
        for (const kw of exceptionKeywords) {
          const idx = normalizedText.indexOf(kw)
          if (idx !== -1) {
            exceptionText = normalizedText.slice(idx + kw.length)
            break
          }
        }

        if (isTargetCustomer) {
          // Fetch latest customers from database
          const { data: latestCusts, error: custsErr } = await supabase
            .from('customers')
            .select('id, name')
            .eq('store_id', store_id)
          if (custsErr) throw custsErr

          const latestCustomers = latestCusts || []
          let targetsToDelete: any[] = []
          let excludedItems: any[] = []

          if (isBulk) {
            for (const c of latestCustomers) {
              const normName = normalize(c.name)
              if (exceptionText && (exceptionText.includes(normName) || normalizedText.includes(`@${normName}`))) {
                excludedItems.push(c)
              } else {
                targetsToDelete.push(c)
              }
            }
          } else {
            // Single customer delete
            for (const c of latestCustomers) {
              const normName = normalize(c.name)
              if (normalizedText.includes(normName) || normalizedText.includes(`@${normName}`)) {
                targetsToDelete.push(c)
              }
            }
          }

          if (targetsToDelete.length === 0) {
            addAgentMessage(`Nenhum cliente correspondente foi encontrado para exclusão.`)
            setTyping(false)
            return
          }

          const idsToDelete = targetsToDelete.map(t => t.id)
          const { error: delErr } = await supabase
            .from('customers')
            .delete()
            .in('id', idsToDelete)

          if (delErr) throw delErr

          window.dispatchEvent(new CustomEvent('dashboard-refresh'))

          let responseMsg = `✅ **Exclusão de clientes concluída!**\n\n`
          responseMsg += `👤 **Clientes excluídos (${targetsToDelete.length}):**\n`
          targetsToDelete.forEach(t => {
            responseMsg += `* ${t.name}\n`
          })
          if (excludedItems.length > 0) {
            responseMsg += `\n🛡️ **Clientes mantidos (${excludedItems.length}):**\n`
            excludedItems.forEach(t => {
              responseMsg += `* ${t.name}\n`
            })
          }
          addAgentMessage(responseMsg)

        } else {
          // Target is products
          // Fetch latest products from database
          const { data: latestProds, error: prodsErr } = await supabase
            .from('products')
            .select('id, name, quantity_in_stock')
            .eq('store_id', store_id)
          if (prodsErr) throw prodsErr

          const latestProducts = latestProds || []
          let targetsToDelete: any[] = []
          let excludedItems: any[] = []

          if (isBulk) {
            for (const p of latestProducts) {
              const normName = normalize(p.name)
              if (exceptionText && (exceptionText.includes(normName) || normalizedText.includes(`@${normName}`))) {
                excludedItems.push(p)
              } else {
                targetsToDelete.push(p)
              }
            }
          } else {
            // Single product delete
            for (const p of latestProducts) {
              const normName = normalize(p.name)
              if (normalizedText.includes(normName) || normalizedText.includes(`@${normName}`)) {
                targetsToDelete.push(p)
              }
            }
          }

          if (targetsToDelete.length === 0) {
            addAgentMessage(`Nenhum produto correspondente foi encontrado para exclusão.`)
            setTyping(false)
            return
          }

          // Fetch sale items to identify products with sales (RESTRICT constraint)
          const { data: saleItems, error: salesErr } = await supabase
            .from('sale_items')
            .select('product_id')
          if (salesErr) throw salesErr

          const soldProductIds = new Set(saleItems?.map(item => item.product_id) || [])

          const productsRealDelete: any[] = []
          const productsZeroStock: any[] = []

          for (const p of targetsToDelete) {
            if (soldProductIds.has(p.id)) {
              productsZeroStock.push(p)
            } else {
              productsRealDelete.push(p)
            }
          }

          // 1. Delete products that don't have sales
          if (productsRealDelete.length > 0) {
            const idsToDelete = productsRealDelete.map(p => p.id)
            const { error: delErr } = await supabase
              .from('products')
              .delete()
              .in('id', idsToDelete)
            if (delErr) throw delErr
          }

          // 2. Set stock to 0 for products that have sales (and cannot be deleted)
          if (productsZeroStock.length > 0) {
            const zeroStockMovements: any[] = []
            for (const p of productsZeroStock) {
              if (p.quantity_in_stock !== 0) {
                zeroStockMovements.push({
                  store_id,
                  product_id: p.id,
                  quantity: -p.quantity_in_stock,
                  type: 'exit',
                  reason: 'manual_adjustment'
                })
              }
            }

            if (zeroStockMovements.length > 0) {
              const { error: smErr } = await supabase
                .from('stock_movements')
                .insert(zeroStockMovements)
              if (smErr) throw smErr
            }
          }

          window.dispatchEvent(new CustomEvent('dashboard-refresh'))

          let responseMsg = `✅ **Exclusão de produtos concluída!**\n\n`
          if (productsRealDelete.length > 0) {
            responseMsg += `🗑️ **Produtos excluídos (${productsRealDelete.length}):**\n`
            productsRealDelete.forEach(p => {
              responseMsg += `* ${p.name}\n`
            })
            responseMsg += `\n`
          }
          if (productsZeroStock.length > 0) {
            responseMsg += `⚠️ **Produtos mantidos mas com estoque zerado (${productsZeroStock.length})** (não puderam ser excluídos pois possuem vendas vinculadas):\n`
            zeroStockMovementsBlock: {
              productsZeroStock.forEach(p => {
                responseMsg += `* ${p.name}\n`
              })
            }
            responseMsg += `\n`
          }
          if (excludedItems.length > 0) {
            responseMsg += `🛡️ **Produtos mantidos com estoque original (${excludedItems.length}):**\n`
            excludedItems.forEach(p => {
              responseMsg += `* ${p.name} (${p.quantity_in_stock} un.)\n`
            })
          }

          addAgentMessage(responseMsg)
        }

      } catch (err: any) {
        console.error(err)
        addAgentMessage(`❌ **Erro ao excluir:** ${err.message || 'Erro desconhecido.'}`)
      } finally {
        setTyping(false)
      }
      return
    }

    let matchedProduct: any = null
    let matchedCustomer: any = null
    let quantity = 1
    let paymentMethod: 'pix' | 'money' | 'credit_card' | 'debit_card' = 'pix'


    const quantityMatch = text.match(/(?:quantidade|qtd|vendi|vendeu|estoque|adicione|aumente|retire|-\s*|\+\s*)?\s*(\d+)/i)
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1]) || 1
    }

    for (const c of customers) {
      const normName = normalize(c.name)
      if (normalizedText.includes(normName) || normalizedText.includes(normName.replace(/\s+/g, '-'))) {
        matchedCustomer = c
        break
      }
    }

    for (const p of products) {
      const normName = normalize(p.name)
      const normSku = p.sku ? normalize(p.sku) : ''
      const normBarcode = p.barcode ? normalize(p.barcode) : ''
      
      if (
        normalizedText.includes(normName) || 
        normalizedText.includes(normName.replace(/\s+/g, '-')) ||
        (normSku && normalizedText.includes(normSku)) ||
        (normBarcode && normalizedText.includes(normBarcode))
      ) {
        matchedProduct = p
        break
      }
    }

    if (normalizedText.includes('dinheiro') || normalizedText.includes('money')) {
      paymentMethod = 'money'
    } else if (normalizedText.includes('credito') || normalizedText.includes('cartao de credito')) {
      paymentMethod = 'credit_card'
    } else if (normalizedText.includes('debito') || normalizedText.includes('cartao de debito')) {
      paymentMethod = 'debit_card'
    }

    const isSale = normalizedText.includes('vendi') || normalizedText.includes('venda') || normalizedText.includes('vendeu') || normalizedText.includes('saida') || normalizedText.includes('saída') || normalizedText.includes('vender')
    const isStockIncrease = normalizedText.includes('adicione') || normalizedText.includes('aumente') || normalizedText.includes('entrada') || normalizedText.includes('somar') || normalizedText.includes('mais') || normalizedText.includes('adicionar')
    const isStockDecrease = normalizedText.includes('retire') || normalizedText.includes('remova') || normalizedText.includes('saida') || normalizedText.includes('saída') || normalizedText.includes('menos') || normalizedText.includes('subtrair') || normalizedText.includes('retirar')
    const isCreate = normalizedText.includes('cadastr') || 
                     normalizedText.includes('cri') || 
                     normalizedText.includes('inser') || 
                     normalizedText.includes('registr') || 
                     normalizedText.includes('novo produto') || 
                     normalizedText.includes('novo cliente') || 
                     normalizedText.includes('nova cliente') ||
                     (normalizedText.includes('adicion') && normalizedText.includes('cliente'))

    await new Promise(resolve => setTimeout(resolve, 1200))

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

      if (isSale) {
        if (!matchedProduct) {
          addAgentMessage("Desculpe, não consegui identificar qual produto foi vendido. Marque-o usando `@`.")
          return
        }

        let customerId = matchedCustomer?.id
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

        const totalValue = quantity * matchedProduct.sale_price

        const { data: newSale, error: saleErr } = await supabase
          .from('sales')
          .insert([{
            store_id,
            customer_id: customerId,
            total_value: totalValue,
            discount: 0,
            payment_method: paymentMethod
          }])
          .select('id')
          .single()

        if (saleErr) throw saleErr

        const { error: itemErr } = await supabase
          .from('sale_items')
          .insert([{
            sale_id: newSale.id,
            product_id: matchedProduct.id,
            quantity,
            unit_price: matchedProduct.sale_price
          }])

        if (itemErr) throw itemErr

        window.dispatchEvent(new CustomEvent('dashboard-refresh'))

        const custName = matchedCustomer ? matchedCustomer.name : 'Cliente Avulso'
        addAgentMessage(`✅ **Venda registrada!**\n\n* **Produto:** ${matchedProduct.name}\n* **Quantidade:** ${quantity} un.\n* **Cliente:** ${custName}\n* **Total:** R$ ${totalValue.toFixed(2)}\n* **Pagamento:** ${paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'money' ? 'Dinheiro' : paymentMethod === 'credit_card' ? 'Crédito' : 'Débito'}`)

      } else if (isStockIncrease || isStockDecrease) {
        if (!matchedProduct) {
          addAgentMessage("Desculpe, não identifiquei o produto para alteração. Use `@`.")
          return
        }

        const quantityChange = isStockIncrease ? quantity : -quantity

        const { error: smErr } = await supabase
          .from('stock_movements')
          .insert([{
            store_id,
            product_id: matchedProduct.id,
            quantity: quantityChange,
            type: isStockIncrease ? 'entry' : 'exit',
            reason: 'manual_adjustment'
          }])

        if (smErr) throw smErr

        window.dispatchEvent(new CustomEvent('dashboard-refresh'))

        const currentQty = matchedProduct.quantity_in_stock + quantityChange
        addAgentMessage(`📦 **Estoque atualizado!**\n\n* **Produto:** ${matchedProduct.name}\n* **Movimentação:** ${quantityChange > 0 ? '+' : ''}${quantityChange} un.\n* **Estoque Atualizado:** ${currentQty} un.`)

      } else if (isCreate) {
        const phoneMatch = text.match(/(?:telefone|phone|celular|whats|whatsapp)\s*(?:de)?\s*([\d\s\-()]+)/i)
        const instagramMatch = text.match(/(?:instagram|ig|insta)\s*(?:de)?\s*([@\w._]+)/i)
        const birthdayMatch = text.match(/(?:nascimento|aniversario|aniversário|nasc)\s*(?:de)?\s*([\d/]+)/i)

        const priceMatch = text.match(/(?:preco|preço|venda|valor)\s*(?:de|R\$)?\s*(\d+(?:[.,]\d+)?)/i)
        const costMatch = text.match(/(?:custo|compra)\s*(?:de|R\$)?\s*(\d+(?:[.,]\d+)?)/i)
        const brandMatch = text.match(/(?:marca|grife|da)\s+([a-zA-Z\s]+?)(?:\s+com|\s+preco|\s+custo|\s+estoque|$)/i)
        const stockMatch = text.match(/(?:estoque|quantidade|qtd)\s*(?:de)?\s*(\d+)/i)

        const productKeywords = ['produto', 'item', 'mercadoria', 'preco', 'preço', 'custo', 'estoque', 'qtd', 'quantidade', 'marca', 'brand', 'sku', 'barra', 'batom', 'blush', 'rimel', 'rímel', 'base', 'delineador', 'sombra', 'gloss', 'esmalte', 'po ', 'pó ', 'corretivo', 'iluminador', 'pincel', 'paleta', 'mascara', 'máscara', 'sabonete', 'creme', 'perfume', 'hidratante', 'oleo', 'óleo', 'serum', 'sérum', 'tonico', 'tônico', 'protetor', 'sol', 'labial']
        const customerKeywords = ['cliente', 'customer', 'comprador', 'compradora', 'fregues', 'freguesa', 'usuario', 'usuaria', 'usuário', 'usuária', 'pessoa', 'contato', 'contatos', 'whats', 'whatsapp', 'telefone', 'celular', 'phone', 'instagram', 'ig', 'insta', 'nascimento', 'aniversario', 'aniversário', 'nasc']

        const hasProductClues = !!(priceMatch || costMatch || brandMatch || stockMatch || productKeywords.some(kw => normalizedText.includes(kw)))
        const hasCustomerClues = !!(phoneMatch || instagramMatch || birthdayMatch || customerKeywords.some(kw => normalizedText.includes(kw)))

        // Determine if it is a customer or a product
        let isCustomer = false
        if (hasCustomerClues && !hasProductClues) {
          isCustomer = true
        } else if (hasProductClues && !hasCustomerClues) {
          isCustomer = false
        } else if (hasCustomerClues && hasProductClues) {
          if (normalizedText.includes('cliente') || normalizedText.includes('customer')) {
            isCustomer = true
          } else {
            isCustomer = false
          }
        } else {
          // Default to customer when no clues are present, as registering just a name is typical for a customer
          isCustomer = true
        }

        const cleanRegex = /\b(cadastrar|cadastre|cadastra|cadastro|criar|crie|cria|inserir|insira|insere|registrar|registre|registra|registro|adicionar|adicione|adiciona|cliente|customer|comprador|compradora|fregues|freguesa|produto|item|um|uma|o|a|os|as|novo|nova)\b/gi

        if (isCustomer) {
          const namePart = text.split(/(?:com|telefone|phone|celular|whats|whatsapp|instagram|ig|insta|nascimento|aniversario|aniversário|nasc)\b/i)[0]
          let name = namePart
            .replace(cleanRegex, '')
            .replace(/@/g, '')
            .replace(/\s+/g, ' ')
            .trim()

          const phone = phoneMatch ? phoneMatch[1].trim() : null
          const instagram = instagramMatch ? instagramMatch[1].replace('@', '').trim() : null
          
          let birthday = null
          if (birthdayMatch) {
            const parts = birthdayMatch[1].trim().split('/')
            if (parts.length === 3) {
              birthday = `${parts[2]}-${parts[1]}-${parts[0]}`
            } else if (parts.length === 2) {
              birthday = `2000-${parts[1]}-${parts[0]}`
            } else {
              birthday = birthdayMatch[1].trim()
            }
          }

          if (!name || name.length < 2) {
            addAgentMessage("Não identifiquei o nome da cliente. Diga algo como: *'cadastre a cliente Luciana com telefone 99999-9999'*.")
            return
          }

          const { data: newCust, error: insertErr } = await supabase
            .from('customers')
            .insert([{
              store_id,
              name,
              phone,
              instagram,
              birthday
            }])
            .select()
            .single()

          if (insertErr) throw insertErr

          window.dispatchEvent(new CustomEvent('dashboard-refresh'))

          let details = `👤 **Cliente cadastrada com sucesso!**\n\n* **Nome:** ${name}`
          if (phone) details += `\n* **Telefone:** ${phone}`
          if (instagram) details += `\n* **Instagram:** @${instagram}`
          if (birthday) details += `\n* **Aniversário:** ${new Date(birthday).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

          addAgentMessage(details)
        } else {
          const namePart = text.split(/(?:com|preco|preço|custo|marca|grife|da|estoque|quantidade|qtd)\b/i)[0]
          let name = namePart
            .replace(cleanRegex, '')
            .replace(/@/g, '')
            .replace(/\s+/g, ' ')
            .trim()

          const sale_price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0.00
          const cost_price = costMatch ? parseFloat(costMatch[1].replace(',', '.')) : 0.00
          const brand = brandMatch ? brandMatch[1].trim() : 'Mimus'
          const stock = stockMatch ? parseInt(stockMatch[1]) : 0

          if (!name || name.length < 2) {
            addAgentMessage("Não consegui identificar o nome do produto. Diga algo como: *'cadastre o produto Delineador com preço 45 e custo 20'*.")
            return
          }

          const { data: newProd, error: insertErr } = await supabase
            .from('products')
            .insert([{
              store_id,
              name,
              brand,
              cost_price,
              sale_price,
              quantity_in_stock: 0,
              min_stock_alert: 5
            }])
            .select()
            .single()

          if (insertErr) throw insertErr

          if (newProd && stock > 0) {
            await supabase
              .from('stock_movements')
              .insert([{
                store_id,
                product_id: newProd.id,
                quantity: stock,
                type: 'entry',
                reason: 'purchase'
              }])
          }

          window.dispatchEvent(new CustomEvent('dashboard-refresh'))

          addAgentMessage(`✨ **Produto cadastrado com sucesso!**\n\n* **Nome:** ${name}\n* **Marca:** ${brand}\n* **Venda:** R$ ${sale_price.toFixed(2)}\n* **Estoque:** ${stock} un.`)
        }

      } else {
        addAgentMessage(`Olá! Sou o assistente Mimus AI. 🌸\n\nComandos aceitos:\n\n* 🛍️ **Vendas:** *"vendi 2 @Batom para @Maria"*.\n* 📦 **Estoque:** *"adicione 10 @Delineador"* ou *"retire 2 @Base"*.\n* ✨ **Cadastrar:** *"cadastre produto Rímel com preço 29.90 e custo 15"*.\n\nUse **\`@\`** para marcar itens sem erro de digitação!`)
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
