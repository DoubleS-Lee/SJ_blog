-- ============================================================
-- Growth-focused analytics upgrade
-- ============================================================

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS visitor_id TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS landing_post_slug TEXT;

UPDATE public.analytics_events
SET visitor_id = session_id
WHERE visitor_id IS NULL;

UPDATE public.analytics_events
SET landing_page = COALESCE(landing_page, page_path),
    landing_post_slug = COALESCE(
      landing_post_slug,
      CASE WHEN content_type = 'blog_post' THEN content_id ELSE NULL END
    )
WHERE event_name = 'session_start';

ALTER TABLE public.analytics_events
  ALTER COLUMN visitor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id
  ON public.analytics_events (visitor_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_start_created_at
  ON public.analytics_events (event_name, created_at DESC)
  WHERE event_name = 'session_start';

CREATE INDEX IF NOT EXISTS idx_analytics_events_landing_post_slug
  ON public.analytics_events (landing_post_slug, created_at DESC)
  WHERE landing_post_slug IS NOT NULL;

ALTER TABLE public.analytics_daily_overview
  ADD COLUMN IF NOT EXISTS sessions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_visitors INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returning_visitors INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engaged_sessions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.analytics_daily_channel
  ADD COLUMN IF NOT EXISTS visitors INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engaged_sessions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.analytics_daily_post
  ADD COLUMN IF NOT EXISTS landing_sessions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visitors INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engaged_sessions INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_analytics_daily_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric_date DATE;
  v_engagement_ms BIGINT;
  v_unique_increment INTEGER;
  v_new_visitor_increment INTEGER;
  v_returning_visitor_increment INTEGER;
  v_menu_name TEXT;
  v_visitor_id TEXT;
  v_engaged_session_increment INTEGER;
  v_post_engaged_session_increment INTEGER;
  v_post_visitor_increment INTEGER;
  v_max_scroll_depth INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL AND public.analytics_is_admin_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  v_metric_date := public.kst_date_from_timestamptz(NEW.created_at);
  v_visitor_id := COALESCE(NULLIF(NEW.visitor_id, ''), NEW.session_id);

  IF NEW.event_name = 'session_start' THEN
    SELECT CASE
      WHEN COUNT(*) = 1 THEN 1
      ELSE 0
    END
    INTO v_unique_increment
    FROM public.analytics_events e
    WHERE e.event_name = 'session_start'
      AND COALESCE(NULLIF(e.visitor_id, ''), e.session_id) = v_visitor_id
      AND public.kst_date_from_timestamptz(e.created_at) = v_metric_date
      AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

    SELECT CASE
      WHEN COUNT(*) = 1 THEN 1
      ELSE 0
    END
    INTO v_new_visitor_increment
    FROM public.analytics_events e
    WHERE e.event_name = 'session_start'
      AND COALESCE(NULLIF(e.visitor_id, ''), e.session_id) = v_visitor_id
      AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

    v_returning_visitor_increment := CASE
      WHEN v_unique_increment = 1 AND v_new_visitor_increment = 0 THEN 1
      ELSE 0
    END;

    INSERT INTO public.analytics_daily_overview (
      metric_date,
      unique_visitors,
      sessions,
      new_visitors,
      returning_visitors
    )
    VALUES (
      v_metric_date,
      v_unique_increment,
      1,
      v_new_visitor_increment,
      v_returning_visitor_increment
    )
    ON CONFLICT (metric_date) DO UPDATE
    SET unique_visitors = public.analytics_daily_overview.unique_visitors + EXCLUDED.unique_visitors,
        sessions = public.analytics_daily_overview.sessions + 1,
        new_visitors = public.analytics_daily_overview.new_visitors + EXCLUDED.new_visitors,
        returning_visitors = public.analytics_daily_overview.returning_visitors + EXCLUDED.returning_visitors;

    IF NEW.landing_post_slug IS NOT NULL THEN
      INSERT INTO public.analytics_daily_post (
        metric_date,
        slug,
        title,
        category,
        landing_sessions,
        visitors
      )
      VALUES (
        v_metric_date,
        NEW.landing_post_slug,
        COALESCE(NEW.content_title, NEW.landing_post_slug),
        NEW.category,
        1,
        v_unique_increment
      )
      ON CONFLICT (metric_date, slug) DO UPDATE
      SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
          category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
          landing_sessions = public.analytics_daily_post.landing_sessions + 1,
          visitors = public.analytics_daily_post.visitors + EXCLUDED.visitors;
    END IF;

  ELSIF NEW.event_name = 'page_view' THEN
    INSERT INTO public.analytics_daily_overview (
      metric_date,
      page_views
    )
    VALUES (
      v_metric_date,
      1
    )
    ON CONFLICT (metric_date) DO UPDATE
    SET page_views = public.analytics_daily_overview.page_views + 1;

    IF NEW.page_type IS NOT NULL THEN
      INSERT INTO public.analytics_daily_page_type (
        metric_date,
        page_type,
        views
      )
      VALUES (
        v_metric_date,
        NEW.page_type,
        1
      )
      ON CONFLICT (metric_date, page_type) DO UPDATE
      SET views = public.analytics_daily_page_type.views + 1;
    END IF;

    IF NEW.category IS NOT NULL THEN
      INSERT INTO public.analytics_daily_category (
        metric_date,
        category,
        views
      )
      VALUES (
        v_metric_date,
        NEW.category,
        1
      )
      ON CONFLICT (metric_date, category) DO UPDATE
      SET views = public.analytics_daily_category.views + 1;
    END IF;

    IF NEW.content_type = 'blog_post' AND NEW.content_id IS NOT NULL THEN
      SELECT CASE
        WHEN COUNT(*) = 1 THEN 1
        ELSE 0
      END
      INTO v_post_visitor_increment
      FROM public.analytics_events e
      WHERE e.event_name = 'page_view'
        AND e.content_type = 'blog_post'
        AND e.content_id = NEW.content_id
        AND COALESCE(NULLIF(e.visitor_id, ''), e.session_id) = v_visitor_id
        AND public.kst_date_from_timestamptz(e.created_at) = v_metric_date
        AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

      INSERT INTO public.analytics_daily_post (
        metric_date,
        slug,
        title,
        category,
        views,
        visitors
      )
      VALUES (
        v_metric_date,
        NEW.content_id,
        COALESCE(NEW.content_title, NEW.content_id),
        NEW.category,
        1,
        v_post_visitor_increment
      )
      ON CONFLICT (metric_date, slug) DO UPDATE
      SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
          category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
          views = public.analytics_daily_post.views + 1,
          visitors = public.analytics_daily_post.visitors + EXCLUDED.visitors;
    END IF;

  ELSIF NEW.event_name = 'engagement_time' THEN
    v_engagement_ms := GREATEST(
      COALESCE((NEW.properties ->> 'engagement_time_ms')::BIGINT, 0),
      0
    );
    v_max_scroll_depth := GREATEST(
      COALESCE((NEW.properties ->> 'max_scroll_depth')::INTEGER, 0),
      0
    );

    IF v_engagement_ms > 0 THEN
      IF v_engagement_ms >= 15000 OR v_max_scroll_depth >= 50 THEN
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
      ELSE
        v_engaged_session_increment := 0;
      END IF;

      INSERT INTO public.analytics_daily_overview (
        metric_date,
        total_engagement_ms,
        engagement_events,
        engaged_sessions
      )
      VALUES (
        v_metric_date,
        v_engagement_ms,
        1,
        v_engaged_session_increment
      )
      ON CONFLICT (metric_date) DO UPDATE
      SET total_engagement_ms = public.analytics_daily_overview.total_engagement_ms + EXCLUDED.total_engagement_ms,
          engagement_events = public.analytics_daily_overview.engagement_events + 1,
          engaged_sessions = public.analytics_daily_overview.engaged_sessions + EXCLUDED.engaged_sessions;

      IF NEW.page_type IS NOT NULL THEN
        INSERT INTO public.analytics_daily_page_type (
          metric_date,
          page_type,
          total_engagement_ms,
          engagement_events
        )
        VALUES (
          v_metric_date,
          NEW.page_type,
          v_engagement_ms,
          1
        )
        ON CONFLICT (metric_date, page_type) DO UPDATE
        SET total_engagement_ms = public.analytics_daily_page_type.total_engagement_ms + EXCLUDED.total_engagement_ms,
            engagement_events = public.analytics_daily_page_type.engagement_events + 1;
      END IF;

      IF NEW.category IS NOT NULL THEN
        INSERT INTO public.analytics_daily_category (
          metric_date,
          category,
          total_engagement_ms,
          engagement_events
        )
        VALUES (
          v_metric_date,
          NEW.category,
          v_engagement_ms,
          1
        )
        ON CONFLICT (metric_date, category) DO UPDATE
        SET total_engagement_ms = public.analytics_daily_category.total_engagement_ms + EXCLUDED.total_engagement_ms,
            engagement_events = public.analytics_daily_category.engagement_events + 1;
      END IF;

      IF NEW.content_type = 'blog_post' AND NEW.content_id IS NOT NULL THEN
        IF v_engagement_ms >= 15000 OR v_max_scroll_depth >= 50 THEN
          SELECT CASE
            WHEN COUNT(*) = 1 THEN 1
            ELSE 0
          END
          INTO v_post_engaged_session_increment
          FROM public.analytics_events e
          WHERE e.event_name = 'engagement_time'
            AND e.session_id = NEW.session_id
            AND e.content_type = 'blog_post'
            AND e.content_id = NEW.content_id
            AND public.kst_date_from_timestamptz(e.created_at) = v_metric_date
            AND (
              GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0) >= 15000
              OR GREATEST(COALESCE((e.properties ->> 'max_scroll_depth')::INTEGER, 0), 0) >= 50
            )
            AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);
        ELSE
          v_post_engaged_session_increment := 0;
        END IF;

        INSERT INTO public.analytics_daily_post (
          metric_date,
          slug,
          title,
          category,
          total_engagement_ms,
          engagement_events,
          engaged_sessions
        )
        VALUES (
          v_metric_date,
          NEW.content_id,
          COALESCE(NEW.content_title, NEW.content_id),
          NEW.category,
          v_engagement_ms,
          1,
          v_post_engaged_session_increment
        )
        ON CONFLICT (metric_date, slug) DO UPDATE
        SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
            category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
            total_engagement_ms = public.analytics_daily_post.total_engagement_ms + EXCLUDED.total_engagement_ms,
            engagement_events = public.analytics_daily_post.engagement_events + 1,
            engaged_sessions = public.analytics_daily_post.engaged_sessions + EXCLUDED.engaged_sessions;
      END IF;
    END IF;
  ELSIF NEW.event_name = 'menu_click' THEN
    v_menu_name := COALESCE(NEW.properties ->> 'menu_name', '기타');

    INSERT INTO public.analytics_daily_menu (
      metric_date,
      menu_name,
      clicks
    )
    VALUES (
      v_metric_date,
      v_menu_name,
      1
    )
    ON CONFLICT (metric_date, menu_name) DO UPDATE
    SET clicks = public.analytics_daily_menu.clicks + 1;
  END IF;

  RETURN NEW;
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
    v_channel_name := public.classify_referrer_channel(NEW.referrer);

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
      SELECT public.classify_referrer_channel(ss.referrer)
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

TRUNCATE TABLE
  public.analytics_daily_overview,
  public.analytics_daily_page_type,
  public.analytics_daily_category,
  public.analytics_daily_menu,
  public.analytics_daily_post,
  public.analytics_daily_channel;

WITH session_events AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    COALESCE(NULLIF(e.visitor_id, ''), e.session_id) AS visitor_id,
    e.session_id,
    e.referrer,
    e.landing_post_slug
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'session_start'
    AND COALESCE(u.is_admin, false) = false
),
first_seen AS (
  SELECT
    visitor_id,
    MIN(metric_date) AS first_seen_date
  FROM session_events
  GROUP BY visitor_id
),
session_stats AS (
  SELECT
    s.metric_date,
    COUNT(*) AS sessions,
    COUNT(DISTINCT s.visitor_id) AS unique_visitors,
    COUNT(DISTINCT CASE WHEN f.first_seen_date = s.metric_date THEN s.visitor_id END) AS new_visitors,
    COUNT(DISTINCT CASE WHEN f.first_seen_date < s.metric_date THEN s.visitor_id END) AS returning_visitors
  FROM session_events s
  JOIN first_seen f ON f.visitor_id = s.visitor_id
  GROUP BY s.metric_date
),
page_view_stats AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    COUNT(*) AS page_views
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at)
),
engagement_stats AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    SUM(GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0)) AS total_engagement_ms,
    COUNT(*) AS engagement_events
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at)
),
engaged_session_stats AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    COUNT(DISTINCT e.session_id) AS engaged_sessions
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND (
      GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0) >= 15000
      OR GREATEST(COALESCE((e.properties ->> 'max_scroll_depth')::INTEGER, 0), 0) >= 50
    )
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at)
)
INSERT INTO public.analytics_daily_overview (
  metric_date,
  unique_visitors,
  sessions,
  new_visitors,
  returning_visitors,
  page_views,
  total_engagement_ms,
  engagement_events,
  engaged_sessions
)
SELECT
  COALESCE(s.metric_date, p.metric_date, g.metric_date, es.metric_date) AS metric_date,
  COALESCE(s.unique_visitors, 0) AS unique_visitors,
  COALESCE(s.sessions, 0) AS sessions,
  COALESCE(s.new_visitors, 0) AS new_visitors,
  COALESCE(s.returning_visitors, 0) AS returning_visitors,
  COALESCE(p.page_views, 0) AS page_views,
  COALESCE(g.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(g.engagement_events, 0) AS engagement_events,
  COALESCE(es.engaged_sessions, 0) AS engaged_sessions
FROM session_stats s
FULL OUTER JOIN page_view_stats p
  ON s.metric_date = p.metric_date
FULL OUTER JOIN engagement_stats g
  ON COALESCE(s.metric_date, p.metric_date) = g.metric_date
FULL OUTER JOIN engaged_session_stats es
  ON COALESCE(s.metric_date, p.metric_date, g.metric_date) = es.metric_date;

WITH page_type_views AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.page_type,
    COUNT(*) AS views
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND e.page_type IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.page_type
),
page_type_engagement AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.page_type,
    SUM(GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0)) AS total_engagement_ms,
    COUNT(*) AS engagement_events
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND e.page_type IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.page_type
)
INSERT INTO public.analytics_daily_page_type (
  metric_date,
  page_type,
  views,
  total_engagement_ms,
  engagement_events
)
SELECT
  COALESCE(v.metric_date, e.metric_date) AS metric_date,
  COALESCE(v.page_type, e.page_type) AS page_type,
  COALESCE(v.views, 0) AS views,
  COALESCE(e.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(e.engagement_events, 0) AS engagement_events
FROM page_type_views v
FULL OUTER JOIN page_type_engagement e
  ON v.metric_date = e.metric_date
 AND v.page_type = e.page_type;

WITH category_views AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.category,
    COUNT(*) AS views
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND e.category IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.category
),
category_engagement AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.category,
    SUM(GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0)) AS total_engagement_ms,
    COUNT(*) AS engagement_events
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND e.category IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.category
),
category_likes AS (
  SELECT
    public.kst_date_from_timestamptz(pl.created_at) AS metric_date,
    p.category,
    COUNT(*) AS likes
  FROM public.post_likes pl
  JOIN public.posts p ON p.id = pl.post_id
  LEFT JOIN public.users u ON u.id = pl.user_id
  WHERE p.category IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(pl.created_at), p.category
)
INSERT INTO public.analytics_daily_category (
  metric_date,
  category,
  views,
  likes,
  total_engagement_ms,
  engagement_events
)
SELECT
  COALESCE(v.metric_date, e.metric_date, l.metric_date) AS metric_date,
  COALESCE(v.category, e.category, l.category) AS category,
  COALESCE(v.views, 0) AS views,
  COALESCE(l.likes, 0) AS likes,
  COALESCE(e.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(e.engagement_events, 0) AS engagement_events
FROM category_views v
FULL OUTER JOIN category_engagement e
  ON v.metric_date = e.metric_date
 AND v.category = e.category
FULL OUTER JOIN category_likes l
  ON COALESCE(v.metric_date, e.metric_date) = l.metric_date
 AND COALESCE(v.category, e.category) = l.category;

INSERT INTO public.analytics_daily_menu (
  metric_date,
  menu_name,
  clicks
)
SELECT
  public.kst_date_from_timestamptz(e.created_at) AS metric_date,
  COALESCE(e.properties ->> 'menu_name', '기타') AS menu_name,
  COUNT(*) AS clicks
FROM public.analytics_events e
LEFT JOIN public.users u ON u.id = e.user_id
WHERE e.event_name = 'menu_click'
  AND COALESCE(u.is_admin, false) = false
GROUP BY public.kst_date_from_timestamptz(e.created_at), COALESCE(e.properties ->> 'menu_name', '기타');

WITH session_events AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    COALESCE(NULLIF(e.visitor_id, ''), e.session_id) AS visitor_id,
    e.session_id,
    public.classify_referrer_channel(e.referrer) AS channel
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

WITH post_views AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.content_id AS slug,
    MAX(COALESCE(e.content_title, e.content_id)) AS title,
    MAX(e.category) AS category,
    COUNT(*) AS views,
    COUNT(DISTINCT COALESCE(NULLIF(e.visitor_id, ''), e.session_id)) AS visitors
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND e.content_type = 'blog_post'
    AND e.content_id IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.content_id
),
post_landing AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.landing_post_slug AS slug,
    MAX(COALESCE(e.content_title, e.landing_post_slug)) AS title,
    MAX(e.category) AS category,
    COUNT(*) AS landing_sessions
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'session_start'
    AND e.landing_post_slug IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.landing_post_slug
),
post_engagement AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.content_id AS slug,
    MAX(COALESCE(e.content_title, e.content_id)) AS title,
    MAX(e.category) AS category,
    SUM(GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0)) AS total_engagement_ms,
    COUNT(*) AS engagement_events,
    COUNT(DISTINCT CASE
      WHEN GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0) >= 15000
        OR GREATEST(COALESCE((e.properties ->> 'max_scroll_depth')::INTEGER, 0), 0) >= 50
      THEN e.session_id
      ELSE NULL
    END) AS engaged_sessions
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND e.content_type = 'blog_post'
    AND e.content_id IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.content_id
),
post_likes AS (
  SELECT
    public.kst_date_from_timestamptz(pl.created_at) AS metric_date,
    p.slug,
    MAX(p.title) AS title,
    MAX(p.category) AS category,
    COUNT(*) AS likes
  FROM public.post_likes pl
  JOIN public.posts p ON p.id = pl.post_id
  LEFT JOIN public.users u ON u.id = pl.user_id
  WHERE COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(pl.created_at), p.slug
)
INSERT INTO public.analytics_daily_post (
  metric_date,
  slug,
  title,
  category,
  views,
  likes,
  total_engagement_ms,
  engagement_events,
  landing_sessions,
  visitors,
  engaged_sessions
)
SELECT
  COALESCE(v.metric_date, l.metric_date, e.metric_date, pl.metric_date) AS metric_date,
  COALESCE(v.slug, l.slug, e.slug, pl.slug) AS slug,
  COALESCE(v.title, l.title, e.title, pl.title, COALESCE(v.slug, l.slug, e.slug, pl.slug)) AS title,
  COALESCE(v.category, l.category, e.category, pl.category) AS category,
  COALESCE(v.views, 0) AS views,
  COALESCE(pl.likes, 0) AS likes,
  COALESCE(e.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(e.engagement_events, 0) AS engagement_events,
  COALESCE(l.landing_sessions, 0) AS landing_sessions,
  COALESCE(v.visitors, 0) AS visitors,
  COALESCE(e.engaged_sessions, 0) AS engaged_sessions
FROM post_views v
FULL OUTER JOIN post_landing l
  ON v.metric_date = l.metric_date
 AND v.slug = l.slug
FULL OUTER JOIN post_engagement e
  ON COALESCE(v.metric_date, l.metric_date) = e.metric_date
 AND COALESCE(v.slug, l.slug) = e.slug
FULL OUTER JOIN post_likes pl
  ON COALESCE(v.metric_date, l.metric_date, e.metric_date) = pl.metric_date
 AND COALESCE(v.slug, l.slug, e.slug) = pl.slug;
