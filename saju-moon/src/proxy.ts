import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { buildContentSecurityPolicy } from '@/lib/security/content-security-policy'

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === 'development')
  // Always overwrite incoming values: neither nonce nor policy is client-owned.
  request.headers.set('x-nonce', nonce)
  request.headers.set('Content-Security-Policy', csp)
  const nextResponse = () => {
    const response = NextResponse.next({ request: { headers: request.headers } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }
  let supabaseResponse = nextResponse()

  // Supabase 키 없으면 (개발 초기) 그냥 통과
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = nextResponse()
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 토큰 갱신 (getUser() 호출 필수)
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
