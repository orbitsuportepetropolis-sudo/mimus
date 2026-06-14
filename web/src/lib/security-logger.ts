import { createClient } from './supabase/server'

interface LogParams {
  userId?: string | null
  affectedUserId?: string | null
  action: string
  ip?: string | null
  userAgent?: string | null
  details?: Record<string, any>
  storeId?: string | null
}

export async function logSecurityAction({
  userId,
  affectedUserId,
  action,
  ip,
  userAgent,
  details = {},
  storeId,
}: LogParams) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('security_logs')
      .insert([
        {
          user_id: userId || null,
          affected_user_id: affectedUserId || null,
          action,
          ip: ip || '127.0.0.1',
          user_agent: userAgent || 'Unknown',
          details,
          store_id: storeId || null,
        }
      ])

    if (error) {
      console.error('Error writing to security_logs table:', error)
    }
  } catch (err) {
    console.error('Failed to log security action:', err)
  }
}
