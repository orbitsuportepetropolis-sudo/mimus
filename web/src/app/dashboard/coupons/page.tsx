'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Ticket, 
  Plus, 
  Search, 
  Tag, 
  Sparkles, 
  Percent, 
  DollarSign, 
  Gift, 
  Truck, 
  Calendar, 
  Copy, 
  Check, 
  Trash2, 
  Edit, 
  AlertCircle, 
  X, 
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react'

interface Coupon {
  id: string
  store_id: string
  code: string
  description: string | null
  type: 'percentage' | 'fixed' | 'product_reward' | 'free_shipping'
  discount_value: number
  min_order_value: number
  reward_product_id: string | null
  reward_product_price: number | null
  max_uses: number | null
  uses_count: number
  active: boolean
  valid_until: string | null
  created_at: string
  reward_product?: {
    id: string
    name: string
    sale_price: number
    image_url: string | null
  } | null
}

interface ProductOption {
  id: string
  name: string
  sale_price: number
  image_url: string | null
}

export default function CouponsPage() {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [needsSqlMigration, setNeedsSqlMigration] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form Fields
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState<'percentage' | 'fixed' | 'product_reward' | 'free_shipping'>('product_reward')
  const [formDiscountValue, setFormDiscountValue] = useState('10')
  const [formMinOrderValue, setFormMinOrderValue] = useState('200')
  const [formRewardProductId, setFormRewardProductId] = useState('')
  const [formRewardProductPrice, setFormRewardProductPrice] = useState('10')
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formValidUntil, setFormValidUntil] = useState('')
  const [formActive, setFormActive] = useState(true)

  const SQL_MIGRATION_TEXT = `-- Execute este script no SQL Editor do Supabase para ativar a tabela de cupons:
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed', 'product_reward', 'free_shipping')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric NOT NULL DEFAULT 0,
  reward_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  reward_product_price numeric DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT unique_store_coupon_code UNIQUE(store_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lojistas gerenciam seus cupons" ON public.coupons;
CREATE POLICY "Lojistas gerenciam seus cupons" ON public.coupons FOR ALL TO authenticated
USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Consulta publica de cupons ativos da vitrine" ON public.coupons;
CREATE POLICY "Consulta publica de cupons ativos da vitrine" ON public.coupons FOR SELECT TO anon, authenticated
USING (active = true);

CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_coupon_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = p_coupon_id;
END;
$$;`

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (!profile?.store_id) return
      setStoreId(profile.store_id)

      // 1. Fetch available store products for reward options
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sale_price, image_url')
        .eq('store_id', profile.store_id)
        .eq('active', true)
        .order('name', { ascending: true })

      if (prods) {
        setProducts(prods)
      }

      // 2. Fetch Coupons
      const { data: couponList, error: couponErr } = await supabase
        .from('coupons')
        .select(`
          *,
          reward_product:reward_product_id(id, name, sale_price, image_url)
        `)
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false })

      if (couponErr) {
        if (couponErr.code === '42P01' || couponErr.message?.includes('coupons')) {
          setNeedsSqlMigration(true)
        } else {
          console.error('Erro ao buscar cupons:', couponErr)
        }
        return
      }

      setCoupons(couponList || [])
      setNeedsSqlMigration(false)

    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenModal(c?: Coupon) {
    setFormError(null)
    if (c) {
      setEditingCoupon(c)
      setFormCode(c.code)
      setFormDescription(c.description || '')
      setFormType(c.type)
      setFormDiscountValue(String(c.discount_value))
      setFormMinOrderValue(String(c.min_order_value))
      setFormRewardProductId(c.reward_product_id || (products[0]?.id || ''))
      setFormRewardProductPrice(String(c.reward_product_price ?? 0))
      setFormMaxUses(c.max_uses ? String(c.max_uses) : '')
      setFormValidUntil(c.valid_until ? c.valid_until.split('T')[0] : '')
      setFormActive(c.active)
    } else {
      setEditingCoupon(null)
      setFormCode(`PROMO${Math.floor(100 + Math.random() * 900)}`)
      setFormDescription('')
      setFormType('product_reward')
      setFormDiscountValue('10')
      setFormMinOrderValue('200')
      setFormRewardProductId(products[0]?.id || '')
      setFormRewardProductPrice('10')
      setFormMaxUses('')
      setFormValidUntil('')
      setFormActive(true)
    }
    setModalOpen(true)
  }

  function generateRandomCode() {
    const prefixes = ['MIMUS', 'VIP', 'BELEZA', 'SUPER', 'ESPECIAL', 'GLOW']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const num = Math.floor(10 + Math.random() * 90)
    setFormCode(`${prefix}${num}`)
  }

  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!formCode.trim()) {
      setFormError('Informe um código para o cupom.')
      return
    }

    if (formType === 'product_reward' && !formRewardProductId) {
      setFormError('Selecione o produto promocional que sairá com valor especial.')
      return
    }

    try {
      setSaving(true)
      if (!storeId) throw new Error('Loja não encontrada')

      const payload = {
        store_id: storeId,
        code: formCode.trim().toUpperCase().replace(/\s+/g, ''),
        description: formDescription.trim() || null,
        type: formType,
        discount_value: parseFloat(formDiscountValue) || 0,
        min_order_value: parseFloat(formMinOrderValue) || 0,
        reward_product_id: formType === 'product_reward' ? formRewardProductId : null,
        reward_product_price: formType === 'product_reward' ? (parseFloat(formRewardProductPrice) || 0) : null,
        max_uses: formMaxUses ? parseInt(formMaxUses) : null,
        valid_until: formValidUntil ? new Date(formValidUntil).toISOString() : null,
        active: formActive
      }

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id)
          .eq('store_id', storeId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([payload])

        if (error) throw error
      }

      await loadData()
      setModalOpen(false)
    } catch (err: any) {
      console.error(err)
      if (err.code === '23505') {
        setFormError('Já existe um cupom com este código na sua loja. Escolha outro código.')
      } else if (err.code === '42P01') {
        setNeedsSqlMigration(true)
        setFormError('A tabela de cupons ainda não foi criada no banco de dados.')
      } else {
        setFormError(err.message || 'Erro ao salvar cupom.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    const newStatus = !coupon.active
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: newStatus } : c))

    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: newStatus })
        .eq('id', coupon.id)
        .eq('store_id', storeId)

      if (error) throw error
    } catch (err) {
      console.error(err)
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: coupon.active } : c))
      alert('Não foi possível alterar o status do cupom.')
    }
  }

  async function handleDeleteCoupon(id: string) {
    if (!confirm('Deseja realmente excluir este cupom?')) return

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId)

      if (error) throw error
      setCoupons(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
      alert('Não foi possível excluir o cupom.')
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  function copyMigrationSql() {
    navigator.clipboard.writeText(SQL_MIGRATION_TEXT)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 3000)
  }

  // Selected reward product details for live preview
  const selectedRewardProduct = products.find(p => p.id === formRewardProductId)

  // Filtered coupons
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || c.type === filterType
    return matchesSearch && matchesType
  })

  // Quick stats
  const activeCount = coupons.filter(c => c.active).length
  const totalUses = coupons.reduce((sum, c) => sum + (c.uses_count || 0), 0)
  const productRewardCount = coupons.filter(c => c.type === 'product_reward' && c.active).length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
              <Ticket className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Gerenciador de Cupons</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Crie cupons de desconto, frete grátis e promoções do tipo <strong>Compre e Leve</strong> (Ex: Compras acima de R$ 200 levam um produto especial por R$ 10).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Criar Novo Cupom
        </button>
      </div>

      {/* SQL Migration Banner if table does not exist */}
      {needsSqlMigration && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="block font-bold">Ativação da Tabela de Cupons Necessária</strong>
              <span>Para salvar cupons no banco de dados, execute a query SQL de criação no Supabase.</span>
            </div>
          </div>
          <button
            onClick={copyMigrationSql}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSql ? 'Copiado!' : 'Copiar Script SQL'}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Cupons Ativos</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5">{activeCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Cupons "Compre e Leve"</span>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{productRewardCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Total de Utilizações</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5">{totalUses}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'product_reward', label: 'Compre e Leve 🎁' },
            { id: 'percentage', label: 'Porcentagem %' },
            { id: 'fixed', label: 'Valor Fixo R$' },
            { id: 'free_shipping', label: 'Frete Grátis 🚚' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === t.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          <span className="text-sm">Carregando cupons...</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-200">Nenhum cupom encontrado</h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
              Crie cupons promocionais para incentivar seus clientes a aumentarem o valor da compra na vitrine.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10"
          >
            <Plus className="w-4 h-4" /> Criar Primeiro Cupom
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((c) => {
            const isProductReward = c.type === 'product_reward'
            const isExpired = c.valid_until && new Date(c.valid_until) < new Date()

            return (
              <div 
                key={c.id} 
                className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all duration-200 flex flex-col justify-between gap-4 ${
                  !c.active || isExpired
                    ? 'border-slate-200 dark:border-zinc-800 opacity-60' 
                    : 'border-slate-200 dark:border-zinc-800 shadow-sm hover:border-rose-500/50 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Badges + Active Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isProductReward && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 flex items-center gap-1">
                          <Gift className="w-3 h-3" /> Compre e Leve
                        </span>
                      )}
                      {c.type === 'percentage' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 flex items-center gap-1">
                          <Percent className="w-3 h-3" /> {c.discount_value}% OFF
                        </span>
                      )}
                      {c.type === 'fixed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> R$ {c.discount_value.toFixed(2)} OFF
                        </span>
                      )}
                      {c.type === 'free_shipping' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Frete Grátis
                        </span>
                      )}

                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                          Expirado
                        </span>
                      )}
                    </div>

                    {/* Status switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        c.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                      title={c.active ? 'Cupom Ativo (clique para pausar)' : 'Cupom Pausado (clique para ativar)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          c.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Coupon Code block */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800">
                    <span className="font-mono text-base font-black tracking-wider text-slate-800 dark:text-white">
                      {c.code}
                    </span>
                    <button
                      onClick={() => copyCode(c.code, c.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Copiar Código"
                    >
                      {copiedCodeId === c.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Rule details */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                    {isProductReward ? (
                      <div className="p-2.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-1">
                        <span className="block text-[11px] text-slate-500 dark:text-zinc-400">Regra de Recompensa:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-200">
                          Comprando a partir de <strong>R$ {c.min_order_value.toFixed(2)}</strong>, leva:
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          {c.reward_product?.image_url && (
                            <img src={c.reward_product.image_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-rose-200 dark:border-rose-900/40" />
                          )}
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {c.reward_product?.name || 'Produto Especial'} por apenas R$ {(c.reward_product_price ?? 0).toFixed(2)}!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p>
                        {c.min_order_value > 0 ? (
                          <>Válido para pedidos acima de <strong>R$ {c.min_order_value.toFixed(2)}</strong></>
                        ) : (
                          <>Válido para <strong>qualquer valor de pedido</strong></>
                        )}
                      </p>
                    )}

                    {c.description && (
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
                        "{c.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>{c.uses_count} {c.uses_count === 1 ? 'uso' : 'usos'}</span>
                    {c.valid_until && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Até {new Date(c.valid_until).toLocaleDateString('pt-BR')}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">
                  {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Selector (Cards) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                  Tipo de Cupom
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('product_reward')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formType === 'product_reward'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Gift className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold">Compre e Leve</strong>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">Ex: Gaste R$ 200 e leve item por R$ 10</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('percentage')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formType === 'percentage'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Percent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold">Porcentagem (%)</strong>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">Ex: 10% ou 15% off no total</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('fixed')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formType === 'fixed'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold">Valor Fixo (R$)</strong>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">Ex: R$ 20 de desconto</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('free_shipping')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formType === 'free_shipping'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold">Frete Grátis</strong>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">Isenção da taxa de entrega</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Code + Random generator */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Código do Cupom *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: BELEZA200, SUPERPROMO"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 font-mono font-bold text-slate-800 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-600 dark:text-zinc-300 text-xs font-semibold"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Descrição (opcional, visível na vitrine)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ganhe um produto especial nas compras acima de R$ 200"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              {/* Min Order Value */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Valor Mínimo da Compra (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="200.00"
                  value={formMinOrderValue}
                  onChange={(e) => setFormMinOrderValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                  O cupom só será ativado quando a soma dos itens no carrinho atingir este valor.
                </span>
              </div>

              {/* Conditional Inputs per Type */}
              {formType === 'product_reward' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                  <span className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                    Configuração do Produto Promocional (Compre e Leve)
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1">
                      Produto que o cliente poderá levar *
                    </label>
                    <select
                      value={formRewardProductId}
                      onChange={(e) => setFormRewardProductId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">Selecione um produto cadastrado...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Preço normal: R$ {p.sale_price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1">
                      Preço Especial com o Cupom (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="10.00 (ou 0 para brinde)"
                      value={formRewardProductPrice}
                      onChange={(e) => setFormRewardProductPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                      Digite <strong>0</strong> se for brinde 100% grátis, ou o valor simbólico (ex: <strong>10.00</strong>).
                    </span>
                  </div>

                  {/* Dynamic Calculation Preview */}
                  {selectedRewardProduct && (
                    <div className="p-3 rounded-lg bg-white/70 dark:bg-zinc-900/80 text-[11px] text-slate-700 dark:text-zinc-300 space-y-1 border border-rose-200/50 dark:border-rose-900/30">
                      <strong>Prévia da Oferta:</strong>
                      <p>
                        Se o cliente comprar <span className="font-bold text-rose-600">R$ {parseFloat(formMinOrderValue || '0').toFixed(2)}</span>, o produto <strong>{selectedRewardProduct.name}</strong> (que custa R$ {selectedRewardProduct.sale_price.toFixed(2)}) sairá por apenas <span className="font-bold text-emerald-600">R$ {parseFloat(formRewardProductPrice || '0').toFixed(2)}</span>!
                      </p>
                      <p className="text-slate-500">
                        Total do pedido: R$ {(parseFloat(formMinOrderValue || '0') + parseFloat(formRewardProductPrice || '0')).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {formType === 'percentage' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Porcentagem de Desconto (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="15"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>
              )}

              {formType === 'fixed' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Valor do Desconto em Reais (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="20.00"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>
              )}

              {/* Extra Limits (Expiry & Max uses) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Data de Validade (opcional)
                  </label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                    Limite de Usos (opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Deixar cupom ativado e disponível para clientes
                </span>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
