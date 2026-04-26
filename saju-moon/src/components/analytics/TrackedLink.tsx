'use client'

import Link from 'next/link'
import type { ComponentPropsWithoutRef, MouseEvent } from 'react'
import { getOrCreateAnalyticsSessionId, trackAnalyticsEvent } from '@/lib/analytics/client'

interface TrackedLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  eventName?: 'content_click' | 'cta_click' | 'menu_click'
  pageType?: string | null
  contentType?: string | null
  contentId?: string | null
  contentTitle?: string | null
  category?: string | null
  properties?: Record<string, string | number | boolean | null>
}

export default function TrackedLink({
  eventName = 'content_click',
  pageType,
  contentType,
  contentId,
  contentTitle,
  category,
  properties,
  onClick,
  href,
  ...props
}: TrackedLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)

    if (event.defaultPrevented || typeof window === 'undefined') return

    const { sessionId } = getOrCreateAnalyticsSessionId()
    const currentPath = `${window.location.pathname}${window.location.search}`
    const nextPath = typeof href === 'string' ? href : href.pathname ?? currentPath

    void trackAnalyticsEvent({
      eventName,
      sessionId,
      pagePath: currentPath,
      pageType,
      contentType,
      contentId,
      contentTitle,
      category,
      properties: {
        target_path: nextPath,
        ...properties,
      },
    })
  }

  return <Link {...props} href={href} onClick={handleClick} />
}
