-- ============================================================
-- Analytics daily rollups and 90-day raw event retention
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_daily_overview (
  metric_date DATE PRIMARY KEY,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  total_engagement_ms BIGINT NOT NULL DEFAULT 0,
  engagement_events INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_page_type (
  metric_date DATE NOT NULL,
  page_type TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  total_engagement_ms BIGINT NOT NULL DEFAULT 0,
  engagement_events INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_date, page_type)
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_category (
  metric_date DATE NOT NULL,
  category TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  total_engagement_ms BIGINT NOT NULL DEFAULT 0,
  engagement_events INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_date, category)
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_menu (
  metric_date DATE NOT NULL,
  menu_name TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_date, menu_name)
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_post (
  metric_date DATE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  total_engagement_ms BIGINT NOT NULL DEFAULT 0,
  engagement_events INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_date, slug)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_overview_metric_date
  ON public.analytics_daily_overview (metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_page_type_metric_date
  ON public.analytics_daily_page_type (metric_date DESC, page_type);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_category_metric_date
  ON public.analytics_daily_category (metric_date DESC, category);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_menu_metric_date
  ON public.analytics_daily_menu (metric_date DESC, menu_name);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_post_metric_date
  ON public.analytics_daily_post (metric_date DESC, slug);

CREATE OR REPLACE FUNCTION public.set_analytics_rollup_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_daily_overview_updated_at ON public.analytics_daily_overview;
CREATE TRIGGER trg_analytics_daily_overview_updated_at
BEFORE UPDATE ON public.analytics_daily_overview
FOR EACH ROW
EXECUTE FUNCTION public.set_analytics_rollup_updated_at();

DROP TRIGGER IF EXISTS trg_analytics_daily_page_type_updated_at ON public.analytics_daily_page_type;
CREATE TRIGGER trg_analytics_daily_page_type_updated_at
BEFORE UPDATE ON public.analytics_daily_page_type
FOR EACH ROW
EXECUTE FUNCTION public.set_analytics_rollup_updated_at();

DROP TRIGGER IF EXISTS trg_analytics_daily_category_updated_at ON public.analytics_daily_category;
CREATE TRIGGER trg_analytics_daily_category_updated_at
BEFORE UPDATE ON public.analytics_daily_category
FOR EACH ROW
EXECUTE FUNCTION public.set_analytics_rollup_updated_at();

DROP TRIGGER IF EXISTS trg_analytics_daily_menu_updated_at ON public.analytics_daily_menu;
CREATE TRIGGER trg_analytics_daily_menu_updated_at
BEFORE UPDATE ON public.analytics_daily_menu
FOR EACH ROW
EXECUTE FUNCTION public.set_analytics_rollup_updated_at();

DROP TRIGGER IF EXISTS trg_analytics_daily_post_updated_at ON public.analytics_daily_post;
CREATE TRIGGER trg_analytics_daily_post_updated_at
BEFORE UPDATE ON public.analytics_daily_post
FOR EACH ROW
EXECUTE FUNCTION public.set_analytics_rollup_updated_at();

CREATE OR REPLACE FUNCTION public.kst_date_from_timestamptz(p_value TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (timezone('Asia/Seoul', p_value))::date
$$;

CREATE OR REPLACE FUNCTION public.analytics_is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = p_user_id
      AND is_admin = true
  )
$$;

CREATE OR REPLACE FUNCTION public.sync_analytics_daily_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metric_date DATE;
  engagement_ms BIGINT;
  unique_increment INTEGER;
  menu_name TEXT;
BEGIN
  IF NEW.user_id IS NOT NULL AND public.analytics_is_admin_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  metric_date := public.kst_date_from_timestamptz(NEW.created_at);

  IF NEW.event_name = 'page_view' THEN
    SELECT CASE
      WHEN COUNT(*) = 1 THEN 1
      ELSE 0
    END
    INTO unique_increment
    FROM public.analytics_events e
    WHERE e.event_name = 'page_view'
      AND e.session_id = NEW.session_id
      AND public.kst_date_from_timestamptz(e.created_at) = metric_date
      AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

    INSERT INTO public.analytics_daily_overview (
      metric_date,
      unique_visitors,
      page_views
    )
    VALUES (
      metric_date,
      unique_increment,
      1
    )
    ON CONFLICT (metric_date) DO UPDATE
    SET unique_visitors = public.analytics_daily_overview.unique_visitors + EXCLUDED.unique_visitors,
        page_views = public.analytics_daily_overview.page_views + 1;

    IF NEW.page_type IS NOT NULL THEN
      INSERT INTO public.analytics_daily_page_type (
        metric_date,
        page_type,
        views
      )
      VALUES (
        metric_date,
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
        metric_date,
        NEW.category,
        1
      )
      ON CONFLICT (metric_date, category) DO UPDATE
      SET views = public.analytics_daily_category.views + 1;
    END IF;

    IF NEW.content_type = 'blog_post' AND NEW.content_id IS NOT NULL THEN
      INSERT INTO public.analytics_daily_post (
        metric_date,
        slug,
        title,
        category,
        views
      )
      VALUES (
        metric_date,
        NEW.content_id,
        COALESCE(NEW.content_title, NEW.content_id),
        NEW.category,
        1
      )
      ON CONFLICT (metric_date, slug) DO UPDATE
      SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
          category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
          views = public.analytics_daily_post.views + 1;
    END IF;
  ELSIF NEW.event_name = 'engagement_time' THEN
    engagement_ms := GREATEST(
      COALESCE((NEW.properties ->> 'engagement_time_ms')::BIGINT, 0),
      0
    );

    IF engagement_ms > 0 THEN
      INSERT INTO public.analytics_daily_overview (
        metric_date,
        total_engagement_ms,
        engagement_events
      )
      VALUES (
        metric_date,
        engagement_ms,
        1
      )
      ON CONFLICT (metric_date) DO UPDATE
      SET total_engagement_ms = public.analytics_daily_overview.total_engagement_ms + EXCLUDED.total_engagement_ms,
          engagement_events = public.analytics_daily_overview.engagement_events + 1;

      IF NEW.page_type IS NOT NULL THEN
        INSERT INTO public.analytics_daily_page_type (
          metric_date,
          page_type,
          total_engagement_ms,
          engagement_events
        )
        VALUES (
          metric_date,
          NEW.page_type,
          engagement_ms,
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
          metric_date,
          NEW.category,
          engagement_ms,
          1
        )
        ON CONFLICT (metric_date, category) DO UPDATE
        SET total_engagement_ms = public.analytics_daily_category.total_engagement_ms + EXCLUDED.total_engagement_ms,
            engagement_events = public.analytics_daily_category.engagement_events + 1;
      END IF;

      IF NEW.content_type = 'blog_post' AND NEW.content_id IS NOT NULL THEN
        INSERT INTO public.analytics_daily_post (
          metric_date,
          slug,
          title,
          category,
          total_engagement_ms,
          engagement_events
        )
        VALUES (
          metric_date,
          NEW.content_id,
          COALESCE(NEW.content_title, NEW.content_id),
          NEW.category,
          engagement_ms,
          1
        )
        ON CONFLICT (metric_date, slug) DO UPDATE
        SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
            category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
            total_engagement_ms = public.analytics_daily_post.total_engagement_ms + EXCLUDED.total_engagement_ms,
            engagement_events = public.analytics_daily_post.engagement_events + 1;
      END IF;
    END IF;
  ELSIF NEW.event_name = 'menu_click' THEN
    menu_name := COALESCE(NEW.properties ->> 'menu_name', '기타');

    INSERT INTO public.analytics_daily_menu (
      metric_date,
      menu_name,
      clicks
    )
    VALUES (
      metric_date,
      menu_name,
      1
    )
    ON CONFLICT (metric_date, menu_name) DO UPDATE
    SET clicks = public.analytics_daily_menu.clicks + 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_analytics_daily_rollups ON public.analytics_events;
CREATE TRIGGER trg_sync_analytics_daily_rollups
AFTER INSERT ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_analytics_daily_rollups();

CREATE OR REPLACE FUNCTION public.sync_post_like_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metric_date DATE;
  delta INTEGER;
  like_user_id UUID;
  post_slug TEXT;
  post_title TEXT;
  post_category TEXT;
BEGIN
  like_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF like_user_id IS NOT NULL AND public.analytics_is_admin_user(like_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  metric_date := public.kst_date_from_timestamptz(COALESCE(NEW.created_at, OLD.created_at));
  delta := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;

  SELECT slug, title, category
  INTO post_slug, post_title, post_category
  FROM public.posts
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);

  IF post_slug IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF post_category IS NOT NULL THEN
    INSERT INTO public.analytics_daily_category (
      metric_date,
      category,
      likes
    )
    VALUES (
      metric_date,
      post_category,
      GREATEST(delta, 0)
    )
    ON CONFLICT (metric_date, category) DO UPDATE
    SET likes = GREATEST(public.analytics_daily_category.likes + delta, 0);
  END IF;

  INSERT INTO public.analytics_daily_post (
    metric_date,
    slug,
    title,
    category,
    likes
  )
  VALUES (
    metric_date,
    post_slug,
    COALESCE(post_title, post_slug),
    post_category,
    GREATEST(delta, 0)
  )
  ON CONFLICT (metric_date, slug) DO UPDATE
  SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
      category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
      likes = GREATEST(public.analytics_daily_post.likes + delta, 0);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_like_rollups ON public.post_likes;
CREATE TRIGGER trg_sync_post_like_rollups
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_like_rollups();

TRUNCATE TABLE
  public.analytics_daily_overview,
  public.analytics_daily_page_type,
  public.analytics_daily_category,
  public.analytics_daily_menu,
  public.analytics_daily_post;

WITH non_admin_page_views AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.session_id
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND COALESCE(u.is_admin, false) = false
),
page_view_counts AS (
  SELECT
    metric_date,
    COUNT(DISTINCT session_id) AS unique_visitors,
    COUNT(*) AS page_views
  FROM non_admin_page_views
  GROUP BY metric_date
),
engagement_counts AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    SUM(GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0)) AS total_engagement_ms,
    COUNT(*) AS engagement_events
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'engagement_time'
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at)
)
INSERT INTO public.analytics_daily_overview (
  metric_date,
  unique_visitors,
  page_views,
  total_engagement_ms,
  engagement_events
)
SELECT
  COALESCE(p.metric_date, g.metric_date) AS metric_date,
  COALESCE(p.unique_visitors, 0) AS unique_visitors,
  COALESCE(p.page_views, 0) AS page_views,
  COALESCE(g.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(g.engagement_events, 0) AS engagement_events
FROM page_view_counts p
FULL OUTER JOIN engagement_counts g USING (metric_date);

WITH page_view_rows AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.page_type
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND e.page_type IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
),
page_type_views AS (
  SELECT
    metric_date,
    page_type,
    COUNT(*) AS views
  FROM page_view_rows
  GROUP BY metric_date, page_type
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
  COALESCE(v.metric_date, g.metric_date) AS metric_date,
  COALESCE(v.page_type, g.page_type) AS page_type,
  COALESCE(v.views, 0) AS views,
  COALESCE(g.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(g.engagement_events, 0) AS engagement_events
FROM page_type_views v
FULL OUTER JOIN page_type_engagement g
  ON v.metric_date = g.metric_date
 AND v.page_type = g.page_type;

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
  WHERE COALESCE(u.is_admin, false) = false
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

WITH post_views AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.content_id AS slug,
    MAX(COALESCE(e.content_title, e.content_id)) AS title,
    MAX(e.category) AS category,
    COUNT(*) AS views
  FROM public.analytics_events e
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE e.event_name = 'page_view'
    AND e.content_type = 'blog_post'
    AND e.content_id IS NOT NULL
    AND COALESCE(u.is_admin, false) = false
  GROUP BY public.kst_date_from_timestamptz(e.created_at), e.content_id
),
post_engagement AS (
  SELECT
    public.kst_date_from_timestamptz(e.created_at) AS metric_date,
    e.content_id AS slug,
    MAX(COALESCE(e.content_title, e.content_id)) AS title,
    MAX(e.category) AS category,
    SUM(GREATEST(COALESCE((e.properties ->> 'engagement_time_ms')::BIGINT, 0), 0)) AS total_engagement_ms,
    COUNT(*) AS engagement_events
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
  engagement_events
)
SELECT
  COALESCE(v.metric_date, e.metric_date, l.metric_date) AS metric_date,
  COALESCE(v.slug, e.slug, l.slug) AS slug,
  COALESCE(v.title, e.title, l.title, COALESCE(v.slug, e.slug, l.slug)) AS title,
  COALESCE(v.category, e.category, l.category) AS category,
  COALESCE(v.views, 0) AS views,
  COALESCE(l.likes, 0) AS likes,
  COALESCE(e.total_engagement_ms, 0) AS total_engagement_ms,
  COALESCE(e.engagement_events, 0) AS engagement_events
FROM post_views v
FULL OUTER JOIN post_engagement e
  ON v.metric_date = e.metric_date
 AND v.slug = e.slug
FULL OUTER JOIN post_likes l
  ON COALESCE(v.metric_date, e.metric_date) = l.metric_date
 AND COALESCE(v.slug, e.slug) = l.slug;

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '3 months';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

ALTER TABLE public.analytics_daily_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_page_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_post ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics daily overview admin read" ON public.analytics_daily_overview;
DROP POLICY IF EXISTS "analytics daily page type admin read" ON public.analytics_daily_page_type;
DROP POLICY IF EXISTS "analytics daily category admin read" ON public.analytics_daily_category;
DROP POLICY IF EXISTS "analytics daily menu admin read" ON public.analytics_daily_menu;
DROP POLICY IF EXISTS "analytics daily post admin read" ON public.analytics_daily_post;

CREATE POLICY "analytics daily overview admin read"
  ON public.analytics_daily_overview
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "analytics daily page type admin read"
  ON public.analytics_daily_page_type
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "analytics daily category admin read"
  ON public.analytics_daily_category
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "analytics daily menu admin read"
  ON public.analytics_daily_menu
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "analytics daily post admin read"
  ON public.analytics_daily_post
  FOR SELECT
  USING (public.is_admin());

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_cron'
  ) THEN
    BEGIN
      PERFORM cron.unschedule(jobid)
      FROM cron.job
      WHERE jobname = 'cleanup-analytics-events-90d';
    EXCEPTION
      WHEN undefined_table OR undefined_function OR invalid_schema_name THEN
        NULL;
    END;

    BEGIN
      PERFORM cron.schedule(
        'cleanup-analytics-events-90d',
        '15 4 * * *',
        'SELECT public.cleanup_old_analytics_events();'
      );
    EXCEPTION
      WHEN undefined_table OR undefined_function OR invalid_schema_name THEN
        NULL;
    END;
  END IF;
END;
$do$;
