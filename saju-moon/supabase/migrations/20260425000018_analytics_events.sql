-- ============================================================
-- Analytics events for admin insights
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name TEXT NOT NULL,
  user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_type TEXT NULL,
  page_path TEXT NOT NULL,
  content_type TEXT NULL,
  content_id TEXT NULL,
  content_title TEXT NULL,
  category TEXT NULL,
  referrer TEXT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name_created_at
  ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
  ON public.analytics_events (session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
  ON public.analytics_events (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_page_type_created_at
  ON public.analytics_events (page_type, created_at DESC)
  WHERE page_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_content_lookup
  ON public.analytics_events (content_type, content_id, created_at DESC)
  WHERE content_type IS NOT NULL
    AND content_id IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics events admin read" ON public.analytics_events;

CREATE POLICY "analytics events admin read"
  ON public.analytics_events
  FOR SELECT
  USING (public.is_admin());
