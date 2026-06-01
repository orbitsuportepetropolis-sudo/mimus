import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../services/supabase'
import { 
  Sparkles, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  BookOpen, 
  FileSpreadsheet, 
  Monitor, 
  AlertCircle,
  Award
} from 'lucide-react-native'

const { width } = Dimensions.get('window')

interface OnboardingScreenProps {
  userId: string
  onComplete: () => void
}

export default function OnboardingScreen({ userId, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  
  // Form states
  const [storeName, setStoreName] = useState('')
  const [segment, setSegment] = useState('Loja de maquiagem')
  const [controlType, setControlType] = useState('')
  const [mainGoal, setMainGoal] = useState('')
  
  // Product states
  const [prodName, setProdName] = useState('')
  const [prodQty, setProdQty] = useState('10')
  const [prodPrice, setProdPrice] = useState('49.90')
  const [createdProduct, setCreatedProduct] = useState<any>(null)
  
  // Sale states
  const [saleQty, setSaleQty] = useState('1')
  const [createdSale, setCreatedSale] = useState<any>(null)

  // Load user profile & store on mount
  useEffect(() => {
    async function loadStore() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id, stores(name)')
          .eq('id', userId)
          .single()
          
        if (profile) {
          setStoreId(profile.store_id)
          const store = (profile.stores as any)
          if (store?.name) {
            setStoreName(store.name)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadStore()
  }, [userId])

  // Step 2: Save store name
  async function handleStoreUpdate() {
    if (!storeName.trim() || !storeId) {
      Alert.alert('Erro', 'Nome da loja não pode ser vazio.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({ name: storeName })
        .eq('id', storeId)
      if (error) throw error
      setStep(3)
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível atualizar o nome da loja.')
    } finally {
      setLoading(false)
    }
  }

  // Step 6: Create Product
  async function handleCreateProduct() {
    const qty = parseInt(prodQty)
    const price = parseFloat(prodPrice)
    if (!prodName.trim() || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0 || !storeId) {
      Alert.alert('Erro', 'Preencha os dados do produto corretamente.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          store_id: storeId,
          name: prodName,
          quantity_in_stock: qty,
          sale_price: price,
          brand: 'Mimus',
          cost_price: Math.round(price * 0.5 * 100) / 100 // simulated cost
        }])
        .select()
        .single()
        
      if (error) throw error
      setCreatedProduct(data)
      setStep(5) // Back to checklist
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar o produto.')
    } finally {
      setLoading(false)
    }
  }

  // Step 7: Register Sale
  async function handleRegisterSale() {
    const qty = parseInt(saleQty)
    if (isNaN(qty) || qty <= 0 || !createdProduct || !storeId) {
      Alert.alert('Erro', 'Insira uma quantidade válida.')
      return
    }
    setLoading(true)
    try {
      const totalValue = Math.round(createdProduct.sale_price * qty * 100) / 100
      
      // 1. Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: storeId,
          customer_id: null,
          total_value: totalValue,
          discount: 0,
          payment_method: 'pix'
        }])
        .select()
        .single()
        
      if (saleError) throw saleError
      
      // 2. Insert sale item
      const { error: itemError } = await supabase
        .from('sale_items')
        .insert([{
          sale_id: saleData.id,
          product_id: createdProduct.id,
          quantity: qty,
          unit_price: createdProduct.sale_price
        }])
        
      if (itemError) throw itemError
      
      setCreatedSale(saleData)
      setStep(5) // Back to checklist (66% progress)
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível registrar a venda.')
    } finally {
      setLoading(false)
    }
  }

  // Step 9: Save AsyncStorage flag and finish
  async function handleCompleteOnboarding() {
    if (storeId) {
      try {
        await AsyncStorage.setItem(`mimus_onboarding_completed_${storeId}`, 'true')
      } catch (err) {
        console.error(err)
      }
    }
    onComplete()
  }

  const isProductCreated = !!createdProduct
  const isSaleCreated = !!createdSale
  const progressPercent = isSaleCreated ? 66 : isProductCreated ? 33 : 0

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      
      {/* Top logo and header progress (except on celebration/welcome steps) */}
      {step > 1 && step < 8 && (
        <View style={styles.headerProgress}>
          <Text style={styles.headerLogo}>Mimus<Text style={{ color: '#E11D48' }}>.</Text></Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(step / 7) * 100}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.card}>
        
        {/* TELA 1: BOAS-VINDAS */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Sparkles size={40} color="#E11D48" />
            </View>
            <Text style={styles.title}>Bem-vindo ao Mimus</Text>
            <Text style={styles.subtitle}>
              Controle vendas, estoque e finanças da sua loja em poucos minutos.
            </Text>
            
            <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>COMEÇAR CONFIGURAÇÃO</Text>
              <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 2: CONHECENDO SUA LOJA */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepIndicator}>Passo 1 de 3</Text>
            <Text style={styles.stepTitle}>Conhecendo sua loja</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Qual o nome da sua loja?</Text>
              <TextInput
                placeholder="Ex: Bella Makeup, Mimus Cosméticos"
                value={storeName}
                onChangeText={setStoreName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Qual seu segmento?</Text>
              <View style={styles.optionsRow}>
                {[
                  'Loja de maquiagem',
                  'Loja de cosméticos',
                  'Revendedora',
                  'Outro'
                ].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSegment(opt)}
                    style={[
                      styles.optCard, 
                      segment === opt ? styles.optCardActive : null
                    ]}
                  >
                    <Text style={[
                      styles.optCardText,
                      segment === opt ? styles.optCardTextActive : null
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btn, !storeName.trim() ? styles.btnDisabled : null]} 
              disabled={loading || !storeName.trim()} 
              onPress={handleStoreUpdate}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>CONTINUAR</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 3: COMO VOCÊ CONTROLA HOJE */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepIndicator}>Passo 2 de 3</Text>
            <Text style={styles.stepTitle}>Como você controla hoje?</Text>
            <Text style={styles.stepSubtitleText}>Como você controla seu estoque e vendas atualmente?</Text>
            
            <View style={styles.gridContainer}>
              {[
                { name: 'Caderno', icon: BookOpen },
                { name: 'Excel', icon: FileSpreadsheet },
                { name: 'Outro sistema', icon: Monitor },
                { name: 'Não controlo', icon: AlertCircle }
              ].map(item => {
                const Icon = item.icon
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setControlType(item.name)}
                    style={[
                      styles.gridItem,
                      controlType === item.name ? styles.gridItemActive : null
                    ]}
                  >
                    <Icon size={24} color={controlType === item.name ? '#E11D48' : '#64748B'} />
                    <Text style={[
                      styles.gridLabel,
                      controlType === item.name ? styles.gridLabelActive : null
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={styles.tipText}>Essa informação é valiosa para marketing e produto.</Text>

            <TouchableOpacity 
              style={[styles.btn, !controlType ? styles.btnDisabled : null]} 
              disabled={!controlType} 
              onPress={() => setStep(4)}
            >
              <Text style={styles.btnText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 4: DEFINE SUA META */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepIndicator}>Passo 3 de 3</Text>
            <Text style={styles.stepTitle}>Defina sua meta</Text>
            <Text style={styles.stepSubtitleText}>Qual seu objetivo principal?</Text>
            
            <View style={styles.gridContainer}>
              {[
                { name: 'Controlar estoque', icon: Package },
                { name: 'Controlar vendas', icon: ShoppingBag },
                { name: 'Controlar finanças', icon: TrendingUp },
                { name: 'Entender meu lucro', icon: Award }
              ].map(item => {
                const Icon = item.icon
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setMainGoal(item.name)}
                    style={[
                      styles.gridItem,
                      mainGoal === item.name ? styles.gridItemActive : null
                    ]}
                  >
                    <Icon size={24} color={mainGoal === item.name ? '#E11D48' : '#64748B'} />
                    <Text style={[
                      styles.gridLabel,
                      mainGoal === item.name ? styles.gridLabelActive : null
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={styles.tipText}>Isso personaliza a experiência.</Text>

            <TouchableOpacity 
              style={[styles.btn, !mainGoal ? styles.btnDisabled : null]} 
              disabled={!mainGoal} 
              onPress={() => setStep(5)}
            >
              <Text style={styles.btnText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 5: CHECKLIST DE CONFIGURAÇÃO */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Configure sua loja</Text>
            <Text style={styles.stepSubtitleText}>Falta muito pouco para deixar tudo em ordem!</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFillLocal, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>Progresso: {progressPercent}%</Text>
            </View>

            <View style={styles.checklist}>
              <View style={[styles.checkItem, isProductCreated ? styles.checkItemDone : null]}>
                <View style={[styles.checkCircle, isProductCreated ? styles.checkCircleDone : null]}>
                  {isProductCreated && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkLabel, isProductCreated ? styles.checkLabelDone : null]}>
                  Cadastre seu primeiro produto
                </Text>
              </View>

              <View style={[styles.checkItem, isSaleCreated ? styles.checkItemDone : null]}>
                <View style={[styles.checkCircle, isSaleCreated ? styles.checkCircleDone : null]}>
                  {isSaleCreated && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkLabel, isSaleCreated ? styles.checkLabelDone : null]}>
                  Registre sua primeira venda
                </Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkCircle} />
                <Text style={styles.checkLabel}>Veja seu dashboard</Text>
              </View>
            </View>

            {!isProductCreated ? (
              <TouchableOpacity style={styles.btn} onPress={() => setStep(6)}>
                <Text style={styles.btnText}>CADASTRAR PRIMEIRO PRODUTO</Text>
              </TouchableOpacity>
            ) : !isSaleCreated ? (
              <TouchableOpacity style={styles.btn} onPress={() => setStep(7)}>
                <Text style={styles.btnText}>REGISTRAR PRIMEIRA VENDA</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={() => setStep(8)}>
                <Text style={styles.btnText}>VER MEUS RESULTADOS</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TELA 6: PRIMEIRO PRODUTO */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Primeiro produto</Text>
            <Text style={styles.stepSubtitleText}>Vamos começar pelos seus produtos mais vendidos.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do produto</Text>
              <TextInput
                placeholder="Ex: Batom Velvet Matte Rose"
                value={prodName}
                onChangeText={setProdName}
                style={styles.input}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Quantidade</Text>
                <TextInput
                  placeholder="10"
                  keyboardType="numeric"
                  value={prodQty}
                  onChangeText={setProdQty}
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Preço de venda (R$)</Text>
                <TextInput
                  placeholder="49.90"
                  keyboardType="numeric"
                  value={prodPrice}
                  onChangeText={setProdPrice}
                  style={styles.input}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btn, !prodName.trim() ? styles.btnDisabled : null]} 
              disabled={loading || !prodName.trim()} 
              onPress={handleCreateProduct}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>SALVAR PRODUTO</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 7: PRIMEIRA VENDA */}
        {step === 7 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Primeira venda</Text>
            <Text style={styles.stepSubtitleText}>Agora registre uma venda para ver o Mimus funcionando.</Text>

            <View style={styles.selectedProductBox}>
              <Text style={styles.selectedProductTitle}>Produto Selecionado</Text>
              <Text style={styles.selectedProductName}>{createdProduct?.name}</Text>
              <Text style={styles.selectedProductPrice}>R$ {createdProduct?.sale_price.toFixed(2)}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantidade vendida</Text>
              <TextInput
                placeholder="1"
                keyboardType="numeric"
                value={saleQty}
                onChangeText={setSaleQty}
                style={styles.input}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btn, !saleQty ? styles.btnDisabled : null]} 
              disabled={loading || !saleQty} 
              onPress={handleRegisterSale}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>REGISTRAR VENDA</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 8: MOMENTO AHA */}
        {step === 8 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepIndicator}>Aqui está a parte mais importante</Text>
            <Text style={styles.stepTitle}>Loja Controlada! 📈</Text>
            
            <View style={styles.ahaBox}>
              <View style={styles.ahaItem}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={styles.ahaLabel}>Faturamento</Text>
                <Text style={styles.ahaValue}>R$ {(createdProduct?.sale_price * parseInt(saleQty || '1')).toFixed(2)}</Text>
              </View>

              <View style={styles.ahaItem}>
                <Package size={20} color="#E11D48" />
                <Text style={styles.ahaLabel}>Estoque restante</Text>
                <Text style={styles.ahaValue}>{createdProduct ? createdProduct.quantity_in_stock - parseInt(saleQty || '1') : 0} itens</Text>
              </View>

              <View style={styles.ahaItem}>
                <Award size={20} color="#8B5CF6" />
                <Text style={styles.ahaLabel}>Lucro estimado</Text>
                <Text style={styles.ahaValue}>R$ {((createdProduct?.sale_price - (createdProduct?.cost_price || 0)) * parseInt(saleQty || '1')).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                Parabéns! Sua loja já está sendo controlada pelo Mimus.
              </Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => setStep(9)}>
              <Text style={styles.btnText}>IR PARA O PAINEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TELA 9: ATIVAÇÃO DO TESTE */}
        {step === 9 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCirclePulse}>
              <Sparkles size={40} color="#E11D48" />
            </View>
            <Text style={styles.title}>🎉 Teste grátis começou</Text>
            <Text style={styles.subtitle}>
              Restam 7 dias para explorar todos os recursos e impulsionar o seu negócio de beleza.
            </Text>

            <TouchableOpacity style={styles.btn} onPress={handleCompleteOnboarding}>
              <Text style={styles.btnText}>EXPLORAR MIMUS</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF8FA',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerProgress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarBg: {
    width: 140,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E11D48',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCirclePulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stepIndicator: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  optCardActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  optCardText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  optCardTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  gridItem: {
    width: (width - 100) / 2,
    aspectRatio: 1.25,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  gridItemActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
  },
  gridLabelActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  tipText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginVertical: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFillLocal: {
    height: '100%',
    backgroundColor: '#E11D48',
  },
  progressText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  checklist: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkItemDone: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  checkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  checkLabelDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  selectedProductBox: {
    width: '100%',
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: 16,
  },
  selectedProductTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  selectedProductPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  ahaBox: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  ahaItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  ahaLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'center',
  },
  ahaValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  alertBox: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    marginBottom: 24,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    backgroundColor: '#E11D48',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#FDA4AF',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: 0.8,
  },
})
