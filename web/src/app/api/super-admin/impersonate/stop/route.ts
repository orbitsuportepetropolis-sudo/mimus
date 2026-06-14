import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { logSecurityAction } from '@/lib/security-logger'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // 1. Get current authenticated user
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Fetch current profile to verify Super Admin permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('mimus_impersonate_user_id')?.value

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'Unknown'

  if (!profile || profile.role !== 'super_admin') {
    // Log unauthorized attempt
    await logSecurityAction({
      userId: user.id,
      action: 'unauthorized_impersonation_stop_attempt',
      ip,
      userAgent,
    })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Clear the impersonation cookie
  cookieStore.delete('mimus_impersonate_user_id')

  // 4. Log the action if impersonation was active
  if (impersonateUserId) {
    await logSecurityAction({
      userId: user.id,
      affectedUserId: impersonateUserId,
      action: 'impersonation_stopped',
      ip,
      userAgent,
      details: {
        adminName: profile.name,
      }
    })
  }

  // 5. Redirect to Super Admin dashboard
  return NextResponse.redirect(new URL('/super-admin', request.url))
}
