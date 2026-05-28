import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native'
import { supabase } from '../services/supabase'
import { DollarSign, Plus, TrendingUp, TrendingDown, Trash2, History, X, Calendar } from 'lucide-react-native'

interface Transaction {
  id: string
  type: 'revenue' | 'expense'
  value: number
  category: string
  description: string | null
  date: string
  created_at: string
}

export default function FinanceScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Form State
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('supplier')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Computed Totals
  const [totals, setTotals] = useState({
    todayInflow: 0,
    weekSales: 0,
    expenses: 0
  })

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFinancialData()
    })
    return unsubscribe
  }, [navigation])

  async function loadFinancialData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Mock fallback for preview mode
        const mockData: Transaction[] = [
          { id: '1', type: 'revenue', value: 390.00, category: 'sale', description: 'Venda no PDV', date: '2026-05-22', created_at: '' },
          { id: '2', type: 'expense', value: 120.00, category: 'supplier', description: 'Compra de maquiagens Bruna Tavares', date: '2026-05-21', created_at: '' },
          { id: '3', type: 'revenue', value: 450.00, category: 'sale', description: 'Venda no PDV', date: '2026-05-20', created_at: '' },
        ]
        setTransactions(mockData)
        calculateStats(mockData)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        const { data, error } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('store_id', profile.store_id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) throw error

        setTransactions(data || [])
        calculateStats(data || [])
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao carregar lançamentos financeiros.')
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(data: Transaction[]) {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    const startOfWeek = new Date()
    const dayOfWeek = startOfWeek.getDay()
    const diffToMonday = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    startOfWeek.setDate(diffToMonday)
    const wYear = startOfWeek.getFullYear()
    const wMonth = String(startOfWeek.getMonth() + 1).padStart(2, '0')
    const wDay = String(startOfWeek.getDate()).padStart(2, '0')
    const startOfWeekStr = `${wYear}-${wMonth}-${wDay}`

    let todayInflow = 0
    let weekSales = 0
    let expenses = 0

    data.forEach((t) => {
      const val = Number(t.value)
      if (t.type === 'revenue') {
        if (t.date === todayStr) {
          todayInflow += val
        }
        if (t.date >= startOfWeekStr) {
          weekSales += val
        }
      } else {
        expenses += val
      }
    })

    setTotals({
      todayInflow,
      weekSales,
      expenses
    })
  }

  async function handleSubmit() {
    const val = parseFloat(value)
    if (isNaN(val) || val <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido maior que zero.')
      return
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição para a despesa.')
      return
    }

    setFormLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback preview mode
        const newMock: Transaction = {
          id: String(Date.now()),
          type: 'expense',
          value: val,
          category,
          description,
          date,
          created_at: ''
        }
        const updated = [newMock, ...transactions]
        setTransactions(updated)
        calculateStats(updated)
        setModalOpen(false)
        resetForm()
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada.')

      const { error } = await supabase
        .from('financial_transactions')
        .insert([{
          store_id: profile.store_id,
          type: 'expense',
          value: val,
          category,
          description,
          date
        }])

      if (error) throw error

      setModalOpen(false)
      resetForm()
      loadFinancialData()
      Alert.alert('Sucesso', 'Despesa registrada com sucesso!')
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao registrar despesa.')
    } finally {
      setFormLoading(false)
    }
  }

  function resetForm() {
    setValue('')
    setCategory('supplier')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta despesa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) {
                // Fallback preview mode
                const updated = transactions.filter(t => t.id !== id)
                setTransactions(updated)
                calculateStats(updated)
                return
              }

              const { error } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('id', id)

              if (error) throw error

              loadFinancialData()
            } catch (err: any) {
              Alert.alert('Erro', 'Não foi possível excluir o lançamento.')
            }
          }
        }
      ]
    )
  }

  function getCategoryLabel(cat: string) {
    switch (cat) {
      case 'sale': return 'Venda PDV'
      case 'supplier': return 'Fornecedor'
      case 'rent': return 'Aluguel'
      case 'marketing': return 'Ads / Marketing'
      case 'salary': return 'Pró-labore'
      default: return 'Outros'
    }
  }

  return (
    <View style={styles.container}>
      
      {/* Header Summary */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Financeiro</Text>
          <Text style={styles.subtitle}>Fluxo de caixa em tempo real</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Registrar Saída</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={styles.kpiLabel}>Entrou hoje</Text>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            R$ {totals.todayInflow.toFixed(2)}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <DollarSign size={16} color="#6366F1" />
          <Text style={styles.kpiLabel}>Vendas da semana</Text>
          <Text style={[styles.kpiValue, { color: '#6366F1' }]}>
            R$ {totals.weekSales.toFixed(2)}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <TrendingDown size={16} color="#EF4444" />
          <Text style={styles.kpiLabel}>Saídas/Pagamentos</Text>
          <Text style={[styles.kpiValue, { color: '#EF4444' }]}>
            R$ {totals.expenses.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Ledger List */}
      <View style={styles.ledgerSection}>
        <Text style={styles.sectionTitle}>
          <History size={14} color="#64748B" style={styles.sectionTitleIcon} /> Histórico de Lançamentos
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#E11D48" style={styles.loader} />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <History size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>Sem lançamentos no período.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isRev = item.type === 'revenue'
              return (
                <View style={styles.transactionRow}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowDesc} numberOfLines={1}>{item.description || 'Sem descrição'}</Text>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowCategory}>{getCategoryLabel(item.category)}</Text>
                      <Text style={styles.rowDot}>•</Text>
                      <Text style={styles.rowDate}>{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowValue, { color: isRev ? '#10B981' : '#EF4444' }]}>
                      {isRev ? '+' : '-'} R$ {Number(item.value).toFixed(2)}
                    </Text>
                    {!isRev && (
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                        <Trash2 size={13} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            }}
          />
        )}
      </View>

      {/* Register Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalOpen}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Saída / Despesa</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor (R$) *</Text>
                <TextInput
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoria *</Text>
                <View style={styles.categoryGrid}>
                  {[
                    { id: 'supplier', label: 'Fornecedor' },
                    { id: 'rent', label: 'Aluguel' },
                    { id: 'marketing', label: 'Anúncios' },
                    { id: 'salary', label: 'Pró-labore' },
                    { id: 'other', label: 'Outros' }
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, category === cat.id && styles.categoryOptionActive]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={[styles.categoryOptionText, category === cat.id && styles.categoryOptionTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data *</Text>
                <View style={styles.dateInputWrapper}>
                  <Calendar size={14} color="#94A3B8" style={styles.dateIcon} />
                  <TextInput
                    placeholder="AAAA-MM-DD"
                    value={date}
                    onChangeText={setDate}
                    style={styles.dateInput}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição / Observação *</Text>
                <TextInput
                  placeholder="Ex: Compra de mercadoria BT..."
                  value={description}
                  onChangeText={setDescription}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity 
                style={styles.saveBtn} 
                disabled={formLoading} 
                onPress={handleSubmit}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>LANÇAR DESPESA</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 10,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  ledgerSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    marginRight: 6,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  transactionRow: {
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
  rowInfo: {
    flex: 1,
    marginRight: 8,
  },
  rowDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  rowCategory: {
    fontSize: 9.5,
    color: '#E11D48',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    fontWeight: '700',
    overflow: 'hidden',
  },
  rowDot: {
    fontSize: 9.5,
    color: '#CBD5E1',
  },
  rowDate: {
    fontSize: 10,
    color: '#64748B',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // Modal Style
  modalOverlay: {
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
    maxHeight: '80%',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  formContainer: {
    gap: 12,
    paddingBottom: 20,
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
    backgroundColor: '#FFFFFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  categoryOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  categoryOptionActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  categoryOptionText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryOptionTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  dateIcon: {
    marginRight: 6,
  },
  dateInput: {
    flex: 1,
    height: 38,
    fontSize: 12,
    color: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
})
