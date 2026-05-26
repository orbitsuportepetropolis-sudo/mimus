import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Fetch current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, store_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch store details
  const { data: store } = await supabase
    .from('stores')
    .select('name, plan')
    .eq('id', profile.store_id)
    .single()

  // Fetch low stock count for notifications
  const { count: lowStockCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lte('quantity_in_stock', 5) // count standard lower bound or min_stock_alert

  return (
    <DashboardShell 
      profile={profile} 
      store={store} 
      lowStockCount={lowStockCount || 0}
    >
      {children}
    </DashboardShell>
  )
}
