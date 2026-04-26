'use client'

import { inferContentMeta, inferPageType } from '@/lib/analytics/page-meta'
import type { AnalyticsEventName, AnalyticsTrackPayload } from '@/lib/analytics/schema'

const SESSION_KEY = 'analytics_session_v1'
const SESSION_TTL_MS = 30 * 60 * 1000

interface StoredSession {
  id: string
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

function normalizePayload(payload: AnalyticsTrackPayload): AnalyticsTrackPayload {
  return {
    ...payload,
    pageType: payload.pageType ?? inferPageType(payload.pagePath),
    referrer: payload.referrer ?? (typeof document !== 'undefined' ? document.referrer || null : null),
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

  return {
    eventName,
    sessionId,
    pagePath,
    pageType: inferPageType(pathname),
    contentType,
    contentId,
  } satisfies AnalyticsTrackPayload
}
