'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, CheckCircle2, HelpCircle, Mail, Sun, Moon, ChevronDown, Phone } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "O Mimus é realmente grátis?",
    answer: "Sim! O plano essencial do Mimus é 100% gratuito e vitalício, permitindo que você cadastre até 50 produtos e registre vendas ilimitadas. Conforme a sua loja cresce, você pode migrar para o plano Pro para ter recursos adicionais."
  },
  {
    question: "Como funciona a integração com a Loja Integrada?",
    answer: "A integração é extremamente simples: basta acessar a página de Configurações no seu Painel, inserir a Chave API gerada na Loja Integrada e ativar. A partir disso, o Mimus passará a sincronizar o estoque de produtos físicos e digitais automaticamente e a receber seus pedidos via webhook instantaneamente."
  },
  {
    question: "Posso usar no celular e no computador?",
    answer: "Com certeza! A plataforma Mimus é totalmente responsiva e baseada em nuvem. Você pode acessar do computador, tablet ou celular (Android e iOS) de forma totalmente sincronizada e instantânea."
  },
  {
    question: "O que é o Mimus AI?",
    answer: "É o nosso assistente inteligente por comando de voz e texto. Em vez de preencher formulários complicados, você pode gerenciar sua loja apenas digitando ou gravando um áudio (por exemplo: 'cadastre o produto batom matte por R$ 35'). O Mimus AI processa a informação e realiza a ação na hora."
  },
  {
    question: "Como funciona a vitrine virtual para WhatsApp?",
    answer: "Ao cadastrar seus produtos no Mimus, você ganha automaticamente um link de vitrine virtual customizado (ex: mimus.app/vitrine/sua-loja). Suas clientes acessam o catálogo, selecionam os produtos desejados e a sacola de compras é enviada diretamente ao seu número do WhatsApp configurado, simplificando a finalização."
  },
  {
    question: "O Mimus calcula o lucro das minhas vendas automaticamente?",
    answer: "Sim. Ao cadastrar um produto, você pode colocar o preço de custo e o preço de venda. Quando registrar uma venda no PDV celular, o sistema calcula o lucro bruto e líquido automaticamente, exibindo no seu painel financeiro para que você saiba exatamente o quanto está lucrando no mês."
  }
]

export default function SuportePage() {
  const [darkMode, setDarkMode] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const toggleFaq = (index: number) => {
    if (openFaqIndex === index) {
      setOpenFaqIndex(null)
    } else {
      setOpenFaqIndex(index)
    }
  }

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
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-b from-rose-200/10 via-pink-300/5 to-transparent dark:from-rose-950/10 dark:via-zinc-950/0 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[35rem] left-0 w-[35rem] h-[35rem] bg-gradient-to-t from-violet-200/10 via-rose-300/5 to-transparent dark:from-purple-950/5 dark:via-zinc-950/0 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
              className="text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-450 border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o início
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Header Title */}
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
            
            {/* FAQ Accordion */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-6 md:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50 dark:border-zinc-800/40">
                <HelpCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Perguntas Frequentes (FAQ)</h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index
                  return (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm transition-all"
                    >
                      <button 
                        onClick={() => toggleFaq(index)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-850 dark:text-zinc-200 hover:text-rose-650 dark:hover:text-rose-450 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div 
                        className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[300px] border-t border-slate-50 dark:border-zinc-800/50' : 'max-h-0'}`}
                      >
                        <p className="p-6 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 border border-emerald-500/15 p-6 rounded-2xl flex flex-col justify-between h-40 transition-all">
                <Phone className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">WhatsApp de Suporte</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Seg. a Sex. das 9h às 18h</p>
                </div>
                <a
                  href="https://wa.me/5524993173232?text=Ol%C3%A1%20Mimus!%20Preciso%20de%20suporte%20com%20a%20minha%20loja."
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
                  href="mailto:suporte@mimus.app"
                  className="w-max px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  suporte@mimus.app
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
