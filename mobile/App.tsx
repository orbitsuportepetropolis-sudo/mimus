import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { LayoutDashboard, Package, ShoppingBag, Users, DollarSign } from 'lucide-react-native'
import { supabase } from './src/services/supabase'

// Import Screens
import DashboardScreen from './src/screens/DashboardScreen'
import StockScreen from './src/screens/StockScreen'
import SalesScreen from './src/screens/SalesScreen'
import CustomerScreen from './src/screens/CustomerScreen'
import FinanceScreen from './src/screens/FinanceScreen'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') {
            return <LayoutDashboard size={size} color={color} />
          } else if (route.name === 'Estoque') {
            return <Package size={size} color={color} />
          } else if (route.name === 'Vendas') {
            return <ShoppingBag size={size} color={color} />
          } else if (route.name === 'Clientes') {
            return <Users size={size} color={color} />
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Painel' }} />
      <Tab.Screen name="Vendas" component={SalesScreen} options={{ title: 'PDV' }} />
      <Tab.Screen name="Estoque" component={StockScreen} options={{ title: 'Estoque' }} />
      <Tab.Screen name="Financeiro" component={FinanceScreen} options={{ title: 'Financeiro' }} />
      <Tab.Screen name="Clientes" component={CustomerScreen} options={{ title: 'Clientes' }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
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
          <Stack.Screen name="MainTabs" component={AppTabs} />
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
