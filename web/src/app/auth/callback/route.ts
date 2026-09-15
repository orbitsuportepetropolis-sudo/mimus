import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  // Resolver o domínio público real da aplicação
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host')

  let baseUrl = requestUrl.origin
  if (forwardedHost) {
    baseUrl = `${forwardedProto}://${forwardedHost}`
  } else if (host && !host.includes('localhost')) {
    baseUrl = `https://${host}`
  }

  // Em produção, garantir o domínio canônico
  if (baseUrl.includes('appmimus.com.br')) {
    baseUrl = 'https://www.appmimus.com.br'
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 1. Verificar se o usuário já possui perfil e loja vinculados
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, role, store_id')
          .eq('id', user.id)
          .maybeSingle()

        let storeId = profile?.store_id

        // 2. CASO NÃO TENHA CADASTRO (usuário novo logando pelo Google):
        // Cria a loja e o perfil inicial e direciona para o onboarding / cadastro
        if (!profile || !storeId) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
          const firstName = fullName ? fullName.split(' ')[0] : 'Lojista'
          const defaultStoreName = user.user_metadata?.store_name || `Loja de ${firstName}`

          // Cria loja para a nova conta
          const { data: newStore, error: storeErr } = await supabase
            .from('stores')
            .insert([{ name: defaultStoreName }])
            .select('id')
            .single()

          if (newStore?.id) {
            storeId = newStore.id

            await supabase
              .from('profiles')
              .upsert([{
                id: user.id,
                store_id: newStore.id,
                name: fullName || user.email?.split('@')[0] || 'Lojista',
                role: 'admin',
                email: user.email,
                status: 'active'
              }])
          } else {
            console.error('Erro ao criar loja automática:', storeErr)
          }

          // Redireciona para o fluxo de cadastro / onboarding inicial
          return NextResponse.redirect(`${baseUrl}/onboarding`)
        }

        // 3. SE JÁ TEM CADASTRO: verificar se a loja possui produtos cadastrados
        if (storeId && profile.role !== 'super_admin') {
          const { count: totalProductCount } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId)

          // Se a loja não tiver nenhum produto, direciona para o onboarding
          if ((totalProductCount ?? 0) === 0) {
            return NextResponse.redirect(`${baseUrl}/onboarding`)
          }
        }

        // 4. Se já possui loja e produtos configurados, direciona para o Dashboard
        const destination = next || '/dashboard'
        return NextResponse.redirect(`${baseUrl}${destination}`)
      }

      return NextResponse.redirect(`${baseUrl}/dashboard`)
    } else {
      console.error('Erro no exchangeCodeForSession:', exchangeError)
    }
  }

  // Redireciona para login com mensagem de erro caso o código falhe
  return NextResponse.redirect(`${baseUrl}/login?error=auth-callback-failed`)
}
