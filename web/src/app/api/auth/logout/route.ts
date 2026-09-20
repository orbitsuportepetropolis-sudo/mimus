import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  return handleLogout(request)
}

export async function POST(request: NextRequest) {
  return handleLogout(request)
}

async function handleLogout(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('mimus_impersonate_user_id')
  } catch (err) {
    console.error('Erro ao fazer logout:', err)
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
