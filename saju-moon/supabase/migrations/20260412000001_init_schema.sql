-- ============================================================
-- 사주문(SajuMoon) 초기 스키마
-- ============================================================

-- ──────────────────────────────
-- 1. users
-- ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,                          -- nullable (카카오 이메일 미제공 대응)
  nickname    TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'free'
                CHECK (role IN ('free', 'plus', 'premium')),
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auth.users 신규 가입 시 users 행 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────
-- 2. user_saju (원국 8글자 + 60갑자 + 기본 정보)
-- ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_saju (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- 사주 8글자
  year_cheongan    TEXT NOT NULL,
  year_jiji        TEXT NOT NULL,
  month_cheongan   TEXT NOT NULL,
  month_jiji       TEXT NOT NULL,
  day_cheongan     TEXT NOT NULL,
  day_jiji         TEXT NOT NULL,
  hour_cheongan    TEXT,            -- 생시 모름이면 NULL
  hour_jiji        TEXT,            -- 생시 모름이면 NULL

  -- 60갑자 4주
  year_ganji       TEXT NOT NULL,
  month_ganji      TEXT NOT NULL,
  day_ganji        TEXT NOT NULL,
  hour_ganji       TEXT,            -- 생시 모름이면 NULL

  -- 인덱스용 일간 (day_cheongan과 동일값)
  ilgan            TEXT NOT NULL,

  -- 입력 원본
  birth_year       INTEGER NOT NULL,
  birth_month      INTEGER NOT NULL,
  birth_day        INTEGER NOT NULL,
  birth_hour       INTEGER,         -- 생시 모름이면 NULL (보정 전 입력값)
  birth_minute     INTEGER,         -- 생시 모름이면 NULL (보정 전 입력값)
  gender           TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  is_lunar         BOOLEAN NOT NULL DEFAULT false,

  -- 대운/세운 전체 계산 결과 (신살은 미저장 — 런타임 계산)
  full_saju_data   JSONB NOT NULL DEFAULT '{}',

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_saju_ilgan ON public.user_saju(ilgan);

-- ──────────────────────────────
-- 3. user_saju_ohang (오행 점수)
-- ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_saju_ohang (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- 점수 (생시 있음: 합계 100점, 생시 모름: 합계 85점 그대로 저장)
  mok_score   NUMERIC(6,2) NOT NULL DEFAULT 0,
  hwa_score   NUMERIC(6,2) NOT NULL DEFAULT 0,
  to_score    NUMERIC(6,2) NOT NULL DEFAULT 0,
  geum_score  NUMERIC(6,2) NOT NULL DEFAULT 0,
  su_score    NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- 유무 (점수 > 0 이면 true)
  has_mok     BOOLEAN NOT NULL DEFAULT false,
  has_hwa     BOOLEAN NOT NULL DEFAULT false,
  has_to      BOOLEAN NOT NULL DEFAULT false,
  has_geum    BOOLEAN NOT NULL DEFAULT false,
  has_su      BOOLEAN NOT NULL DEFAULT false,

  -- 위치 목록 (예: {"목": ["월간", "일지"], ...})
  positions   JSONB NOT NULL DEFAULT '{}',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────
-- 4. user_saju_sipsung (십성 점수)
-- ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_saju_sipsung (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- 점수
  bigyeon_score    NUMERIC(6,2) NOT NULL DEFAULT 0,
  gyeopjae_score   NUMERIC(6,2) NOT NULL DEFAULT 0,
  sikshin_score    NUMERIC(6,2) NOT NULL DEFAULT 0,
  sanggwan_score   NUMERIC(6,2) NOT NULL DEFAULT 0,
  pyeonjae_score   NUMERIC(6,2) NOT NULL DEFAULT 0,
  jeongjae_score   NUMERIC(6,2) NOT NULL DEFAULT 0,
  pyeongwan_score  NUMERIC(6,2) NOT NULL DEFAULT 0,
  jeonggwan_score  NUMERIC(6,2) NOT NULL DEFAULT 0,
  pyeonin_score    NUMERIC(6,2) NOT NULL DEFAULT 0,
  jeongin_score    NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- 유무
  has_bigyeon      BOOLEAN NOT NULL DEFAULT false,
  has_gyeopjae     BOOLEAN NOT NULL DEFAULT false,
  has_sikshin      BOOLEAN NOT NULL DEFAULT false,
  has_sanggwan     BOOLEAN NOT NULL DEFAULT false,
  has_pyeonjae     BOOLEAN NOT NULL DEFAULT false,
  has_jeongjae     BOOLEAN NOT NULL DEFAULT false,
  has_pyeongwan    BOOLEAN NOT NULL DEFAULT false,
  has_jeonggwan    BOOLEAN NOT NULL DEFAULT false,
  has_pyeonin      BOOLEAN NOT NULL DEFAULT false,
  has_jeongin      BOOLEAN NOT NULL DEFAULT false,

  -- 위치 목록
  positions        JSONB NOT NULL DEFAULT '{}',

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────
-- 5. posts
-- ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  summary          TEXT,
  content          JSONB NOT NULL DEFAULT '{}',     -- Tiptap JSON
  thumbnail_url    TEXT,
  category         TEXT NOT NULL
                     CHECK (category IN (
                       '연애·궁합', '커리어·이직', '재물·투자', '건강·체질', '육아·자녀교육'
                     )),
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  is_published     BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  target_year      INTEGER,                         -- NULL이면 열람 시점 날짜 기준
  reading_minutes  INTEGER,

  -- 판정 시스템
  judgment_rules   JSONB,                           -- NULL이면 판정 영역 미표시
  judgment_detail  JSONB,                           -- Tiptap JSON (판정 상세 설명)

  created_by       UUID REFERENCES public.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug     ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_list            ON public.posts(is_published, published_at DESC, category);
CREATE INDEX IF NOT EXISTS idx_posts_featured        ON public.posts(is_featured) WHERE is_published = true;

-- ──────────────────────────────
-- 6. site_settings (단일 행)
-- ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id                        INTEGER PRIMARY KEY DEFAULT 1,
  grade_separation_enabled  BOOLEAN NOT NULL DEFAULT false,
  CHECK (id = 1)
);

INSERT INTO public.site_settings (id, grade_separation_enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;
