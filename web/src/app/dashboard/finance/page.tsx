'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  History, 
  Loader2, 
  X,
  Trash2
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface Transaction {
  id: string
  type: 'revenue' | 'expense'
  value: number
  category: string
  description: string | null
  date: string
  created_at: string
}

export default function FinancePage() {
  const supabase = createClient()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Form State
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('supplier')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [formError, setFormError] = useState<string | null>(null)

  // Computed Stats
  const [totals, setTotals] = useState({
    revenue: 0,
    expense: 0,
    balance: 0
  })
  
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    loadFinancialData()
  }, [])

  async function loadFinancialData() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) return
      const storeId = profile.store_id

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setTransactions(data)
        
        // Calculate totals
        let rev = 0
        let exp = 0
        data.forEach((t) => {
          if (t.type === 'revenue') {
            rev += Number(t.value)
          } else {
            exp += Number(t.value)
          }
        })
        setTotals({
          revenue: rev,
          expense: exp,
          balance: rev - exp
        })

        // Format chart data by grouping last 5 days
        const last5Days = Array.from({ length: 5 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (4 - i))
          const dateStr = d.toISOString().split('T')[0]
          return {
            dateKey: dateStr,
            label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            entradas: 0,
            saidas: 0
          }
        })

        data.forEach((t) => {
          const match = last5Days.find(item => item.dateKey === t.date)
          if (match) {
            if (t.type === 'revenue') {
              match.entradas += Number(t.value)
            } else {
              match.saidas += Number(t.value)
            }
          }
        })

        setChartData(last5Days.map(item => ({
          label: item.label,
          entradas: item.entradas,
          saidas: item.saidas
        })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    const val = parseFloat(value)
    if (isNaN(val) || val <= 0) {
      setFormError('O valor deve ser maior que zero.')
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

      // Insert transaction as manual expense
      const { error } = await supabase
        .from('financial_transactions')
        .insert([{
          store_id: profile.store_id,
          type: 'expense',
          value: val,
          category,
          description: description || null,
          date
        }])

      if (error) throw error

      setModalOpen(false)
      setValue('')
      setCategory('supplier')
      setDescription('')
      await loadFinancialData()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar despesa.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteTransaction(id: string) {
    if (confirm('Deseja excluir este lançamento financeiro?')) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Não autenticado')

        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id')
          .eq('id', user.id)
          .single()

        if (!profile) throw new Error('Loja não encontrada')
        const store_id = profile.store_id

        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', id)
          .eq('store_id', store_id)

        if (error) throw error
        await loadFinancialData()
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message)
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-rose-500" /> Fluxo de Caixa & Financeiro
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Monitore suas receitas de vendas e gerencie despesas operacionais da loja.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Registrar Saída
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Entradas */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Entradas (Faturamento)</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
              R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Saídas (Despesas)</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
              R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            totals.balance >= 0 ? 'bg-teal-500/10 text-teal-600' : 'bg-rose-500/10 text-rose-600'
          }`}>
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Saldo Líquido</span>
            <h3 className={`text-2xl font-bold mt-0.5 ${
              totals.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-600'
            }`}>
              R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Comparativo Entradas vs. Saídas</h3>
        <div className="h-64 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-zinc-800" />
              <XAxis dataKey="label" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="entradas" fill="#10B981" radius={[4, 4, 0, 0]} name="Entradas" />
              <Bar dataKey="saidas" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-zinc-800 pb-2 mb-4 flex items-center gap-1.5">
          <History className="w-4 h-4 text-rose-500" /> Histórico de Transações
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">Nenhuma transação financeira registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-50 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="py-2.5">Descrição</th>
                  <th className="py-2.5">Categoria</th>
                  <th className="py-2.5">Tipo</th>
                  <th className="py-2.5">Valor</th>
                  <th className="py-2.5">Data</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                {transactions.map(t => {
                  const isRev = t.type === 'revenue'
                  const catLabel = 
                    t.category === 'sale' ? 'Venda PDV' :
                    t.category === 'supplier' ? 'Fornecedor' :
                    t.category === 'rent' ? 'Aluguel' :
                    t.category === 'marketing' ? 'Anúncios / Ads' :
                    t.category === 'salary' ? 'Pró-labore / Salários' : 'Outros'

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20">
                      <td className="py-3 font-bold text-slate-700 dark:text-zinc-300">
                        {t.description || 'Lançamento sem descrição'}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-zinc-400">{catLabel}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          isRev ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        }`}>
                          {isRev ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`py-3 font-extrabold ${isRev ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isRev ? '+' : '-'} R$ {Number(t.value).toFixed(2)}
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 text-right">
                        {!isRev ? (
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Excluir despesa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Registrar Saída / Despesa</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Valor da Despesa (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                >
                  <option value="supplier">Fornecedor / Mercadorias</option>
                  <option value="rent">Aluguel / Condomínio</option>
                  <option value="marketing">Anúncios Instagram / Facebook Ads</option>
                  <option value="salary">Salários / Comissões</option>
                  <option value="other">Outras despesas operacionais</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Data do Lançamento *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Descrição / Observação *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Compra de batons BT e paletas de sombra"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lançar Saída
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
