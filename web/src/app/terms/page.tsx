'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sun, Moon } from 'lucide-react'

export default function TermsPage() {
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
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Documentos Legais</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Termos de Uso do Mimus
          </h1>
          <p className="text-sm text-slate-400 dark:text-zinc-500">
            Última atualização: 4 de junho de 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-6 text-slate-650 dark:text-zinc-300">
          <p>
            Bem-vinda ao Mimus! O Mimus é uma plataforma de Software como Serviço (SaaS) desenvolvida pela Mimus Software Ltda., projetada especificamente para simplificar e otimizar a gestão de estoque, vendas, finanças e catálogo virtual para pequenos e médios lojistas do segmento de beleza e cosméticos.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            1. Aceitação dos Termos
          </h2>
          <p>
            Ao criar uma conta ou utilizar os serviços do Mimus em qualquer dispositivo móvel ou plataforma web, você concorda expressamente em cumprir e estar vinculada a estes Termos de Uso. Se você não concordar com qualquer termo aqui descrito, por favor, não acesse ou utilize os nossos serviços.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            2. Cadastro de Conta e Segurança
          </h2>
          <p>
            Para usufruir de todas as funcionalidades da plataforma, é obrigatório realizar um cadastro fornecendo informações verídicas e atualizadas. Você é a única responsável pela segurança da sua senha de acesso e por qualquer atividade realizada sob a sua conta. Em caso de uso não autorizado ou suspeito, notifique imediatamente o nosso suporte.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            3. Descrição e Uso do Serviço
          </h2>
          <p>
            O Mimus concede a você uma licença limitada, revogável, não exclusiva e intransferível para acessar e utilizar o sistema de acordo com o plano contratado (Grátis ou Pro). Você se compromete a não utilizar a plataforma para fins ilícitos, falsificação de dados ou qualquer prática que viole direitos de terceiros ou leis vigentes.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            4. Planos, Assinaturas e Cancelamento
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Plano Grátis:</strong> Permite cadastrar até 50 produtos e ter 1 usuária na conta, sem custo mensal, de forma vitalícia.</li>
            <li><strong>Plano Pro:</strong> Oferece cadastro ilimitado de produtos, usuárias de equipe, relatórios financeiros avançados, vitrine virtual com banners premium e domínio personalizado mediante pagamento de assinatura mensal.</li>
            <li><strong>Cancelamento:</strong> A assinatura Pro pode ser cancelada a qualquer momento diretamente pelo painel financeiro, sem cobrança de multas rescisórias. O acesso às funcionalidades Pro será mantido até o final do período faturado corrente.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            5. Disponibilidade do Sistema e Limitação de Responsabilidade
          </h2>
          <p>
            Nós nos esforçamos para manter a plataforma ativa 24 horas por dia, 7 dias por semana. No entanto, o sistema pode ficar temporariamente indisponível para manutenções programadas ou devido a falhas técnicas fora do nosso controle razoável. O Mimus não se responsabiliza por perdas financeiras, vendas não registradas ou prejuízos indiretos decorrentes de instabilidades momentâneas no serviço.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            6. Propriedade Intelectual
          </h2>
          <p>
            Todos os direitos autorais, marcas registradas, designs, códigos-fonte e propriedade intelectual relacionados à plataforma Mimus são de propriedade exclusiva da Mimus Software Ltda. Nenhuma disposição destes Termos transfere a propriedade de qualquer tecnologia ou design do Mimus para as usuárias.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200/50 dark:border-zinc-800">
            7. Jurisdição e Resolução de Conflitos
          </h2>
          <p>
            Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil. Fica eleito o Foro da Comarca de Petrópolis, Estado do Rio de Janeiro, para dirimir qualquer controvérsia decorrente deste instrumento, com expressa renúncia a qualquer outro.
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
