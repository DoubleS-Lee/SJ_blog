-- ============================================================
-- 상담 댓글 프로필 이미지 스냅샷
-- ============================================================

ALTER TABLE public.consultation_comments
  ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;

UPDATE public.consultation_comments cc
SET author_avatar_url = u.avatar_url
FROM public.users u
WHERE cc.user_id = u.id
  AND cc.author_avatar_url IS DISTINCT FROM u.avatar_url;
