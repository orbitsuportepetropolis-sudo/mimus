import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const path = request.nextUrl.pathname

  // System/platform domains to bypass custom domain checks
  const platformHosts = [
    'localhost:3000',
    'mimusapp.vercel.app',
    'mimus-59ej.vercel.app',
    'mimus.vercel.app',
    'mimusapp.com.br',
    'mimus.com.br'
  ]

  const isPlatformHost = platformHosts.some(host => hostname.includes(host))

  // If it's a custom domain, check database and rewrite internally
  if (!isPlatformHost && !path.startsWith('/api') && !path.startsWith('/_next') && !path.startsWith('/favicon.ico')) {
    const cleanHost = hostname.replace(/^www\./, '')
    
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .or(`custom_domain.eq.${cleanHost},custom_domain.eq.www.${cleanHost}`)
        .maybeSingle()

      if (store) {
        const url = request.nextUrl.clone()
        // If not already rewritten, route internally to /store/[store_id]
        if (!path.startsWith('/store')) {
          url.pathname = `/store/${store.id}${path === '/' ? '' : path}`
          return NextResponse.rewrite(url)
        }
      }
    } catch (err) {
      console.error('Middleware Custom Domain Error:', err)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

