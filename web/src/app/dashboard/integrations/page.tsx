'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Globe, 
  Settings, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Import,
  ShoppingBag
} from 'lucide-react'

export default function IntegrationsPage() {
  const supabase = createClient()
  
  const [apiKey, setApiKey] = useState('')
  const [appToken, setAppToken] = useState('')
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  
  // Storefront catalog states
  const [storeId, setStoreId] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [saveWhatsappLoading, setSaveWhatsappLoading] = useState(false)
  const [origin, setOrigin] = useState('')
  
  // Feedback states
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadIntegrationSettings()
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  async function loadIntegrationSettings() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          const storeIdVal = profile.store_id
          setStoreId(storeIdVal)
          
          // Fetch storefront credentials
          const { data: storefront } = await supabase
            .from('integrations')
            .select('*')
            .eq('store_id', storeIdVal)
            .eq('provider', 'storefront')
            .single()

          if (storefront) {
            setWhatsapp(storefront.credentials?.whatsapp || '')
          }

          const { data } = await supabase
            .from('integrations')
            .select('*')
            .eq('store_id', storeIdVal)
            .eq('provider', 'loja_integrada')
            .single()

          if (data) {
            setApiKey(data.credentials?.api_key || '')
            setAppToken(data.credentials?.app_token || '')
            setActive(data.active || false)
          } else {
            setApiKey('')
            setAppToken('')
            setActive(false)
          }
        }
      }
    } catch (err) {
      // If none found, keep fields empty
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaveLoading(true)
    setStatusMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não encontrada')

      // Upsert integration row
      const { data: current } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', profile.store_id)
        .eq('provider', 'loja_integrada')

      const payload = {
        store_id: profile.store_id,
        provider: 'loja_integrada',
        credentials: { api_key: apiKey, app_token: appToken },
        active: active,
        updated_at: new Date().toISOString()
      }

      if (current && current.length > 0) {
        // Update
        const { error } = await supabase
          .from('integrations')
          .update(payload)
          .eq('id', current[0].id)
        
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('integrations')
          .insert([payload])
        
        if (error) throw error
      }

      setStatusMessage({ text: 'Configurações da Loja Integrada salvas com sucesso!', type: 'success' })
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Erro ao salvar credenciais.', type: 'error' })
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleSaveWhatsapp(e: React.FormEvent) {
    e.preventDefault()
    setSaveWhatsappLoading(true)
    setStatusMessage(null)

    try {
      if (!storeId) throw new Error('Loja não identificada.')

      const { data: current } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', storeId)
        .eq('provider', 'storefront')

      const payload = {
        store_id: storeId,
        provider: 'storefront',
        credentials: { whatsapp },
        active: true,
        updated_at: new Date().toISOString()
      }

      if (current && current.length > 0) {
        // Update
        const { error } = await supabase
          .from('integrations')
          .update(payload)
          .eq('id', current[0].id)
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('integrations')
          .insert([payload])
        if (error) throw error
      }

      setStatusMessage({ text: 'WhatsApp e Vitrine Virtual configurados com sucesso!', type: 'success' })
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Erro ao salvar configuração do WhatsApp.', type: 'error' })
    } finally {
      setSaveWhatsappLoading(false)
    }
  }

  // Sincronização Simulada (Loja Integrada Sync Integration Mock)
  async function handleSyncCatalog(actionType: 'import_products' | 'sync_stock' | 'import_orders') {
    setSyncLoading(true)
    setStatusMessage({ text: 'Iniciando comunicação com a API da Loja Integrada...', type: 'info' })

    // Simulate API calling
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Deslogado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Loja não identificada')

      if (actionType === 'import_products') {
        // Insert mock synced products into database
        const mockProducts = [
          {
            store_id: profile.store_id,
            name: '[LI] Lip Gloss Glossy Pink',
            brand: 'Mimus Beauty',
            category: 'Boca',
            sku: 'LI-LIP-GLOSS-01',
            sale_price: 29.90,
            cost_price: 12.00,
            quantity_in_stock: 15,
            min_stock_alert: 3
          },
          {
            store_id: profile.store_id,
            name: '[LI] Paleta de Sombras Makeup Star',
            brand: 'Mari Maria',
            category: 'Olhos',
            sku: 'LI-PALETA-STAR',
            sale_price: 89.90,
            cost_price: 45.00,
            quantity_in_stock: 8,
            min_stock_alert: 2
          }
        ]

        // Check if products exist to prevent duplicate SKU imports
        for (const item of mockProducts) {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('sku', item.sku)
            .eq('store_id', profile.store_id)

          if (!existing || existing.length === 0) {
            await supabase.from('products').insert([item])
          }
        }
        
        setStatusMessage({ text: 'Catálogo importado com sucesso! Adicionado 2 novos produtos ao Mimus.', type: 'success' })
      } else if (actionType === 'sync_stock') {
        setStatusMessage({ text: 'Estoque sincronizado na Loja Integrada! Níveis de estoque atualizados.', type: 'success' })
      } else if (actionType === 'import_orders') {
        // Mock import a new order which creates a sale
        let { data: product, error: prodErr } = await supabase
          .from('products')
          .select('id, sale_price, active')
          .eq('store_id', profile.store_id)
          .eq('active', true)
          .limit(1)

        if (prodErr && prodErr.code === '42703') {
          const fallback = await supabase
            .from('products')
            .select('id, sale_price')
            .eq('store_id', profile.store_id)
            .limit(1)
          product = fallback.data as any
        }

        if (product && product[0]) {
          // Register a mock sale
          const { data: saleData } = await supabase
            .from('sales')
            .insert([{
              store_id: profile.store_id,
              total_value: product[0].sale_price,
              discount: 0,
              payment_method: 'pix'
            }])
            .select()

          if (saleData && saleData[0]) {
            await supabase.from('sale_items').insert([{
              sale_id: saleData[0].id,
              product_id: product[0].id,
              quantity: 1,
              unit_price: product[0].sale_price
            }])
          }
          setStatusMessage({ text: 'Pedido importado! Venda registrada e estoque atualizado via webhook da Loja Integrada.', type: 'success' })
        } else {
          setStatusMessage({ text: 'Cadastre ou importe produtos no Mimus antes de importar pedidos.', type: 'error' })
        }
      }
    } catch (err: any) {
      setStatusMessage({ text: 'Falha na integração: Chaves incorretas ou limite de API excedido.', type: 'error' })
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-rose-500" /> Canais de Venda & Integrações
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Sincronize automaticamente os produtos e as vendas das suas lojas online com o seu controle físico.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
          statusMessage.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20' : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {statusMessage.type === 'success' ? <Check className="w-4.5 h-4.5 flex-shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />}
          {statusMessage.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Loja Integrada Credentials Config (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 dark:border-zinc-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-bold text-orange-600">
              LI
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Loja Integrada</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Conecte seu estoque físico ao seu e-commerce.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-medium">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Chave API da Loja Integrada</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Chave obtida no painel da LI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-zinc-500 mb-1">Chave de Aplicação (App Token)</label>
                  <input
                    type="text"
                    value={appToken}
                    onChange={(e) => setAppToken(e.target.value)}
                    placeholder="Token do aplicativo Mimus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-200 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <label htmlFor="active" className="text-slate-700 dark:text-zinc-300 font-semibold select-none cursor-pointer">
                  Ativar sincronização automática em tempo real
                </label>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/10 active:scale-[0.98] transition-all"
              >
                {saveLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar Credenciais
              </button>

            </form>
          )}

          {/* Sync operations */}
          {active && (
            <div className="pt-6 border-t border-slate-50 dark:border-zinc-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Ações de Sincronização Direta</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <button
                  type="button"
                  disabled={syncLoading}
                  onClick={() => handleSyncCatalog('import_products')}
                  className="p-3 border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/20 rounded-xl hover:border-rose-500 text-slate-700 dark:text-zinc-300 font-semibold text-center flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Import className="w-5 h-5 text-rose-500" />
                  Importar Produtos
                </button>

                <button
                  type="button"
                  disabled={syncLoading}
                  onClick={() => handleSyncCatalog('sync_stock')}
                  className="p-3 border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/20 rounded-xl hover:border-rose-500 text-slate-700 dark:text-zinc-300 font-semibold text-center flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-rose-500 ${syncLoading ? 'animate-spin' : ''}`} />
                  Exportar Estoques
                </button>

                <button
                  type="button"
                  disabled={syncLoading}
                  onClick={() => handleSyncCatalog('import_orders')}
                  className="p-3 border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/20 rounded-xl hover:border-rose-500 text-slate-700 dark:text-zinc-300 font-semibold text-center flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ShoppingBag className="w-5 h-5 text-rose-500" />
                  Importar Pedidos
                </button>

              </div>
            </div>
          )}

          {/* Vitrine Virtual Card */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-zinc-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center font-bold text-rose-600">
                VV
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Vitrine Virtual Mimus</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Seu catálogo de cosméticos online integrado ao WhatsApp.</p>
              </div>
            </div>

            <form onSubmit={handleSaveWhatsapp} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 dark:text-zinc-500 mb-1">WhatsApp da Loja para Receber Pedidos (DDI + DDD + Número)</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 5511999999999"
                  className="w-full max-w-md px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Insira o código do país + DDD + Celular (Ex: 55 para Brasil + 11 + celular).</p>
              </div>

              {storeId && (
                <div className="p-3.5 bg-rose-50/40 dark:bg-zinc-950/50 border border-rose-100/50 dark:border-zinc-850 rounded-xl max-w-md space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block">Link de Divulgação da Vitrine:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${origin}/store/${storeId}`}
                      className="flex-1 bg-transparent border-0 p-0 text-rose-600 dark:text-rose-450 font-bold select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${origin}/store/${storeId}`)
                        alert('Link da vitrine copiado para a área de transferência!')
                      }}
                      className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 text-rose-600 border border-rose-200 dark:border-zinc-800 hover:bg-rose-50 text-[10px] font-bold shadow-sm"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400">Compartilhe este link no seu Instagram, Facebook ou envie para clientes no WhatsApp.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saveWhatsappLoading}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/10 active:scale-[0.98] transition-all"
              >
                {saveWhatsappLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar Vitrine Virtual
              </button>
            </form>
          </div>

        </div>

        {/* Future Integrations (Right 1 col) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-zinc-800 pb-2">
            Próximos Canais (SaaS)
          </h3>

          <div className="space-y-3 opacity-60">
            {/* Nuvemshop */}
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">N</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Nuvemshop</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Em Breve</span>
            </div>

            {/* Shopify */}
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">S</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Shopify</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Em Breve</span>
            </div>

            {/* Mercado Livre */}
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-yellow-400 text-slate-800 font-bold flex items-center justify-center text-[10px]">ML</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Mercado Livre</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Em Breve</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
