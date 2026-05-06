import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const KAKAO_LOGIN_STATE_COOKIE = 'kakao_login_state'
const KAKAO_LOGIN_NEXT_COOKIE = 'kakao_login_next'

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

function getSafeNext(next: string | null | undefined) {
  return next?.startsWith('/') ? next : '/'
}

async function createSupabaseServerClient() {
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

  return { supabase, cookieStore }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = getSafeOrigin(request)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const { supabase, cookieStore } = await createSupabaseServerClient()
  const savedState = cookieStore.get(KAKAO_LOGIN_STATE_COOKIE)?.value
  const savedNext = cookieStore.get(KAKAO_LOGIN_NEXT_COOKIE)?.value
  const next = getSafeNext(savedNext)

  cookieStore.set(KAKAO_LOGIN_STATE_COOKIE, '', { path: '/', maxAge: 0 })
  cookieStore.set(KAKAO_LOGIN_NEXT_COOKIE, '', { path: '/', maxAge: 0 })

  if (error) {
    console.error('[auth/kakao/callback] kakao authorize error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=kakao_auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  if (!state || !savedState || state !== savedState) {
    console.error('[auth/kakao/callback] invalid state')
    return NextResponse.redirect(`${origin}/login?error=invalid_state`)
  }

  if (!process.env.KAKAO_REST_API_KEY) {
    console.error('[auth/kakao/callback] missing KAKAO_REST_API_KEY')
    return NextResponse.redirect(`${origin}/login?error=kakao_config_missing`)
  }

  const redirectUri = `${origin}/auth/kakao/callback`

  const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code,
      ...(process.env.KAKAO_CLIENT_SECRET
        ? { client_secret: process.env.KAKAO_CLIENT_SECRET }
        : {}),
    }),
  })

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string
    id_token?: string
    error?: string
    error_description?: string
  }

  if (!tokenResponse.ok || !tokenPayload.id_token) {
    console.error('[auth/kakao/callback] token exchange failed:', tokenPayload)
    return NextResponse.redirect(`${origin}/login?error=kakao_token_failed`)
  }

  const { error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'kakao',
    token: tokenPayload.id_token,
    access_token: tokenPayload.access_token,
  })

  if (signInError) {
    console.error('[auth/kakao/callback] signInWithIdToken error:', signInError.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('terms_agreed_at')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.terms_agreed_at) {
      const agreeUrl = `${origin}/agree?next=${encodeURIComponent(next)}`
      return NextResponse.redirect(agreeUrl)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
