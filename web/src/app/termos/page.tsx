'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-b from-rose-200/10 via-pink-300/5 to-transparent dark:from-rose-950/10 dark:via-zinc-950/0 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-650 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para a página inicial
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Termos de Uso
            </h1>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Última atualização: 3 de junho de 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-8 md:p-12 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-8 text-sm md:text-base leading-relaxed text-slate-650 dark:text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta ou utilizar os serviços do <strong>Mimus</strong> (plataforma acessada pelo domínio <code>appmimus.com.br</code>), você concorda integralmente com estes Termos de Uso. Se você não concordar com qualquer termo, não deverá utilizar a plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Cadastro e Uso da Conta</h2>
            <p>
              Para utilizar o Mimus, você deve fornecer informações corretas e atualizadas. A segurança das suas credenciais de login (email e senha) é de sua inteira responsabilidade. Qualquer atividade realizada através da sua conta será de sua responsabilidade.
            </p>
            <p>
              O Mimus destina-se a fins comerciais (gerenciamento de vendas, estoque e finanças de lojas de cosméticos e beleza). É proibido utilizar o sistema para fins ilícitos, disseminação de malware ou fraudes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Planos, Cobrança e Cancelamento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Plano Grátis:</strong> Disponibiliza controle essencial de estoque e vendas limitado a 10 produtos e 1 operador, sendo gratuito por tempo ilimitado.</li>
              <li><strong>Plano Pro:</strong> Cobrança mensal recorrente no valor de R$ 49,00. Dá direito a produtos e operadores ilimitados, relatórios financeiros e vitrine customizada.</li>
              <li><strong>Cancelamento:</strong> O plano Pro pode ser cancelado a qualquer momento pelo painel de controle. Não há taxas de fidelidade ou multas de rescisão.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Propriedade Intelectual</h2>
            <p>
              Todo o código-fonte, design visual, logotipos, ilustrações e funcionalidades da plataforma são de propriedade exclusiva do Mimus Software Ltda. Nenhuma parte do sistema pode ser copiada, distribuída, vendida ou engenheirada reversamente sem autorização prévia por escrito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Limitação de Responsabilidade</h2>
            <p>
              O Mimus é fornecido "como está". Nos empenhamos para manter o sistema online e livre de falhas, mas não garantimos que a plataforma estará 100% livre de interrupções ou erros. Não nos responsabilizamos por perdas de dados decorrentes de mau uso da plataforma ou problemas de conexão do usuário.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dúvidas sobre os Termos?</h2>
            <p>
              Caso tenha dúvidas sobre como utilizar a plataforma de forma adequada, entre em contato com nosso time de atendimento através do <Link href="/suporte" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">Canal de Suporte</Link> ou pelo email <code>suporte@appmimus.com.br</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
