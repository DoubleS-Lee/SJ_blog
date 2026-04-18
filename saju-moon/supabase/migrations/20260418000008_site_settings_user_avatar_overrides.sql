-- ============================================================
-- 관리자 사용자별 아이콘 오버라이드 설정
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS user_avatar_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.site_settings
SET user_avatar_overrides = COALESCE(user_avatar_overrides, '{}'::jsonb)
WHERE id = 1;
