'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Sparkles, 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Volume2, 
  Layout, 
  Eye, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react'

const GOOGLE_FONTS = [
  { name: 'Inter', value: 'Inter', type: 'sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display', type: 'serif' },
  { name: 'Poppins', value: 'Poppins', type: 'sans-serif' },
  { name: 'Montserrat', value: 'Montserrat', type: 'sans-serif' },
  { name: 'Lora', value: 'Lora', type: 'serif' },
  { name: 'Outfit', value: 'Outfit', type: 'sans-serif' }
]

export default function SettingsPage() {
  const supabase = createClient()

  // Loading States
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Store & Integration ID
  const [storeId, setStoreId] = useState('')

  // Form Fields
  const [storeName, setStoreName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#b5127b')
  const [accentColor, setAccentColor] = useState('#1bbc9b')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [marqueeText, setMarqueeText] = useState('')

interface BannerConfig {
  title: string
  subtitle: string
  cta: string
  tag: string
  banner_url: string | null
  file: File | null
  preview: string | null
}

  // Campaign Banners State
  const [banners, setBanners] = useState<BannerConfig[]>([
    { title: '', subtitle: '', cta: '', tag: '', banner_url: null, file: null, preview: null },
    { title: '', subtitle: '', cta: '', tag: '', banner_url: null, file: null, preview: null },
    { title: '', subtitle: '', cta: '', tag: '', banner_url: null, file: null, preview: null }
  ])
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  // File Upload State
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Load Custom Font Family for Settings Live Preview
  useEffect(() => {
    if (fontFamily) {
      const linkId = 'settings-dynamic-font'
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;600;800;900&display=swap`
    }
  }, [fontFamily])

  useEffect(() => {
    loadStoreSettings()
  }, [])

  async function loadStoreSettings() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setStoreId(profile.store_id)

        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('id', profile.store_id)
          .single()

        if (store) {
          setStoreName(store.name || '')
          setLogoUrl(store.logo_url || null)
          setLogoPreview(store.logo_url || null)
          setPrimaryColor(store.primary_color || '#b5127b')
          setAccentColor(store.accent_color || '#1bbc9b')
          setFontFamily(store.font_family || 'Inter')
          setMarqueeText(store.marquee_text || '')

          // Load banners
          let loadedBanners: any[] = []
          if (store.banners && Array.isArray(store.banners) && store.banners.length > 0) {
            loadedBanners = store.banners
          } else if (store.campaign_title || store.campaign_banner_url) {
            // Fallback for legacy campaign fields
            loadedBanners = [{
              title: store.campaign_title || '',
              subtitle: store.campaign_subtitle || '',
              cta: store.campaign_cta || '',
              tag: store.campaign_tag || '',
              banner_url: store.campaign_banner_url || null
            }]
          }

          const newBanners = [
            { title: '', subtitle: '', cta: '', tag: '', banner_url: null, file: null, preview: null },
            { title: '', subtitle: '', cta: '', tag: '', banner_url: null, file: null, preview: null },
            { title: '', subtitle: '', cta: '', tag: '', banner_url: null, file: null, preview: null }
          ]

          for (let i = 0; i < 3; i++) {
            if (loadedBanners[i]) {
              newBanners[i] = {
                title: loadedBanners[i].title || '',
                subtitle: loadedBanners[i].subtitle || '',
                cta: loadedBanners[i].cta || '',
                tag: loadedBanners[i].tag || '',
                banner_url: loadedBanners[i].banner_url || null,
                file: null,
                preview: loadedBanners[i].banner_url || null
              }
            }
          }
          setBanners(newBanners)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  function handleBannerFieldChange(field: keyof BannerConfig, value: any) {
    setBanners(prev => prev.map((b, idx) => {
      if (idx === activeBannerIndex) {
        return { ...b, [field]: value }
      }
      return b
    }))
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBanners(prev => prev.map((b, idx) => {
        if (idx === activeBannerIndex) {
          return { ...b, file, preview: URL.createObjectURL(file) }
        }
        return b
      }))
    }
  }

  function handleRemoveBanner() {
    setBanners(prev => prev.map((b, idx) => {
      if (idx === activeBannerIndex) {
        return { ...b, file: null, preview: null, banner_url: null }
      }
      return b
    }))
  }

  async function uploadLogo(storeId: string): Promise<string | null> {
    if (!logoFile) return logoUrl

    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${storeId}/logo-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (err) {
      console.error('Erro no upload da logo:', err)
      return null
    }
  }

  async function uploadBannerAtIndex(storeId: string, index: number, banner: BannerConfig): Promise<string | null> {
    if (!banner.file) return banner.banner_url

    try {
      const fileExt = banner.file.name.split('.').pop()
      const fileName = `${storeId}/banner-${index}-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, banner.file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (err) {
      console.error(`Erro no upload do banner ${index + 1}:`, err)
      return null
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaveLoading(true)
    setMessage(null)

    try {
      let finalLogoUrl = logoUrl

      if (logoFile) {
        const uploadedLogo = await uploadLogo(storeId)
        if (uploadedLogo) {
          finalLogoUrl = uploadedLogo
          setLogoUrl(uploadedLogo)
          setLogoFile(null)
        }
      }

      // Upload each banner and construct banners array to save
      const finalBannersToSave: any[] = []
      const updatedBannersState = [...banners]

      for (let i = 0; i < banners.length; i++) {
        const b = banners[i]
        if (b.file) {
          const uploadedUrl = await uploadBannerAtIndex(storeId, i, b)
          if (uploadedUrl) {
            updatedBannersState[i] = {
              ...b,
              banner_url: uploadedUrl,
              file: null,
              preview: uploadedUrl
            }
          }
        }

        // Add to array if there is at least a title, subtitle, tag, or url
        if (updatedBannersState[i].title || updatedBannersState[i].subtitle || updatedBannersState[i].banner_url || updatedBannersState[i].cta || updatedBannersState[i].tag) {
          finalBannersToSave.push({
            title: updatedBannersState[i].title || '',
            subtitle: updatedBannersState[i].subtitle || '',
            cta: updatedBannersState[i].cta || '',
            tag: updatedBannersState[i].tag || '',
            banner_url: updatedBannersState[i].banner_url || null
          })
        }
      }
      setBanners(updatedBannersState)

      const firstBanner = finalBannersToSave[0] || null

      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          logo_url: finalLogoUrl,
          primary_color: primaryColor,
          accent_color: accentColor,
          font_family: fontFamily,
          // Mirror first banner for backwards compatibility
          campaign_title: firstBanner ? firstBanner.title : null,
          campaign_subtitle: firstBanner ? firstBanner.subtitle : null,
          campaign_cta: firstBanner ? firstBanner.cta : null,
          campaign_tag: firstBanner ? firstBanner.tag : null,
          campaign_banner_url: firstBanner ? firstBanner.banner_url : null,
          // New banners array
          banners: finalBannersToSave,
          marquee_text: marqueeText || null
        })
        .eq('id', storeId)

      if (error) {
        // If it's a DDL missing column error, notify the user gracefully but save the rest
        if (error.code === '42703') {
          throw new Error('Coluna "banners" não existe no banco de dados. Por favor, execute a query SQL indicada no SQL Editor do Supabase.')
        }
        throw error
      }

      setMessage({ type: 'success', text: 'Configurações da loja salvas com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar configurações.' })
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <Palette className="w-6 h-6 text-rose-500" /> Personalizar Vitrine & Campanha
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Personalize as cores, fontes, logotipo e configure uma campanha ativa para destacar na sua loja virtual.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' 
            : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Form Editor */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Branding and Theme */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-50 dark:border-zinc-800/60 pb-2 flex items-center gap-2">
              <Layout className="w-4 h-4 text-rose-500" /> Identidade Visual
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="col-span-2">
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Nome da Loja *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Logo Upload */}
              <div className="col-span-2 space-y-2">
                <label className="block text-slate-400 dark:text-zinc-500">Logotipo da Loja</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-350" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-350 hover:border-rose-500 rounded-xl cursor-pointer text-[11px] font-bold hover:text-rose-500 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Escolher Logotipo
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  {logoPreview && (
                    <button 
                      type="button" 
                      onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null); }}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Cor Principal (Identidade)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 border border-slate-200 dark:border-zinc-850 rounded-lg cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Cor Secundária (Botões/Compra)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 border border-slate-200 dark:border-zinc-850 rounded-lg cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div className="col-span-2">
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Fonte da Loja</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 font-semibold text-slate-700 dark:text-zinc-350 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {GOOGLE_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Promotional Campaign */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 dark:border-zinc-800/60 pb-2">
              <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" /> Carrossel de Campanhas (Múltiplos Banners)
              </h2>
              <span className="text-[10px] text-slate-450 dark:text-zinc-555 font-normal text-slate-400">Configure até 3 banners rotativos</span>
            </div>

            {/* Banner Tab Selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-950 p-1 rounded-xl w-fit border border-slate-100 dark:border-zinc-850">
              {[0, 1, 2].map((idx) => {
                const isActive = activeBannerIndex === idx
                const banner = banners[idx]
                const isConfigured = banner.title || banner.preview
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveBannerIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-155 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100/50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span>Banner {idx + 1}</span>
                    {isConfigured ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-zinc-700" />
                    )}
                  </button>
                )
              })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold pt-2">
              <div className="col-span-2">
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Título da Campanha (Banner {activeBannerIndex + 1})</label>
                <input
                  type="text"
                  placeholder="Ex: Coleção Especial Outono/Inverno 🍂"
                  value={banners[activeBannerIndex].title}
                  onChange={(e) => handleBannerFieldChange('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Subtítulo / Descrição da Campanha</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Descubra cosméticos com até 30% OFF selecionados especialmente."
                  value={banners[activeBannerIndex].subtitle}
                  onChange={(e) => handleBannerFieldChange('subtitle', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Texto do Botão (CTA)</label>
                <input
                  type="text"
                  placeholder="Ex: Ver Coleção"
                  value={banners[activeBannerIndex].cta}
                  onChange={(e) => handleBannerFieldChange('cta', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Filtrar por Categoria / Tag</label>
                <input
                  type="text"
                  placeholder="Ex: Boca"
                  value={banners[activeBannerIndex].tag}
                  onChange={(e) => handleBannerFieldChange('tag', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[9px] text-slate-400 dark:text-zinc-550 mt-1 block">Filtra os produtos destacados que correspondem a este termo.</span>
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">Texto da Barra de Anúncios Superior (Rotativa)</label>
                <input
                  type="text"
                  placeholder="Ex: ⚡ FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 150 • 💳 PARCELE EM ATÉ 3X SEM JUROS"
                  value={marqueeText}
                  onChange={(e) => setMarqueeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[9px] text-slate-400 dark:text-zinc-550 mt-1 block font-normal">Escreva a mensagem promocional que ficará rolando no topo da sua vitrine.</span>
              </div>

              {/* Campaign Banner Upload */}
              <div className="col-span-2 space-y-2 pt-2">
                <label className="block text-slate-400 dark:text-zinc-500">Banner de Fundo da Campanha (Hero - Banner {activeBannerIndex + 1})</label>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:w-64 h-24 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {banners[activeBannerIndex].preview ? (
                      <img src={banners[activeBannerIndex].preview} alt={`Banner ${activeBannerIndex + 1} preview`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-450 dark:text-zinc-650">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                        <span className="text-[10px]">Sem banner (usará gradiente sólido)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-350 hover:border-rose-500 rounded-xl cursor-pointer text-[11px] font-bold hover:text-rose-500 transition-colors w-fit">
                      <Upload className="w-3.5 h-3.5" /> Escolher Banner {activeBannerIndex + 1}
                      <input type="file" accept="image/*" onChange={handleBannerFileChange} className="hidden" />
                    </label>
                    {banners[activeBannerIndex].preview && (
                      <button 
                        type="button" 
                        onClick={handleRemoveBanner}
                        className="text-[10px] text-rose-500 hover:underline text-left w-fit"
                      >
                        Remover Banner {activeBannerIndex + 1}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98]"
            >
              {saveLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Alterações
            </button>
          </div>
        </form>

        {/* Right Side: Live Mockup Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Eye className="w-4.5 h-4.5" /> Visualização em Tempo Real (Mockup)
          </h2>

          {/* Device Mockup Shell */}
          <div 
            style={{ fontFamily: `${fontFamily}, sans-serif` }}
            className="w-full bg-[#FCF8F9] dark:bg-zinc-950 rounded-[36px] border border-slate-200 dark:border-zinc-850 shadow-xl overflow-hidden pb-8 transition-all duration-300"
          >
            {/* Ticker marquee preview */}
            <div className="bg-neutral-900 text-[8px] text-white py-1.5 px-3 uppercase tracking-wider text-center font-semibold opacity-90 overflow-hidden whitespace-nowrap">
              {marqueeText || '⚡ FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 150 • 💳 PARCELE EM ATÉ 3X'}
            </div>

            {/* Header Preview */}
            <div className="px-4 py-3 bg-white/90 dark:bg-zinc-900/90 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {logoPreview ? (
                  <img src={logoPreview} alt="Store logo" className="h-6 max-w-[80px] object-contain" />
                ) : (
                  <div 
                    style={{ backgroundColor: primaryColor }}
                    className="w-6 h-6 rounded-full text-white font-extrabold text-[9px] flex items-center justify-center shadow-md"
                  >
                    {storeName ? storeName.slice(0, 2).toUpperCase() : 'LO'}
                  </div>
                )}
                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white leading-none">
                  {storeName || 'Sua Loja'}
                </span>
              </div>
              
              <div className="relative p-1.5 rounded-full bg-slate-50 dark:bg-zinc-800">
                <ShoppingBag className="w-4.5 h-4.5 text-slate-700 dark:text-zinc-200" />
                <span 
                  style={{ backgroundColor: accentColor }}
                  className="absolute -top-1 -right-1 text-white font-extrabold text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow"
                >
                  1
                </span>
              </div>
            </div>

            {/* Mockup Body Content */}
            <div className="p-4 space-y-4">
              
              {/* Campaign Banner Preview */}
              {banners.some(b => b.title || b.preview) ? (
                <div className="relative group space-y-2">
                  <div 
                    style={{ 
                      backgroundImage: banners[activeBannerIndex].preview 
                        ? `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.85)), url(${banners[activeBannerIndex].preview})`
                        : `linear-gradient(135deg, ${primaryColor}, #0a0a0a)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden space-y-2 text-left min-h-[140px] flex flex-col justify-center transition-all duration-300"
                  >
                    <span className="inline-block bg-white/20 text-[7px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full w-fit">
                      Campanha {activeBannerIndex + 1} 🌟
                    </span>
                    <h3 className="text-sm font-black leading-tight">
                      {banners[activeBannerIndex].title || 'Título da Campanha'}
                    </h3>
                    {banners[activeBannerIndex].subtitle && (
                      <p className="text-[9px] text-pink-100/80 font-medium leading-relaxed line-clamp-2">
                        {banners[activeBannerIndex].subtitle}
                      </p>
                    )}
                    <button 
                      style={{ color: primaryColor }}
                      className="bg-white text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow hover:scale-105 transition-transform w-fit flex items-center gap-1 mt-1"
                    >
                      {banners[activeBannerIndex].cta || 'Aproveitar'} <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Dot selectors in mockup */}
                  <div className="flex justify-center gap-1.5">
                    {banners.map((_, idx) => {
                      const isActive = activeBannerIndex === idx
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveBannerIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                            isActive 
                              ? 'bg-rose-500 scale-125' 
                              : 'bg-slate-350 dark:bg-zinc-700'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-350 dark:border-zinc-800/80 rounded-2xl p-4 text-center py-6 text-slate-400 text-[10px]">
                  Sem campanha ativa configurada. Preencha os campos ao lado para ativar o carrossel de destaques.
                </div>
              )}

              {/* Product Grid Mockup */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-1">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">
                    {banners[activeBannerIndex].tag ? `Destaques: ${banners[activeBannerIndex].tag}` : 'Nossos Cosméticos'}
                  </span>
                  <span 
                    style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
                    className="text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  >
                    Novo 🔥
                  </span>
                </div>

                {/* Mock Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 p-3 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden group">
                  <div className="absolute top-2 left-2 bg-pink-500/10 text-[var(--primary-color)] text-[7px] font-black px-1.5 py-0.2 rounded" style={{ color: primaryColor }}>
                    FRETE GRÁTIS
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center flex-shrink-0 text-slate-300 font-bold text-[8px] border border-slate-100 dark:border-zinc-800">
                    <ImageIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span 
                      style={{ color: primaryColor }}
                      className="text-[8px] font-bold uppercase tracking-wider block"
                    >
                      Mimus Cosmetics
                    </span>
                    <h4 className="text-[10px] font-bold text-slate-700 dark:text-zinc-200 truncate mt-0.5">
                      Batom Matte Rosé Intenso
                    </h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[10px] font-black text-slate-800 dark:text-white">
                        R$ 29,90
                      </span>
                      <span className="text-[8px] text-slate-400 line-through">
                        R$ 39,90
                      </span>
                    </div>
                  </div>

                  <button 
                    style={{ backgroundColor: accentColor }}
                    className="py-1.5 px-3 rounded-lg text-white font-extrabold text-[8px] uppercase self-end hover:opacity-95 shadow-sm active:scale-95 transition-all"
                  >
                    ADICIONAR
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
