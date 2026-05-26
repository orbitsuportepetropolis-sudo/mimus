'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : signInError.message
        )
      } else {
        router.refresh()
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (googleError) setError(googleError.message)
    } catch (err) {
      setError('Erro ao iniciar login com Google.')
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 mb-4 animate-bounce">
            <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">Plataforma Mimus</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mimus<span className="text-rose-600">.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            A gestão perfeita para sua loja de cosméticos e maquiagem
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-zinc-800 p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
            Entrar na sua conta
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-100 dark:border-rose-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                E-mail
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Senha
                </label>
                <Link
                  href="/recovery"
                  className="text-xs text-rose-600 hover:text-rose-500 font-medium hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <>
                  Entrar no Painel <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100 dark:border-zinc-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-zinc-900 text-xs text-slate-400 dark:text-zinc-500 font-medium">
              ou continue com
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-700 dark:text-zinc-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-400">
            Não tem uma conta?{' '}
            <Link
              href="/register"
              className="text-rose-600 hover:text-rose-500 hover:underline font-semibold"
            >
              Cadastre-se grátis
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
