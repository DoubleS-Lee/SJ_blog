-- ============================================================
-- Launch hardening: request rate limit + atomic post like count
-- ============================================================

CREATE TABLE IF NOT EXISTS public.request_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_window_seconds INTEGER,
  p_max_count INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.request_rate_limits%ROWTYPE;
BEGIN
  IF p_key IS NULL OR btrim(p_key) = '' OR p_window_seconds <= 0 OR p_max_count <= 0 THEN
    RETURN FALSE;
  END IF;

  SELECT *
  INTO current_row
  FROM public.request_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.request_rate_limits (key, count, window_started_at, updated_at)
    VALUES (p_key, 1, NOW(), NOW());
    RETURN TRUE;
  END IF;

  IF current_row.window_started_at + make_interval(secs => p_window_seconds) <= NOW() THEN
    UPDATE public.request_rate_limits
    SET count = 1,
        window_started_at = NOW(),
        updated_at = NOW()
    WHERE key = p_key;
    RETURN TRUE;
  END IF;

  IF current_row.count >= p_max_count THEN
    RETURN FALSE;
  END IF;

  UPDATE public.request_rate_limits
  SET count = count + 1,
      updated_at = NOW()
  WHERE key = p_key;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_like_count ON public.post_likes;

CREATE TRIGGER trg_sync_post_like_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_like_count();

UPDATE public.posts p
SET like_count = COALESCE(src.cnt, 0)
FROM (
  SELECT post_id, COUNT(*)::INT AS cnt
  FROM public.post_likes
  GROUP BY post_id
) src
WHERE p.id = src.post_id;

UPDATE public.posts
SET like_count = 0
WHERE like_count IS NULL;
