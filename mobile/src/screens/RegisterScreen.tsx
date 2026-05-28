import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native'
import { supabase } from '../services/supabase'

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!name || !storeName || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            store_name: storeName,
            role: 'admin'
          }
        }
      })

      if (error) throw error

      Alert.alert(
        'Cadastro Realizado!',
        'Sua loja foi criada com sucesso! Redirecionando para a tela de login...',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      )
    } catch (err: any) {
      Alert.alert('Erro ao cadastrar', err.message || 'Houve uma falha ao realizar o cadastro.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleRegister() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'mimus://auth-callback',
        }
      })
      if (error) throw error
      if (data?.url) {
        Linking.openURL(data.url)
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível iniciar o cadastro com o Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Mimus<Text style={styles.dot}>.</Text></Text>
      <Text style={styles.subtitle}>Crie sua conta para começar a gerenciar</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Nova Loja de Cosméticos</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seu Nome</Text>
          <TextInput
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Loja</Text>
          <TextInput
            placeholder="Ex: Bella Makeup"
            value={storeName}
            onChangeText={setStoreName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={email => setEmail(email.trim())}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            placeholder="Minimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.btn} disabled={loading} onPress={handleRegister}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>CRIAR CONTA GRÁTIS</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou continue com</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} disabled={loading} onPress={handleGoogleRegister}>
          <Text style={styles.googleBtnText}>Cadastrar com o Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
          <Text style={styles.switchText}>Já tem uma conta? <Text style={styles.switchHighlight}>Fazer Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 48,
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
    marginBottom: 24,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
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
    height: 42,
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
    marginTop: 18,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    color: '#94A3B8',
    paddingHorizontal: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  googleBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
})
