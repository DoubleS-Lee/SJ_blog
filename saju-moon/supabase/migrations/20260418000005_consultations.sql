-- ============================================================
-- 익명 고민 상담 게시판
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultations (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                        TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  body                         TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  status                       TEXT NOT NULL DEFAULT 'submitted'
                                 CHECK (status IN ('submitted', 'answered', 'closed')),
  content_usage_agreed         BOOLEAN NOT NULL DEFAULT true CHECK (content_usage_agreed = true),
  content_usage_agreed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_usage_version        TEXT NOT NULL DEFAULT '2026-04-18-v1',
  admin_note                   TEXT,
  anonymized_content           TEXT,
  is_external_use_ready        BOOLEAN NOT NULL DEFAULT false,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_user_created
  ON public.consultations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_status_updated
  ON public.consultations(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.consultation_comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id    UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body               TEXT NOT NULL,
  is_deleted         BOOLEAN NOT NULL DEFAULT false,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT consultation_comments_body_required CHECK (
    is_deleted OR char_length(btrim(body)) BETWEEN 1 AND 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_consultation_comments_consultation_created
  ON public.consultation_comments(consultation_id, created_at ASC);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations: own select" ON public.consultations;
DROP POLICY IF EXISTS "consultations: own insert" ON public.consultations;
DROP POLICY IF EXISTS "consultations: admin select all" ON public.consultations;
DROP POLICY IF EXISTS "consultations: admin update all" ON public.consultations;
DROP POLICY IF EXISTS "consultation_comments: author/admin select" ON public.consultation_comments;
DROP POLICY IF EXISTS "consultation_comments: author/admin insert" ON public.consultation_comments;
DROP POLICY IF EXISTS "consultation_comments: own update" ON public.consultation_comments;
DROP POLICY IF EXISTS "consultation_comments: admin update all" ON public.consultation_comments;

CREATE POLICY "consultations: own select"
  ON public.consultations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "consultations: own insert"
  ON public.consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND content_usage_agreed = true);

CREATE POLICY "consultations: admin select all"
  ON public.consultations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "consultations: admin update all"
  ON public.consultations FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "consultation_comments: author/admin select"
  ON public.consultation_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultations c
      WHERE c.id = consultation_id
        AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "consultation_comments: author/admin insert"
  ON public.consultation_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.consultations c
      WHERE c.id = consultation_id
        AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "consultation_comments: own update"
  ON public.consultation_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consultation_comments: admin update all"
  ON public.consultation_comments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
