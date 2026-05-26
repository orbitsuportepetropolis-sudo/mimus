import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView, Image } from 'react-native'
import { supabase } from '../services/supabase'
import { ShoppingBag, Coins, CreditCard, DollarSign, Plus, Minus, Trash2, Search, X, CheckCircle, UserPlus, Percent } from 'lucide-react-native'

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

export default function SalesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog')
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
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

  // Quick Customer Create Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustInstagram, setNewCustInstagram] = useState('')
  const [newCustBirthday, setNewCustBirthday] = useState('')
  const [custLoading, setCustLoading] = useState(false)

  useEffect(() => {
    // Reload data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadPDVData()
    })
    return unsubscribe
  }, [navigation])

  async function loadPDVData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback mock
        setProducts([
          { id: '1', name: 'Batom Matte Rose V.', brand: 'Bruna Tavares', sale_price: 39.90, quantity_in_stock: 5, image_url: null },
          { id: '2', name: 'Corretivo Peach Glow', brand: 'Mimus', sale_price: 45.00, quantity_in_stock: 12, image_url: null },
          { id: '3', name: 'Sérum Renovador Skin Care', brand: 'Sallve', sale_price: 69.90, quantity_in_stock: 3, image_url: null }
        ])
        setCustomers([
          { id: '1', name: 'Leticia Silva', phone: '11999999999' },
          { id: '2', name: 'Mariana Costa', phone: '21988888888' }
        ])
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Fetch products in stock
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, brand, sale_price, quantity_in_stock, image_url')
          .eq('store_id', profile.store_id)
          .gt('quantity_in_stock', 0)
          .order('name', { ascending: true })

        // Fetch customers
        const { data: custs } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('store_id', profile.store_id)
          .order('name', { ascending: true })

        setProducts(prods || [])
        setCustomers(custs || [])
      }
    } catch (err) {
      console.error('Erro ao carregar dados do PDV:', err)
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

  function removeFromCart(prodId: string) {
    setCart(cart.filter(item => item.product.id !== prodId))
  }

  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.sale_price * curr.quantity), 0)
  const total = Math.max(0, subtotal - discount)

  async function handleQuickCustomerCreate() {
    if (!newCustName) {
      Alert.alert('Erro', 'Nome é obrigatório.')
      return
    }

    setCustLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback for demo
        const mockNew = { id: String(Date.now()), name: newCustName, phone: newCustPhone }
        setSelectedCustomer(mockNew)
        setCustomers([mockNew, ...customers])
        setCustomerModalOpen(false)
        resetCustForm()
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
        resetCustForm()
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao criar cliente.')
    } finally {
      setCustLoading(false)
    }
  }

  function resetCustForm() {
    setNewCustName('')
    setNewCustPhone('')
    setNewCustInstagram('')
    setNewCustBirthday('')
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      Alert.alert('Erro', 'O carrinho está vazio.')
      return
    }

    setCheckoutLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback for demo
        setLastSaleDetails({
          id: String(Date.now()),
          total: total,
          payment: paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'money' ? 'Dinheiro' : paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito',
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

      // 1. Insert the Sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: profile.store_id,
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

      // Record last sale details for feedback modal
      const paymentLabel = 
        paymentMethod === 'pix' ? 'PIX' : 
        paymentMethod === 'money' ? 'Dinheiro' : 
        paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'

      setLastSaleDetails({
        id: sale.id,
        total: total,
        payment: paymentLabel,
        itemsCount: cart.length
      })

      // Reset states
      setCart([])
      setSelectedCustomer(null)
      setDiscount(0)
      setSuccessOpen(true)
      loadPDVData()
    } catch (err: any) {
      Alert.alert('Erro ao finalizar venda', err.message || 'Houve uma falha.')
    } finally {
      setCheckoutLoading(false)
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
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'catalog' && styles.tabActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'cart' && styles.tabActive]}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>
            Carrinho ({cart.reduce((a, c) => a + c.quantity, 0)})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'catalog' ? (
        <View style={styles.catalogTab}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar maquiagem..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#E11D48" style={styles.loader} />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ShoppingBag size={36} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nenhum produto disponível em estoque.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              style={styles.gridList}
              renderItem={({ item }) => {
                const cartItem = cart.find(x => x.product.id === item.id)
                const quantityInCart = cartItem ? cartItem.quantity : 0

                return (
                  <TouchableOpacity style={styles.prodCard} onPress={() => addToCart(item)}>
                    <View style={styles.imageContainer}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.prodImage as any} />
                      ) : (
                        <View style={styles.fallbackImage}>
                          <Text style={styles.fallbackText}>
                            {item.name.slice(0, 3).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {quantityInCart > 0 && (
                        <View style={styles.cartBadge}>
                          <Text style={styles.cartBadgeText}>{quantityInCart}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.prodCardInfo}>
                      <Text style={styles.prodCardBrand} numberOfLines={1}>
                        {item.brand || 'COSMÉTICOS'}
                      </Text>
                      <Text style={styles.prodCardName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.prodCardFooter}>
                        <Text style={styles.prodCardPrice}>
                          R$ {item.sale_price.toFixed(2)}
                        </Text>
                        <Text style={styles.prodCardStock}>
                          {item.quantity_in_stock} un.
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          )}

          {/* Floating Cart Button */}
          {cart.length > 0 && (
            <TouchableOpacity 
              style={styles.floatingCartBtn} 
              onPress={() => setActiveTab('cart')}
            >
              <View style={styles.floatingCartContent}>
                <ShoppingBag size={18} color="#FFFFFF" />
                <Text style={styles.floatingCartText}>
                  Ver Carrinho ({cart.reduce((a, c) => a + c.quantity, 0)} itens)
                </Text>
              </View>
              <Text style={styles.floatingCartPrice}>
                R$ {total.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.cartTabContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.cartTabContentContainer}>
          {/* Cart Header */}
          <View style={styles.cartItemsHeader}>
            <Text style={styles.sectionTitle}>Itens Selecionados</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() => setCart([])}>
                <Text style={styles.clearCartText}>Esvaziar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cart list */}
          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <ShoppingBag size={32} color="#CBD5E1" />
              <Text style={styles.emptyCartText}>Seu carrinho está vazio.</Text>
              <TouchableOpacity style={styles.backToCatalogBtn} onPress={() => setActiveTab('catalog')}>
                <Text style={styles.backToCatalogBtnText}>Ir para o Catálogo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cartListWrapper}>
              {cart.map(item => (
                <View key={item.product.id} style={styles.cartRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemText} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.cartItemSubprice}>R$ {item.product.sale_price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity onPress={() => decreaseQty(item.product.id)} style={styles.qtyBtn}>
                      <Minus size={12} color="#475569" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => addToCart(item.product)} style={styles.qtyBtn}>
                      <Plus size={12} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Customer Selection */}
          <View style={styles.customerSection}>
            <View style={styles.customerHeader}>
              <Text style={styles.sectionTitle}>Cliente da Venda</Text>
              <TouchableOpacity style={styles.addCustomerLink} onPress={() => setCustomerModalOpen(true)}>
                <UserPlus size={14} color="#E11D48" />
                <Text style={styles.addCustomerLinkText}>Rápido</Text>
              </TouchableOpacity>
            </View>

            {selectedCustomer ? (
              <View style={styles.selectedCustomerCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                  {selectedCustomer.phone && <Text style={styles.selectedCustomerPhone}>{selectedCustomer.phone}</Text>}
                </View>
                <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.customerSearchWrapper}>
                <TextInput
                  placeholder="Buscar cliente ou deixar avulso..."
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholderTextColor="#94A3B8"
                  style={styles.customerInput}
                />
                {customerSearch.length > 0 && (
                  <View style={styles.customerDropdown}>
                    <ScrollView nestedScrollEnabled={true}>
                      {filteredCustomers.map(c => (
                        <TouchableOpacity 
                          key={c.id} 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedCustomer(c)
                            setCustomerSearch('')
                          }}
                        >
                          <Text style={styles.dropdownItemName}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <Text style={styles.dropdownEmptyText}>Sem clientes encontrados.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Discount input */}
          <View style={styles.discountSection}>
            <Text style={styles.sectionTitle}>Desconto Geral (R$)</Text>
            <View style={styles.discountInputWrapper}>
              <Percent size={14} color="#94A3B8" style={styles.discountIcon} />
              <TextInput
                placeholder="0.00"
                value={discount ? String(discount) : ''}
                onChangeText={val => setDiscount(Math.max(0, parseFloat(val) || 0))}
                keyboardType="numeric"
                style={styles.discountInput}
              />
            </View>
          </View>

          {/* Payment Section */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity 
                style={[styles.paymentBtn, paymentMethod === 'pix' && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod('pix')}
              >
                <Text style={[styles.paymentBtnText, paymentMethod === 'pix' && styles.paymentBtnTextActive]}>PIX</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentBtn, paymentMethod === 'money' && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod('money')}
              >
                <Text style={[styles.paymentBtnText, paymentMethod === 'money' && styles.paymentBtnTextActive]}>Dinheiro</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentBtn, paymentMethod === 'credit_card' && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod('credit_card')}
              >
                <Text style={[styles.paymentBtnText, paymentMethod === 'credit_card' && styles.paymentBtnTextActive]}>Crédito</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentBtn, paymentMethod === 'debit_card' && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod('debit_card')}
              >
                <Text style={[styles.paymentBtnText, paymentMethod === 'debit_card' && styles.paymentBtnTextActive]}>Débito</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Totals Summary & Checkout */}
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.subtotalText}>Subtotal: R$ {subtotal.toFixed(2)}</Text>
                {discount > 0 && <Text style={styles.discountText}>Desconto: -R$ {discount.toFixed(2)}</Text>}
              </View>
              <Text style={styles.totalVal}>R$ {total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={styles.checkoutBtn} 
              disabled={cart.length === 0 || checkoutLoading} 
              onPress={handleCheckout}
            >
              {checkoutLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.checkoutBtnText}>FINALIZAR VENDA</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Success Modal */}
      {lastSaleDetails && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={successOpen}
        >
          <View style={styles.overlay}>
            <View style={styles.successModal}>
              <View style={styles.checkCircle}>
                <CheckCircle size={44} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Venda Concluída!</Text>
              <Text style={styles.successSub}>Balanço de estoque e caixa atualizados no Mimus.</Text>

              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Total Geral:</Text>
                  <Text style={styles.receiptVal}>R$ {lastSaleDetails.total.toFixed(2)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Forma de Pagamento:</Text>
                  <Text style={styles.receiptVal}>{lastSaleDetails.payment}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Produtos Vendidos:</Text>
                  <Text style={styles.receiptVal}>{lastSaleDetails.itemsCount} itens</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.successCloseBtn} onPress={() => {
                setSuccessOpen(false)
                setActiveTab('catalog')
              }}>
                <Text style={styles.successCloseBtnText}>Nova Venda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Quick Customer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={customerModalOpen}
      >
        <View style={styles.overlayBottom}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar Cliente Rápido</Text>
              <TouchableOpacity onPress={() => setCustomerModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Cliente *</Text>
                <TextInput
                  placeholder="Nome completo"
                  value={newCustName}
                  onChangeText={setNewCustName}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp / Telefone</Text>
                <TextInput
                  placeholder="DDD + Celular"
                  value={newCustPhone}
                  onChangeText={setNewCustPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput
                  placeholder="@perfil"
                  value={newCustInstagram}
                  onChangeText={setNewCustInstagram}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data Aniversário (AAAA-MM-DD)</Text>
                <TextInput
                  placeholder="AAAA-MM-DD"
                  value={newCustBirthday}
                  onChangeText={setNewCustBirthday}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} disabled={custLoading} onPress={handleQuickCustomerCreate}>
                {custLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalSaveBtnText}>CADASTRAR E SELECIONAR</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  catalogTab: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  gridList: {
    flex: 1,
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
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    padding: 10,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#FDA4AF',
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  prodCardInfo: {
    marginTop: 8,
    gap: 2,
  },
  prodCardBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E11D48',
    textTransform: 'uppercase',
  },
  prodCardName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    height: 32,
    lineHeight: 16,
  },
  prodCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  prodCardPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  prodCardStock: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  floatingCartBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  floatingCartPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cartTabContainer: {
    flex: 1,
  },
  cartTabContentContainer: {
    paddingBottom: 80,
  },
  cartItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  clearCartText: {
    fontSize: 11.5,
    color: '#E11D48',
    fontWeight: '700',
  },
  emptyCartBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCartText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  backToCatalogBtn: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
  },
  backToCatalogBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  cartListWrapper: {
    marginBottom: 16,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemSubprice: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    width: 16,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
  },
  customerSection: {
    marginBottom: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addCustomerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCustomerLinkText: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '700',
  },
  selectedCustomerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
  },
  selectedCustomerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  selectedCustomerPhone: {
    fontSize: 10,
    color: '#FB7185',
    marginTop: 1,
  },
  customerSearchWrapper: {
    position: 'relative',
    zIndex: 30,
  },
  customerInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 12,
    color: '#1E293B',
  },
  customerDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    maxHeight: 120,
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownEmptyText: {
    padding: 10,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  discountSection: {
    marginBottom: 16,
  },
  discountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  discountIcon: {
    marginRight: 6,
  },
  discountInput: {
    flex: 1,
    height: 38,
    fontSize: 12,
    color: '#1E293B',
  },
  paymentSection: {
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  paymentBtnActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
  },
  paymentBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentBtnTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtotalText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  discountText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E11D48',
  },
  checkoutBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  successSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 18,
    gap: 6,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  receiptVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  successCloseBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  successCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11.5,
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  form: {
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
    color: '#1E293B',
  },
  modalSaveBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10.5,
  },
})
