import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { logSecurityAction } from '@/lib/security-logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('userId')

  if (!targetUserId) {
    return NextResponse.json({ error: 'Falta o parâmetro userId' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. Get current authenticated user
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Fetch current profile to verify Super Admin permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, store_id')
    .eq('id', user.id)
    .single()

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'Unknown'

  if (!profile || profile.role !== 'super_admin') {
    // Log unauthorized attempt
    await logSecurityAction({
      userId: user.id,
      action: 'unauthorized_impersonation_attempt',
      ip,
      userAgent,
      details: { attemptedUserId: targetUserId }
    })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Set the impersonation cookie
  const cookieStore = await cookies()
  cookieStore.set('mimus_impersonate_user_id', targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  // 4. Fetch target user name for the log
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('name, store_id')
    .eq('id', targetUserId)
    .single()

  // 5. Log the action
  await logSecurityAction({
    userId: user.id,
    affectedUserId: targetUserId,
    action: 'impersonation_started',
    ip,
    userAgent,
    storeId: targetProfile?.store_id || null,
    details: {
      adminName: profile.name,
      targetName: targetProfile?.name || 'Desconhecido'
    }
  })

  // 6. Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
