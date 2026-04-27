-- ============================================================
-- Admin-controlled boost for counsel social proof count
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS counsel_social_proof_boost integer NOT NULL DEFAULT 0;
