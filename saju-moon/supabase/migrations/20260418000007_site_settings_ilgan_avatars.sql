-- ============================================================
-- 관리자 일간 아이콘 설정
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ilgan_avatar_urls JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.site_settings
SET ilgan_avatar_urls = COALESCE(ilgan_avatar_urls, '{}'::jsonb)
WHERE id = 1;
