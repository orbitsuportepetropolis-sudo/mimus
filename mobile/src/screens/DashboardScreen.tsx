import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert, Clipboard, Modal } from 'react-native'
import { supabase } from '../services/supabase'
import { LayoutDashboard, ShoppingBag, Users, MessageSquare, Award, Share2, Copy, Play, Settings, Sparkles } from 'lucide-react-native'
import AIChatModal from './AIChatModal'

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState('Mimus Cosméticos')
  const [storeId, setStoreId] = useState('')
  const [chatVisible, setChatVisible] = useState(false)
  
  // Dashboard Action States
  const [clientsToReply, setClientsToReply] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [pendingPaymentsValue, setPendingPaymentsValue] = useState(0)
  const [rebuysCount, setRebuysCount] = useState(0)
  
  // Goal Progress
  const [weeklySales, setWeeklySales] = useState(380.00)
  const weeklyGoal = 1000.00

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardMetrics()
    })
    return unsubscribe
  }, [navigation])

  async function loadDashboardMetrics() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id, stores(name)')
          .eq('id', user.id)
          .single()

        if (profile) {
          const store = (profile.stores as any)
          setStoreName(store?.name || 'Minha Loja')
          setStoreId(profile.store_id)
          
          // Fetch Customers
          const { data: customers } = await supabase
            .from('customers')
            .select('*')
            .eq('store_id', profile.store_id)
          
          const customersList = customers || []

          // Fetch Sales
          const { data: sales } = await supabase
            .from('sales')
            .select('*')
            .eq('store_id', profile.store_id)
          
          const salesList = sales || []

          // 1. Calculate pending/no-reply items
          const replyCount = salesList.filter(s => s.status === 'novo').length
          const pendOrders = salesList.filter(s => s.status === 'novo' || s.status === 'aguardando pagamento').length
          const pendPay = salesList
            .filter(s => s.status === 'aguardando pagamento')
            .reduce((sum, curr) => sum + Number(curr.total_value), 0)

          setClientsToReply(replyCount)
          setPendingOrders(pendOrders)
          setPendingPaymentsValue(pendPay)

          // 2. Calculate weekly sales (past 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const weekSalesVal = salesList
            .filter(s => new Date(s.created_at) >= sevenDaysAgo && (s.status === 'pago' || s.status === 'concluído' || s.status === 'enviado'))
            .reduce((sum, curr) => sum + Number(curr.total_value), 0)
          
          setWeeklySales(weekSalesVal)

          // 3. Calculate rebuys (no purchases in last 45 days)
          const now = Date.now()
          let staleCount = 0
          customersList.forEach(cust => {
            const custSales = salesList
              .filter(s => s.customer_id === cust.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            
            let lastDate = cust.created_at
            if (custSales.length > 0) {
              lastDate = custSales[0].created_at
            }
            const diff = (now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
            if (diff > 45) {
              staleCount++
            }
          })
          setRebuysCount(staleCount)
        }
      } else {
        // Fallback Mock values for demo mode
        setStoreId('demo-store-id')
        setClientsToReply(3)
        setPendingOrders(4)
        setPendingPaymentsValue(320.00)
        setRebuysCount(2)
        setWeeklySales(450.00)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleShareCatalog = async () => {
    const catalogUrl = `https://mimus.vercel.app/store/${storeId}`
    try {
      await Share.share({
        message: `🌸 Olá! Veja nosso catálogo de maquiagens completo e faça seu pedido direto pelo WhatsApp: ${catalogUrl}`,
      })
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    }
  }

  const handleCopyLink = () => {
    const catalogUrl = `https://mimus.vercel.app/store/${storeId}`
    Clipboard.setString(catalogUrl)
    Alert.alert('Copiado', 'Link do catálogo copiado para a área de transferência! 💕')
  }

  const goalPercentage = Math.min(100, (weeklySales / weeklyGoal) * 100)

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8FA' }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Empreendedora! 🌸</Text>
          <Text style={styles.storeName}>{storeName}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ASSISTENTE</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Configuracoes')}>
            <Settings size={20} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Priorities Banner */}
      <View style={styles.priorityBox}>
        <Text style={styles.priorityTitle}>O que precisamos fazer agora? 👇</Text>

        <View style={styles.prioritiesList}>
          {clientsToReply > 0 && (
            <TouchableOpacity style={styles.priorityItem} onPress={() => navigation.navigate('FollowUp')}>
              <View style={[styles.priorityIconWrapper, { backgroundColor: '#FFF1F2' }]}>
                <MessageSquare size={16} color="#E11D48" />
              </View>
              <Text style={styles.priorityText}>
                Responder <Text style={styles.highlight}>{clientsToReply} clientes</Text> com orçamentos pendentes.
              </Text>
            </TouchableOpacity>
          )}

          {pendingOrders > 0 && (
            <TouchableOpacity style={styles.priorityItem} onPress={() => navigation.navigate('Pedidos')}>
              <View style={[styles.priorityIconWrapper, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingBag size={16} color="#3B82F6" />
              </View>
              <Text style={styles.priorityText}>
                Acompanhar <Text style={styles.highlight}>{pendingOrders} pedidos</Text> em andamento.
              </Text>
            </TouchableOpacity>
          )}

          {pendingPaymentsValue > 0 && (
            <TouchableOpacity style={styles.priorityItem} onPress={() => navigation.navigate('FollowUp')}>
              <View style={[styles.priorityIconWrapper, { backgroundColor: '#ECFDF5' }]}>
                <Award size={16} color="#059669" />
              </View>
              <Text style={styles.priorityText}>
                Cobrar <Text style={styles.highlight}>R$ {pendingPaymentsValue.toFixed(2)}</Text> de Pix pendentes.
              </Text>
            </TouchableOpacity>
          )}

          {rebuysCount > 0 && (
            <TouchableOpacity style={styles.priorityItem} onPress={() => navigation.navigate('FollowUp')}>
              <View style={[styles.priorityIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                <Users size={16} color="#D97706" />
              </View>
              <Text style={styles.priorityText}>
                {rebuysCount} clientes sumidas prontas para recompra!
              </Text>
            </TouchableOpacity>
          )}

          {clientsToReply === 0 && pendingOrders === 0 && pendingPaymentsValue === 0 && rebuysCount === 0 && (
            <View style={styles.emptyPriorities}>
              <Text style={styles.emptyPrioritiesText}>Tudo em ordem por hoje! Nenhuma tarefa crítica pendente. 💖</Text>
            </View>
          )}
        </View>
      </View>

      {/* Gamified Goal Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Meta de Vendas da Semana</Text>
          <Text style={styles.goalStatus}>
            R$ {weeklySales.toFixed(2)} <Text style={{ color: '#94A3B8', fontWeight: '400' }}>/ R$ {weeklyGoal.toFixed(0)}</Text>
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${goalPercentage}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{goalPercentage.toFixed(0)}% completo</Text>
        </View>

        <Text style={styles.goalMessage}>
          {goalPercentage >= 100 
            ? 'Incrível! Você bateu a sua meta! Meta alcançada! 🏆🚀' 
            : `Faltam R$ ${(weeklyGoal - weeklySales).toFixed(2)} para completar o seu objetivo! Vamos vender! 💪`
          }
        </Text>
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Pedidos')}>
          <View style={[styles.gridIcon, { backgroundColor: '#FFF1F2' }]}>
            <ShoppingBag size={20} color="#E11D48" />
          </View>
          <Text style={styles.gridLabel}>Novo Pedido</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Clientes')}>
          <View style={[styles.gridIcon, { backgroundColor: '#FFF1F2' }]}>
            <Users size={20} color="#E11D48" />
          </View>
          <Text style={styles.gridLabel}>Ver Clientes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Estoque')}>
          <View style={[styles.gridIcon, { backgroundColor: '#FFF1F2' }]}>
            <Award size={20} color="#E11D48" />
          </View>
          <Text style={styles.gridLabel}>Meus Produtos</Text>
        </TouchableOpacity>
      </View>

      {/* Loja Integrada (Catalog Link) */}
      <View style={styles.catalogCard}>
        <Text style={styles.catalogTitle}>Seu Catálogo Online 🌐</Text>
        <Text style={styles.catalogDesc}>Compartilhe esse link no Instagram e WhatsApp para suas clientes comprarem diretamente.</Text>
        
        <View style={styles.urlBox}>
          <Text style={styles.urlText} numberOfLines={1}>mimus.app/store/{storeId || '...'}</Text>
        </View>

        <View style={styles.catalogActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopyLink}>
            <Copy size={16} color="#E11D48" />
            <Text style={styles.actionBtnText}>Copiar Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShareCatalog}>
            <Share2 size={16} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Enviar Whats</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 32 }} />
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity 
        style={styles.floatingChatBtn} 
        onPress={() => setChatVisible(true)}
      >
        <Sparkles size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Mimus AI Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <AIChatModal
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          storeId={storeId}
          onRefresh={loadDashboardMetrics}
        />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA', // soft feminine pink background
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  priorityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: 20,
  },
  priorityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  prioritiesList: {
    gap: 10,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  priorityIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  priorityText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  highlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyPriorities: {
    padding: 12,
    alignItems: 'center',
  },
  emptyPrioritiesText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  goalStatus: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  goalMessage: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  gridIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  catalogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  catalogTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  catalogDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 12,
  },
  urlBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  urlText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  catalogActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  shareBtn: {
    backgroundColor: '#E11D48',
  },
  floatingChatBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
})
