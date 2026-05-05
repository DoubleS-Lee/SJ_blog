import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSafeOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = request.headers.get('host')
  const protocol =
    request.headers.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https')

  const rawHost = forwardedHost ?? hostHeader

  if (rawHost) {
    const normalizedHost = rawHost.replace(/^0\.0\.0\.0(?=[:/]|$)/, 'localhost')
    return `${protocol}://${normalizedHost}`
  }

  const { origin } = new URL(request.url)
  return origin.replace('://0.0.0.0', '://localhost')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = getSafeOrigin(request)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // 약관 동의 여부 확인 — 미동의 시 /agree 로 보냄
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('terms_agreed_at')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.terms_agreed_at) {
      const agreeUrl = `${origin}/agree?next=${encodeURIComponent(next.startsWith('/') ? next : '/')}`
      return NextResponse.redirect(agreeUrl)
    }
  }

  // next 파라미터가 외부 URL이면 홈으로 (오픈 리다이렉트 방지)
  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin
  return NextResponse.redirect(redirectTo)
}
