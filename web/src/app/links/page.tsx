'use client'

import React from 'react'
import { Users, Globe, MessageCircle, ArrowRight } from 'lucide-react'

export default function LinksPage() {
  const links = [
    {
      title: 'Grupo VIP no WhatsApp 🚀',
      subtitle: 'Receba dicas de gestão, novidades e ofertas exclusivas!',
      url: 'https://chat.whatsapp.com/FfH6BmnncodIjGxlfOYmZC',
      icon: Users,
      highlight: true,
    },
    {
      title: 'Nosso Site Oficial 🌐',
      subtitle: 'Controle de estoque, PDV rápido, vitrine virtual e muito mais.',
      url: 'https://www.appmimus.com.br/',
      icon: Globe,
      highlight: false,
    },
    {
      title: 'Fale Conosco no WhatsApp 💬',
      subtitle: 'Tire suas dúvidas ou solicite uma demonstração agora mesmo!',
      url: 'https://wa.me/5511957337045?text=Ol%C3%A1!%20Vim%20do%20Instagram%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Mimus.',
      icon: MessageCircle,
      highlight: false,
    },
  ]

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] aspect-square rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center py-12 space-y-8 z-10">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {/* Pulsing ring around logo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-500 to-violet-500 opacity-60 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative w-24 h-24 rounded-3xl bg-slate-900 overflow-hidden border border-white/15 flex items-center justify-center">
              <img 
                src="/logo-mimus.png" 
                alt="Mimus Logo" 
                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
              Mimus
            </h1>
            <p className="text-xs text-rose-450 dark:text-rose-400 font-extrabold uppercase tracking-widest">
              Gestão Inteligente de Beleza
            </p>
            <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed font-medium">
              A plataforma completa de gestão para consultoras e lojistas de cosméticos e beleza. 💖
            </p>
          </div>
        </div>

        {/* Links List */}
        <div className="w-full space-y-4">
          {links.map((link, idx) => {
            const Icon = link.icon
            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                  link.highlight
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-550 hover:to-rose-650 text-white border-rose-500/30 hover:border-rose-450 shadow-lg shadow-rose-600/10 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99] backdrop-blur-md'
                }`}
              >
                <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                  link.highlight
                    ? 'bg-white/15 text-white'
                    : 'bg-rose-600/10 group-hover:bg-rose-600/20 text-rose-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate leading-snug">
                    {link.title}
                  </h3>
                  <p className={`text-[11px] mt-0.5 leading-snug ${
                    link.highlight ? 'text-rose-100' : 'text-slate-450 dark:text-zinc-500 group-hover:text-slate-400'
                  }`}>
                    {link.subtitle}
                  </p>
                </div>

                <div className={`shrink-0 transition-transform duration-300 ${
                  link.highlight
                    ? 'group-hover:translate-x-1 text-white'
                    : 'group-hover:translate-x-1 text-slate-400 group-hover:text-white'
                }`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            )
          })}
        </div>

      </div>

      {/* Footer Area */}
      <div className="w-full text-center py-4 z-10 border-t border-white/5">
        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
          Feito com 💖 pelo <span className="text-rose-550/80">Mimus</span>
        </p>
      </div>
    </div>
  )
}
