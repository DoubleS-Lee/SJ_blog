-- ============================================================
-- 댓글 / 대댓글 / 좋아요
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id          UUID REFERENCES public.post_comments(id) ON DELETE SET NULL,
  author_name        TEXT NOT NULL,
  author_avatar_url  TEXT,
  body               TEXT NOT NULL,
  is_deleted         BOOLEAN NOT NULL DEFAULT false,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT post_comments_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id),
  CONSTRAINT post_comments_body_required CHECK (
    is_deleted OR char_length(btrim(body)) BETWEEN 1 AND 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_parent_created
  ON public.post_comments(post_id, parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_user_created
  ON public.post_comments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_comment_likes (
  comment_id   UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_comment_likes_user
  ON public.post_comment_likes(user_id, created_at DESC);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_comments: published select" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments: own insert" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments: own update" ON public.post_comments;
DROP POLICY IF EXISTS "post_comment_likes: published select" ON public.post_comment_likes;
DROP POLICY IF EXISTS "post_comment_likes: own insert" ON public.post_comment_likes;
DROP POLICY IF EXISTS "post_comment_likes: own delete" ON public.post_comment_likes;

CREATE POLICY "post_comments: published select"
  ON public.post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.is_published = true
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

CREATE POLICY "post_comments: own insert"
  ON public.post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.is_published = true
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

CREATE POLICY "post_comments: own update"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_comment_likes: published select"
  ON public.post_comment_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.post_comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = comment_id
        AND p.is_published = true
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

CREATE POLICY "post_comment_likes: own insert"
  ON public.post_comment_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.post_comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = comment_id
        AND c.is_deleted = false
        AND p.is_published = true
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

CREATE POLICY "post_comment_likes: own delete"
  ON public.post_comment_likes FOR DELETE
  USING (auth.uid() = user_id);
