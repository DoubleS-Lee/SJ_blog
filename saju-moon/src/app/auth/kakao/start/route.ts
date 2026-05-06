import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

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

function getSafeNext(next: string | null) {
  return next?.startsWith('/') ? next : '/'
}

export async function GET(request: NextRequest) {
  const origin = getSafeOrigin(request)
  const next = getSafeNext(new URL(request.url).searchParams.get('next'))

  if (!process.env.KAKAO_REST_API_KEY) {
    return NextResponse.redirect(`${origin}/login?error=kakao_config_missing`)
  }

  const state = randomUUID()
  const redirectUri = `${origin}/auth/kakao/callback`
  const authorizeUrl = new URL('https://kauth.kakao.com/oauth/authorize')

  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', process.env.KAKAO_REST_API_KEY)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('scope', 'openid')

  const response = NextResponse.redirect(authorizeUrl.toString())
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 60 * 10,
  }

  response.cookies.set(KAKAO_LOGIN_STATE_COOKIE, state, cookieOptions)
  response.cookies.set(KAKAO_LOGIN_NEXT_COOKIE, next, cookieOptions)

  return response
}
