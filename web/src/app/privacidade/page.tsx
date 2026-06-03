'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

export default function PrivacidadePage() {
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
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Política de Privacidade
            </h1>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Última atualização: 3 de junho de 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-8 md:p-12 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-8 text-sm md:text-base leading-relaxed text-slate-650 dark:text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Compromisso com a Privacidade</h2>
            <p>
              Nós, do <strong>Mimus</strong>, respeitamos a sua privacidade e a privacidade dos clientes da sua loja. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações de cadastro e os dados comerciais inseridos na plataforma <code>appmimus.com.br</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Coleta de Informações</h2>
            <p>Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de Cadastro:</strong> Nome, email, senha criptografada e nome da loja fornecidos durante o registro e onboarding.</li>
              <li><strong>Dados Comerciais (Dados da sua Loja):</strong> Produtos cadastrados (nome, marca, preço, custo), clientes cadastrados, histórico de vendas realizadas, movimentações de estoque e registros de receitas/despesas financeiras.</li>
              <li><strong>Dados de Acesso:</strong> Endereço IP, tipo de navegador, páginas visitadas e tempos de acesso para segurança e melhorias de performance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Uso das Informações</h2>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer as funcionalidades da plataforma (exibição de relatórios de vendas, controle de alertas de estoque e processamento do caixa).</li>
              <li>Exibir sua Vitrine Virtual de produtos para que suas clientes possam selecionar produtos e finalizar o pedido no seu WhatsApp.</li>
              <li>Enviar notificações automáticas e comunicações de suporte ou atualizações do sistema.</li>
            </ul>
            <p className="font-semibold text-rose-600 dark:text-rose-450">
              Importante: Nós nunca compartilharemos, venderemos ou alugaremos os dados comerciais da sua loja ou dos seus clientes para empresas terceiras. Seus dados são seus e são mantidos de forma estritamente privada.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Armazenamento e Segurança dos Dados</h2>
            <p>
              Todos os dados são transmitidos de forma segura usando criptografia SSL/HTTPS e armazenados em servidores de banco de dados do <strong>Supabase</strong> altamente protegidos. Adotamos as melhores práticas de segurança digital para evitar perdas, acessos não autorizados ou vazamentos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Seus Direitos (LGPD)</h2>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, exportar ou solicitar a exclusão definitiva de todos os dados associados à sua loja do nosso banco de dados a qualquer momento. Para exercer esses direitos, basta entrar em contato com o nosso suporte.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contato e Privacidade</h2>
            <p>
              Se você tiver dúvidas, sugestões ou quiser fazer alguma solicitação referente aos seus dados, por favor fale conosco através do email <code>privacidade@appmimus.com.br</code> ou abra um ticket em nossa página de <Link href="/suporte" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">Suporte</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
