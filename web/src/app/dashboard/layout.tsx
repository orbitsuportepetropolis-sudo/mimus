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

  // --- ONBOARDING GUARD (first-access only) ---
  // Check if store has any products. If not, this is a brand-new user and they
  // must complete onboarding before accessing the dashboard.
  let productCount = 0
  const prodQuery = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', profile.store_id)
    .eq('active', true)

  if (prodQuery.error && prodQuery.error.code === '42703') {
    const fallback = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', profile.store_id)
    productCount = fallback.count || 0
  } else {
    productCount = prodQuery.count || 0
  }

  if (productCount === 0) {
    redirect('/onboarding')
  }
  // --- END ONBOARDING GUARD ---

  // Fetch store details
  const { data: store } = await supabase
    .from('stores')
    .select('name, plan, plan_status, trial_ends_at')
    .eq('id', profile.store_id)
    .single()

  // Fetch low stock count for notifications
  let lowStockCount = 0
  const lowStockQuery = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', profile.store_id)
    .eq('active', true)
    .lte('quantity_in_stock', 5)

  if (lowStockQuery.error && lowStockQuery.error.code === '42703') {
    const fallback = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', profile.store_id)
      .lte('quantity_in_stock', 5)
    lowStockCount = fallback.count || 0
  } else {
    lowStockCount = lowStockQuery.count || 0
  }

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
