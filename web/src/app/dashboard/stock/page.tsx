'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  Loader2, 
  X,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'

interface Product {
  id: string
  name: string
  quantity_in_stock: number
}

interface StockMovement {
  id: string
  quantity: number
  type: string
  reason: string
  created_at: string
  products: any
}

export default function StockPage() {
  const supabase = createClient()
  
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'entry' | 'exit'>('entry')
  const [adjustmentReason, setAdjustmentReason] = useState('manual_adjustment')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadStockData()
  }, [])

  async function loadStockData() {
    try {
      setLoading(true)

      // Fetch products for the dropdown
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, quantity_in_stock')
        .order('name', { ascending: true })

      // Fetch stock movements history
      const { data: moves } = await supabase
        .from('stock_movements')
        .select('id, quantity, type, reason, created_at, products(name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (prods) setProducts(prods)
      if (moves) setMovements(moves)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdjustmentSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    if (!selectedProductId) {
      setFormError('Selecione um produto.')
      setFormLoading(false)
      return
    }

    const qty = parseInt(adjustmentQuantity)
    if (isNaN(qty) || qty <= 0) {
      setFormError('A quantidade deve ser um número maior que zero.')
      setFormLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')

      // Entry adds, exit subtracts
      const finalQuantity = adjustmentType === 'entry' ? qty : -qty

      // Save movement
      const { error } = await supabase
        .from('stock_movements')
        .insert([{
          store_id: profile.store_id,
          product_id: selectedProductId,
          quantity: finalQuantity,
          type: adjustmentType,
          reason: adjustmentReason
        }])

      if (error) throw error

      setModalOpen(false)
      setSelectedProductId('')
      setAdjustmentQuantity('')
      setAdjustmentReason('manual_adjustment')
      await loadStockData()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar ajuste de estoque.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-rose-500" /> Controle de Estoque
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Acompanhe a movimentação de mercadorias e realize ajustes manuais no inventário.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Ajustar Estoque
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Current stock status list (Left 1 col) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4 max-h-[65vh] overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-zinc-800 pb-2">
            Balanço Atual
          </h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">Sem produtos cadastrados.</p>
          ) : (
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60">
                  <span className="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[12rem]">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    p.quantity_in_stock <= 2 
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' 
                      : p.quantity_in_stock <= 5 
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50'
                        : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}>
                    {p.quantity_in_stock} un.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock movements log (Right 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-zinc-800 pb-2 mb-4 flex items-center gap-1.5">
            <History className="w-4 h-4 text-rose-500" /> Histórico de Movimentações (Últimas 50)
          </h3>

          {loading ? (
            <div className="flex justify-center py-12 flex-1 items-center">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
              Nenhuma movimentação de estoque registrada.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto pr-1">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="py-2.5">Produto</th>
                    <th className="py-2.5">Tipo</th>
                    <th className="py-2.5">Qtd.</th>
                    <th className="py-2.5">Motivo</th>
                    <th className="py-2.5">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {movements.map((move) => {
                    const isEntry = move.type === 'entry'
                    const formattedReason = 
                      move.reason === 'sale' ? 'Venda PDV' :
                      move.reason === 'purchase' ? 'Nova Compra / Entrada' :
                      move.reason === 'loss' ? 'Perda / Roubo' :
                      move.reason === 'manual_adjustment' ? 'Ajuste Manual' : move.reason

                    return (
                      <tr key={move.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20">
                        <td className="py-3 font-bold text-slate-700 dark:text-zinc-350">
                          {move.products 
                            ? (Array.isArray(move.products) 
                                ? move.products[0]?.name 
                                : move.products.name) || 'Produto Excluído'
                            : 'Produto Excluído'}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            isEntry ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isEntry ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                            {isEntry ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="py-3 font-extrabold text-slate-800 dark:text-white">
                          {isEntry ? '+' : ''}{move.quantity}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-zinc-400">
                          {formattedReason}
                        </td>
                        <td className="py-3 text-slate-400 font-mono">
                          {new Date(move.created_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Adjustment Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Realizar Ajuste de Estoque</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">{formError}</div>
            )}

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs font-medium">
              
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Selecionar Produto *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Atual: {p.quantity_in_stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Operação *</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as 'entry' | 'exit')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                  >
                    <option value="entry">Entrada (+)</option>
                    <option value="exit">Saída (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="Qtd."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Motivo do Ajuste *</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                >
                  <option value="manual_adjustment">Ajuste Manual</option>
                  <option value="purchase">Entrada de Compra / Fornecedor</option>
                  <option value="loss">Perda de Estoque / Vencido / Danificado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Ajuste
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
