import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { logSecurityAction } from '@/lib/security-logger'
import Link from 'next/link'
import { Shield, LayoutDashboard, LogOut, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // 2. Fetch profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'Unknown'

  // 3. Protection Guard
  if (!profile || profile.role !== 'super_admin') {
    // Log unauthorized attempt in security logs
    await logSecurityAction({
      userId: user.id,
      action: 'unauthorized_admin_page_access_attempt',
      ip,
      userAgent,
      details: {
        userName: profile?.name || 'Desconhecido',
        userRole: profile?.role || 'nenhum',
        attemptedPath: '/super-admin'
      }
    })
    
    // Redirect to home/dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Super Admin Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              Mimus Super Admin <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">Master</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Controle Total do Sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{profile.name}</span>
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Super Administrador</span>
          </div>

          <div className="w-px h-8 bg-slate-800 hidden sm:block" />

          {/* Quick links */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-[0.98]"
          >
            <LayoutDashboard className="w-4 h-4" /> Ir para Dashboard
          </Link>

          <form action="/api/super-admin/impersonate/stop" method="GET">
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
