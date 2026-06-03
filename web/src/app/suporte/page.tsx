'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, CheckCircle2, HelpCircle, Mail, PhoneCall } from 'lucide-react'

export default function SuportePage() {
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // FAQ state toggle
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const faqs = [
    {
      q: "O plano grátis realmente dura para sempre?",
      a: "Sim! O plano básico é gratuito vitalício. Você pode cadastrar até 10 produtos, registrar vendas ilimitadas, cadastrar clientes e usar a vitrine virtual básica sem custo nenhum e sem precisar cadastrar cartão de crédito."
    },
    {
      q: "Posso acessar pelo computador e celular ao mesmo tempo?",
      a: "Com certeza. O Mimus é baseado em nuvem. Você pode vender pelo celular enquanto atualiza o estoque no computador de forma totalmente sincronizada e instantânea."
    },
    {
      q: "Como minhas clientes compram na Vitrine Virtual?",
      a: "É super simples! O Mimus gera um link exclusivo para a sua loja (ex: appmimus.com.br/vitrine/sualoja). Você envia esse link para suas clientes ou coloca na bio do Instagram. Elas escolhem os batons, maquiagens e produtos que desejam, clicam em finalizar e a lista do pedido vai direto para o seu WhatsApp prontinha para você fechar a venda!"
    },
    {
      q: "O Mimus calcula o lucro das minhas vendas automaticamente?",
      a: "Sim. Ao cadastrar um produto, você pode colocar o preço de custo e o preço de venda. Quando registrar uma venda no PDV celular, o sistema calcula o lucro bruto e líquido automaticamente, exibindo no seu painel financeiro para que você saiba exatamente o quanto está lucrando no mês."
    },
    {
      q: "Como funciona a assistente de IA por comandos?",
      a: "A Mimus IA é a sua ajudante inteligente. Você pode enviar mensagens de texto ou áudio (no plano Pro) perguntando sobre estoque baixo, vendas do dia ou resumo financeiro (ex: 'IA: quais batons estão com estoque abaixo do mínimo?') e ela responderá listando as informações na hora."
    }
  ]

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formEmail || !formMessage) return

    setLoading(true)
    // Simulate API request
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setFormName('')
      setFormEmail('')
      setFormSubject('')
      setFormMessage('')
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-b from-rose-200/10 via-pink-300/5 to-transparent dark:from-rose-950/10 dark:via-zinc-950/0 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-650 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para a página inicial
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/10">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Central de Suporte Mimus
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Estamos aqui para ajudar você a organizar a gestão da sua loja.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: FAQ & Contact channels */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* FAQ Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-6 md:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50 dark:border-zinc-800/40">
                <HelpCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Perguntas Frequentes (FAQ)</h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-slate-50 dark:border-zinc-800/20 pb-4 last:border-b-0 last:pb-0">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left font-bold text-sm md:text-base text-slate-850 dark:text-zinc-200 hover:text-rose-650 dark:hover:text-rose-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span className="text-lg font-mono text-rose-600">{openFaqIndex === idx ? '−' : '+'}</span>
                    </button>
                    {openFaqIndex === idx && (
                      <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-zinc-450 leading-relaxed animate-in fade-in duration-200">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 border border-emerald-500/15 p-6 rounded-2xl flex flex-col justify-between h-40 transition-all">
                <PhoneCall className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">WhatsApp de Suporte</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Seg. a Sex. das 9h às 18h</p>
                </div>
                <a
                  href="https://wa.me/5524999999999?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20Mimus%20App"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-max px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Falar no WhatsApp
                </a>
              </div>

              <div className="bg-gradient-to-r from-rose-500/5 to-pink-500/5 hover:from-rose-500/10 hover:to-pink-500/10 border border-rose-500/15 p-6 rounded-2xl flex flex-col justify-between h-40 transition-all">
                <Mail className="w-6 h-6 text-rose-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Atendimento por E-mail</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Respondemos em até 2 horas úteis</p>
                </div>
                <a
                  href="mailto:suporte@appmimus.com.br"
                  className="w-max px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  suporte@appmimus.com.br
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Contact form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-6 md:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Envie uma Mensagem</h2>
              <p className="text-xs text-slate-450 dark:text-zinc-500 mb-6">Preencha o formulário abaixo e nosso time entrará em contato.</p>

              {submitted ? (
                <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-950 dark:text-white">Mensagem Enviada!</h3>
                  <p className="text-xs text-slate-450 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Obrigado por entrar em contato. Enviamos uma confirmação para o seu e-mail e responderemos muito em breve!
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-500 transition-colors"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Seu Nome</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Juliana Alencar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Seu E-mail</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="exemplo@gmail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Assunto</label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Dúvida sobre cadastro, plano, etc."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Mensagem</label>
                    <textarea
                      required
                      rows={4}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder="Descreva aqui sua dúvida ou problema em detalhes..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formName || !formEmail || !formMessage}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-colors mt-6"
                  >
                    {loading ? 'Processando...' : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Enviar Mensagem
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
