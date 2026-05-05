'use client'

import { inferContentMeta, inferPageType } from '@/lib/analytics/page-meta'
import type { AnalyticsEventName, AnalyticsTrackPayload } from '@/lib/analytics/schema'

const SESSION_KEY = 'analytics_session_v1'
const VISITOR_KEY = 'analytics_visitor_v1'
const SESSION_TTL_MS = 30 * 60 * 1000
const VISITOR_TTL_MS = 180 * 24 * 60 * 60 * 1000

interface StoredSession {
  id: string
  lastSeenAt: number
}

interface StoredVisitor {
  id: string
  firstSeenAt: number
  lastSeenAt: number
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateAnalyticsSessionId() {
  if (typeof window === 'undefined') {
    return {
      sessionId: createSessionId(),
      isNewSession: true,
    }
  }

  const now = Date.now()
  const raw = window.localStorage.getItem(SESSION_KEY)

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed.id && now - parsed.lastSeenAt < SESSION_TTL_MS) {
        window.localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ id: parsed.id, lastSeenAt: now }),
        )
        return { sessionId: parsed.id, isNewSession: false }
      }
    } catch {
      // Ignore malformed storage and create a new session below.
    }
  }

  const sessionId = createSessionId()
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: sessionId, lastSeenAt: now }))
  return { sessionId, isNewSession: true }
}

export function getOrCreateAnalyticsVisitorId() {
  if (typeof window === 'undefined') {
    return {
      visitorId: createSessionId(),
      isNewVisitor: true,
    }
  }

  const now = Date.now()
  const raw = window.localStorage.getItem(VISITOR_KEY)

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredVisitor
      if (parsed.id && now - parsed.lastSeenAt < VISITOR_TTL_MS) {
        window.localStorage.setItem(
          VISITOR_KEY,
          JSON.stringify({
            id: parsed.id,
            firstSeenAt: parsed.firstSeenAt || now,
            lastSeenAt: now,
          }),
        )

        return { visitorId: parsed.id, isNewVisitor: false }
      }
    } catch {
      // Ignore malformed storage and create a new visitor below.
    }
  }

  const visitorId = createSessionId()
  window.localStorage.setItem(
    VISITOR_KEY,
    JSON.stringify({ id: visitorId, firstSeenAt: now, lastSeenAt: now }),
  )
  return { visitorId, isNewVisitor: true }
}

function readCurrentUtmParams() {
  if (typeof window === 'undefined') {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    }
  }

  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  }
}

function normalizePayload(payload: AnalyticsTrackPayload): AnalyticsTrackPayload {
  const { visitorId } = getOrCreateAnalyticsVisitorId()
  const utm = readCurrentUtmParams()

  return {
    ...payload,
    visitorId: payload.visitorId ?? visitorId,
    pageType: payload.pageType ?? inferPageType(payload.pagePath),
    referrer: payload.referrer ?? (typeof document !== 'undefined' ? document.referrer || null : null),
    utmSource: payload.utmSource ?? utm.utmSource,
    utmMedium: payload.utmMedium ?? utm.utmMedium,
    utmCampaign: payload.utmCampaign ?? utm.utmCampaign,
  }
}

function sendViaBeacon(payload: AnalyticsTrackPayload) {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false
  }

  const body = JSON.stringify(normalizePayload(payload))
  return navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }))
}

export async function trackAnalyticsEvent(payload: AnalyticsTrackPayload, options?: { preferBeacon?: boolean }) {
  const normalized = normalizePayload(payload)

  if (options?.preferBeacon && sendViaBeacon(normalized)) {
    return
  }

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
      credentials: 'same-origin',
      keepalive: options?.preferBeacon ?? false,
    })
  } catch {
    // Analytics must never block the user flow.
  }
}

export function buildCurrentPagePayload(eventName: AnalyticsEventName, pathname: string, search = '') {
  const pagePath = search ? `${pathname}?${search}` : pathname
  const { contentType, contentId } = inferContentMeta(pathname)
  const { sessionId } = getOrCreateAnalyticsSessionId()
  const { visitorId } = getOrCreateAnalyticsVisitorId()

  return {
    eventName,
    visitorId,
    sessionId,
    pagePath,
    pageType: inferPageType(pathname),
    contentType,
    contentId,
  } satisfies AnalyticsTrackPayload
}
