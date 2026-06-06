import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView 
} from 'react-native'
import { Sparkles, X, Send } from 'lucide-react-native'
import { supabase } from '../services/supabase'

interface Message {
  id: string
  sender: 'user' | 'agent'
  text: string
  timestamp: Date
}

interface AIChatModalProps {
  visible: boolean
  onClose: () => void
  storeId: string
  onRefresh: () => void
}

const normalize = (str: string) => 
  str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : ""

export default function AIChatModal({ onClose, storeId, onRefresh }: AIChatModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init-1',
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

  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    loadAutocompleteData()
  }, [])

  async function loadAutocompleteData() {
    try {
      if (!storeId) return

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
      console.error('Erro ao carregar cache do Mimus AI:', err)
    }
  }

  const handleTextChange = (text: string) => {
    setInputValue(text)
    
    // Find the last "@" position
    const lastAtPos = text.lastIndexOf('@')
    if (lastAtPos !== -1) {
      const searchSlice = text.slice(lastAtPos + 1)
      // Suggest only if there is no space after the '@' before the current typing position
      if (!searchSlice.includes(' ')) {
        setAutocompleteOpen(true)
        setAutocompleteSearch(searchSlice)
        setCursorPos(lastAtPos)
      } else {
        setAutocompleteOpen(false)
      }
    } else {
      setAutocompleteOpen(false)
    }
  }

  const selectSuggestion = (name: string) => {
    const beforeAt = inputValue.substring(0, cursorPos)
    const newValue = `${beforeAt}@${name} `
    setInputValue(newValue)
    setAutocompleteOpen(false)
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userText = inputValue.trim()
    const newMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMsg])
    setInputValue('')
    setAutocompleteOpen(false)
    setTyping(true)
    
    // Scroll list to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      // 1. Fetch latest products and customers in real-time
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sku, barcode, sale_price, cost_price, quantity_in_stock')
        .eq('store_id', storeId)
        .eq('active', true)

      const { data: custs } = await supabase
        .from('customers')
        .select('id, name')
        .eq('store_id', storeId)

      const currentProducts = prods || []
      const currentCustomers = custs || []

      // 2. Call the deployed Next.js backend API chat endpoint
      const response = await fetch('https://mimus.vercel.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: userText,
          currentProducts: currentProducts.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '',
            barcode: p.barcode || '',
            price: p.sale_price,
            stock: p.quantity_in_stock
          })),
          currentCustomers: currentCustomers.map(c => ({
            id: c.id,
            name: c.name
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro de comunicação com o servidor Mimus AI.')
      }

      const parsed = await response.json()
      const reply = parsed.reply || ''
      const actions = parsed.actions || []

      let actionsExecuted = false

      // 3. Loop over actions and execute against Supabase
      for (const action of actions) {
        if (action.type === 'create_product') {
          const { data: newProd, error: insertErr } = await supabase
            .from('products')
            .insert([{
              store_id: storeId,
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
              store_id: storeId,
              product_id: newProd.id,
              quantity: action.quantity,
              type: 'entry',
              reason: 'purchase'
            }])
          }
          actionsExecuted = true
        } else if (action.type === 'create_customer') {
          const { error: insertErr } = await supabase
            .from('customers')
            .insert([{
              store_id: storeId,
              name: action.name,
              phone: action.phone || null,
              instagram: action.instagram || null,
              birthday: action.birthday || null
            }])

          if (insertErr) throw insertErr
          actionsExecuted = true
        } else if (action.type === 'stock_movement') {
          const { error: smErr } = await supabase
            .from('stock_movements')
            .insert([{
              store_id: storeId,
              product_id: action.productId,
              quantity: action.movementType === 'entry' ? action.quantity : -action.quantity,
              type: action.movementType,
              reason: action.reason || 'manual_adjustment'
            }])

          if (smErr) throw smErr
          actionsExecuted = true
        } else if (action.type === 'create_sale') {
          let customerId = action.customerId
          if (!customerId) {
            const { data: existingAvulso } = await supabase
              .from('customers')
              .select('id')
              .eq('store_id', storeId)
              .eq('name', 'Cliente Avulso')
              .maybeSingle()

            if (existingAvulso) {
              customerId = existingAvulso.id
            } else {
              const { data: newAvulso } = await supabase
                .from('customers')
                .insert([{ store_id: storeId, name: 'Cliente Avulso' }])
                .select('id')
                .single()
              customerId = newAvulso?.id
            }
          }

          const totalValue = action.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)

          const { data: newSale, error: saleErr } = await supabase
            .from('sales')
            .insert([{
              store_id: storeId,
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
          actionsExecuted = true
        } else if (action.type === 'delete_product') {
          const { error: delErr } = await supabase
            .from('products')
            .update({ active: false })
            .eq('id', action.productId)
            .eq('store_id', storeId)

          if (delErr) throw delErr
          actionsExecuted = true
        } else if (action.type === 'delete_customer') {
          const { error: delErr } = await supabase
            .from('customers')
            .delete()
            .eq('id', action.customerId)
            .eq('store_id', storeId)

          if (delErr) throw delErr
          actionsExecuted = true
        }
      }

      if (actionsExecuted) {
        onRefresh() // Trigger parent dashboard metric refresh
        loadAutocompleteData() // Refresh autocomplete list data
      }

      // Add response message
      const agentMsg: Message = {
        id: Math.random().toString(),
        sender: 'agent',
        text: reply || 'Comando processado com sucesso! 💕',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMsg])

    } catch (err: any) {
      console.error(err)
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'agent',
        text: `❌ **Erro ao processar:** ${err.message || 'Erro de comunicação desconhecido.'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setTyping(false)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  // Suggestion list filtering
  const filteredProducts = products.filter(p => 
    !autocompleteSearch || 
    normalize(p.name).includes(normalize(autocompleteSearch)) || 
    (p.sku && normalize(p.sku).includes(normalize(autocompleteSearch)))
  )

  const filteredCustomers = customers.filter(c => 
    !autocompleteSearch || 
    normalize(c.name).includes(normalize(autocompleteSearch))
  )

  const showSuggestions = autocompleteOpen && (filteredProducts.length > 0 || filteredCustomers.length > 0)

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.sparkleIcon}>
              <Sparkles size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Mimus AI</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Online • Assistente Virtual</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[
              styles.bubbleContainer, 
              item.sender === 'user' ? styles.bubbleRight : styles.bubbleLeft
            ]}>
              <View style={[
                styles.bubble,
                item.sender === 'user' ? styles.bubbleUser : styles.bubbleAgent
              ]}>
                <Text style={[
                  styles.bubbleText,
                  item.sender === 'user' ? styles.textUser : styles.textAgent
                ]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={typing ? (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#64748B" />
                <Text style={styles.typingText}>Mimus AI está digitando...</Text>
              </View>
            </View>
          ) : null}
        />

        {/* Suggestion list for mentions */}
        {showSuggestions && (
          <View style={styles.suggestionBox}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionHeaderText}>PRODUTOS E CLIENTES MATCHING "@"</Text>
            </View>
            <FlatList
              data={[
                ...filteredProducts.map(p => ({ ...p, key: `p-${p.id}`, type: 'product' })),
                ...filteredCustomers.map(c => ({ ...c, key: `c-${c.id}`, type: 'customer' }))
              ]}
              keyExtractor={item => item.key}
              style={{ maxHeight: 150 }}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem} 
                  onPress={() => selectSuggestion(item.name)}
                >
                  {item.type === 'product' ? (
                    <View style={styles.suggestionItemRow}>
                      <Text style={styles.suggestionName}>🛍️ {item.name}</Text>
                      <Text style={styles.suggestionMeta}>
                        Estoque: {item.quantity_in_stock} • R$ {item.sale_price.toFixed(2)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.suggestionName}>👤 {item.name}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputArea}>
          <TextInput
            placeholder="Digite um comando para a Mimus AI..."
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={inputValue}
            onChangeText={handleTextChange}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputValue.trim() ? styles.sendBtnDisabled : null]}
            onPress={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  bubbleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: '#E11D48',
    borderTopRightRadius: 2,
  },
  bubbleAgent: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  textUser: {
    color: '#FFFFFF',
  },
  textAgent: {
    color: '#1E293B',
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderTopLeftRadius: 2,
  },
  typingText: {
    fontSize: 11,
    color: '#64748B',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 13,
    color: '#1E293B',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#FDA4AF',
  },
  suggestionBox: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  suggestionHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  suggestionMeta: {
    fontSize: 10,
    color: '#64748B',
  },
})
