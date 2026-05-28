import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, ActivityIndicator, ScrollView, Alert } from 'react-native'
import { supabase } from '../services/supabase'
import { MessageSquare, Phone, Award, Clock, DollarSign, HelpCircle, Heart } from 'lucide-react-native'

interface FollowUpAction {
  id: string
  name: string
  phone: string | null
  type: 'stale' | 'rebuy' | 'pending_payment' | 'vip' | 'no_reply'
  detail: string
  message: string
  lastDate?: string
}

export default function FollowUpScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'stale' | 'pending_payment' | 'vip'>('all')
  const [actions, setActions] = useState<FollowUpAction[]>([])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFollowUps()
    })
    return unsubscribe
  }, [navigation])

  async function loadFollowUps() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      let customersList: any[] = []
      let salesList: any[] = []

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          // Fetch customers
          const { data: custs } = await supabase
            .from('customers')
            .select('*')
            .eq('store_id', profile.store_id)
          
          customersList = custs || []

          // Fetch sales
          const { data: sales } = await supabase
            .from('sales')
            .select('*, customers(name, phone)')
            .eq('store_id', profile.store_id)
            .order('created_at', { ascending: false })
          
          salesList = sales || []
        }
      } else {
        // Fallback Mock Data for demo mode
        customersList = [
          { id: '1', name: 'Leticia Costa', phone: '11988887777', tags: 'VIP, Pele Seca', status: 'active', created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', name: 'Mariana Silva', phone: '21977776666', tags: 'Batom', status: 'active', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '3', name: 'Fernanda Souza', phone: '11966665555', tags: 'Sombra', status: 'active', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
        ]
        salesList = [
          { id: '101', customer_id: '1', total_value: 120.00, status: 'aguardando pagamento', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '102', customer_id: '2', total_value: 85.50, status: 'novo', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '103', customer_id: '3', total_value: 230.00, status: 'concluído', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
        ]
      }

      // Process and generate action items
      const items: FollowUpAction[] = []
      const now = Date.now()

      // 1. Check for Pending Payments & No-Reply Quotes
      salesList.forEach(sale => {
        const customer = customersList.find(c => c.id === sale.customer_id)
        const custName = customer?.name || 'Cliente Avulso'
        const custPhone = customer?.phone || null

        if (sale.status === 'aguardando pagamento') {
          items.push({
            id: `pay-${sale.id}`,
            name: custName,
            phone: custPhone,
            type: 'pending_payment',
            detail: `Pagamento pendente de R$ ${Number(sale.total_value).toFixed(2)}`,
            message: `Oi ${custName}! 🌸 Tudo bem? Vi que seu pedido de R$ ${Number(sale.total_value).toFixed(2)} ficou aguardando o pagamento. Quer que eu te envie o Pix de novo para liberar o seu pacote?`
          })
        } else if (sale.status === 'novo') {
          items.push({
            id: `reply-${sale.id}`,
            name: custName,
            phone: custPhone,
            type: 'no_reply',
            detail: `Orçamento de R$ ${Number(sale.total_value).toFixed(2)} enviado e sem resposta`,
            message: `Oi ${custName}! 🌸 Passando para saber se você conseguiu ver o orçamento de R$ ${Number(sale.total_value).toFixed(2)} que te enviei. Tem alguma dúvida sobre os produtos?`
          })
        }
      })

      // 2. Check for stale customers (> 45 days since last purchase or creation date)
      customersList.forEach(cust => {
        const custSales = salesList.filter(s => s.customer_id === cust.id)
        let lastPurchaseDate = cust.created_at

        if (custSales.length > 0) {
          lastPurchaseDate = custSales[0].created_at // list is ordered by created_at desc
        }

        const daysDiff = Math.floor((now - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff > 45) {
          items.push({
            id: `stale-${cust.id}`,
            name: cust.name,
            phone: cust.phone,
            type: 'stale',
            detail: `Sumida há ${daysDiff} dias (Último contato em ${new Date(lastPurchaseDate).toLocaleDateString('pt-BR')})`,
            message: `Oi ${cust.name}! 🌸 Tudo bem? Faz um tempinho que você não repõe suas maquiagens preferidas. Chegaram novidades incríveis por aqui! Quer dar uma olhadinha no catálogo?`
          })
        }

        // 3. Check for VIP clients
        const tags = cust.tags || ''
        if (tags.toUpperCase().includes('VIP') || cust.status === 'vip') {
          items.push({
            id: `vip-${cust.id}`,
            name: cust.name,
            phone: cust.phone,
            type: 'vip',
            detail: `Cliente VIP ★ (Tags: ${tags || 'VIP'})`,
            message: `Oi ${cust.name}! 👑 Você é uma cliente muito especial por aqui. Preparei um mimo e desconto exclusivo de presente para sua próxima compra! Vamos agendar?`
          })
        }
      })

      setActions(items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleSendWhatsApp(item: FollowUpAction) {
    if (!item.phone) {
      Alert.alert('Ops', 'Esta cliente não possui número de telefone cadastrado.')
      return
    }
    const cleanPhone = item.phone.replace(/\D/g, '')
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(item.message)}`
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.')
    })
  }

  const filteredActions = actions.filter(act => {
    if (activeFilter === 'all') return true
    return act.type === activeFilter
  })

  return (
    <View style={styles.container}>
      {/* Filters Header */}
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        {[
          { id: 'all', label: 'Tudo' },
          { id: 'stale', label: 'Sumidas (>45 dias)' },
          { id: 'pending_payment', label: 'Aguardando Pix' },
          { id: 'vip', label: 'Clientes VIP' }
        ].map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterBtn, activeFilter === filter.id && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter.id as any)}
          >
            <Text style={[styles.filterBtnText, activeFilter === filter.id && styles.filterBtnTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E11D48" />
        </View>
      ) : filteredActions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={44} color="#FDA4AF" />
          <Text style={styles.emptyTitle}>Tudo em ordem! 💕</Text>
          <Text style={styles.emptyText}>Nenhuma ação de follow-up necessária para este filtro.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredActions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isStale = item.type === 'stale'
            const isPay = item.type === 'pending_payment'
            const isVip = item.type === 'vip'

            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={[
                    styles.iconWrapper,
                    isStale ? styles.iconStale : isPay ? styles.iconPay : isVip ? styles.iconVip : styles.iconDefault
                  ]}>
                    {isStale ? <Clock size={16} color="#64748B" /> :
                     isPay ? <DollarSign size={16} color="#059669" /> :
                     isVip ? <Award size={16} color="#D97706" /> :
                     <MessageSquare size={16} color="#E11D48" />}
                  </View>
                  <View style={styles.infoWrapper}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <Text style={styles.detailText}>{item.detail}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.waButton} onPress={() => handleSendWhatsApp(item)}>
                  <MessageSquare size={16} color="#FFFFFF" />
                  <Text style={styles.waButtonText}>Enviar Whats</Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    maxHeight: 46,
    marginBottom: 16,
  },
  filterBarContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  filterBtnActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E11D48',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: 10,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconStale: {
    backgroundColor: '#F1F5F9',
  },
  iconPay: {
    backgroundColor: '#ECFDF5',
  },
  iconVip: {
    backgroundColor: '#FEF3C7',
  },
  iconDefault: {
    backgroundColor: '#FFF1F2',
  },
  infoWrapper: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 9.5,
    color: '#64748B',
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#128C7E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  waButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
})
