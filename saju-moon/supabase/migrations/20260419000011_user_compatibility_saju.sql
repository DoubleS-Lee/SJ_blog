-- ============================================================
-- 궁합용 추가 만세력 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_compatibility_saju (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_day INTEGER NOT NULL,
  birth_hour INTEGER,
  birth_minute INTEGER,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  is_lunar BOOLEAN NOT NULL DEFAULT false,
  full_saju_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_compatibility_saju_user_id
  ON public.user_compatibility_saju(user_id);

ALTER TABLE public.user_compatibility_saju ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_compatibility_saju: own all"
  ON public.user_compatibility_saju
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
