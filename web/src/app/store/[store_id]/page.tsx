'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingBag, 
  Search, 
  X, 
  ChevronRight, 
  MapPin, 
  Store, 
  Phone,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle,
  Truck,
  ShieldCheck,
  Percent
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string | null
  category: string | null
  sale_price: number
  quantity_in_stock: number
  image_url: string | null
  description: string | null
  promotional_price: number | null
  has_free_shipping: boolean
}

interface CartItem extends Product {
  qty: number
}

interface Banner {
  title: string
  subtitle: string
  cta: string
  tag: string
  banner_url: string | null
}

export default function StorefrontPage() {
  const params = useParams()
  const storeId = params.store_id as string
  const supabase = createClient()

  // Branding & Configuration States
  const [storeName, setStoreName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#b5127b')
  const [accentColor, setAccentColor] = useState('#1bbc9b')
  const [fontFamily, setFontFamily] = useState('Inter')

  // Campaign Banners States
  const [banners, setBanners] = useState<Banner[]>([])
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [marqueeText, setMarqueeText] = useState<string | null>(null)

  // Products list
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [clientName, setClientName] = useState('')
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup')
  const [address, setAddress] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  // Load Custom Font Family from Google Fonts
  useEffect(() => {
    if (fontFamily) {
      const linkId = 'storefront-dynamic-font'
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
    }
  }, [fontFamily])

  // Auto rotation of banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [banners])

  useEffect(() => {
    if (storeId) {
      loadStorefrontData()
    }
  }, [storeId])

  async function loadStorefrontData() {
    try {
      setLoading(true)

      // Fetch Store details with fallback options for legacy database tables
      let store: any = null
      
      const firstQuery = await supabase
        .from('stores')
        .select('name, logo_url, primary_color, accent_color, font_family, campaign_title, campaign_subtitle, campaign_cta, campaign_tag, campaign_banner_url, marquee_text, banners, company_name, cnpj')
        .eq('id', storeId)
        .maybeSingle()

      if (firstQuery.error) {
        console.warn('Erro ao consultar novas colunas, tentando consulta legado...', firstQuery.error)
        
        // Fallback 1: Sem as colunas novas 'company_name' e 'cnpj'
        const fallbackQuery = await supabase
          .from('stores')
          .select('name, logo_url, primary_color, accent_color, font_family, campaign_title, campaign_subtitle, campaign_cta, campaign_tag, campaign_banner_url, marquee_text, banners')
          .eq('id', storeId)
          .maybeSingle()

        if (fallbackQuery.error) {
          console.warn('Erro ao consultar banners, tentando sem banners...', fallbackQuery.error)
          
          // Fallback 2: Sem banners e sem colunas novas
          const fallbackLegacyQuery = await supabase
            .from('stores')
            .select('name, logo_url, primary_color, accent_color, font_family, campaign_title, campaign_subtitle, campaign_cta, campaign_tag, campaign_banner_url, marquee_text')
            .eq('id', storeId)
            .maybeSingle()

          if (fallbackLegacyQuery.error) {
            throw fallbackLegacyQuery.error
          }
          store = fallbackLegacyQuery.data
        } else {
          store = fallbackQuery.data
        }
      } else {
        store = firstQuery.data
      }

      if (!store) {
        setErrorMsg('Esta loja não foi encontrada ou o link está incorreto.')
        setLoading(false)
        return
      }
      if (store) {
        setStoreName(store.name)
        setLogoUrl(store.logo_url)
        setPrimaryColor(store.primary_color || '#b5127b')
        setAccentColor(store.accent_color || '#1bbc9b')
        setFontFamily(store.font_family || 'Inter')
        setMarqueeText(store.marquee_text || null)
        setCompanyName(store.company_name || '')
        setCnpj(store.cnpj || '')

        // Parse banners array with fallback to legacy fields
        let loadedBanners: Banner[] = []
        if (store.banners && Array.isArray(store.banners) && store.banners.length > 0) {
          loadedBanners = store.banners.map((b: any) => ({
            title: b.title || '',
            subtitle: b.subtitle || '',
            cta: b.cta || '',
            tag: b.tag || '',
            banner_url: b.banner_url || null
          }))
        } else if (store.campaign_title || store.campaign_banner_url) {
          loadedBanners = [{
            title: store.campaign_title || '',
            subtitle: store.campaign_subtitle || '',
            cta: store.campaign_cta || '',
            tag: store.campaign_tag || '',
            banner_url: store.campaign_banner_url || null
          }]
        }
        setBanners(loadedBanners)
      }

      // Fetch Products with stock > 0
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .gt('quantity_in_stock', 0)
        .order('name', { ascending: true })

      if (prodsErr) throw prodsErr
      if (prods) {
        const inStockProds = prods.filter(p => p.quantity_in_stock > 0)
        setProducts(inStockProds)
        
        console.log('DEBUG STOREFRONT:', {
          storeName: store?.name,
          campaignTitle: store?.campaign_title,
          campaignTag: store?.campaign_tag,
          productsCount: prods.length,
          campaignProducts: prods.filter(p => {
            if (!store?.campaign_tag) return false
            const tag = store.campaign_tag.toLowerCase()
            return (
              (p.category && p.category.toLowerCase().includes(tag)) ||
              (p.brand && p.brand.toLowerCase().includes(tag)) ||
              p.name.toLowerCase().includes(tag)
            )
          })
        })

        // Check if there is a 'product' parameter in the URL on load
        const params = new URLSearchParams(window.location.search)
        const productId = params.get('product')
        if (productId) {
          const prod = prods.find(p => p.id === productId)
          if (prod) {
            setSelectedProduct(prod)
          }
        }
      }

      // Fetch WhatsApp storefront settings from integrations table
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials')
        .eq('store_id', storeId)
        .eq('provider', 'storefront')
        .single()

      if (integration) {
        setWhatsappNumber(integration.credentials?.whatsapp || '')
      }
    } catch (err: any) {
      console.error('Erro ao carregar vitrine:', err)
      setErrorMsg(err.message || 'Erro ao carregar os dados do banco.')
    } finally {
      setLoading(false)
    }
  }

  function addToCart(prod: Product) {
    if (prod.quantity_in_stock <= 0) {
      alert('Desculpe, este produto está esgotado.')
      return
    }
    const finalPrice = (prod.promotional_price && prod.promotional_price > 0) ? prod.promotional_price : prod.sale_price
    const prodWithPrice = { ...prod, sale_price: finalPrice }
    
    const existing = cart.find(item => item.id === prod.id)
    if (existing) {
      if (existing.qty >= prod.quantity_in_stock) {
        alert('Desculpe, quantidade máxima em estoque atingida.')
        return
      }
      setCart(cart.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item))
    } else {
      setCart([...cart, { ...prodWithPrice, qty: 1 }])
    }
  }

  // URL state management helpers for Product Details Drawer
  function openProductDetails(prod: Product) {
    setSelectedProduct(prod)
    const url = new URL(window.location.href)
    url.searchParams.set('product', prod.id)
    window.history.pushState({}, '', url.toString())
  }

  function closeProductDetails() {
    setSelectedProduct(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('product')
    window.history.pushState({}, '', url.toString())
  }

  function updateQty(id: string, delta: number) {
    const item = cart.find(i => i.id === id)
    if (!item) return

    const newQty = item.qty + delta
    if (newQty <= 0) {
      setCart(cart.filter(i => i.id !== id))
    } else {
      const prod = products.find(p => p.id === id)
      if (prod && newQty > prod.quantity_in_stock) {
        alert('Desculpe, limite de estoque atingido.')
        return
      }
      setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i))
    }
  }

  const activeBanner = banners[activeBannerIndex] || null
  const activeBannerTag = activeBanner ? activeBanner.tag : null

  // Filter products by Campaign Tag of the currently active banner
  const matchesCampaignTag = (p: Product) => {
    if (!activeBannerTag) return false
    const tag = activeBannerTag.toLowerCase()
    return (
      (p.category && p.category.toLowerCase().includes(tag)) ||
      (p.brand && p.brand.toLowerCase().includes(tag)) ||
      p.name.toLowerCase().includes(tag)
    )
  }

  const campaignProducts = activeBannerTag ? products.filter(matchesCampaignTag) : []
  const otherProducts = products // Não esconde produtos em destaque do catálogo geral
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

  const filteredProducts = otherProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  const cartTotal = cart.reduce((acc, item) => acc + (item.sale_price * item.qty), 0)
  const cartItemsCount = cart.reduce((acc, item) => acc + item.qty, 0)

  function handleSendOrder() {
    if (!clientName) {
      alert('Por favor, informe seu nome para o pedido.')
      return
    }

    if (deliveryType === 'delivery' && !address) {
      alert('Por favor, insira o endereço de entrega.')
      return
    }

    // Format WhatsApp message
    let message = `🌸 *NOVO PEDIDO - ${storeName.toUpperCase()}* 🌸\n\n`
    message += `👤 *Cliente:* ${clientName}\n`
    message += `🚚 *Método:* ${deliveryType === 'delivery' ? 'Entrega em Domicílio 🛵' : 'Retirar na Loja 🏪'}\n`
    if (deliveryType === 'delivery') {
      message += `📍 *Endereço:* ${address}\n`
    }
    message += `\n🛍️ *PRODUTOS SELECIONADOS:*\n`

    cart.forEach(item => {
      message += `- *${item.qty}x* ${item.name} (${item.brand || 'Geral'}) — R$ ${(item.sale_price * item.qty).toFixed(2)}\n`
    })

    message += `\n💰 *VALOR TOTAL DO PEDIDO:* R$ ${cartTotal.toFixed(2)}\n\n`
    message += `Olá! Gostaria de confirmar o meu pedido e combinar a forma de pagamento.`

    const phoneNum = whatsappNumber.replace(/\D/g, '') || '5500000000000'
    const encodedText = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNum}?text=${encodedText}`

    window.open(whatsappUrl, '_blank')
  }

  // Define dynamic style settings
  const storeStyles = {
    '--primary-color': primaryColor,
    '--accent-color': accentColor,
    fontFamily: `${fontFamily}, sans-serif`
  } as React.CSSProperties

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">Preparando vitrine virtual...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Loja não encontrada</h2>
        <p className="text-sm text-slate-400 mt-2">{errorMsg}</p>
        <p className="text-xs text-rose-500/80 mt-6 max-w-md bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 rounded-lg p-3">
          Se você for o proprietário desta loja, por favor certifique-se de que todas as tabelas e colunas adicionais foram criadas no painel do Supabase executando o arquivo de migração SQL.
        </p>
      </div>
    )
  }

  if (!storeName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Loja não encontrada</h2>
        <p className="text-sm text-slate-400 mt-2">O link que você acessou parece estar incorreto ou a loja não existe.</p>
      </div>
    )
  }

  return (
    <div style={storeStyles} className="min-h-screen bg-[#FCF8F9] dark:bg-zinc-950 pb-24 text-slate-800 dark:text-zinc-100 transition-colors duration-200">
      
      {/* Dynamic Keyframe Style injection for Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-left: 20%;
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* Ticker Promotional Bar */}
      <div className="bg-neutral-900 text-[10px] text-white py-2 px-4 uppercase tracking-widest font-semibold text-center overflow-hidden whitespace-nowrap border-b border-white/5">
        <div className="inline-block animate-marquee">
          {marqueeText ? (
            <>
              {marqueeText} &nbsp;•&nbsp; {marqueeText} &nbsp;•&nbsp; {marqueeText}
            </>
          ) : (
            <>
              ⚡ FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 150 &nbsp;•&nbsp; 💳 PARCELE EM ATÉ 3X SEM JUROS &nbsp;•&nbsp; 💄 PRODUTOS 100% VEGANOS &nbsp;•&nbsp; ⚡ 5% DESCONTO ADICIONAL NO PIX &nbsp;•&nbsp; 🌸 REALCE SUA BELEZA &nbsp;•&nbsp; ⚡ FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 150 &nbsp;•&nbsp; 💳 PARCELE EM ATÉ 3X SEM JUROS &nbsp;•&nbsp; 💄 PRODUTOS 100% VEGANOS &nbsp;•&nbsp; ⚡ 5% DESCONTO ADICIONAL NO PIX &nbsp;•&nbsp; 🌸 REALCE SUA BELEZA
            </>
          )}
        </div>
      </div>

      {/* Glassmorphism Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-pink-100/30 dark:border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 max-w-[150px] object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] text-white font-extrabold text-sm flex items-center justify-center shadow-lg shadow-pink-500/10">
                  {storeName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-base font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">{storeName}</h1>
                  <span className="text-[9px] uppercase tracking-wider text-[var(--primary-color)] font-bold">Vitrine Virtual</span>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setCartOpen(true)}
            className="relative p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/50 dark:border-zinc-700 transition-all active:scale-95"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--accent-color)] text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        
        {/* Campaign Banners Carousel */}
        {banners.length > 0 && (
          <div className="relative group overflow-hidden rounded-[32px] shadow-2xl bg-neutral-900 min-h-[260px] md:min-h-[300px] flex flex-col justify-between">
            {/* Carousel Slides wrapper */}
            <div className="relative flex-1 flex items-center min-h-[260px] md:min-h-[300px]">
              {banners.map((banner, index) => {
                const isActive = activeBannerIndex === index
                return (
                  <div
                    key={index}
                    style={{
                      backgroundImage: banner.banner_url
                        ? `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.85)), url(${banner.banner_url})`
                        : `linear-gradient(to right, var(--primary-color), #0a0a0a)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    className={`absolute inset-0 w-full h-full p-6 md:p-12 flex items-center transition-all duration-750 ease-in-out ${
                      isActive 
                        ? 'opacity-100 z-10 scale-100' 
                        : 'opacity-0 z-0 scale-95 pointer-events-none'
                    }`}
                  >
                    {/* Glowing details inside banner */}
                    <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="max-w-lg z-10 space-y-4 text-left">
                      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-[9px] uppercase font-black tracking-widest px-3.5 py-1 rounded-full border border-white/10">
                        <Sparkles className="w-3 h-3 text-pink-200" /> Destaque {index + 1} 🌟
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-tight text-white">
                        {banner.title || 'Mimus Cosméticos'}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-xs md:text-sm text-pink-100/90 font-medium leading-relaxed max-w-sm">
                          {banner.subtitle}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          const el = document.getElementById('products-catalog')
                          if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="inline-flex items-center gap-2 bg-white text-[var(--primary-color)] text-xs font-black tracking-wider uppercase px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        {banner.cta || 'Aproveitar Agora'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Decorative layout icon */}
                    <div className="hidden md:flex absolute right-12 bottom-0 top-0 items-center justify-end w-1/3">
                      <div className="w-48 h-48 rounded-full border-8 border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner bg-white/5">
                        <ShoppingBag className="w-20 h-20 text-white/10" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Navigation Dots (pill style) */}
            {banners.length > 1 && (
              <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center gap-1.5">
                {banners.map((_, index) => {
                  const isActive = activeBannerIndex === index
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveBannerIndex(index)}
                      className={`rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'bg-white w-6 h-2' 
                          : 'bg-white/40 w-2 h-2 hover:bg-white/60'
                      }`}
                      aria-label={`Ir para slide ${index + 1}`}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Campaign Tag Highlighted Products */}
        {campaignProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100/40 pb-2">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="w-4.5 h-4.5 text-[var(--primary-color)]" />
                {activeBannerTag || 'Ofertas Selecionadas'}
              </h2>
              <span className="text-[9px] font-black text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                DESTAQUES 🔥
              </span>
            </div>
            
            <div className="flex items-center gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none">
              {campaignProducts.map(prod => {
                return (
                   <div 
                    key={prod.id} 
                    onClick={() => openProductDetails(prod)}
                    className="w-48 bg-white dark:bg-zinc-900 rounded-[24px] border border-slate-100 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col flex-shrink-0 relative group hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  >
                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                      {prod.promotional_price && prod.promotional_price > 0 && (
                        <div className="bg-[var(--primary-color)] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                          {Math.round((1 - prod.promotional_price / prod.sale_price) * 100)}% OFF
                        </div>
                      )}
                      {prod.has_free_shipping && (
                        <div className="bg-emerald-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                          FRETE GRÁTIS
                        </div>
                      )}
                    </div>

                    <div className="aspect-square bg-slate-50 dark:bg-zinc-950 relative flex items-center justify-center text-slate-300 border-b border-slate-50 dark:border-zinc-950 overflow-hidden">
                      {prod.image_url ? (
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-rose-50 dark:bg-zinc-900 w-full h-full flex items-center justify-center">
                          {prod.name.slice(0, 3)}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-[var(--primary-color)] uppercase tracking-wider block">
                          {prod.brand || 'Exclusivo'}
                        </span>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mt-0.5 line-clamp-2 leading-tight h-8">
                          {prod.name}
                        </h3>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col">
                          {prod.promotional_price && prod.promotional_price > 0 ? (
                            <>
                              <span className="text-[10px] text-slate-400 line-through">
                                R$ {prod.sale_price.toFixed(2)}
                              </span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                R$ {prod.promotional_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              R$ {prod.sale_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                          className="w-full py-2.5 rounded-xl bg-[var(--accent-color)] hover:opacity-95 text-white font-extrabold text-[10px] uppercase transition-all active:scale-[0.97] shadow-sm shadow-[var(--accent-color)]/10"
                        >
                          COMPRAR AGORA
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Regular Catalog Section */}
        <div id="products-catalog" className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-100/30 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                Nosso Catálogo
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Explore nossos cosméticos e monte sua sacola</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cosméticos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-xs shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Categories Bar */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === null 
                    ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white shadow-md' 
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                Todos os Produtos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white shadow-md' 
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
              <ShoppingBag className="w-12 h-12 text-slate-350 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Nenhum produto disponível</h3>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar sua busca ou escolha outra categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.map(prod => {
                const originalPrice = prod.sale_price * 1.2 // 20% fake original price
                return (
                  <div 
                    key={prod.id} 
                    onClick={() => openProductDetails(prod)}
                    className="bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-100 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group relative cursor-pointer"
                  >
                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                      {prod.has_free_shipping && (
                        <div className="bg-pink-500/10 text-[var(--primary-color)] text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full" style={{ color: primaryColor }}>
                          FRETE GRÁTIS
                        </div>
                      )}
                      {prod.promotional_price && prod.promotional_price > 0 && (
                        <div className="bg-emerald-505/10 text-emerald-600 bg-emerald-55 bg-emerald-500/10 text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full">
                          PROMO
                        </div>
                      )}
                    </div>

                    <div className="aspect-square bg-slate-50 dark:bg-zinc-950 relative flex items-center justify-center text-slate-300 border-b border-slate-50 dark:border-zinc-950 overflow-hidden">
                      {prod.image_url ? (
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-rose-50 dark:bg-zinc-900 w-full h-full flex items-center justify-center">
                          {prod.name.slice(0, 3)}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                          {prod.brand || 'Cosméticos'}
                        </span>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mt-0.5 line-clamp-2 leading-tight h-8">
                          {prod.name}
                        </h3>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {prod.promotional_price && prod.promotional_price > 0 ? (
                            <>
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                R$ {prod.promotional_price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                R$ {prod.sale_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              R$ {prod.sale_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                          className="w-full mt-3 py-2 rounded-xl bg-[var(--accent-color)] hover:opacity-95 text-white font-extrabold text-[10px] uppercase transition-all active:scale-[0.97]"
                        >
                          ADICIONAR
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* High-conversion trust indicators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-pink-100/30">
          <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center gap-3">
            <Truck className="w-8 h-8 text-[var(--primary-color)] flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Frete Rápido</h4>
              <p className="text-[9.5px] text-slate-400">Entregamos com agilidade</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[var(--primary-color)] flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Compra Segura</h4>
              <p className="text-[9.5px] text-slate-400">Dados 100% protegidos</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center gap-3">
            <Percent className="w-8 h-8 text-[var(--primary-color)] flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold">5% OFF no PIX</h4>
              <p className="text-[9.5px] text-slate-400">Desconto acumulativo</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center gap-3">
            <Phone className="w-8 h-8 text-[var(--primary-color)] flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Suporte Direto</h4>
              <p className="text-[9.5px] text-slate-400">Dúvidas via WhatsApp</p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-pink-100/30 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md py-8 text-center text-xs text-slate-500 dark:text-zinc-400 space-y-4">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="font-extrabold uppercase text-[var(--primary-color)] tracking-wide">{storeName}</h4>
            {companyName && <p className="font-medium text-slate-750 dark:text-zinc-350">{companyName}</p>}
            {cnpj && <p className="text-[10px] opacity-80">CNPJ: {cnpj}</p>}
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1.5 text-slate-600 dark:text-zinc-300">
            <div className="flex items-center gap-1.5 text-emerald-650 dark:text-emerald-450 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              🛡️ Compra Segura
            </div>
            <p className="text-[10px] opacity-70">Seus dados pessoais e de pagamento estão 100% protegidos.</p>
          </div>
        </div>
        <div className="text-[10px] opacity-60 max-w-5xl mx-auto px-4 border-t border-pink-100/10 dark:border-zinc-800/40 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
          <p>Compra Segura com tecnologia Mimus 🌸</p>
        </div>
      </footer>

      {/* Floating Cart Drawer Indicator */}
      {cartItemsCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-lg mx-auto animate-bounce-short">
          <button 
            onClick={() => setCartOpen(true)}
            className="w-full bg-slate-900 hover:bg-black dark:bg-zinc-900 dark:hover:bg-zinc-950 text-white px-6 py-4 rounded-2xl flex items-center justify-between shadow-2xl transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-[var(--accent-color)] text-white text-[9px] font-black px-2 py-1 rounded-md">
                {cartItemsCount}
              </span>
              <span className="text-xs font-bold">Ver sacola de compras</span>
            </div>
            <div className="flex items-center gap-1 font-extrabold text-sm">
              R$ {cartTotal.toFixed(2)} <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[var(--primary-color)]" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Minha Sacola</h2>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-850 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Cart Items list) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 gap-2">
                  <ShoppingBag className="w-12 h-12 text-slate-200 dark:text-zinc-800" />
                  <p className="text-xs">Sua sacola está vazia.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 text-xs"
                      >
                        <div className="flex-1 pr-3">
                          <h4 className="font-bold text-slate-700 dark:text-zinc-200 line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] text-slate-400">{item.brand || 'Geral'}</span>
                          <p className="font-extrabold text-slate-800 dark:text-white mt-1">R$ {item.sale_price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 flex items-center justify-center font-bold text-slate-700 dark:text-zinc-300"
                          >
                            -
                          </button>
                          <span className="font-bold w-4 text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 flex items-center justify-center font-bold text-slate-700 dark:text-zinc-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer information Form */}
                  <div className="pt-5 border-t border-slate-100 dark:border-zinc-850 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-[var(--primary-color)]" /> Detalhes da Entrega
                    </h3>
                    
                    <div className="space-y-3 text-xs font-medium">
                      <div>
                        <label className="block text-slate-400 mb-1">Seu Nome *</label>
                        <input 
                          type="text" 
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Informe seu nome completo"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Opção de Entrega</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setDeliveryType('pickup')}
                            className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-semibold ${
                              deliveryType === 'pickup' 
                                ? 'border-[var(--primary-color)] bg-pink-50/30 dark:bg-pink-950/10 text-[var(--primary-color)] font-bold shadow-sm' 
                                : 'border-slate-200 dark:border-zinc-800 text-slate-500 dark:hover:bg-zinc-850 hover:bg-slate-50'
                            }`}
                          >
                            <Store className="w-3.5 h-3.5" /> Retirar na Loja
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDeliveryType('delivery')}
                            className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-semibold ${
                              deliveryType === 'delivery' 
                                ? 'border-[var(--primary-color)] bg-pink-50/30 dark:bg-pink-950/10 text-[var(--primary-color)] font-bold shadow-sm' 
                                : 'border-slate-200 dark:border-zinc-800 text-slate-500 dark:hover:bg-zinc-850 hover:bg-slate-50'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5" /> Receber em Casa
                          </button>
                        </div>
                      </div>

                      {deliveryType === 'delivery' && (
                        <div>
                          <label className="block text-slate-400 mb-1">Endereço Completo de Entrega *</label>
                          <textarea 
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Rua, número, complemento, bairro, cidade"
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer (Total and WhatsApp send) */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 space-y-4">
                <div className="flex justify-between items-center text-slate-800 dark:text-white">
                  <span className="text-xs font-semibold text-slate-400">Total do pedido:</span>
                  <span className="text-lg font-black">R$ {cartTotal.toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={handleSendOrder}
                  className="w-full py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-[0.98] transition-all"
                >
                  <Phone className="w-4 h-4 fill-white" /> ENVIAR PEDIDO VIA WHATSAPP <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Product Details Drawer Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
              <span className="text-[10px] font-black uppercase text-[var(--primary-color)] tracking-wider">
                Detalhes do Produto
              </span>
              <button 
                onClick={closeProductDetails}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-850 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Product details) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Product Large Image */}
              <div className="aspect-square bg-slate-50 dark:bg-zinc-950 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-850/85 relative flex items-center justify-center text-slate-350 shadow-inner group">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                  {selectedProduct.promotional_price && selectedProduct.promotional_price > 0 && (
                    <div className="bg-[var(--primary-color)] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md">
                      {Math.round((1 - selectedProduct.promotional_price / selectedProduct.sale_price) * 100)}% OFF
                    </div>
                  )}
                  {selectedProduct.has_free_shipping && (
                    <div className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md">
                      FRETE GRÁTIS
                    </div>
                  )}
                </div>

                {selectedProduct.image_url ? (
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShoppingBag className="w-12 h-12 text-slate-250 dark:text-zinc-800" />
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">{selectedProduct.name.slice(0, 3)}</span>
                  </div>
                )}
              </div>

              {/* Title & Brand */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[var(--primary-color)] uppercase tracking-widest block">
                  {selectedProduct.brand || 'Coleção Exclusiva'}
                </span>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white leading-tight">
                  {selectedProduct.name}
                </h1>
                {selectedProduct.category && (
                  <span className="inline-block bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-300 text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full mt-1.5 uppercase">
                    Categoria: {selectedProduct.category}
                  </span>
                )}
              </div>

              {/* Pricing section */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-100 dark:border-zinc-850/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  {selectedProduct.promotional_price && selectedProduct.promotional_price > 0 ? (
                    <>
                      <span className="text-[10px] text-slate-400 line-through block">De: R$ {selectedProduct.sale_price.toFixed(2)}</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {selectedProduct.promotional_price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {selectedProduct.sale_price.toFixed(2)}</span>
                  )}
                </div>

                {/* Stock alert */}
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Disponibilidade</span>
                  <span className={`text-[10px] font-extrabold ${selectedProduct.quantity_in_stock <= 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedProduct.quantity_in_stock <= 5 
                      ? `Apenas ${selectedProduct.quantity_in_stock} un. restantes!` 
                      : 'Em estoque'}
                  </span>
                </div>
              </div>

              {/* Description section */}
              <div className="space-y-2 border-t border-slate-100 dark:border-zinc-850 pt-5">
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-[var(--primary-color)]" /> Descrição do Cosmético
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
                  {selectedProduct.description || 
                    `Este cosmético exclusivo foi desenvolvido com ingredientes de alta performance para realçar sua beleza natural. Perfeito para complementar sua rotina diária de autocuidado com sofisticação e resultados visíveis desde a primeira aplicação.`}
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-zinc-850 pt-5 text-[10px] text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌱</span> 100% Vegano & Cruelty Free
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span> Testado Dermatologicamente
                </div>
              </div>

            </div>

            {/* Drawer Footer (Buy button) */}
            <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
              {selectedProduct.quantity_in_stock <= 0 ? (
                <button 
                  disabled
                  className="w-full py-4 px-4 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 font-extrabold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  PRODUTO ESGOTADO
                </button>
              ) : (
                <button 
                  onClick={() => {
                    addToCart(selectedProduct)
                    closeProductDetails()
                    setCartOpen(true)
                  }}
                  style={{ backgroundColor: accentColor }}
                  className="w-full py-4 px-4 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  ADICIONAR À SACOLA — R$ {selectedProduct.sale_price.toFixed(2)}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
