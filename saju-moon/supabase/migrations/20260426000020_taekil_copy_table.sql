-- ============================================================
-- Taekil copy table for admin-managed content
-- ============================================================

CREATE TABLE IF NOT EXISTS public.taekil_copy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_group TEXT NOT NULL CHECK (copy_group IN ('page', 'purpose', 'level', 'panel', 'template')),
  copy_key TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT taekil_copy_group_key_unique UNIQUE (copy_group, copy_key)
);

CREATE INDEX IF NOT EXISTS idx_taekil_copy_group_active
  ON public.taekil_copy (copy_group, is_active, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_taekil_copy_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_taekil_copy_updated_at ON public.taekil_copy;
CREATE TRIGGER trg_taekil_copy_updated_at
BEFORE UPDATE ON public.taekil_copy
FOR EACH ROW
EXECUTE FUNCTION public.set_taekil_copy_updated_at();

ALTER TABLE public.taekil_copy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "taekil copy public read active" ON public.taekil_copy;
DROP POLICY IF EXISTS "taekil copy admin read all" ON public.taekil_copy;
DROP POLICY IF EXISTS "taekil copy admin insert" ON public.taekil_copy;
DROP POLICY IF EXISTS "taekil copy admin update" ON public.taekil_copy;
DROP POLICY IF EXISTS "taekil copy admin delete" ON public.taekil_copy;

CREATE POLICY "taekil copy public read active"
  ON public.taekil_copy
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "taekil copy admin read all"
  ON public.taekil_copy
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "taekil copy admin insert"
  ON public.taekil_copy
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "taekil copy admin update"
  ON public.taekil_copy
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "taekil copy admin delete"
  ON public.taekil_copy
  FOR DELETE
  USING (public.is_admin());
