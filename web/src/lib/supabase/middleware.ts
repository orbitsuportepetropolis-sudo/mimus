import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT remove. This refreshes user session using JWT cookie
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ROUTE PROTECTION
  const path = request.nextUrl.pathname

  // Protected: dashboard, PDV, finance, etc.
  if (path.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect if logged in
  if ((path === '/login' || path === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
