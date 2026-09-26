'use client'

import React from 'react'
import { Package, Image as ImageIcon } from 'lucide-react'

export interface MentionProduct {
  id: string
  name: string
  sku: string | null
  sale_price: number
  quantity_in_stock: number
  image_url: string | null
}

interface ProductMentionPopoverProps {
  isOpen: boolean
  search: string
  products: MentionProduct[]
  onSelect: (product: MentionProduct) => void
}

export default function ProductMentionPopover({
  isOpen,
  search,
  products,
  onSelect
}: ProductMentionPopoverProps) {
  if (!isOpen) return null

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 6)

  return (
    <div className="absolute bottom-full left-0 mb-3 w-80 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 mb-1">
        <span>Marcar Produto (@)</span>
        <span className="text-[10px] text-rose-500 font-medium">Mimus Work</span>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
          Nenhum produto encontrado para "{search}"
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map(prod => (
            <button
              key={prod.id}
              type="button"
              onClick={() => onSelect(prod)}
              className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200 dark:border-zinc-700">
                {prod.image_url ? (
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-rose-500 transition-colors" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  {prod.name}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                  <span>R$ {Number(prod.sale_price).toFixed(2).replace('.', ',')}</span>
                  <span>•</span>
                  <span>{prod.quantity_in_stock} em estoque</span>
                  {prod.sku && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{prod.sku}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
