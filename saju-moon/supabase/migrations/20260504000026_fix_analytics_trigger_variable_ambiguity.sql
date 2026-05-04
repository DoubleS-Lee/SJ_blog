-- ============================================================
-- Fix analytics trigger variable ambiguity and referrer labels
-- ============================================================

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
  v_menu_name TEXT;
BEGIN
  IF NEW.user_id IS NOT NULL AND public.analytics_is_admin_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  v_metric_date := public.kst_date_from_timestamptz(NEW.created_at);

  IF NEW.event_name = 'page_view' THEN
    SELECT CASE
      WHEN COUNT(*) = 1 THEN 1
      ELSE 0
    END
    INTO v_unique_increment
    FROM public.analytics_events e
    WHERE e.event_name = 'page_view'
      AND e.session_id = NEW.session_id
      AND public.kst_date_from_timestamptz(e.created_at) = v_metric_date
      AND (e.user_id IS NULL OR public.analytics_is_admin_user(e.user_id) = false);

    INSERT INTO public.analytics_daily_overview (
      metric_date,
      unique_visitors,
      page_views
    )
    VALUES (
      v_metric_date,
      v_unique_increment,
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
      INSERT INTO public.analytics_daily_post (
        metric_date,
        slug,
        title,
        category,
        views
      )
      VALUES (
        v_metric_date,
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
    v_engagement_ms := GREATEST(
      COALESCE((NEW.properties ->> 'engagement_time_ms')::BIGINT, 0),
      0
    );

    IF v_engagement_ms > 0 THEN
      INSERT INTO public.analytics_daily_overview (
        metric_date,
        total_engagement_ms,
        engagement_events
      )
      VALUES (
        v_metric_date,
        v_engagement_ms,
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
        INSERT INTO public.analytics_daily_post (
          metric_date,
          slug,
          title,
          category,
          total_engagement_ms,
          engagement_events
        )
        VALUES (
          v_metric_date,
          NEW.content_id,
          COALESCE(NEW.content_title, NEW.content_id),
          NEW.category,
          v_engagement_ms,
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

CREATE OR REPLACE FUNCTION public.sync_post_like_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric_date DATE;
  v_delta INTEGER;
  v_like_user_id UUID;
  v_post_slug TEXT;
  v_post_title TEXT;
  v_post_category TEXT;
BEGIN
  v_like_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF v_like_user_id IS NOT NULL AND public.analytics_is_admin_user(v_like_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_metric_date := public.kst_date_from_timestamptz(COALESCE(NEW.created_at, OLD.created_at));
  v_delta := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;

  SELECT slug, title, category
  INTO v_post_slug, v_post_title, v_post_category
  FROM public.posts
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);

  IF v_post_slug IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_post_category IS NOT NULL THEN
    INSERT INTO public.analytics_daily_category (
      metric_date,
      category,
      likes
    )
    VALUES (
      v_metric_date,
      v_post_category,
      GREATEST(v_delta, 0)
    )
    ON CONFLICT (metric_date, category) DO UPDATE
    SET likes = GREATEST(public.analytics_daily_category.likes + v_delta, 0);
  END IF;

  INSERT INTO public.analytics_daily_post (
    metric_date,
    slug,
    title,
    category,
    likes
  )
  VALUES (
    v_metric_date,
    v_post_slug,
    COALESCE(v_post_title, v_post_slug),
    v_post_category,
    GREATEST(v_delta, 0)
  )
  ON CONFLICT (metric_date, slug) DO UPDATE
  SET title = COALESCE(EXCLUDED.title, public.analytics_daily_post.title),
      category = COALESCE(EXCLUDED.category, public.analytics_daily_post.category),
      likes = GREATEST(public.analytics_daily_post.likes + v_delta, 0);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.classify_referrer_channel(p_referrer TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_value TEXT;
BEGIN
  v_value := lower(COALESCE(btrim(p_referrer), ''));

  IF v_value = '' THEN
    RETURN '직접접속';
  ELSIF v_value LIKE '%google.%' THEN
    RETURN '구글';
  ELSIF v_value LIKE '%naver.%' THEN
    RETURN '네이버';
  ELSIF v_value LIKE '%instagram.%' THEN
    RETURN '인스타그램';
  ELSIF v_value LIKE '%youtube.%' OR v_value LIKE '%youtu.be%' THEN
    RETURN '유튜브';
  ELSIF v_value LIKE '%threads.%' THEN
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
  v_metric_date DATE;
  v_channel_name TEXT;
BEGIN
  IF NEW.event_name <> 'session_start' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NOT NULL AND public.analytics_is_admin_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  v_metric_date := public.kst_date_from_timestamptz(NEW.created_at);
  v_channel_name := public.classify_referrer_channel(NEW.referrer);

  INSERT INTO public.analytics_daily_channel (
    metric_date,
    channel,
    sessions
  )
  VALUES (
    v_metric_date,
    v_channel_name,
    1
  )
  ON CONFLICT (metric_date, channel) DO UPDATE
  SET sessions = public.analytics_daily_channel.sessions + 1;

  RETURN NEW;
END;
$$;
