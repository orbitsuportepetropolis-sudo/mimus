'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'

export default function RecoveryPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError('Erro ao processar a solicitação de redefinição de senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50 via-slate-50 to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden">
      
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 right-1/4 w-[35rem] h-[35rem] bg-rose-300/20 dark:bg-rose-950/20 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 left-1/4 w-[35rem] h-[35rem] bg-pink-300/25 dark:bg-pink-950/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo and header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mimus<span className="text-rose-600">.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Recuperação de Acesso
          </p>
        </div>

        {/* Recovery Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-zinc-800 p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
          </Link>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Esqueceu sua senha?
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
            Insira o e-mail cadastrado na plataforma. Enviaremos um link de redefinição de senha para você.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-100 dark:border-rose-900/30">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <MailCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Redefinição Enviada!</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Se as informações estiverem corretas, você receberá o link em seu e-mail em alguns instantes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Seu E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  )
}
