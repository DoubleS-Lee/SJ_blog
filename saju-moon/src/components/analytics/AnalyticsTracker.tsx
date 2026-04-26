'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { buildCurrentPagePayload, getOrCreateAnalyticsSessionId, trackAnalyticsEvent } from '@/lib/analytics/client'

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageStartRef = useRef<number>(Date.now())
  const scrollMarksRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      return
    }

    const search = searchParams.toString()
    const pagePayload = buildCurrentPagePayload('page_view', pathname, search)
    const session = getOrCreateAnalyticsSessionId()

    if (session.isNewSession) {
      void trackAnalyticsEvent({
        ...pagePayload,
        eventName: 'session_start',
        properties: {
          entry_path: pagePayload.pagePath,
        },
      })
    }

    pageStartRef.current = Date.now()
    scrollMarksRef.current = new Set()

    void trackAnalyticsEvent(pagePayload)

    const handleScroll = () => {
      const doc = document.documentElement
      const maxScrollable = doc.scrollHeight - window.innerHeight
      const depth = maxScrollable <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / maxScrollable) * 100))

      for (const threshold of SCROLL_THRESHOLDS) {
        if (depth >= threshold && !scrollMarksRef.current.has(threshold)) {
          scrollMarksRef.current.add(threshold)
          void trackAnalyticsEvent({
            ...pagePayload,
            eventName: 'scroll_depth',
            properties: { depth_percent: threshold },
          })
        }
      }
    }

    const flushEngagement = () => {
      const engagementTimeMs = Date.now() - pageStartRef.current
      const maxDepth = Math.max(0, ...Array.from(scrollMarksRef.current))

      void trackAnalyticsEvent(
        {
          ...pagePayload,
          eventName: 'engagement_time',
          properties: {
            engagement_time_ms: engagementTimeMs,
            max_scroll_depth: maxDepth,
          },
        },
        { preferBeacon: true },
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushEngagement()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pagehide', flushEngagement)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    handleScroll()

    return () => {
      flushEngagement()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pagehide', flushEngagement)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, searchParams])

  return null
}
