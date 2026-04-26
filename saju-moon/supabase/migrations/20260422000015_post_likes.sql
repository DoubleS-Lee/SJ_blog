-- ============================================================
-- 게시글 좋아요 테이블 및 RLS 정책
-- ============================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_user
  ON public.post_likes(user_id, created_at DESC);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes: published select" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes: own insert" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes: own delete" ON public.post_likes;

CREATE POLICY "post_likes: published select"
  ON public.post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_likes.post_id
        AND p.is_published = true
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

CREATE POLICY "post_likes: own insert"
  ON public.post_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_likes.post_id
        AND p.is_published = true
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

CREATE POLICY "post_likes: own delete"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 기존 데이터 기준 좋아요 카운트 보정
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
