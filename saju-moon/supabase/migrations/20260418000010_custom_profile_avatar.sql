-- ============================================================
-- 사용자 직접 업로드 프로필 이미지 분리
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

UPDATE public.post_comments pc
SET author_avatar_url = NULL
FROM public.users u
WHERE pc.user_id = u.id
  AND u.custom_avatar_url IS NULL;

UPDATE public.consultation_comments cc
SET author_avatar_url = NULL
FROM public.users u
WHERE cc.user_id = u.id
  AND u.custom_avatar_url IS NULL;
