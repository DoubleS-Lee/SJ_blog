-- ============================================================
-- Compatibility copy tables for admin-managed content
-- ============================================================

CREATE TABLE IF NOT EXISTS public.compatibility_copy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('dayGan', 'dayJi', 'ohang', 'johoo', 'sipsung')),
  copy_key TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT NOT NULL,
  pattern TEXT NOT NULL,
  detail_case TEXT NOT NULL,
  male_condition TEXT NOT NULL,
  female_condition TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compatibility_copy_section_key_unique UNIQUE (section, copy_key)
);

CREATE TABLE IF NOT EXISTS public.compatibility_fortune_copy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly', 'yearly', 'daewoon')),
  category TEXT NOT NULL CHECK (category IN ('pair_relation', 'track_match', 'ohang_support', 'transition')),
  copy_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compatibility_fortune_copy_scope_key_unique UNIQUE (period_type, category, copy_key)
);

CREATE INDEX IF NOT EXISTS idx_compatibility_copy_section_active
  ON public.compatibility_copy (section, is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_compatibility_fortune_copy_scope_active
  ON public.compatibility_fortune_copy (period_type, category, is_active, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_compatibility_copy_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compatibility_copy_updated_at ON public.compatibility_copy;
CREATE TRIGGER trg_compatibility_copy_updated_at
BEFORE UPDATE ON public.compatibility_copy
FOR EACH ROW
EXECUTE FUNCTION public.set_compatibility_copy_updated_at();

DROP TRIGGER IF EXISTS trg_compatibility_fortune_copy_updated_at ON public.compatibility_fortune_copy;
CREATE TRIGGER trg_compatibility_fortune_copy_updated_at
BEFORE UPDATE ON public.compatibility_fortune_copy
FOR EACH ROW
EXECUTE FUNCTION public.set_compatibility_copy_updated_at();

ALTER TABLE public.compatibility_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_fortune_copy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compatibility copy public read active" ON public.compatibility_copy;
DROP POLICY IF EXISTS "compatibility copy admin read all" ON public.compatibility_copy;
DROP POLICY IF EXISTS "compatibility copy admin insert" ON public.compatibility_copy;
DROP POLICY IF EXISTS "compatibility copy admin update" ON public.compatibility_copy;
DROP POLICY IF EXISTS "compatibility copy admin delete" ON public.compatibility_copy;

CREATE POLICY "compatibility copy public read active"
  ON public.compatibility_copy
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "compatibility copy admin read all"
  ON public.compatibility_copy
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "compatibility copy admin insert"
  ON public.compatibility_copy
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "compatibility copy admin update"
  ON public.compatibility_copy
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "compatibility copy admin delete"
  ON public.compatibility_copy
  FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "compatibility fortune copy public read active" ON public.compatibility_fortune_copy;
DROP POLICY IF EXISTS "compatibility fortune copy admin read all" ON public.compatibility_fortune_copy;
DROP POLICY IF EXISTS "compatibility fortune copy admin insert" ON public.compatibility_fortune_copy;
DROP POLICY IF EXISTS "compatibility fortune copy admin update" ON public.compatibility_fortune_copy;
DROP POLICY IF EXISTS "compatibility fortune copy admin delete" ON public.compatibility_fortune_copy;

CREATE POLICY "compatibility fortune copy public read active"
  ON public.compatibility_fortune_copy
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "compatibility fortune copy admin read all"
  ON public.compatibility_fortune_copy
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "compatibility fortune copy admin insert"
  ON public.compatibility_fortune_copy
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "compatibility fortune copy admin update"
  ON public.compatibility_fortune_copy
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "compatibility fortune copy admin delete"
  ON public.compatibility_fortune_copy
  FOR DELETE
  USING (public.is_admin());
