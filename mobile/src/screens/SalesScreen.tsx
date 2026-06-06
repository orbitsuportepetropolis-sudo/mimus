import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView, Image } from 'react-native'
import { supabase } from '../services/supabase'
import { ShoppingBag, DollarSign, Plus, Minus, Trash2, Search, X, CheckCircle, UserPlus, Clipboard, Check } from 'lucide-react-native'

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

interface Order {
  id: string
  created_at: string
  total_value: number
  payment_method: string
  status: 'novo' | 'aguardando pagamento' | 'pago' | 'enviado' | 'concluído'
  customer_id: string | null
  customers?: {
    name: string
    phone: string | null
  }
}

export default function SalesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'orders'>('catalog')
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [discount, setDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'money' | 'credit_card' | 'debit_card'>('pix')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastSaleDetails, setLastSaleDetails] = useState<any>(null)

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  // Quick Customer Create Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSalesData()
    })
    return unsubscribe
  }, [navigation, activeTab])

  async function loadSalesData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback Mock data
        setProducts([
          { id: '1', name: 'Batom Matte Rose V.', brand: 'Bruna Tavares', sale_price: 39.90, quantity_in_stock: 5, image_url: null },
          { id: '2', name: 'Corretivo Peach Glow', brand: 'Mimus', sale_price: 45.00, quantity_in_stock: 12, image_url: null },
          { id: '3', name: 'Sérum Renovador Skin Care', brand: 'Sallve', sale_price: 69.90, quantity_in_stock: 3, image_url: null }
        ])
        setCustomers([
          { id: '1', name: 'Leticia Costa', phone: '11988887777' },
          { id: '2', name: 'Mariana Silva', phone: '21977776666' }
        ])
        setOrders([
          { id: 'ord-1', created_at: new Date().toISOString(), total_value: 84.90, payment_method: 'pix', status: 'aguardando pagamento', customer_id: '1', customers: { name: 'Leticia Costa', phone: '11988887777' } },
          { id: 'ord-2', created_at: new Date(Date.now() - 24*60*60*1000).toISOString(), total_value: 45.00, payment_method: 'money', status: 'pago', customer_id: '2', customers: { name: 'Mariana Silva', phone: '21977776666' } }
        ])
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Fetch products
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, brand, sale_price, quantity_in_stock, image_url')
          .eq('store_id', profile.store_id)
          .eq('active', true)
          .gt('quantity_in_stock', 0)
          .order('name', { ascending: true })

        // Fetch customers
        const { data: custs } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('store_id', profile.store_id)
          .order('name', { ascending: true })

        // Fetch orders/sales
        const { data: sls } = await supabase
          .from('sales')
          .select('*, customers(name, phone)')
          .eq('store_id', profile.store_id)
          .order('created_at', { ascending: false })

        setProducts(prods || [])
        setCustomers(custs || [])
        setOrders((sls as any[]) || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(prod: Product) {
    const existing = cart.find(item => item.product.id === prod.id)
    if (existing) {
      if (existing.quantity >= prod.quantity_in_stock) {
        Alert.alert('Limite', `Estoque máximo atingido (${prod.quantity_in_stock} un. disponíveis).`)
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

  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.sale_price * curr.quantity), 0)
  const total = Math.max(0, subtotal - discount)

  async function handleQuickCustomerCreate() {
    if (!newCustName) {
      Alert.alert('Erro', 'Nome é obrigatório.')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const mockNew = { id: String(Date.now()), name: newCustName, phone: newCustPhone }
        setSelectedCustomer(mockNew)
        setCustomers([mockNew, ...customers])
        setCustomerModalOpen(false)
        setNewCustName('')
        setNewCustPhone('')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada.')

      const { data: newCust, error } = await supabase
        .from('customers')
        .insert([{
          store_id: profile.store_id,
          name: newCustName,
          phone: newCustPhone || null
        }])
        .select()

      if (error) throw error

      if (newCust && newCust[0]) {
        setSelectedCustomer(newCust[0])
        setCustomers([newCust[0], ...customers])
        setCustomerModalOpen(false)
        setNewCustName('')
        setNewCustPhone('')
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao criar cliente.')
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      Alert.alert('Erro', 'O carrinho está vazio.')
      return
    }

    setCheckoutLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const initialStatus = 
        paymentMethod === 'money' ? 'pago' : 
        paymentMethod === 'pix' ? 'aguardando pagamento' : 'pago'

      if (!user) {
        setLastSaleDetails({
          id: String(Date.now()),
          total: total,
          payment: paymentMethod.toUpperCase(),
          itemsCount: cart.length
        })
        setCart([])
        setSelectedCustomer(null)
        setDiscount(0)
        setSuccessOpen(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada.')

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: profile.store_id,
          customer_id: selectedCustomer?.id || null,
          total_value: total,
          discount: discount,
          payment_method: paymentMethod,
          status: initialStatus
        }])
        .select()

      if (saleError) throw saleError
      const sale = saleData[0]

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

      setLastSaleDetails({
        id: sale.id,
        total: total,
        payment: paymentMethod.toUpperCase(),
        itemsCount: cart.length
      })

      setCart([])
      setSelectedCustomer(null)
      setDiscount(0)
      setSuccessOpen(true)
      loadSalesData()
    } catch (err: any) {
      Alert.alert('Erro ao finalizar venda', err.message || 'Houve uma falha.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleUpdateStatus(newStatus: 'novo' | 'aguardando pagamento' | 'pago' | 'enviado' | 'concluído') {
    if (!selectedOrder) return

    setStatusUpdateLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
        setSelectedOrder({ ...selectedOrder, status: newStatus })
        setOrderModalOpen(false)
        return
      }

      const { error } = await supabase
        .from('sales')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id)

      if (error) throw error

      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      setSelectedOrder({ ...selectedOrder, status: newStatus })
      setOrderModalOpen(false)
      Alert.alert('Sucesso', 'Status do pedido atualizado! 🌸')
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao atualizar status.')
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'novo': return { bg: '#F1F5F9', text: '#475569', label: 'Novo' }
      case 'aguardando pagamento': return { bg: '#FEF3C7', text: '#D97706', label: 'Aguardando Pagamento' }
      case 'pago': return { bg: '#ECFDF5', text: '#059669', label: 'Pago' }
      case 'enviado': return { bg: '#EFF6FF', text: '#3B82F6', label: 'Enviado' }
      case 'concluído': return { bg: '#F5F5F4', text: '#1C1917', label: 'Concluído' }
      default: return { bg: '#F1F5F9', text: '#475569', label: 'Desconhecido' }
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'catalog' && styles.tabActive]} onPress={() => setActiveTab('catalog')}>
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'cart' && styles.tabActive]} onPress={() => setActiveTab('cart')}>
          <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>Carrinho ({cart.reduce((a, c) => a + c.quantity, 0)})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'orders' && styles.tabActive]} onPress={() => setActiveTab('orders')}>
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Pedidos</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E11D48" style={styles.loader} />
      ) : activeTab === 'catalog' ? (
        <View style={styles.tabContent}>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar maquiagens..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const cartItem = cart.find(x => x.product.id === item.id)
              const qtyInCart = cartItem ? cartItem.quantity : 0
              return (
                <TouchableOpacity style={styles.prodCard} onPress={() => addToCart(item)}>
                  <View style={styles.imageBox}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.prodImage as any} />
                    ) : (
                      <View style={styles.fallbackImage}>
                        <Text style={styles.fallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                    {qtyInCart > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{qtyInCart}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.brand} numberOfLines={1}>{item.brand || 'Geral'}</Text>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.prodFooter}>
                    <Text style={styles.price}>R$ {item.sale_price.toFixed(2)}</Text>
                    <Text style={styles.stock}>{item.quantity_in_stock} un.</Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />

          {cart.length > 0 && (
            <TouchableOpacity style={styles.floatingCart} onPress={() => setActiveTab('cart')}>
              <ShoppingBag size={18} color="#FFFFFF" />
              <Text style={styles.floatingCartText}>Ver Carrinho • R$ {total.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : activeTab === 'cart' ? (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <ShoppingBag size={44} color="#FDA4AF" />
              <Text style={styles.emptyCartTitle}>Seu carrinho está vazio 🌸</Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('catalog')}>
                <Text style={styles.backBtnText}>Ir para o Catálogo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cartBox}>
              <Text style={styles.sectionTitle}>Produtos</Text>
              {cart.map(item => (
                <View key={item.product.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartProdName} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.cartProdPrice}>R$ {item.product.sale_price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.cartQtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.product.id)}>
                      <Minus size={12} color="#64748B" />
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item.product)}>
                      <Plus size={12} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Cliente da Venda</Text>
              {selectedCustomer ? (
                <View style={styles.selectedCustomer}>
                  <Text style={styles.selectedCustomerText}>{selectedCustomer.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                    <X size={16} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.customerSearchRow}>
                    <TextInput
                      placeholder="Pesquisar cliente ou avulso..."
                      value={customerSearch}
                      onChangeText={setCustomerSearch}
                      style={styles.customerInput}
                    />
                    <TouchableOpacity style={styles.addCustomerBtn} onPress={() => setCustomerModalOpen(true)}>
                      <UserPlus size={16} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                  {customerSearch.length > 0 && (
                    <View style={styles.dropdown}>
                      {filteredCustomers.map(c => (
                        <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch('')
                        }}>
                          <Text style={styles.dropdownText}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.sectionTitle}>Desconto Geral (R$)</Text>
              <TextInput
                placeholder="R$ 0.00"
                keyboardType="numeric"
                value={discount ? String(discount) : ''}
                onChangeText={val => setDiscount(parseFloat(val) || 0)}
                style={styles.discountInput}
              />

              <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
              <View style={styles.paymentRow}>
                {[
                  { id: 'pix', label: 'PIX' },
                  { id: 'money', label: 'Dinheiro' },
                  { id: 'credit_card', label: 'Crédito' },
                  { id: 'debit_card', label: 'Débito' }
                ].map(pm => (
                  <TouchableOpacity key={pm.id} style={[styles.paymentBtn, paymentMethod === pm.id && styles.paymentBtnActive]} onPress={() => setPaymentMethod(pm.id as any)}>
                    <Text style={[styles.paymentBtnText, paymentMethod === pm.id && styles.paymentBtnTextActive]}>{pm.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>R$ {subtotal.toFixed(2)}</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#E11D48' }]}>Desconto</Text>
                    <Text style={[styles.summaryVal, { color: '#E11D48' }]}>- R$ {discount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, marginTop: 10 }]}>
                  <Text style={[styles.summaryLabel, { fontSize: 13, fontWeight: '800' }]}>Total</Text>
                  <Text style={[styles.summaryVal, { fontSize: 14, fontWeight: '900', color: '#E11D48' }]}>R$ {total.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.checkoutBtn} disabled={checkoutLoading} onPress={handleCheckout}>
                {checkoutLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.checkoutBtnText}>FINALIZAR VENDA</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.tabContent}>
          {/* Orders list */}
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const theme = getStatusStyle(item.status)
              return (
                <TouchableOpacity style={styles.orderCard} onPress={() => { setSelectedOrder(item); setOrderModalOpen(true); }}>
                  <View>
                    <Text style={styles.orderCust}>{item.customers?.name || 'Cliente Avulso'}</Text>
                    <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('pt-BR')} • {item.payment_method.toUpperCase()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.orderTotal}>R$ {Number(item.total_value).toFixed(2)}</Text>
                    <View style={[styles.statusTag, { backgroundColor: theme.bg }]}>
                      <Text style={[styles.statusTagText, { color: theme.text }]}>{theme.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </View>
      )}

      {/* Success Modal */}
      {lastSaleDetails && (
        <Modal animationType="fade" transparent={true} visible={successOpen}>
          <View style={styles.overlay}>
            <View style={styles.successModal}>
              <CheckCircle size={48} color="#059669" />
              <Text style={styles.successTitle}>Venda Concluída! 🌸</Text>
              <Text style={styles.successSub}>O estoque e financeiro já foram atualizados no Mimus.</Text>

              <View style={styles.successReceipt}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Total:</Text>
                  <Text style={styles.receiptVal}>R$ {lastSaleDetails.total.toFixed(2)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Método:</Text>
                  <Text style={styles.receiptVal}>{lastSaleDetails.payment}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.successBtn} onPress={() => { setSuccessOpen(false); setActiveTab('catalog'); }}>
                <Text style={styles.successBtnText}>Nova Venda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Quick Customer Modal */}
      <Modal animationType="slide" transparent={true} visible={customerModalOpen}>
        <View style={styles.overlayBottom}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar Cliente Rápido</Text>
              <TouchableOpacity onPress={() => setCustomerModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo *</Text>
                <TextInput placeholder="Ex: Ana Souza" value={newCustName} onChangeText={setNewCustName} style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp / Celular</Text>
                <TextInput placeholder="Ex: 11999999999" value={newCustPhone} onChangeText={setNewCustPhone} keyboardType="phone-pad" style={styles.input} />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleQuickCustomerCreate}>
                <Text style={styles.saveBtnText}>CADASTRAR E SELECIONAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Status Action Modal */}
      {selectedOrder && (
        <Modal animationType="slide" transparent={true} visible={orderModalOpen}>
          <View style={styles.overlayBottom}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Pedido de {selectedOrder.customers?.name || 'Cliente Avulso'}</Text>
                  <Text style={styles.modalSubtitle}>Código: #{selectedOrder.id.slice(0,8).toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => setOrderModalOpen(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <Text style={[styles.label, { marginBottom: 12 }]}>Atualizar Status do Pedido:</Text>
                <View style={styles.statusButtonsCol}>
                  {[
                    { id: 'novo', label: 'Novo (Orçamento)' },
                    { id: 'aguardando pagamento', label: 'Aguardando Pagamento' },
                    { id: 'pago', label: 'Pago (Confirmado)' },
                    { id: 'enviado', label: 'Enviado (A caminho)' },
                    { id: 'concluído', label: 'Concluído (Entregue)' }
                  ].map(st => {
                    const active = selectedOrder.status === st.id
                    return (
                      <TouchableOpacity 
                        key={st.id} 
                        style={[styles.statusSelectBtn, active && styles.statusSelectBtnActive]} 
                        disabled={statusUpdateLoading}
                        onPress={() => handleUpdateStatus(st.id as any)}
                      >
                        <Text style={[styles.statusSelectBtnText, active && styles.statusSelectBtnTextActive]}>{st.label}</Text>
                        {active && <Check size={14} color="#E11D48" />}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 12,
    color: '#1E293B',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prodCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: 10,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  prodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E11D48',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  brand: {
    fontSize: 9,
    color: '#E11D48',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  prodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
  },
  price: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  stock: {
    fontSize: 9,
    color: '#94A3B8',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyCartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    marginTop: 8,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  backBtnText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '700',
  },
  cartBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  cartProdName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  cartProdPrice: {
    fontSize: 10.5,
    color: '#E11D48',
    fontWeight: '700',
    marginTop: 2,
  },
  cartQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  selectedCustomer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedCustomerText: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '800',
  },
  customerSearchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  addCustomerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 120,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  paymentBtnActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  paymentBtnText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
  },
  paymentBtnTextActive: {
    color: '#E11D48',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '700',
  },
  checkoutBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: 14,
    marginBottom: 8,
  },
  orderCust: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  orderDate: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 14,
  },
  successSub: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  successReceipt: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: '700',
  },
  successBtn: {
    backgroundColor: '#E11D48',
    width: '100%',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusButtonsCol: {
    gap: 8,
  },
  statusSelectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusSelectBtnActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
  },
  statusSelectBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statusSelectBtnTextActive: {
    color: '#E11D48',
    fontWeight: '800',
  },
})
