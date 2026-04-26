export const ANALYTICS_EVENT_NAMES = [
  'session_start',
  'page_view',
  'scroll_depth',
  'engagement_time',
  'menu_click',
  'content_click',
  'cta_click',
  'conversion',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

export interface AnalyticsTrackPayload {
  eventName: AnalyticsEventName
  sessionId: string
  pagePath: string
  pageType?: string | null
  contentType?: string | null
  contentId?: string | null
  contentTitle?: string | null
  category?: string | null
  referrer?: string | null
  properties?: Record<string, string | number | boolean | null>
}
