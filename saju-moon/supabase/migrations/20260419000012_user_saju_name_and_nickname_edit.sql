-- ============================================================
-- user_saju 별도 이름 컬럼 추가
-- ============================================================

ALTER TABLE public.user_saju
  ADD COLUMN IF NOT EXISTS saju_name TEXT NOT NULL DEFAULT '';

UPDATE public.user_saju
SET saju_name = COALESCE(saju_name, '')
WHERE saju_name IS NULL;
