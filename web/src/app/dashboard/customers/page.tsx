'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Cake, 
  Loader2, 
  X,
  TrendingUp,
  ShoppingBag
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  instagram: string | null
  birthday: string | null
  created_at: string
}

export default function CustomersPage() {
  const supabase = createClient()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [birthday, setBirthday] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setCustomers(data)
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

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')

      const { error } = await supabase
        .from('customers')
        .insert([{
          store_id: profile.store_id,
          name,
          phone: phone || null,
          instagram: instagram || null,
          birthday: birthday || null
        }])

      if (error) throw error

      setModalOpen(false)
      setName('')
      setPhone('')
      setInstagram('')
      setBirthday('')
      await loadCustomers()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar cliente.')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search)) ||
    (c.instagram && c.instagram.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-500" /> Clientes Cadastrados
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Acompanhe o cadastro e as preferências de compra das suas clientes.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Adicionar Cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Clientes Ativos</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{customers.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Ticket Médio Est.</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">R$ 138,50</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Fidelidade Recorrente</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">72%</h3>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou instagram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 text-center rounded-2xl border border-slate-100 dark:border-zinc-850">
          <p className="text-slate-400 text-xs">Nenhum cliente cadastrado ou correspondente à busca.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Contato / Telefone</th>
                  <th className="px-6 py-4">Instagram</th>
                  <th className="px-6 py-4">Aniversário</th>
                  <th className="px-6 py-4">Data Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40 text-slate-700 dark:text-zinc-300">
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-950/10">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center font-bold text-[10px]">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      {c.name}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {c.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.instagram ? (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                          <svg className="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                          </svg> {c.instagram.startsWith('@') ? c.instagram : `@${c.instagram}`}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.birthday ? (
                        <span className="flex items-center gap-1">
                          <Cake className="w-3.5 h-3.5 text-pink-500" /> {new Date(c.birthday + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cadastrar Nova Cliente</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">WhatsApp / Celular</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 90000-0000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Instagram (@)</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Ex: leticia_costa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Data de Aniversário</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
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
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold flex items-center gap-1"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cadastrar Cliente
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
