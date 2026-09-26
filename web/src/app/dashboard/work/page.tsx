'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Package, 
  Layout, 
  ArrowLeft, 
  Columns, 
  Maximize2, 
  RefreshCw, 
  CheckCircle2, 
  Tag, 
  DollarSign, 
  Boxes, 
  Flame, 
  Plus, 
  X,
  Store,
  Layers
} from 'lucide-react'
import ProductMentionPopover, { MentionProduct } from './components/product-mention-popover'
import VitrinePreview, { StorefrontTheme } from './components/vitrine-preview'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: Date
  executedActions?: any[]
  attachedImage?: string | null
  mentionedProduct?: MentionProduct | null
}

const DEFAULT_THEME: StorefrontTheme = {
  primary_color: '#E11D48',
  banner_title: 'Bem-vindo à nossa loja',
  banner_subtitle: 'Confira nossas novidades e promoções exclusivas',
  banner_image_url: null,
  layout_style: 'modern_grid',
  featured_badge: 'Coleção Outono'
}

export default function MimusWorkPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/dashboard')
    }
  }, [router])

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<MentionProduct[]>([])
  const [theme, setTheme] = useState<StorefrontTheme>(DEFAULT_THEME)

  // Layout states
  const [splitView, setSplitView] = useState(true)
  const [isUpdatingVitrine, setIsUpdatingVitrine] = useState(false)

  // Chat states
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Mention (@) states
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [activeMentionedProduct, setActiveMentionedProduct] = useState<MentionProduct | null>(null)
  const [cursorPos, setCursorPos] = useState(0)

  // Attachment states
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      loadInitialData()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadInitialData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.store_id) return

      // Carregar loja e storefront_theme
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, name, plan, plan_status, storefront_theme')
        .eq('id', profile.store_id)
        .single()

      if (storeData) {
        setStore(storeData)
        if (storeData.storefront_theme) {
          setTheme(storeData.storefront_theme)
        }
      }

      // Carregar catálogo de produtos
      const { data: prodsData } = await supabase
        .from('products')
        .select('id, name, sku, barcode, sale_price, quantity_in_stock, image_url, visible_in_storefront, is_launch, category')
        .eq('store_id', profile.store_id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (prodsData) {
        setProducts(prodsData as any)
      }

      // Mensagem inicial de boas-vindas do Work
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Olá! Bem-vindo ao **Mimus Work (Plano Premium)** ⚡\n\nSou seu co-piloto para gerenciar a loja e a sua vitrine em tempo real:\n- 📦 **Cadastre produtos em lote**: digite nomes, preços e estoque livremente.\n- 📸 **Adicione fotos com facilidade**: use \`@\` para marcar o produto e anexe a imagem.\n- 🎨 **Edite a vitrine ao vivo**: peça para trocar banners, títulos e cores temáticas!`,
          timestamp: new Date()
        }
      ])
    } catch (err) {
      console.error('Erro ao carregar dados do Mimus Work:', err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh rápido dos produtos após ação do agente
  async function refreshProducts() {
    if (!store?.id) return
    setIsUpdatingVitrine(true)
    const { data: prodsData } = await supabase
      .from('products')
      .select('id, name, sku, barcode, sale_price, quantity_in_stock, image_url, visible_in_storefront, is_launch, category')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (prodsData) {
      setProducts(prodsData as any)
    }
    setTimeout(() => setIsUpdatingVitrine(false), 500)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputMessage(val)

    const selStart = e.target.selectionStart || 0
    const textBefore = val.slice(0, selStart)
    const lastAtPos = textBefore.lastIndexOf('@')

    if (lastAtPos !== -1 && !textBefore.slice(lastAtPos, selStart).includes(' ')) {
      setMentionOpen(true)
      setMentionSearch(textBefore.slice(lastAtPos + 1, selStart))
      setCursorPos(selStart)
    } else {
      setMentionOpen(false)
      setMentionSearch('')
    }
  }

  const handleSelectMention = (product: MentionProduct) => {
    const textBefore = inputMessage.slice(0, cursorPos)
    const lastAtPos = textBefore.lastIndexOf('@')
    const beforeAt = inputMessage.slice(0, lastAtPos)
    const afterCursor = inputMessage.slice(cursorPos)

    setInputMessage(`${beforeAt}@${product.name} ${afterCursor}`)
    setActiveMentionedProduct(product)
    setMentionOpen(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage
    if ((!text.trim() && !selectedImage) || isProcessing) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
      attachedImage: selectedImage,
      mentionedProduct: activeMentionedProduct
    }

    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    const sentImg = selectedImage
    const sentMention = activeMentionedProduct
    setSelectedImage(null)
    setActiveMentionedProduct(null)
    setMentionOpen(false)
    setIsProcessing(true)

    try {
      const res = await fetch('/api/work/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mentionedProduct: sentMention,
          imageUrl: sentImg,
          currentTheme: theme
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar mensagem')
      }

      // Se atualizou tema, sincronizar
      const themeAction = data.executedActions?.find((a: any) => a.type === 'theme_updated')
      if (themeAction) {
        setTheme(themeAction.data)
      }

      // Atualizar lista de produtos da vitrine
      await refreshProducts()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date(),
        executedActions: data.executedActions
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Desculpe, ocorreu uma falha ao executar: ${err.message}`,
          timestamp: new Date()
        }
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* TOPBAR: SWITCHER E STATUS DO PLANO PREMIUM */}
      <header className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Voltar ao Painel Clássico"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight">
              Mimus<span className="text-rose-500">.</span>Work
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Premium R$ 109
            </span>
          </div>
        </div>

        {/* MODO SWITCHER CENTRAL: [Painel] | [Work] */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
          <Link
            href="/dashboard"
            className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all"
          >
            Painel Clássico
          </Link>
          <div className="px-3 py-1 text-xs font-semibold text-white bg-rose-500 rounded-lg shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Work & Vitrine Studio
          </div>
        </div>

        {/* CONTROLES DE VISUALIZAÇÃO */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSplitView(!splitView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              splitView 
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900' 
                : 'text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{splitView ? 'Ocultar Vitrine' : 'Dividir Tela (Vitrine)'}</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA (SPLIT SCREEN) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LADO ESQUERDO: CHAT CO-WORK (ESTILO CHATGPT WORK) */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${splitView ? 'w-1/2' : 'w-full'}`}>
          {/* MENSAGENS / CONTEÚDO */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* HERO QUANDO O CHAT TEM POUCAS MENSAGENS */}
            {messages.length <= 1 && (
              <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 mb-2 border border-rose-100 dark:border-rose-900/50 shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  No que vamos trabalhar hoje?
                </h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                  Cadastre produtos, adicione fotos, suba estoque e ajuste o design da sua vitrine com comandos rápidos de IA.
                </p>

                {/* SUGGESTION CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-left">
                  <button
                    onClick={() => handleSendMessage("Cadastre 5 Batons Matte por R$ 39,90 cada, custo R$ 18, com 10 unidades em estoque e código BAT-01")}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Cadastrar Lote de Produtos
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Crie batons com estoque, preço e SKU gerados na hora.
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Mude o tema da vitrine para um tom elegante terracota (#9C4221), com o título 'Coleção Exclusiva' e badge 'Novidades da Semana'")}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Editar Vitrine Studio
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Altere cores, banners e chamadas comerciais da loja.
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (products.length > 0) {
                        handleSendMessage(`@${products[0].name} coloque como destaque de lançamento e aumente o estoque em 5 unidades`)
                      } else {
                        handleSendMessage("Cadastre 2 Perfumes Florais por R$ 120 e coloque na vitrine como lançamento")
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Destacar com @
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Marque um produto para virar lançamento na vitrine.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE MENSAGENS */}
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-rose-500 text-white rounded-br-none' 
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none'
                  }`}>
                    {/* Anexo de Imagem se houver */}
                    {msg.attachedImage && (
                      <div className="mb-2 max-w-xs rounded-lg overflow-hidden border border-white/20">
                        <img src={msg.attachedImage} alt="Anexo" className="w-full h-auto object-cover max-h-48" />
                      </div>
                    )}

                    {/* Badge do Produto Mencionado */}
                    {msg.mentionedProduct && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 bg-white/20 rounded-md text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        <span>@{msg.mentionedProduct.name}</span>
                      </div>
                    )}

                    {/* Texto com formatação simples */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Cards de Ações Executadas (Feedback Visual) */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ações executadas no banco de dados:</span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.executedActions.map((action, idx) => (
                            <div 
                              key={idx} 
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-rose-500" />
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-zinc-200">
                                    {action.data?.name || 'Item processado'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {action.type === 'product_created' && 'Produto criado e ativado na vitrine'}
                                    {action.type === 'product_photo_updated' && 'Foto vinculada com sucesso'}
                                    {action.type === 'theme_updated' && 'Tema visual atualizado'}
                                    {action.type === 'stock_adjusted' && `Estoque atualizado para ${action.data?.newQuantity}`}
                                  </div>
                                </div>
                              </div>

                              {action.data?.sale_price && (
                                <span className="font-bold text-slate-700 dark:text-zinc-300">
                                  R$ {Number(action.data.sale_price).toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-3 items-center text-xs text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Mimus Work está analisando e aplicando na vitrine...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT BAR FIXA INFERIOR */}
          <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="max-w-2xl mx-auto relative">
              {/* Popover de Menção (@) */}
              <ProductMentionPopover
                isOpen={mentionOpen}
                search={mentionSearch}
                products={products}
                onSelect={handleSelectMention}
              />

              {/* Preview da Imagem Anexada */}
              {selectedImage && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 w-fit">
                  <img src={selectedImage} alt="Anexo" className="w-10 h-10 object-cover rounded-lg" />
                  <span className="text-xs text-slate-500 dark:text-zinc-400">Foto selecionada para o produto</span>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tag de Produto Mencionado Selecionado */}
              {activeMentionedProduct && (
                <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <Package className="w-3.5 h-3.5" />
                  <span>Marcado: {activeMentionedProduct.name}</span>
                  <button onClick={() => setActiveMentionedProduct(null)} className="ml-1 text-rose-400 hover:text-rose-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Caixa de Texto */}
              <div className="flex flex-col bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl p-2 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 transition-all">
                <textarea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Trabalhe no que quiser (use @ para marcar produtos, anexe fotos ou descreva cadastros)..."
                  rows={2}
                  className="w-full bg-transparent border-0 resize-none text-xs md:text-sm focus:outline-none p-1 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />

                {/* Barra de Ações Inferior */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-zinc-700/50">
                  <div className="flex items-center gap-1">
                    {/* Botão de Anexo de Foto */}
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                      title="Anexar foto do produto"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    {/* Botão de Atalho @ */}
                    <button
                      type="button"
                      onClick={() => {
                        setInputMessage(prev => prev + '@')
                        setMentionOpen(true)
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <span>@</span>
                      <span className="hidden sm:inline text-[11px]">Produto</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Enter para enviar
                    </span>
                    <button
                      type="button"
                      disabled={isProcessing || (!inputMessage.trim() && !selectedImage)}
                      onClick={() => handleSendMessage()}
                      className="p-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: VITRINE STUDIO (PREVIEW EM TEMPO REAL) */}
        {splitView && (
          <div className="w-1/2 hidden md:block">
            <VitrinePreview
              storeId={store?.id || ''}
              storeName={store?.name || 'Minha Loja'}
              theme={theme}
              products={products}
              isLiveUpdating={isUpdatingVitrine}
            />
          </div>
        )}
      </div>
    </div>
  )
}
