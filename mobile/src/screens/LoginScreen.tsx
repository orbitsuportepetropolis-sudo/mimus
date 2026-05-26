import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { supabase } from '../services/supabase'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (err: any) {
      Alert.alert('Erro de Acesso', err.message || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Mimus<Text style={styles.dot}>.</Text></Text>
      <Text style={styles.subtitle}>Gerencie sua loja de maquiagem do celular</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Acessar Conta</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.btn} disabled={loading} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>ENTRAR NO PAINEL</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchLink}>
          <Text style={styles.switchText}>Não tem uma conta? <Text style={styles.switchHighlight}>Cadastre-se grátis</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  dot: {
    color: '#E11D48',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
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
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#1E293B',
  },
  btn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  switchLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 11,
    color: '#64748B',
  },
  switchHighlight: {
    color: '#E11D48',
    fontWeight: '700',
  },
})
