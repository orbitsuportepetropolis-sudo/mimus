'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Shield, 
  ShieldAlert, 
  Loader2, 
  Clock 
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: 'admin' | 'operator'
  created_at: string
}

export default function TeamPage() {
  const supabase = createClient()
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteRole, setInviteRole] = useState<'operator' | 'admin'>('operator')

  useEffect(() => {
    loadTeamData()
  }, [])

  async function loadTeamData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setStoreId(profile.store_id)
        
        // Fetch all profiles belonging to the same store
        const { data: team } = await supabase
          .from('profiles')
          .select('id, name, role, created_at')
          .eq('store_id', profile.store_id)
          .order('name', { ascending: true })

        if (team) {
          setMembers(team as TeamMember[])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Generate invite URL
  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?store_id=${storeId}&role=${inviteRole}`
    : ''

  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-rose-500" /> Gestão de Equipe (Multi-usuário)
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Adicione operadoras de caixa e administradores para gerenciar sua loja de maquiagem em conjunto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Members List (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-zinc-800 pb-2">
            Colaboradores Ativos ({members.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850/60 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-zinc-200">{member.name}</h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {member.role === 'admin' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1 border border-rose-100 dark:border-rose-900/20">
                        <Shield className="w-3.5 h-3.5" /> Administradora
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] flex items-center gap-1 border border-slate-200 dark:border-zinc-700/30">
                        <ShieldAlert className="w-3.5 h-3.5" /> Operadora
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Generator (Right 1 col) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-zinc-800 pb-2">
            Convidar Nova Usuária
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Selecione o nível de acesso e copie o link gerado abaixo para enviar para seu time. Ao se cadastrar pelo link, o perfil será vinculado automaticamente à sua loja.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1">Nível de Acesso *</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'operator' | 'admin')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="operator">Operadora (Somente PDV e Vendas)</option>
                <option value="admin">Administradora (Acesso Total)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/50 dark:border-zinc-800 text-[10px] break-all font-mono text-slate-600 dark:text-zinc-400">
              {inviteUrl}
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-500/10 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Link de Convite
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
