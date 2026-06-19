import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { logSecurityAction } from '@/lib/security-logger'

// Initialize Admin Supabase Client using Service Role Key
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Check if current user is indeed a Super Admin
async function checkSuperAdminPermission() {
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return null
  }
  return { id: user.id, name: profile.name }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await checkSuperAdminPermission()
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = headersList.get('user-agent') || 'Unknown'

    if (!adminUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    const adminClient = getAdminClient()

    if (action === 'create') {
      const { email, password, name, phone, role = 'admin', storeId } = body

      if (!email || !password || !name) {
        return NextResponse.json({ error: 'E-mail, senha e nome são obrigatórios' }, { status: 400 })
      }

      // 1. Create auth user
      const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, store_id: storeId, phone }
      })

      if (authErr) throw authErr

      // 2. Insert profile manually if handle_new_user trigger wasn't triggered
      // Note: The handle_new_user trigger should run automatically, but we can verify/update.
      const { error: profileErr } = await adminClient
        .from('profiles')
        .update({ role, name, status: 'active', store_id: storeId || null, phone: phone || null })
        .eq('id', authUser.user.id)

      // Log the user creation
      await logSecurityAction({
        userId: adminUser.id,
        affectedUserId: authUser.user.id,
        action: 'user_created',
        ip,
        userAgent,
        details: { adminName: adminUser.name, createdEmail: email, createdRole: role }
      })

      return NextResponse.json({ success: true, user: authUser.user })

    } else if (action === 'edit') {
      const { userId, name, role, status, phone } = body

      if (!userId) {
        return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
      }

      // Update profile
      const { error: updateErr } = await adminClient
        .from('profiles')
        .update({ name, role, status, phone })
        .eq('id', userId)

      if (updateErr) throw updateErr

      // Log update
      await logSecurityAction({
        userId: adminUser.id,
        affectedUserId: userId,
        action: 'user_updated',
        ip,
        userAgent,
        details: { adminName: adminUser.name, role, status, name }
      })

      return NextResponse.json({ success: true })

    } else if (action === 'delete') {
      const { userId } = body

      if (!userId) {
        return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
      }

      // Delete auth user (cascades to profile)
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)

      if (deleteErr) throw deleteErr

      // Log deletion
      await logSecurityAction({
        userId: adminUser.id,
        affectedUserId: userId,
        action: 'user_deleted',
        ip,
        userAgent,
        details: { adminName: adminUser.name }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err: any) {
    console.error('Super Admin API Error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
