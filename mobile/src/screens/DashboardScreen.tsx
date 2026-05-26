import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '../services/supabase'
import { TrendingUp, ShoppingBag, Package, Bell, DollarSign } from 'lucide-react-native'

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true)
  const [todaySales, setTodaySales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [storeName, setStoreName] = useState('Carregando...')

  useEffect(() => {
    loadDashboardMetrics()
  }, [])

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
          setStoreName((profile.stores as any)?.name || 'Minha Loja')
          
          // Fetch low stock count
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .lte('quantity_in_stock', 5)

          setLowStockCount(count || 0)

          // Fetch today's sales
          const startOfToday = new Date()
          startOfToday.setHours(0, 0, 0, 0)

          const { data: sales } = await supabase
            .from('sales')
            .select('total_value')
            .gte('created_at', startOfToday.toISOString())

          if (sales) {
            setTodaySales(sales.length)
            const sum = sales.reduce((acc, curr) => acc + Number(curr.total_value), 0)
            setTotalRevenue(sum)
          }
        }
      } else {
        // Mock fallback values for presentation on new/unauth state
        setStoreName('Mimus Cosméticos')
        setTodaySales(8)
        setTotalRevenue(940.50)
        setLowStockCount(4)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Mimus</Text>
          <Text style={styles.storeName}>{storeName}</Text>
        </View>
        <TouchableOpacity style={styles.bellButton} onPress={loadDashboardMetrics}>
          <Bell size={20} color="#E11D48" />
        </TouchableOpacity>
      </View>

      {/* Overview Card */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <View style={[styles.iconWrapper, { backgroundColor: '#ECFDF5' }]}>
            <DollarSign size={20} color="#059669" />
          </View>
          <Text style={styles.kpiLabel}>Faturamento Hoje</Text>
          <Text style={styles.kpiVal}>R$ {totalRevenue.toFixed(2)}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FFF1F2' }]}>
            <ShoppingBag size={20} color="#E11D48" />
          </View>
          <Text style={styles.kpiLabel}>Vendas Hoje</Text>
          <Text style={styles.kpiVal}>{todaySales} vendas</Text>
        </View>
      </View>

      {/* Alertas */}
      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <Package size={20} color="#D97706" />
          <View style={styles.alertTextWrapper}>
            <Text style={styles.alertTitle}>Alerta de Estoque!</Text>
            <Text style={styles.alertDesc}>Há {lowStockCount} produtos com níveis críticos.</Text>
          </View>
          <TouchableOpacity 
            style={styles.alertAction} 
            onPress={() => navigation.navigate('Estoque')}
          >
            <Text style={styles.alertActionText}>Ver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Quick Actions */}
      <Text style={styles.sectionTitle}>Acesso Rápido</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Vendas')}>
          <ShoppingBag size={24} color="#E11D48" />
          <Text style={styles.gridLabel}>Registrar Venda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Estoque')}>
          <Package size={24} color="#E11D48" />
          <Text style={styles.gridLabel}>Consultar Estoque</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Clientes')}>
          <TrendingUp size={24} color="#E11D48" />
          <Text style={styles.gridLabel}>Novas Clientes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeName: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
  },
  bellButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  alertDesc: {
    fontSize: 11,
    color: '#B45309',
  },
  alertAction: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
  },
})
