'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  ShoppingBag, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Eye, 
  Tag, 
  Palette,
  CheckCircle2
} from 'lucide-react'

export interface StorefrontTheme {
  primary_color: string
  banner_title: string
  banner_subtitle: string
  banner_image_url: string | null
  layout_style: string
  featured_badge: string
}

interface VitrinePreviewProps {
  storeId: string
  storeName: string
  theme: StorefrontTheme
  products: any[]
  isLiveUpdating?: boolean
}

export default function VitrinePreview({
  storeId,
  storeName,
  theme,
  products,
  isLiveUpdating = false
}: VitrinePreviewProps) {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile')
  const [activeTab, setActiveTab] = useState<'all' | 'launch'>('all')

  const visibleProducts = products.filter(p => p.visible_in_storefront !== false)
  const launchProducts = visibleProducts.filter(p => p.is_launch)
  const displayProducts = activeTab === 'launch' ? launchProducts : visibleProducts

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Vitrine Studio (Live)
          </div>
          {isLiveUpdating && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Sincronizando IA...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device Toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                deviceMode === 'mobile' 
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visão Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                deviceMode === 'desktop' 
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visão Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={`/store/${storeId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Ver Loja</span>
          </a>
        </div>
      </div>

      {/* Preview Frame Container */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start bg-slate-200/60 dark:bg-black/40">
        <div 
          className={`bg-white dark:bg-zinc-900 shadow-2xl transition-all duration-300 overflow-hidden ${
            deviceMode === 'mobile' 
              ? 'w-[375px] rounded-[36px] border-[6px] border-slate-800 dark:border-zinc-700 my-2' 
              : 'w-full max-w-2xl rounded-2xl border border-slate-300 dark:border-zinc-700 my-2'
          }`}
        >
          {/* Mobile Notch bar if in mobile mode */}
          {deviceMode === 'mobile' && (
            <div className="h-5 bg-slate-800 dark:bg-zinc-700 flex justify-center items-center">
              <div className="w-20 h-3 bg-black rounded-b-lg"></div>
            </div>
          )}

          {/* Storefront Header */}
          <div 
            className="px-4 py-3 flex items-center justify-between text-white transition-colors"
            style={{ backgroundColor: theme.primary_color || '#E11D48' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                {storeName.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-sm tracking-tight truncate max-w-[180px]">
                {storeName}
              </span>
            </div>
            <div className="relative">
              <ShoppingBag className="w-4 h-4 opacity-90" />
            </div>
          </div>

          {/* Hero / Banner Editado pela IA */}
          <div 
            className="relative overflow-hidden p-5 text-white flex flex-col justify-end min-h-[140px]"
            style={{
              background: theme.banner_image_url 
                ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${theme.banner_image_url}) center/cover`
                : `linear-gradient(135deg, ${theme.primary_color || '#E11D48'}, #831843)`
            }}
          >
            <div className="relative z-10 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm">
                {theme.featured_badge || 'Destaque'}
              </span>
              <h2 className="text-base font-extrabold leading-tight">
                {theme.banner_title || 'Bem-vindo à nossa loja'}
              </h2>
              <p className="text-xs text-white/80 line-clamp-2">
                {theme.banner_subtitle || 'Produtos selecionados com alta qualidade e entrega rápida'}
              </p>
            </div>
          </div>

          {/* Category / Filter Tabs */}
          <div className="flex gap-2 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 overflow-x-auto text-xs">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                activeTab === 'all' 
                  ? 'text-white' 
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
              style={{ backgroundColor: activeTab === 'all' ? (theme.primary_color || '#E11D48') : undefined }}
            >
              Todos ({visibleProducts.length})
            </button>
            <button 
              onClick={() => setActiveTab('launch')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                activeTab === 'launch' 
                  ? 'text-white' 
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
              style={{ backgroundColor: activeTab === 'launch' ? (theme.primary_color || '#E11D48') : undefined }}
            >
              🔥 Lançamentos ({launchProducts.length})
            </button>
          </div>

          {/* Product Grid */}
          <div className="p-4 grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
            {displayProducts.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-slate-400">
                Nenhum produto na vitrine ainda. Use o Co-Work ao lado para cadastrar!
              </div>
            ) : (
              displayProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="group bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700/60 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-slate-100 dark:bg-zinc-700/40 overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300 dark:text-zinc-500">
                        <ShoppingBag className="w-8 h-8 stroke-1" />
                        <span className="text-[10px] mt-1">Sem foto</span>
                      </div>
                    )}

                    {product.is_launch && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shadow-sm">
                        Novo
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1">
                        {product.name}
                      </h3>
                      {product.category && (
                        <span className="text-[10px] text-slate-400">{product.category}</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        R$ {Number(product.sale_price).toFixed(2).replace('.', ',')}
                      </span>
                      <button 
                        className="p-1 rounded-md text-white text-[10px]"
                        style={{ backgroundColor: theme.primary_color || '#E11D48' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
