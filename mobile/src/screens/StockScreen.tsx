import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, Image } from 'react-native'
import { supabase } from '../services/supabase'
import { Package, Search, AlertCircle, Plus, Edit, Trash2, X, ArrowUpDown, RefreshCw, Camera } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'

export default function StockScreen() {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [storePlan, setStorePlan] = useState<'free' | 'pro'>('free')

  // Form State (New Product)
  const [formName, setFormName] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formBarcode, setFormBarcode] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formSalePrice, setFormSalePrice] = useState('')
  const [formStock, setFormStock] = useState('0')
  const [formMinStock, setFormMinStock] = useState('5')
  const [formExpDate, setFormExpDate] = useState('')
  const [formImageUri, setFormImageUri] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Modal State (Product detail actions / edit / adjust)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [actionType, setActionType] = useState<'options' | 'adjust' | 'edit'>('options')

  // Stock Adjustment State
  const [adjustType, setAdjustType] = useState<'entry' | 'exit'>('entry')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('manual_adjustment')

  async function pickImage() {
    Alert.alert(
      'Foto do Produto',
      'Como deseja adicionar a foto do produto?',
      [
        {
          text: 'Tirar Foto (Câmera)',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua câmera.')
              return
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setFormImageUri(result.assets[0].uri)
            }
          }
        },
        {
          text: 'Escolher da Galeria',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria.')
              return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setFormImageUri(result.assets[0].uri)
            }
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    )
  }

  async function uploadImage(uri: string, storeId: string): Promise<string | null> {
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      
      const fileExt = uri.split('.').pop() || 'jpg'
      const fileName = `${storeId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, blob, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Erro storage upload mobile:', error)
        return null
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err)
      return null
    }
  }

  useEffect(() => {
    fetchStock()
  }, [activeTab])

  async function fetchStock() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback mock
        setProducts([
          { id: '1', name: 'Batom Matte Rose V.', brand: 'Bruna Tavares', category: 'Boca', sale_price: 39.90, cost_price: 15.00, quantity_in_stock: 2, min_stock_alert: 5 },
          { id: '2', name: 'Corretivo Peach Glow', brand: 'Mimus', category: 'Pele', sale_price: 45.00, cost_price: 20.00, quantity_in_stock: 12, min_stock_alert: 5 },
          { id: '3', name: 'Base Satin Liquida', brand: 'Boca Rosa', category: 'Pele', sale_price: 89.90, cost_price: 40.00, quantity_in_stock: 0, min_stock_alert: 3 },
        ])
        setStorePlan('free')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id, stores(plan, plan_status, trial_ends_at)')
        .eq('id', user.id)
        .single()

      if (profile) {
        const store = (profile.stores as any)
        const plan = store?.plan || 'free'
        const status = store?.plan_status || 'trial'
        const trialEnds = store?.trial_ends_at

        const getTrialDaysLeft = () => {
          if (!trialEnds) return 0
          const diff = new Date(trialEnds).getTime() - Date.now()
          return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
        }
        const isTrialActive = status === 'trial' && getTrialDaysLeft() > 0
        const isPro = plan === 'pro' || isTrialActive

        setStorePlan(isPro ? 'pro' : 'free')
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', profile.store_id)
          .order('name', { ascending: true })

        if (error) throw error
        setProducts(data || [])
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProduct() {
    if (!formName || !formSalePrice || !formCostPrice) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios (*).')
      return
    }

    if (storePlan === 'free' && products.length >= 50) {
      Alert.alert(
        'Limite Excedido', 
        'Você atingiu o limite de 50 produtos no Plano Free. Faça o upgrade para o Plano Pro no Painel Web.'
      )
      return
    }

    setSubmitLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Sucesso', 'Produto criado com sucesso! (Modo de Demonstração)')
        resetForm()
        setActiveTab('list')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada.')

      let imageUrl = null
      if (formImageUri) {
        imageUrl = await uploadImage(formImageUri, profile.store_id)
      }

      const productPayload = {
        store_id: profile.store_id,
        name: formName,
        brand: formBrand || null,
        category: formCategory || null,
        sku: formSku || null,
        barcode: formBarcode || null,
        cost_price: parseFloat(formCostPrice) || 0,
        sale_price: parseFloat(formSalePrice) || 0,
        quantity_in_stock: parseInt(formStock) || 0,
        min_stock_alert: parseInt(formMinStock) || 5,
        expiration_date: formExpDate || null,
        image_url: imageUrl
      }

      const { data: newProd, error } = await supabase
        .from('products')
        .insert([productPayload])
        .select()

      if (error) throw error

      // If initial stock is > 0, insert a stock entry movement
      if (newProd && newProd[0] && parseInt(formStock) > 0) {
        await supabase.from('stock_movements').insert([{
          store_id: profile.store_id,
          product_id: newProd[0].id,
          quantity: parseInt(formStock),
          type: 'entry',
          reason: 'purchase'
        }])
      }

      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!')
      resetForm()
      setActiveTab('list')
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao criar produto.')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleAdjustStock() {
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Informe uma quantidade válida maior que zero.')
      return
    }

    setSubmitLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Sucesso', 'Ajuste de estoque salvo! (Modo de Demonstração)')
        setModalVisible(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada.')

      const finalQty = adjustType === 'entry' ? qty : -qty

      const { error } = await supabase
        .from('stock_movements')
        .insert([{
          store_id: profile.store_id,
          product_id: selectedProduct.id,
          quantity: finalQty,
          type: adjustType,
          reason: adjustReason
        }])

      if (error) throw error

      Alert.alert('Sucesso', 'Ajuste de estoque registrado!')
      setModalVisible(false)
      fetchStock()
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao ajustar estoque.')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleUpdateProduct() {
    if (!formName || !formSalePrice || !formCostPrice) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios.')
      return
    }

    setSubmitLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Sucesso', 'Produto atualizado! (Modo de Demonstração)')
        resetForm()
        setModalVisible(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada.')

      let imageUrl = formImageUri
      if (formImageUri && formImageUri.startsWith('file://')) {
        const uploadedUrl = await uploadImage(formImageUri, profile.store_id)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const productPayload = {
        name: formName,
        brand: formBrand || null,
        category: formCategory || null,
        sku: formSku || null,
        barcode: formBarcode || null,
        cost_price: parseFloat(formCostPrice) || 0,
        sale_price: parseFloat(formSalePrice) || 0,
        min_stock_alert: parseInt(formMinStock) || 5,
        expiration_date: formExpDate || null,
        image_url: imageUrl
      }

      const { error } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', selectedProduct.id)

      if (error) throw error

      Alert.alert('Sucesso', 'Produto atualizado com sucesso!')
      resetForm()
      setModalVisible(false)
      fetchStock()
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao atualizar produto.')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleDeleteProduct() {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o produto "${selectedProduct.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', selectedProduct.id)

              if (error) throw error
              Alert.alert('Sucesso', 'Produto excluído.')
              resetForm()
              setModalVisible(false)
              fetchStock()
            } catch (err: any) {
              Alert.alert('Erro', 'Não foi possível excluir. Verifique se o produto não possui vendas associadas.')
            }
          }
        }
      ]
    )
  }

  function resetForm() {
    setFormName('')
    setFormBrand('')
    setFormCategory('')
    setFormSku('')
    setFormBarcode('')
    setFormCostPrice('')
    setFormSalePrice('')
    setFormStock('0')
    setFormMinStock('5')
    setFormExpDate('')
    setFormImageUri(null)
  }

  function openOptions(product: any) {
    setSelectedProduct(product)
    setFormName(product.name)
    setFormBrand(product.brand || '')
    setFormCategory(product.category || '')
    setFormSku(product.sku || '')
    setFormBarcode(product.barcode || '')
    setFormCostPrice(String(product.cost_price))
    setFormSalePrice(String(product.sale_price))
    setFormMinStock(String(product.min_stock_alert))
    setFormExpDate(product.expiration_date || '')
    setFormImageUri(product.image_url || null)
    
    // Reset adjustment
    setAdjustType('entry')
    setAdjustQty('')
    setAdjustReason('manual_adjustment')

    setActionType('options')
    setModalVisible(true)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <View style={styles.container}>
      {/* Navigation tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'list' && styles.tabActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>Estoque</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'new' && styles.tabActive]}
          onPress={() => {
            resetForm()
            setActiveTab('new')
          }}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Novo Produto</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? (
        <View style={styles.content}>
          {/* Plan limit info */}
          {storePlan === 'free' && (
            <View style={styles.limitBanner}>
              <Text style={styles.limitText}>
                Plano Free: {products.length}/50 produtos cadastrados.
              </Text>
            </View>
          )}

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por nome, marca ou categoria..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#E11D48" style={styles.loader} />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Package size={36} color="#CBD5E1" />
              <Text style={styles.emptyText}>Sem produtos no catálogo.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isLow = item.quantity_in_stock <= (item.min_stock_alert || 5)
                const isOut = item.quantity_in_stock === 0

                return (
                  <TouchableOpacity style={styles.card} onPress={() => openOptions(item)}>
                    {/* Thumbnail */}
                    <View style={styles.thumbnailContainer}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.thumbnailImage as any} />
                      ) : (
                        <View style={styles.thumbnailFallback}>
                          <Text style={styles.thumbnailFallbackText}>
                            {item.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.prodName}>{item.name}</Text>
                      <View style={styles.prodMeta}>
                        <Text style={styles.metaLabel}>{item.brand || 'Sem marca'}</Text>
                        {item.category && (
                          <Text style={styles.categoryBadge}>{item.category}</Text>
                        )}
                      </View>
                      <Text style={styles.prodPrice}>R$ {item.sale_price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      <Text style={[
                        styles.badgeText,
                        isOut ? styles.badgeOut : isLow ? styles.badgeLow : styles.badgeNormal
                      ]}>
                        {item.quantity_in_stock} un.
                      </Text>
                      {isLow && <AlertCircle size={14} color="#D97706" style={styles.alertIcon} />}
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Produto *</Text>
              <TextInput
                placeholder="Ex: Lip Gloss Rosé"
                value={formName}
                onChangeText={setFormName}
                style={styles.input}
              />
            </View>

            <View style={styles.grid2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  placeholder="Ex: Bruna Tavares"
                  value={formBrand}
                  onChangeText={setFormBrand}
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Categoria</Text>
                <TextInput
                  placeholder="Ex: Boca, Pele"
                  value={formCategory}
                  onChangeText={setFormCategory}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>SKU</Text>
                <TextInput
                  placeholder="Ex: GLOSS-ROSE"
                  value={formSku}
                  onChangeText={setFormSku}
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Código Barras</Text>
                <TextInput
                  placeholder="EAN-13"
                  value={formBarcode}
                  onChangeText={setFormBarcode}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Preço Custo (R$) *</Text>
                <TextInput
                  placeholder="0.00"
                  value={formCostPrice}
                  onChangeText={setFormCostPrice}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Preço Venda (R$) *</Text>
                <TextInput
                  placeholder="0.00"
                  value={formSalePrice}
                  onChangeText={setFormSalePrice}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Estoque Inicial</Text>
                <TextInput
                  placeholder="0"
                  value={formStock}
                  onChangeText={setFormStock}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Alerta Mínimo</Text>
                <TextInput
                  placeholder="5"
                  value={formMinStock}
                  onChangeText={setFormMinStock}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data Validade (AAAA-MM-DD)</Text>
              <TextInput
                placeholder="Ex: 2027-12-31"
                value={formExpDate}
                onChangeText={setFormExpDate}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Foto do Produto</Text>
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  <Camera size={18} color="#E11D48" />
                  <Text style={styles.imagePickerBtnText}>Selecionar Imagem</Text>
                </TouchableOpacity>
                {formImageUri && (
                  <View style={styles.imagePreviewBox}>
                    <Image source={{ uri: formImageUri }} style={styles.imagePreview as any} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setFormImageUri(null)}>
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.btn} 
              disabled={submitLoading} 
              onPress={handleCreateProduct}
            >
              {submitLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>SALVAR PRODUTO</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Product Detail / Actions Modal */}
      {selectedProduct && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedProduct.name}</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {actionType === 'options' && (
                <View style={styles.modalBody}>
                  {/* Summary info */}
                  <View style={styles.productSummaryBox}>
                    <Text style={styles.summaryLabel}>Marca: <Text style={styles.summaryVal}>{selectedProduct.brand || '-'}</Text></Text>
                    <Text style={styles.summaryLabel}>Preço Venda: <Text style={styles.summaryVal}>R$ {selectedProduct.sale_price.toFixed(2)}</Text></Text>
                    <Text style={styles.summaryLabel}>Estoque Atual: <Text style={[styles.summaryVal, { fontWeight: '800', color: '#E11D48' }]}>{selectedProduct.quantity_in_stock} unidades</Text></Text>
                  </View>

                  <TouchableOpacity style={styles.optionBtn} onPress={() => setActionType('adjust')}>
                    <ArrowUpDown size={18} color="#E11D48" />
                    <Text style={styles.optionBtnText}>Ajustar Estoque (Entrada/Saída)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.optionBtn} onPress={() => setActionType('edit')}>
                    <Edit size={18} color="#E11D48" />
                    <Text style={styles.optionBtnText}>Editar Detalhes do Produto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.optionBtn, styles.deleteBtn]} onPress={handleDeleteProduct}>
                    <Trash2 size={18} color="#EF4444" />
                    <Text style={[styles.optionBtnText, { color: '#EF4444' }]}>Excluir Produto</Text>
                  </TouchableOpacity>
                </View>
              )}

              {actionType === 'adjust' && (
                <View style={styles.modalBody}>
                  <Text style={styles.sectionLabel}>Realizar Ajuste de Estoque</Text>

                  {/* Operation type toggle */}
                  <View style={styles.adjustTypeRow}>
                    <TouchableOpacity 
                      style={[styles.adjustTypeBtn, adjustType === 'entry' && styles.adjustTypeBtnActive]}
                      onPress={() => setAdjustType('entry')}
                    >
                      <Text style={[styles.adjustTypeText, adjustType === 'entry' && styles.adjustTypeTextActive]}>Entrada (+)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.adjustTypeBtn, adjustType === 'exit' && styles.adjustTypeBtnActive]}
                      onPress={() => setAdjustType('exit')}
                    >
                      <Text style={[styles.adjustTypeText, adjustType === 'exit' && styles.adjustTypeTextActive]}>Saída (-)</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Quantidade de Ajuste</Text>
                    <TextInput
                      placeholder="Qtd."
                      value={adjustQty}
                      onChangeText={setAdjustQty}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Motivo do Ajuste</Text>
                    <View style={styles.reasonRow}>
                      <TouchableOpacity 
                        style={[styles.reasonBadge, adjustReason === 'manual_adjustment' && styles.reasonBadgeActive]}
                        onPress={() => setAdjustReason('manual_adjustment')}
                      >
                        <Text style={[styles.reasonBadgeText, adjustReason === 'manual_adjustment' && styles.reasonBadgeTextActive]}>Manual</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.reasonBadge, adjustReason === 'purchase' && styles.reasonBadgeActive]}
                        onPress={() => setAdjustReason('purchase')}
                      >
                        <Text style={[styles.reasonBadgeText, adjustReason === 'purchase' && styles.reasonBadgeTextActive]}>Compra</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.reasonBadge, adjustReason === 'loss' && styles.reasonBadgeActive]}
                        onPress={() => setAdjustReason('loss')}
                      >
                        <Text style={[styles.reasonBadgeText, adjustReason === 'loss' && styles.reasonBadgeTextActive]}>Perda</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setActionType('options')}>
                      <Text style={styles.cancelModalBtnText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmModalBtn} 
                      disabled={submitLoading}
                      onPress={handleAdjustStock}
                    >
                      {submitLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmModalBtnText}>SALVAR AJUSTE</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {actionType === 'edit' && (
                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionLabel}>Editar Detalhes do Produto</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome do Produto *</Text>
                    <TextInput
                      placeholder="Nome"
                      value={formName}
                      onChangeText={setFormName}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.grid2}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Marca</Text>
                      <TextInput
                        placeholder="Marca"
                        value={formBrand}
                        onChangeText={setFormBrand}
                        style={styles.input}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Categoria</Text>
                      <TextInput
                        placeholder="Categoria"
                        value={formCategory}
                        onChangeText={setFormCategory}
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.grid2}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>SKU</Text>
                      <TextInput
                        placeholder="SKU"
                        value={formSku}
                        onChangeText={setFormSku}
                        style={styles.input}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Cód. Barras</Text>
                      <TextInput
                        placeholder="EAN"
                        value={formBarcode}
                        onChangeText={setFormBarcode}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.grid2}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Preço Custo (R$) *</Text>
                      <TextInput
                        placeholder="Custo"
                        value={formCostPrice}
                        onChangeText={setFormCostPrice}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Preço Venda (R$) *</Text>
                      <TextInput
                        placeholder="Venda"
                        value={formSalePrice}
                        onChangeText={setFormSalePrice}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.grid2}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Aviso Mínimo</Text>
                      <TextInput
                        placeholder="5"
                        value={formMinStock}
                        onChangeText={setFormMinStock}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Validade (AAAA-MM-DD)</Text>
                      <TextInput
                        placeholder="AAAA-MM-DD"
                        value={formExpDate}
                        onChangeText={setFormExpDate}
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Foto do Produto</Text>
                    <View style={styles.imagePickerContainer}>
                      <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                        <Camera size={18} color="#E11D48" />
                        <Text style={styles.imagePickerBtnText}>Selecionar Imagem</Text>
                      </TouchableOpacity>
                      {formImageUri && (
                        <View style={styles.imagePreviewBox}>
                          <Image source={{ uri: formImageUri }} style={styles.imagePreview as any} />
                          <TouchableOpacity style={styles.removeImageBtn} onPress={() => setFormImageUri(null)}>
                            <X size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setActionType('options')}>
                      <Text style={styles.cancelModalBtnText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmModalBtn} 
                      disabled={submitLoading}
                      onPress={handleUpdateProduct}
                    >
                      {submitLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmModalBtnText}>SALVAR</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
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
  content: {
    flex: 1,
  },
  limitBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  limitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: '#1E293B',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  prodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#64748B',
  },
  categoryBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E11D48',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  prodPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeNormal: {
    backgroundColor: '#E2E8F0',
    color: '#334155',
  },
  badgeLow: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  badgeOut: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
  },
  alertIcon: {
    marginLeft: 6,
  },
  formContainer: {
    flex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  btn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  productSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  optionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  deleteBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  adjustTypeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 8,
    marginBottom: 14,
  },
  adjustTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  adjustTypeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adjustTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  adjustTypeTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  reasonBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  reasonBadgeActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  reasonBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  reasonBadgeTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelModalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  confirmModalBtn: {
    flex: 1.5,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  imagePickerBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  imagePreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 3,
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailFallbackText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDA4AF',
  },
})
