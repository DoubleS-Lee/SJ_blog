-- ============================================================
-- Refine analytics channel classification
-- ============================================================

CREATE OR REPLACE FUNCTION public.classify_acquisition_channel(
  p_referrer TEXT,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_referrer TEXT;
  v_source TEXT;
  v_medium TEXT;
BEGIN
  v_referrer := lower(COALESCE(btrim(p_referrer), ''));
  v_source := lower(COALESCE(btrim(p_utm_source), ''));
  v_medium := lower(COALESCE(btrim(p_utm_medium), ''));

  IF v_source IN ('google', 'google-search') THEN
    RETURN '구글 검색';
  ELSIF v_source IN ('naver', 'naver-search') THEN
    RETURN '네이버 검색';
  ELSIF v_source IN ('instagram', 'ig', 'insta') THEN
    RETURN '인스타그램';
  ELSIF v_source IN ('kakaotalk', 'kakao', 'kakao-talk') THEN
    RETURN '카카오톡';
  ELSIF v_source IN ('youtube', 'youtu', 'youtube-search') THEN
    RETURN '유튜브';
  ELSIF v_source = 'threads' THEN
    RETURN '쓰레드';
  ELSIF v_medium IN ('social', 'social-media', 'social_network', 'social-network', 'social network') THEN
    RETURN '기타 소셜';
  ELSIF v_medium IN ('cpc', 'ppc', 'paid', 'paid-social', 'display', 'banner') AND v_source <> '' THEN
    RETURN '유료 캠페인';
  ELSIF v_referrer = '' THEN
    RETURN '직접접속';
  ELSIF v_referrer LIKE '%google.%' THEN
    RETURN '구글 검색';
  ELSIF v_referrer LIKE '%search.naver.%' OR v_referrer LIKE '%m.search.naver.%' THEN
    RETURN '네이버 검색';
  ELSIF v_referrer LIKE '%blog.naver.%' THEN
    RETURN '네이버 블로그';
  ELSIF v_referrer LIKE '%instagram.%' THEN
    RETURN '인스타그램';
  ELSIF v_referrer LIKE '%kakao.%' OR v_referrer LIKE '%kakaotalk.%' THEN
    RETURN '카카오톡';
  ELSIF v_referrer LIKE '%youtube.%' OR v_referrer LIKE '%youtu.be%' THEN
    RETURN '유튜브';
  ELSIF v_referrer LIKE '%threads.%' THEN
    RETURN '쓰레드';
  ELSIF v_referrer LIKE '%facebook.%'
    OR v_referrer LIKE '%fb.%'
    OR v_referrer LIKE '%twitter.%'
    OR v_referrer LIKE '%x.com%'
    OR v_referrer LIKE '%t.co%'
    OR v_referrer LIKE '%linkedin.%'
    OR v_referrer LIKE '%m.blog.%'
  THEN
    RETURN '기타 소셜';
  ELSE
    RETURN '기타';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.classify_referrer_channel(p_referrer TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN public.classify_acquisition_channel(p_referrer, NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_analytics_channel_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric_date DATE;
  v_channel_name TEXT;
  v_visitor_id TEXT;
  v_visitor_increment INTEGER;
  v_engaged_session_increment INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL AND public.analytics_is_admin_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  v_metric_date := public.kst_date_from_timestamptz(NEW.created_at);
  v_visitor_id := COALESCE(NULLIF(NEW.visitor_id, ''), NEW.session_id);

  IF NEW.event_name = 'session_start' THEN
    v_channel_name := public.classify_acquisition_channel(
      NEW.referrer,
      NEW.utm_source,
      NEW.utm_medium
    );

    SELECT CASE
      WHEN COUNT(*) = 1 THEN 1
      ELSE 0
    END
    INTO v_visitor_increment
    FROM public.analytics_events e
    WHERE e.event_name = 'session_start'
      AND COALESCE(NULLIF(e.visitor_id, ''), e.session_id) = v_visitor_id
      AND public.kst_date_from_timestamptz(e.created_at) = v_metric_date
      AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

    INSERT INTO public.analytics_daily_channel (
      metric_date,
      channel,
      sessions,
      visitors
    )
    VALUES (
      v_metric_date,
      v_channel_name,
      1,
      v_visitor_increment
    )
    ON CONFLICT (metric_date, channel) DO UPDATE
    SET sessions = public.analytics_daily_channel.sessions + 1,
        visitors = public.analytics_daily_channel.visitors + EXCLUDED.visitors;

  ELSIF NEW.event_name = 'engagement_time'
    AND (
      GREATEST(COALESCE((NEW.properties ->> 'engagement_time_ms')::BIGINT, 0), 0) >= 15000
      OR GREATEST(COALESCE((NEW.properties ->> 'max_scroll_depth')::INTEGER, 0), 0) >= 50
    ) THEN
    SELECT CASE
      WHEN COUNT(*) = 1 THEN 1
      ELSE 0
    END
    INTO v_engaged_session_increment
    FROM public.analytics_events e
    WHERE e.event_name = 'engagement_time'
      AND e.session_id = NEW.session_id
      AND public.kst_date_from_timestamptz(e.created_at) = v_metric_date
      AND (
        GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0) >= 15000
        OR GREATEST(COALESCE((e.properties ->> 'max_scroll_depth')::INTEGER, 0), 0) >= 50
      )
      AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

    IF v_engaged_session_increment = 1 THEN
      SELECT public.classify_acquisition_channel(ss.referrer, ss.utm_source, ss.utm_medium)
      INTO v_channel_name
      FROM public.analytics_events ss
      WHERE ss.event_name = 'session_start'
        AND ss.session_id = NEW.session_id
        AND public.kst_date_from_timestamptz(ss.created_at) = v_metric_date
        AND (ss.user_id IS NULL OR public.analytics_is_admin_user(ss.user_id) = false)
      ORDER BY ss.created_at ASC
      LIMIT 1;

      IF v_channel_name IS NOT NULL THEN
        INSERT INTO public.analytics_daily_channel (
          metric_date,
          channel,
          engaged_sessions
        )
        VALUES (
          v_metric_date,
          v_channel_name,
          1
        )
        ON CONFLICT (metric_date, channel) DO UPDATE
        SET engaged_sessions = public.analytics_daily_channel.engaged_sessions + 1;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

TRUNCATE TABLE public.analytics_daily_channel;

WITH session_events AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    COALESCE(NULLIF(e.visitor_id, ''), e.session_id) AS visitor_id,
    e.session_id,
    public.classify_acquisition_channel(e.referrer, e.utm_source, e.utm_medium) AS channel
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'session_start'
    AND COALESCE(u.is_admin, false) = false
),
channel_sessions AS (
  SELECT
    metric_date,
    channel,
    COUNT(*) AS sessions,
    COUNT(DISTINCT visitor_id) AS visitors
  FROM session_events
  GROUP BY metric_date, channel
),
engaged_channel_sessions AS (
  SELECT
    s.metric_date,
    s.channel,
    COUNT(DISTINCT s.session_id) AS engaged_sessions
  FROM session_events s
  JOIN public.analytics_events e
    ON e.session_id = s.session_id
   AND public.kst_date_from_timestamptz(e.created_at) = s.metric_date
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND (
      GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0) >= 15000
      OR GREATEST(COALESCE((e.properties ->> 'max_scroll_depth')::INTEGER, 0), 0) >= 50
    )
    AND COALESCE(u.is_admin, false) = false
  GROUP BY s.metric_date, s.channel
)
INSERT INTO public.analytics_daily_channel (
  metric_date,
  channel,
  sessions,
  visitors,
  engaged_sessions
)
SELECT
  COALESCE(cs.metric_date, es.metric_date) AS metric_date,
  COALESCE(cs.channel, es.channel) AS channel,
  COALESCE(cs.sessions, 0) AS sessions,
  COALESCE(cs.visitors, 0) AS visitors,
  COALESCE(es.engaged_sessions, 0) AS engaged_sessions
FROM channel_sessions cs
FULL OUTER JOIN engaged_channel_sessions es
  ON cs.metric_date = es.metric_date
 AND cs.channel = es.channel;
