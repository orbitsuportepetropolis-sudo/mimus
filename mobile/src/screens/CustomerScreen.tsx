import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, Linking } from 'react-native'
import { supabase } from '../services/supabase'
import { Users, Plus, Search, Phone, Instagram } from 'lucide-react-native'

export default function CustomerScreen() {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list')
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')

  useEffect(() => {
    if (activeTab === 'list') {
      fetchCustomers()
    }
  }, [activeTab])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback mock for demo
        setCustomers([
          { id: '1', name: 'Leticia Costa', phone: '(11) 98888-7777', instagram: '@leticia_costa' },
          { id: '2', name: 'Mariana Silva', phone: '(21) 97777-6666', instagram: '@mari_silva' },
          { id: '3', name: 'Fernanda Souza', phone: null, instagram: '@nandavlog' },
        ])
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', profile.store_id)
          .order('name', { ascending: true })

        if (error) throw error
        setCustomers(data || [])
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!name) {
      Alert.alert('Erro', 'Por favor, insira o nome da cliente.')
      return
    }

    setSubmitLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Sucesso', 'Cliente cadastrada com sucesso! (Modo de Demonstração)')
        setName('')
        setPhone('')
        setInstagram('')
        setActiveTab('list')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()
      
      if (!profile) throw new Error('Loja não encontrada.')

      const { error } = await supabase
        .from('customers')
        .insert([{
          store_id: profile.store_id,
          name,
          phone: phone || null,
          instagram: instagram || null
        }])

      if (error) throw error

      Alert.alert('Sucesso', 'Cliente cadastrada com sucesso!')
      setName('')
      setPhone('')
      setInstagram('')
      setActiveTab('list')
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao cadastrar cliente.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.instagram && c.instagram.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'list' && styles.tabActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>Minhas Clientes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Cadastrar Nova</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? (
        <View style={styles.content}>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por nome, fone ou instagram..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#E11D48" style={styles.loader} />
          ) : filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={36} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nenhuma cliente cadastrada.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.slice(0,2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.contactRow}>
                      {item.phone && (
                        <TouchableOpacity 
                          style={styles.contactBadge}
                          onPress={() => Linking.openURL(`https://wa.me/55${item.phone.replace(/\D/g, '')}`)}
                        >
                          <Phone size={12} color="#475569" />
                          <Text style={styles.badgeLabel}>{item.phone}</Text>
                        </TouchableOpacity>
                      )}
                      {item.instagram && (
                        <View style={styles.contactBadge}>
                          <Instagram size={12} color="#E11D48" />
                          <Text style={[styles.badgeLabel, { color: '#E11D48' }]}>{item.instagram}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                placeholder="Ex: Leticia Silva"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>WhatsApp / Celular</Text>
              <TextInput
                placeholder="Ex: 11999999999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instagram</Text>
              <TextInput
                placeholder="Ex: @leticia_costa"
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <TouchableOpacity 
              style={styles.btn} 
              disabled={submitLoading} 
              onPress={handleRegister}
            >
              {submitLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>SALVAR CLIENTE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
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
  },
  inputGroup: {
    marginBottom: 16,
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
})
