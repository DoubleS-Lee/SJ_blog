-- ============================================================
-- Analytics referrer channel rollups
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_daily_channel (
  metric_date DATE NOT NULL,
  channel TEXT NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_date, channel)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_channel_metric_date
  ON public.analytics_daily_channel (metric_date DESC, channel);

DROP TRIGGER IF EXISTS trg_analytics_daily_channel_updated_at ON public.analytics_daily_channel;
CREATE TRIGGER trg_analytics_daily_channel_updated_at
BEFORE UPDATE ON public.analytics_daily_channel
FOR EACH ROW
EXECUTE FUNCTION public.set_analytics_rollup_updated_at();

CREATE OR REPLACE FUNCTION public.classify_referrer_channel(p_referrer TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  value TEXT;
BEGIN
  value := lower(COALESCE(btrim(p_referrer), ''));

  IF value = '' THEN
    RETURN '직접접속';
  ELSIF value LIKE '%google.%' THEN
    RETURN '구글';
  ELSIF value LIKE '%naver.%' THEN
    RETURN '네이버';
  ELSIF value LIKE '%instagram.%' THEN
    RETURN '인스타그램';
  ELSIF value LIKE '%youtube.%' OR value LIKE '%youtu.be%' THEN
    RETURN '유튜브';
  ELSIF value LIKE '%threads.%' THEN
    RETURN '쓰레드';
  ELSE
    RETURN '기타';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_analytics_channel_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metric_date DATE;
  channel_name TEXT;
BEGIN
  IF NEW.event_name <> 'session_start' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NOT NULL AND public.analytics_is_admin_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  metric_date := public.kst_date_from_timestamptz(NEW.created_at);
  channel_name := public.classify_referrer_channel(NEW.referrer);

  INSERT INTO public.analytics_daily_channel (
    metric_date,
    channel,
    sessions
  )
  VALUES (
    metric_date,
    channel_name,
    1
  )
  ON CONFLICT (metric_date, channel) DO UPDATE
  SET sessions = public.analytics_daily_channel.sessions + 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_analytics_channel_rollups ON public.analytics_events;
CREATE TRIGGER trg_sync_analytics_channel_rollups
AFTER INSERT ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_analytics_channel_rollups();

TRUNCATE TABLE public.analytics_daily_channel;

INSERT INTO public.analytics_daily_channel (
  metric_date,
  channel,
  sessions
)
SELECT
  public.kst_date_from_timestamptz(e.created_at) AS metric_date,
  public.classify_referrer_channel(e.referrer) AS channel,
  COUNT(*) AS sessions
FROM public.analytics_events e
LEFT JOIN public.users u ON u.id = e.user_id
WHERE e.event_name = 'session_start'
  AND COALESCE(u.is_admin, false) = false
GROUP BY public.kst_date_from_timestamptz(e.created_at), public.classify_referrer_channel(e.referrer);

ALTER TABLE public.analytics_daily_channel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics daily channel admin read" ON public.analytics_daily_channel;

CREATE POLICY "analytics daily channel admin read"
  ON public.analytics_daily_channel
  FOR SELECT
  USING (public.is_admin());
