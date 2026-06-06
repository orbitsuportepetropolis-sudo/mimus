import React, { useState, useEffect } from 'react'
import { Linking } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { LayoutDashboard, Package, ShoppingBag, Users, DollarSign, MessageSquare } from 'lucide-react-native'
import { supabase } from './src/services/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import OnboardingScreen from './src/screens/OnboardingScreen'
import { requestNotificationPermissions, scheduleDailyReminder, cancelDailyReminder } from './src/services/notifications'

// Import Screens
import DashboardScreen from './src/screens/DashboardScreen'
import StockScreen from './src/screens/StockScreen'
import SalesScreen from './src/screens/SalesScreen'
import CustomerScreen from './src/screens/CustomerScreen'
import FinanceScreen from './src/screens/FinanceScreen'
import FollowUpScreen from './src/screens/FollowUpScreen'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import SettingsScreen from './src/screens/SettingsScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <LayoutDashboard size={size} color={color} />
          } else if (route.name === 'Pedidos') {
            return <ShoppingBag size={size} color={color} />
          } else if (route.name === 'Clientes') {
            return <Users size={size} color={color} />
          } else if (route.name === 'FollowUp') {
            return <MessageSquare size={size} color={color} />
          } else {
            return <DollarSign size={size} color={color} />
          }
        },
        tabBarActiveTintColor: '#E11D48',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 15,
          color: '#0F172A',
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Clientes" component={CustomerScreen} options={{ title: 'Clientes' }} />
      <Tab.Screen name="Pedidos" component={SalesScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="FollowUp" component={FollowUpScreen} options={{ title: 'Follow-up' }} />
      <Tab.Screen name="Financeiro" component={FinanceScreen} options={{ title: 'Financeiro' }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false)

  async function checkOnboarding(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', userId)
        .single()
        
      if (profile?.store_id) {
        // 1. Check local storage
        const completed = await AsyncStorage.getItem(`mimus_onboarding_completed_${profile.store_id}`)
        if (completed) {
          setIsOnboardingRequired(false)
          setLoading(false)
          return
        }

        // 2. Check if store already has products in database (meaning they completed onboarding steps)
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', profile.store_id)
          .eq('active', true)

        if (productCount && productCount > 0) {
          // Set flag in local storage for future fast checks
          await AsyncStorage.setItem(`mimus_onboarding_completed_${profile.store_id}`, 'true')
          setIsOnboardingRequired(false)
          setLoading(false)
          return
        }

        setIsOnboardingRequired(true)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Erro ao verificar onboarding:', err)
    }
    setIsOnboardingRequired(false)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        if (session) {
          checkOnboarding(session.user.id)
          // Request notification permissions and schedule daily reminder on login
          requestNotificationPermissions().then((granted) => {
            if (granted) scheduleDailyReminder()
          })
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await checkOnboarding(session.user.id)
        // Schedule daily reminder for newly logged-in sessions
        const granted = await requestNotificationPermissions()
        if (granted) scheduleDailyReminder()
      } else {
        setIsOnboardingRequired(false)
        // Cancel daily reminder on logout
        cancelDailyReminder()
      }
    })

    // Handle deep links (OAuth callback)
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url
      if (url && (url.includes('access_token') || url.includes('refresh_token'))) {
        const parts = url.split(/[#?]/)
        const query = parts[1] || ''
        const pairs = query.split('&')
        const params: any = {}
        for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i].split('=')
          params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '')
        }
        
        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          })
          if (error) {
            console.error('Erro ao definir sessão via link:', error)
          }
        }
      }
    }

    const subscriptionLink = Linking.addEventListener('url', handleDeepLink)

    // Check if the app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.unsubscribe()
      subscriptionLink.remove()
    }
  }, [])

  if (loading) {
    return null // or a splash screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {session ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isOnboardingRequired ? (
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen 
                  {...props} 
                  userId={session.user.id} 
                  onComplete={() => setIsOnboardingRequired(false)} 
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={AppTabs} />
              <Stack.Screen 
                name="Estoque" 
                component={StockScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Meus Produtos', 
                  headerTintColor: '#E11D48',
                  headerStyle: { backgroundColor: '#FFFFFF' },
                  headerShadowVisible: false,
                  headerTitleStyle: { fontWeight: '800', fontSize: 16 }
                }} 
              />
              <Stack.Screen 
                name="Configuracoes" 
                component={SettingsScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Configurações da Loja', 
                  headerTintColor: '#E11D48',
                  headerStyle: { backgroundColor: '#FFFFFF' },
                  headerShadowVisible: false,
                  headerTitleStyle: { fontWeight: '800', fontSize: 16 }
                }} 
              />
            </>
          )}
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
