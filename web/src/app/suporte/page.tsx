'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sun, Moon, Phone, Mail, HelpCircle, ChevronDown, CheckCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "O Mimus é realmente grátis?",
    answer: "Sim! O plano essencial do Mimus é 100% gratuito e vitalício, permitindo que você cadastre até 10 produtos e registre vendas ilimitadas. Conforme a sua loja cresce, você pode migrar para o plano Pro para ter recursos ilimitados."
  },
  {
    question: "Como funciona a integração com a Loja Integrada?",
    answer: "A integração é extremamente simples: basta acessar a página de Configurações no seu Painel, inserir a Chave API gerada na Loja Integrada e ativar. A partir disso, o Mimus passará a sincronizar o estoque de produtos físicos e digitais automaticamente e a receber seus pedidos via webhook instantaneamente."
  },
  {
    question: "Posso usar no celular e no computador?",
    answer: "Com certeza! A plataforma Mimus é totalmente responsiva e foi desenvolvida para rodar com rapidez em smartphones (Android e iOS), tablets e computadores, sem a necessidade de baixar aplicativos pesados."
  },
  {
    question: "O que é o Mimus AI?",
    answer: "É o nosso assistente inteligente por comando. Em vez de preencher formulários complicados, você pode gerenciar sua loja apenas digitando ou gravando um áudio (por exemplo: 'cadastre o produto batom matte por R$ 35'). O Mimus AI processa a informação e realiza a ação na hora."
  },
  {
    question: "Como funciona a vitrine virtual para WhatsApp?",
    answer: "Ao cadastrar seus produtos no Mimus, você ganha automaticamente um link de vitrine virtual customizado (ex: mimus.app/vitrine/sua-loja). Suas clientes acessam o catálogo, selecionam os produtos desejados e a sacola de compras é enviada diretamente ao seu número do WhatsApp configurado, simplificando a finalização."
  }
]

export default function SupportPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-gradient-to-b from-rose-200/10 via-pink-300/5 to-transparent dark:from-rose-950/10 dark:via-zinc-950/0 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[35rem] left-0 w-[35rem] h-[35rem] bg-gradient-to-t from-violet-200/10 via-rose-300/5 to-transparent dark:from-purple-950/5 dark:via-zinc-950/0 rounded-full blur-[120px] pointer-events-none -z-10" />

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

      {/* Hero Header */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Atendimento Humanizado</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Central de Ajuda & Suporte
          </h1>
          <p className="text-base text-slate-500 dark:text-zinc-400">
            Estamos aqui para ajudar você a simplificar as vendas da sua loja de beleza. Escolha como quer entrar em contato ou resolva suas dúvidas rápidas.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: WhatsApp */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-8 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Conversar via WhatsApp</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Suporte prioritário e imediato para dúvidas operacionais, configurações do catálogo virtual e uso no celular.
              </p>
            </div>
            <a 
              href="https://wa.me/5524999331168?text=Ol%C3%A1%20Mimus!%20Preciso%20de%20suporte%20com%20a%20minha%20loja."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center font-bold text-xs py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 fill-white" /> Iniciar conversa no WhatsApp
            </a>
          </div>

          {/* Card 2: Email */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-8 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6 flex flex-col justify-between hover:border-rose-500/25 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Suporte por E-mail</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Ideal para questões sobre assinaturas, sugestões de novos recursos, alterações cadastrais ou solicitações da LGPD.
              </p>
            </div>
            <a 
              href="mailto:suporte@mimus.app"
              className="w-full text-center font-bold text-xs py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" /> Enviar e-mail para suporte@mimus.app
            </a>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="space-y-8 pt-8 border-t border-slate-200/50 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-rose-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dúvidas Frequentes (FAQ)</h2>
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
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-white hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div 
                    className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[300px] border-t border-slate-50 dark:border-zinc-800/50' : 'max-h-0'}`}
                  >
                    <p className="p-6 text-sm md:text-base text-slate-550 dark:text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )
            })}
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
