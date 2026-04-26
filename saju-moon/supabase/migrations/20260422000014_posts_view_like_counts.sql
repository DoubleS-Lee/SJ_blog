-- ============================================================
-- 블로그 조회수/좋아요 카운트 컬럼 및 조회수 증가 함수
-- ============================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_post_view_count(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_post_id
    AND is_published = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_post_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_view_count(UUID) TO anon, authenticated, service_role;
