import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ANALYTICS_EVENT_NAMES, type AnalyticsTrackPayload } from '@/lib/analytics/schema'

const ALLOWED_EVENT_NAMES = new Set<string>(ANALYTICS_EVENT_NAMES)

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

export async function POST(request: Request) {
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
  const pagePath = sanitizeText(payload.pagePath, 500)

  if (!sessionId || !pagePath) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabaseAdmin.from('analytics_events').insert({
    event_name: payload.eventName,
    user_id: user?.id ?? null,
    session_id: sessionId,
    page_type: sanitizeText(payload.pageType, 80),
    page_path: pagePath,
    content_type: sanitizeText(payload.contentType, 80),
    content_id: sanitizeText(payload.contentId, 200),
    content_title: sanitizeText(payload.contentTitle, 255),
    category: sanitizeText(payload.category, 120),
    referrer: sanitizeText(payload.referrer, 500),
    properties: sanitizeProperties(payload.properties),
  })

  if (error) {
    console.error('[analytics.track]', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
