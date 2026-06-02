import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Configure how notifications appear while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// ─────────────────────────────────────────────
//  PERMISSION & SETUP
// ─────────────────────────────────────────────

/**
 * Request push notification permissions from the user.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulators do not support push notifications
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[Mimus Notifications] Permissão negada pelo usuário.')
    return false
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mimus-alerts', {
      name: 'Alertas da Mimus',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E11D48',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('mimus-reminders', {
      name: 'Lembretes Mimus',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150],
      lightColor: '#E11D48',
    })
  }

  return true
}

// ─────────────────────────────────────────────
//  IMMEDIATE LOCAL NOTIFICATIONS
// ─────────────────────────────────────────────

/** Send an immediate local notification */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId = 'mimus-alerts'
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null, // fire immediately
    ...(Platform.OS === 'android' ? { channelId } : {}),
  } as any)
}

// ─────────────────────────────────────────────
//  SMART DAILY REMINDER
// ─────────────────────────────────────────────

const REMINDER_STORAGE_KEY = 'mimus_daily_reminder_id'

/**
 * Schedule a daily 9 AM reminder to check the dashboard.
 * Cancels any previously scheduled reminder first.
 */
export async function scheduleDailyReminder() {
  try {
    // Cancel existing reminder
    const existingId = await AsyncStorage.getItem(REMINDER_STORAGE_KEY)
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId)
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌸 Bom dia, empreendedora!',
        body: 'Confira as prioridades de hoje na sua loja Mimus.',
        sound: 'default',
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    })

    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, id)
    console.log('[Mimus Notifications] Lembrete diário agendado:', id)
  } catch (err) {
    console.error('[Mimus Notifications] Erro ao agendar lembrete:', err)
  }
}

/**
 * Cancel the daily reminder (e.g. on logout).
 */
export async function cancelDailyReminder() {
  try {
    const existingId = await AsyncStorage.getItem(REMINDER_STORAGE_KEY)
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId)
      await AsyncStorage.removeItem(REMINDER_STORAGE_KEY)
    }
  } catch (err) {
    console.error('[Mimus Notifications] Erro ao cancelar lembrete:', err)
  }
}

// ─────────────────────────────────────────────
//  SMART BUSINESS ALERTS (called after data load)
// ─────────────────────────────────────────────

/**
 * Fires contextual local notifications based on the latest store data.
 * This should be called once per app session (e.g., when the dashboard loads).
 */
export async function fireSmartAlerts(options: {
  pendingOrders: number
  clientsToReply: number
  lowStockProducts: string[]  // list of product names with low stock
  pendingPaymentsValue: number
}) {
  const { pendingOrders, clientsToReply, lowStockProducts, pendingPaymentsValue } = options

  // Only fire alerts if the app is not in the foreground (background / inactive)
  // For simplicity, we use a "last alert date" check so we fire at most once per day
  const lastAlertKey = 'mimus_last_smart_alert_date'
  const today = new Date().toDateString()
  const lastAlert = await AsyncStorage.getItem(lastAlertKey)

  if (lastAlert === today) return // already fired today
  await AsyncStorage.setItem(lastAlertKey, today)

  // Alert 1: pending orders
  if (pendingOrders > 0) {
    await sendLocalNotification(
      '📦 Pedidos aguardando',
      `Você tem ${pendingOrders} pedido${pendingOrders > 1 ? 's' : ''} aguardando atenção na sua loja.`,
      { screen: 'Pedidos' },
      'mimus-alerts'
    )
  }

  // Alert 2: clients to reply
  if (clientsToReply > 0) {
    await sendLocalNotification(
      '💬 Clientes esperando resposta',
      `${clientsToReply} cliente${clientsToReply > 1 ? 's precisam' : ' precisa'} de uma resposta sua. Não deixa esfriar! 🌸`,
      { screen: 'FollowUp' },
      'mimus-alerts'
    )
  }

  // Alert 3: low stock (if any)
  if (lowStockProducts.length > 0) {
    const productList = lowStockProducts.slice(0, 3).join(', ')
    const extra = lowStockProducts.length > 3 ? ` e mais ${lowStockProducts.length - 3}` : ''
    await sendLocalNotification(
      '⚠️ Estoque baixo',
      `Repor em breve: ${productList}${extra}.`,
      { screen: 'Estoque' },
      'mimus-reminders'
    )
  }

  // Alert 4: pending payments
  if (pendingPaymentsValue > 0) {
    await sendLocalNotification(
      '💰 Pix pendente',
      `R$ ${pendingPaymentsValue.toFixed(2)} em pagamentos ainda não confirmados.`,
      { screen: 'FollowUp' },
      'mimus-reminders'
    )
  }
}
