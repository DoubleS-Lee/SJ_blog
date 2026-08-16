import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ANALYTICS_EVENT_NAMES, type AnalyticsTrackPayload } from '@/lib/analytics/schema'

const ALLOWED_EVENT_NAMES = new Set<string>(ANALYTICS_EVENT_NAMES)
const BOT_USER_AGENT_PATTERN =
  /(bot|crawler|spider|slurp|bingpreview|googleweblight|google-extended|mediapartners-google|facebookexternalhit|meta-externalagent|twitterbot|linkedinbot|whatsapp|slackbot|discordbot|telegrambot|naverbot|yeti|daumoa|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|headlesschrome|lighthouse)/i

function sanitizeText(value: unknown, maxLength = 255) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function sanitizeProperties(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(input).flatMap(([key, value]) => {
      if (typeof key !== 'string' || !key.trim()) return []
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        return [[key.slice(0, 100), value]]
      }
      return []
    }),
  )
}

/**
 * 요청 자체의 Host 헤더를 기준으로 판단 — NEXT_PUBLIC_SITE_URL 같은 환경변수 설정에
 * 의존하면 커스텀 도메인과 실제 배포 도메인이 어긋날 때 정상 요청까지 막힐 수 있다.
 */
function isSameOriginRequest(request: Request) {
  const host = request.headers.get('host')
  if (!host) return false

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }

  const referer = request.headers.get('referer')
  if (!referer) return false

  try {
    return new URL(referer).host === host
  } catch {
    return false
  }
}

function isIgnoredAnalyticsRequest(request: Request) {
  const userAgent = request.headers.get('user-agent') ?? ''
  const purpose = request.headers.get('purpose') ?? request.headers.get('sec-purpose') ?? ''
  const nextRouterPrefetch = request.headers.get('next-router-prefetch')
  const xMiddlewarePrefetch = request.headers.get('x-middleware-prefetch')

  if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return true
  }

  if (purpose.toLowerCase().includes('prefetch')) {
    return true
  }

  return nextRouterPrefetch === '1' || xMiddlewarePrefetch === '1'
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 })
  }

  let payload: AnalyticsTrackPayload

  try {
    payload = (await request.json()) as AnalyticsTrackPayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!ALLOWED_EVENT_NAMES.has(payload.eventName)) {
    return NextResponse.json({ error: 'invalid_event_name' }, { status: 400 })
  }

  const sessionId = sanitizeText(payload.sessionId, 120)
  const visitorId = sanitizeText(payload.visitorId, 120)
  const pagePath = sanitizeText(payload.pagePath, 500)

  if (!sessionId || !pagePath || !visitorId) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
  }

  if (isIgnoredAnalyticsRequest(request)) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const supabase = await createClient()
  let userId: string | null = null

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch (error) {
    const authCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : null
    if (authCode !== 'refresh_token_not_found') {
      console.error('[analytics.track][auth]', error)
    }
  }

  const { error } = await supabaseAdmin.from('analytics_events').insert({
    event_name: payload.eventName,
    user_id: userId,
    visitor_id: visitorId,
    session_id: sessionId,
    page_type: sanitizeText(payload.pageType, 80),
    page_path: pagePath,
    content_type: sanitizeText(payload.contentType, 80),
    content_id: sanitizeText(payload.contentId, 500),
    content_title: sanitizeText(payload.contentTitle, 255),
    category: sanitizeText(payload.category, 120),
    referrer: sanitizeText(payload.referrer, 500),
    utm_source: sanitizeText(payload.utmSource, 120),
    utm_medium: sanitizeText(payload.utmMedium, 120),
    utm_campaign: sanitizeText(payload.utmCampaign, 160),
    landing_page: sanitizeText(payload.landingPage, 500),
    landing_post_slug: sanitizeText(payload.landingPostSlug, 500),
    properties: sanitizeProperties(payload.properties),
  })

  if (error) {
    console.error('[analytics.track]', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
