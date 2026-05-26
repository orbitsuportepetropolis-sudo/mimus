import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Mimus - Gestão Inteligente para Lojas de Cosméticos e Beleza',
  description: 'Controle de estoque, PDV rápido, fluxo de caixa, gestão de clientes e integração com a Loja Integrada. O SaaS moderno e premium para lojistas de beleza.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} h-full antialiased`}>
      <body
        className="min-h-full font-sans antialiased bg-background text-foreground transition-colors duration-200"
        style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
