import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native'
import { supabase } from '../services/supabase'
import { User, Landmark, Star, LogOut, Save } from 'lucide-react-native'

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  
  // Data States
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [storeId, setStoreId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [planStatus, setPlanStatus] = useState('trial')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Mock fallback for preview mode
        setUserName('Lojista Demo')
        setUserEmail('demo@mimus.com')
        setStoreName('Mimus Cosméticos')
        setCompanyName('Mimus Cosméticos LTDA')
        setCnpj('12.345.678/0001-90')
        setPlan('free')
        setPlanStatus('trial')
        return
      }

      setUserEmail(user.email || '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, store_id, stores(name, company_name, cnpj, plan, plan_status)')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (profile) {
        setUserName(profile.name || '')
        setStoreId(profile.store_id)
        
        const store = (profile.stores as any)
        if (store) {
          setStoreName(store.name || '')
          setCompanyName(store.company_name || '')
          setCnpj(store.cnpj || '')
          setPlan(store.plan || 'free')
          setPlanStatus(store.plan_status || 'trial')
        }
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!userName.trim() || !storeName.trim()) {
      Alert.alert('Erro', 'Seu nome e o nome da loja são campos obrigatórios.')
      return
    }

    setSaveLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Sucesso', 'Configurações salvas! (Modo de Demonstração)')
        return
      }

      // Update Profile Name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: userName })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update Store details
      if (storeId) {
        const { error: storeError } = await supabase
          .from('stores')
          .update({
            name: storeName,
            company_name: companyName || null,
            cnpj: cnpj || null
          })
          .eq('id', storeId)

        if (storeError) throw storeError
      }

      Alert.alert('Sucesso', 'Configurações salvas com sucesso!')
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message || 'Houve uma falha ao salvar as alterações.')
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Sair do App',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
          }
        }
      ]
    )
  }

  const handleUpgrade = () => {
    Linking.openURL('https://mimus.vercel.app/dashboard/billing').catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o link de upgrade no navegador.')
    })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      
      {/* Account Settings Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <User size={18} color="#E11D48" />
          <Text style={styles.sectionTitle}>Dados de Perfil & Loja</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seu Nome *</Text>
          <TextInput
            placeholder="Nome Completo"
            value={userName}
            onChangeText={setUserName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Loja *</Text>
          <TextInput
            placeholder="Ex: Mimus Cosméticos"
            value={storeName}
            onChangeText={setStoreName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail da Conta (Não editável)</Text>
          <TextInput
            value={userEmail}
            style={[styles.input, styles.inputDisabled]}
            editable={false}
          />
        </View>
      </View>

      {/* Company/Corporate Settings Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Landmark size={18} color="#E11D48" />
          <Text style={styles.sectionTitle}>Dados da Empresa</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Razão Social / Nome da Empresa</Text>
          <TextInput
            placeholder="Ex: Loja de Cosméticos LTDA"
            value={companyName}
            onChangeText={setCompanyName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CNPJ</Text>
          <TextInput
            placeholder="Ex: 00.000.000/0001-00"
            value={cnpj}
            onChangeText={setCnpj}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      {/* Billing & Subscription Section */}
      <View style={[styles.sectionCard, styles.planCard]}>
        <View style={styles.sectionHeader}>
          <Star size={18} color="#D97706" />
          <Text style={styles.sectionTitle}>Gestão de Plano</Text>
        </View>

        <View style={styles.planStatusRow}>
          <Text style={styles.planStatusLabel}>Status do Plano:</Text>
          <View style={[styles.planBadge, plan === 'pro' ? styles.badgePro : styles.badgeFree]}>
            <Text style={[styles.planBadgeText, plan === 'pro' ? styles.badgeTextPro : styles.badgeTextFree]}>
              {plan === 'pro' ? 'MIMUS PRO ★' : 'GRATUITO'}
            </Text>
          </View>
        </View>

        {plan !== 'pro' && (
          <View style={styles.upgradeInfoBox}>
            <Text style={styles.upgradeInfoTitle}>Deseja destravar todas as funcionalidades? 🚀</Text>
            <Text style={styles.upgradeInfoDesc}>
              No plano Pro você tem produtos ilimitados, catálogo web customizado com frete grátis, etiquetas de desconto e controle completo de vendas no celular.
            </Text>
          </View>
        )}

        {/* Upgrade Always Button */}
        <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
          <Star size={14} color="#FFFFFF" style={styles.upgradeBtnIcon} />
          <Text style={styles.upgradeBtnText}>
            {plan === 'pro' ? 'GERENCIAR ASSINATURA' : 'ASSINAR MIMUS PRO (R$ 29,90)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsBox}>
        <TouchableOpacity style={styles.saveBtn} disabled={saveLoading} onPress={handleSave}>
          {saveLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={16} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.saveBtnText}>SALVAR CONFIGURAÇÕES</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color="#EF4444" style={styles.btnIcon} />
          <Text style={styles.logoutBtnText}>SAIR DO APLICATIVO</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: 18,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  planCard: {
    borderColor: '#FEF3C7',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 9.5,
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
    fontSize: 12,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#94A3B8',
  },
  planStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  planStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeFree: {
    backgroundColor: '#F1F5F9',
  },
  badgePro: {
    backgroundColor: '#FEF3C7',
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextFree: {
    color: '#64748B',
  },
  badgeTextPro: {
    color: '#D97706',
  },
  upgradeInfoBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  upgradeInfoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  upgradeInfoDesc: {
    fontSize: 9.5,
    color: '#D97706',
    lineHeight: 13,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  upgradeBtnIcon: {
    marginRight: 2,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  actionsBox: {
    gap: 12,
    marginTop: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingVertical: 13,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 13,
    gap: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 11,
  },
  btnIcon: {
    marginRight: 2,
  },
})
