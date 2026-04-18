-- ============================================================
-- 댓글 / 상담 댓글 일간 스냅샷
-- ============================================================

ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS author_ilgan TEXT;

ALTER TABLE public.consultation_comments
  ADD COLUMN IF NOT EXISTS author_ilgan TEXT;

UPDATE public.post_comments AS pc
SET author_ilgan = us.ilgan
FROM public.user_saju AS us
WHERE pc.user_id = us.user_id
  AND pc.author_ilgan IS NULL;

UPDATE public.consultation_comments AS cc
SET author_ilgan = us.ilgan
FROM public.user_saju AS us
WHERE cc.user_id = us.user_id
  AND cc.author_ilgan IS NULL;
