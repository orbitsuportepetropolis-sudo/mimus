'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sun, Moon } from 'lucide-react'

export default function PrivacyPage() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !darkMode
    setDarkMode(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-b from-rose-200/10 via-pink-300/5 to-transparent dark:from-rose-950/10 dark:via-zinc-950/0 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[30rem] left-0 w-[30rem] h-[30rem] bg-gradient-to-t from-violet-200/10 via-rose-300/5 to-transparent dark:from-purple-950/5 dark:via-zinc-950/0 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span>Mimus</span><span className="text-rose-600">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
              aria-label="Alternar tema"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link 
              href="/" 
              className="text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o início
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 space-y-10">
        <div className="space-y-4">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Segurança e Privacidade</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Políticas de Privacidade
          </h1>
          <p className="text-sm text-slate-400 dark:text-zinc-500">
            Última atualização: 4 de junho de 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-6 text-slate-650 dark:text-zinc-300">
          <p>
            No Mimus, valorizamos profundamente a confiança que você deposita em nós ao gerenciar os dados da sua loja de cosméticos e beleza. Por isso, a privacidade e a segurança das suas informações e das informações de suas clientes são nossas prioridades absolutas. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos os seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/18).
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            1. Informações que Coletamos
          </h2>
          <p>
            Coletamos informações essenciais em diferentes etapas de uso da plataforma:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha de acesso e dados da sua loja (nome fantasia, CNPJ se aplicável, cor primária e logotipo).</li>
            <li><strong>Dados Operacionais da Loja:</strong> Catálogo de produtos, níveis de estoque, transações financeiras (vendas, entradas de caixa, custos de fornecedores).</li>
            <li><strong>Dados de Suas Clientes:</strong> Nome, telefone, histórico de compras e preferências, salvos por você para controle de relacionamento.</li>
            <li><strong>Dados de Navegação:</strong> Informações de uso do app, logs de erro para depuração e preferências de tema (dark/light).</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            2. Como Utilizamos os seus Dados
          </h2>
          <p>
            Os dados coletados são utilizados estritamente para fornecer, aprimorar e manter nossos serviços, o que inclui:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Garantir o funcionamento e a sincronização do seu painel e vitrine virtual.</li>
            <li>Processar comandos de texto e áudio por meio da nossa inteligência artificial (**Mimus AI**) de forma contextualizada.</li>
            <li>Enviar alertas automáticos sobre níveis baixos de estoque ou datas de vencimento de produtos.</li>
            <li>Faturar assinaturas do Plano Pro e prover o suporte operacional humanizado.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            3. Segurança e Armazenamento dos Dados
          </h2>
          <p>
            O Mimus utiliza infraestrutura moderna e segura de nuvem baseada no **Supabase**. Adotamos protocolos rígidos de segurança, incluindo criptografia na transmissão e no armazenamento de dados sensíveis, controle de acessos restrito por políticas a nível de banco de dados (RLS) e backups diários para evitar qualquer perda ou vazamento de dados.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            4. Compartilhamento de Dados com Terceiros
          </h2>
          <p>
            **Nunca vendemos ou comercializamos quaisquer dados armazenados na plataforma.** As informações operacionais só são compartilhadas com integradoras de terceiros (como a *Loja Integrada*) quando ativadas e configuradas explicitamente por você no seu painel de configurações.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            5. Seus Direitos como Titular de Dados (LGPD)
          </h2>
          <p>
            Em conformidade com a LGPD, você tem direito a:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Confirmar a existência do tratamento de seus dados pessoais.</li>
            <li>Acessar, corrigir ou atualizar dados incompletos ou inexatos.</li>
            <li>Solicitar a portabilidade dos dados operacionais da sua loja.</li>
            <li>Solicitar a exclusão definitiva de sua conta e de todos os dados operacionais vinculados a ela em nossos servidores.</li>
          </ul>
          <p>
            Para exercer qualquer um destes direitos, basta entrar em contato com nosso encarregado de dados pelo e-mail <a href="mailto:privacidade@mimus.app" className="text-rose-600 hover:underline">privacidade@mimus.app</a>.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            6. Alterações nesta Política
          </h2>
          <p>
            Esta política de privacidade pode ser revisada periodicamente para refletir melhorias técnicas e novos recursos regulamentares. Qualquer alteração relevante será notificada diretamente em nosso site ou por e-mail cadastrado em sua conta.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-500 text-center text-xs transition-colors duration-300">
        <p className="max-w-4xl mx-auto px-6">
          © {new Date().getFullYear()} Mimus Software Ltda. CNPJ 00.000.000/0001-00. Petrópolis - RJ. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
