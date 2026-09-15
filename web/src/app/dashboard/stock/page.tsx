'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function StockRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/products?tab=stock')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        Redirecionando para Estoque em Produtos...
      </p>
    </div>
  )
}
