import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, Linking, Modal, ScrollView } from 'react-native'
import { supabase } from '../services/supabase'
import { Users, Plus, Search, Phone, Instagram, Calendar, Tag, FileText, CheckCircle, ChevronRight, MessageSquare, Star } from 'lucide-react-native'

export default function CustomerScreen() {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list')
  const [customers, setCustomers] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Details Modal State
  const [selectedCust, setSelectedCust] = useState<any>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form State (New / Edit Client)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [birthday, setBirthday] = useState('')
  const [custTags, setCustTags] = useState('')
  const [custStatus, setCustStatus] = useState('active')
  const [custNotes, setCustNotes] = useState('')

  useEffect(() => {
    fetchCustomersAndSales()
  }, [activeTab])

  async function fetchCustomersAndSales() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback mock for demo mode
        const mockCusts = [
          { id: '1', name: 'Leticia Costa', phone: '11988887777', instagram: '@leticia_costa', tags: 'VIP, Pele Seca, Rímel', status: 'vip', notes: 'Prefere base com acabamento satin. Gosta de tons nudes.', birthday: '1995-10-12', created_at: new Date().toISOString() },
          { id: '2', name: 'Mariana Silva', phone: '21977776666', instagram: '@mari_silva', tags: 'Batom BT, Blush', status: 'active', notes: 'Gosta do corretivo pêssego.', birthday: '1998-05-15', created_at: new Date().toISOString() },
          { id: '3', name: 'Fernanda Souza', phone: '11966665555', instagram: null, tags: 'Lead, Sombra', status: 'lead', notes: 'Interessada no lançamento da paleta.', birthday: null, created_at: new Date().toISOString() },
        ]
        const mockSales = [
          { id: '101', customer_id: '1', total_value: 120.00, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '102', customer_id: '1', total_value: 95.00, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '103', customer_id: '2', total_value: 45.00, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        ]
        setCustomers(mockCusts)
        setSales(mockSales)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        const { data: custs, error: custsErr } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', profile.store_id)
          .order('name', { ascending: true })

        if (custsErr) throw custsErr

        const { data: sls, error: slsErr } = await supabase
          .from('sales')
          .select('id, customer_id, total_value, created_at')
          .eq('store_id', profile.store_id)
          .order('created_at', { ascending: false })

        if (slsErr) throw slsErr

        setCustomers(custs || [])
        setSales(sls || [])
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
      const payload = {
        name,
        phone: phone || null,
        instagram: instagram || null,
        birthday: birthday || null,
        tags: custTags || null,
        status: custStatus,
        notes: custNotes || null
      }

      if (!user) {
        Alert.alert('Sucesso', 'Cliente cadastrada com sucesso! (Modo de Demonstração)')
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

      if (isEditing && selectedCust) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', selectedCust.id)

        if (error) throw error
        Alert.alert('Sucesso', 'Cliente atualizada com sucesso!')
        setDetailsVisible(false)
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{
            store_id: profile.store_id,
            ...payload
          }])

        if (error) throw error
        Alert.alert('Sucesso', 'Cliente cadastrada com sucesso!')
      }

      resetForm()
      setActiveTab('list')
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao salvar cliente.')
    } finally {
      setSubmitLoading(false)
    }
  }

  function resetForm() {
    setName('')
    setPhone('')
    setInstagram('')
    setBirthday('')
    setCustTags('')
    setCustStatus('active')
    setCustNotes('')
    setIsEditing(false)
  }

  function handleOpenDetails(cust: any) {
    const custSales = sales.filter(s => s.customer_id === cust.id)
    setSelectedCust({ ...cust, sales: custSales })
    
    // Set form fields in case they want to edit
    setName(cust.name)
    setPhone(cust.phone || '')
    setInstagram(cust.instagram || '')
    setBirthday(cust.birthday || '')
    setCustTags(cust.tags || '')
    setCustStatus(cust.status || 'active')
    setCustNotes(cust.notes || '')
    
    setIsEditing(false)
    setDetailsVisible(true)
  }

  function handleOpenEdit() {
    setIsEditing(true)
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'vip': return 'VIP ★'
      case 'active': return 'Ativa'
      case 'lead': return 'Lead'
      case 'inactive': return 'Inativa'
      default: return 'Geral'
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'vip': return { bg: '#FEF3C7', text: '#D97706' }
      case 'active': return { bg: '#ECFDF5', text: '#059669' }
      case 'lead': return { bg: '#EFF6FF', text: '#3B82F6' }
      case 'inactive': return { bg: '#F1F5F9', text: '#64748B' }
      default: return { bg: '#FFF1F2', text: '#E11D48' }
    }
  }

  const filteredCustomers = customers.map(cust => {
    const custSales = sales.filter(s => s.customer_id === cust.id)
    const lastPurchase = custSales.length > 0 ? custSales[0].created_at : null
    return {
      ...cust,
      purchaseCount: custSales.length,
      lastPurchaseDate: lastPurchase
    }
  }).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.tags && c.tags.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
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
          onPress={() => {
            resetForm()
            setActiveTab('new')
          }}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Nova Cliente</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? (
        <View style={styles.content}>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por nome, tag, whatsapp..."
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
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const statusTheme = getStatusStyle(item.status)
                return (
                  <TouchableOpacity style={styles.card} onPress={() => handleOpenDetails(item)}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.name.slice(0,2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.name}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
                            {getStatusLabel(item.status)}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Tags */}
                      {item.tags && (
                        <View style={styles.tagsContainer}>
                          {item.tags.split(',').map((tag: string, index: number) => (
                            <View key={index} style={styles.tagBadge}>
                              <Text style={styles.tagBadgeText}>{tag.trim()}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.cardFooterRow}>
                        <Text style={styles.footerText}>
                          {item.purchaseCount} {item.purchaseCount === 1 ? 'compra' : 'compras'}
                        </Text>
                        {item.lastPurchaseDate && (
                          <Text style={styles.footerText}>
                            Última: {new Date(item.lastPurchaseDate).toLocaleDateString('pt-BR')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
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

            <View style={styles.grid2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput
                  placeholder="@perfil"
                  value={instagram}
                  onChangeText={setInstagram}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Aniversário</Text>
                <TextInput
                  placeholder="AAAA-MM-DD"
                  value={birthday}
                  onChangeText={setBirthday}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (Separadas por vírgula)</Text>
              <TextInput
                placeholder="Ex: VIP, Pele Oleosa, Batom Nude"
                value={custTags}
                onChangeText={setCustTags}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status da Cliente</Text>
              <View style={styles.statusRow}>
                {[
                  { id: 'active', label: 'Ativa' },
                  { id: 'vip', label: 'VIP ★' },
                  { id: 'lead', label: 'Lead' },
                  { id: 'inactive', label: 'Inativa' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.statusBtn, custStatus === item.id && styles.statusBtnActive]}
                    onPress={() => setCustStatus(item.id)}
                  >
                    <Text style={[styles.statusBtnText, custStatus === item.id && styles.statusBtnTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observações / Preferências</Text>
              <TextInput
                placeholder="Ex: Prefere pó solto translúcido. Tem alergia a fragrância..."
                value={custNotes}
                onChangeText={setCustNotes}
                multiline={true}
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
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
        </ScrollView>
      )}

      {/* Customer Details Sheet Modal */}
      {selectedCust && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailsVisible}
          onRequestClose={() => setDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{name}</Text>
                  <Text style={styles.modalSubtitle}>Perfil e Histórico de Relacionamento</Text>
                </View>
                <TouchableOpacity onPress={() => setDetailsVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsFormScroll}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome Completo *</Text>
                    <TextInput value={name} onChangeText={setName} style={styles.input} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>WhatsApp</Text>
                    <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
                  </View>
                  <View style={styles.grid2}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Instagram</Text>
                      <TextInput value={instagram} onChangeText={setInstagram} autoCapitalize="none" style={styles.input} />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Aniversário</Text>
                      <TextInput value={birthday} onChangeText={setBirthday} style={styles.input} />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tags</Text>
                    <TextInput value={custTags} onChangeText={setCustTags} style={styles.input} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Status da Cliente</Text>
                    <View style={styles.statusRow}>
                      {[
                        { id: 'active', label: 'Ativa' },
                        { id: 'vip', label: 'VIP' },
                        { id: 'lead', label: 'Lead' },
                        { id: 'inactive', label: 'Inativa' }
                      ].map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.statusBtn, custStatus === item.id && styles.statusBtnActive]}
                          onPress={() => setCustStatus(item.id)}
                        >
                          <Text style={[styles.statusBtnText, custStatus === item.id && styles.statusBtnTextActive]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observações</Text>
                    <TextInput value={custNotes} onChangeText={setCustNotes} multiline={true} style={[styles.input, styles.textArea]} />
                  </View>
                  
                  <View style={styles.editActionsRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                      <Text style={styles.cancelBtnText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveEditBtn} disabled={submitLoading} onPress={handleRegister}>
                      {submitLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveEditBtnText}>SALVAR</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
                  
                  {/* Quick WhatsApp Action Button */}
                  {phone && (
                    <TouchableOpacity 
                      style={styles.quickWhatsAppBtn}
                      onPress={() => Linking.openURL(`https://wa.me/55${phone.replace(/\D/g, '')}`)}
                    >
                      <MessageSquare size={16} color="#FFFFFF" />
                      <Text style={styles.quickWhatsAppText}>Chamar no WhatsApp</Text>
                    </TouchableOpacity>
                  )}

                  {/* Customer Stats Cards */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statVal}>R$ {selectedCust.sales.reduce((sum: number, curr: any) => sum + Number(curr.total_value), 0).toFixed(2)}</Text>
                      <Text style={styles.statLabel}>Total Gasto</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statVal}>{selectedCust.sales.length}</Text>
                      <Text style={styles.statLabel}>Vendas Realizadas</Text>
                    </View>
                  </View>

                  {/* Follow Up Suggestion Alert */}
                  <View style={styles.followUpAlert}>
                    <Star size={16} color="#E11D48" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>Sugestão de Ação</Text>
                      <Text style={styles.alertDesc}>
                        {selectedCust.status === 'vip' 
                          ? 'Ofereça um cupom exclusivo para manter esta cliente VIP engajada.'
                          : selectedCust.sales.length === 0 
                          ? 'Envie o link do seu catálogo para apresentar suas maquiagens.'
                          : 'Sugerir reposição dos itens da última compra.'
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Customer Info Sections */}
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Detalhes do Cadastro</Text>
                    <View style={styles.infoRow}>
                      <Tag size={13} color="#94A3B8" />
                      <Text style={styles.infoText}>Status: <Text style={{fontWeight: '700'}}>{getStatusLabel(custStatus)}</Text></Text>
                    </View>
                    {instagram && (
                      <View style={styles.infoRow}>
                        <Instagram size={13} color="#94A3B8" />
                        <Text style={styles.infoText}>Instagram: {instagram}</Text>
                      </View>
                    )}
                    {birthday && (
                      <View style={styles.infoRow}>
                        <Calendar size={13} color="#94A3B8" />
                        <Text style={styles.infoText}>Aniversário: {new Date(birthday + 'T12:00:00').toLocaleDateString('pt-BR')}</Text>
                      </View>
                    )}
                    {custTags && (
                      <View style={styles.infoRow}>
                        <Tag size={13} color="#94A3B8" />
                        <Text style={styles.infoText}>Tags: {custTags}</Text>
                      </View>
                    )}
                  </View>

                  {/* Notes / Obs */}
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Observações e Preferências</Text>
                    <View style={styles.notesBox}>
                      <FileText size={14} color="#64748B" style={{marginRight: 6}} />
                      <Text style={styles.notesText}>{custNotes || 'Nenhuma observação registrada.'}</Text>
                    </View>
                  </View>

                  {/* History of Sales */}
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Histórico de Pedidos</Text>
                    {selectedCust.sales.length === 0 ? (
                      <Text style={styles.emptyHistoryText}>Nenhuma compra realizada ainda.</Text>
                    ) : (
                      selectedCust.sales.map((sale: any) => (
                        <View key={sale.id} style={styles.historyRow}>
                          <View>
                            <Text style={styles.historyDate}>
                              {new Date(sale.created_at).toLocaleDateString('pt-BR')} às {new Date(sale.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </Text>
                            <Text style={styles.historyId}>Pedido: #{sale.id.slice(0,6).toUpperCase()}</Text>
                          </View>
                          <Text style={styles.historyVal}>R$ {Number(sale.total_value).toFixed(2)}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Action buttons */}
                  <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
                    <Text style={styles.editBtnText}>EDITAR CLIENTE</Text>
                  </TouchableOpacity>

                  <View style={{ height: 24 }} />
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
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E6',
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
    fontSize: 12,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tagBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  footerText: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  grid2: {
    flexDirection: 'row',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statusBtnActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  statusBtnText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#E11D48',
    fontWeight: '800',
  },
  textArea: {
    height: 70,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
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
    maxHeight: '90%',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  detailsScroll: {
    gap: 16,
  },
  detailsFormScroll: {
    gap: 12,
    paddingBottom: 24,
  },
  quickWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#128C7E',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
  },
  quickWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  followUpAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  alertDesc: {
    fontSize: 10,
    color: '#E11D48',
    marginTop: 2,
    lineHeight: 14,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 14,
  },
  emptyHistoryText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  historyDate: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  historyId: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: '#E11D48',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  editBtnText: {
    color: '#E11D48',
    fontWeight: '800',
    fontSize: 11,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  saveEditBtn: {
    flex: 2,
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveEditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
})
