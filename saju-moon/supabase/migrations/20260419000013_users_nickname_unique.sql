-- ============================================================
-- 닉네임 중복 불가(대소문자/앞뒤 공백 무시)
-- ============================================================

-- 1) 기존 닉네임 앞뒤 공백 정리
UPDATE public.users
SET nickname = btrim(nickname)
WHERE nickname IS NOT NULL
  AND nickname <> btrim(nickname);

-- 2) 기존 중복 닉네임 정리 (첫 사용자 유지, 나머지는 suffix 부여)
WITH ranked AS (
  SELECT
    id,
    nickname,
    lower(btrim(nickname)) AS normalized_nickname,
    row_number() OVER (
      PARTITION BY lower(btrim(nickname))
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.users
  WHERE nickname IS NOT NULL
    AND btrim(nickname) <> ''
)
UPDATE public.users u
SET
  nickname = left(btrim(u.nickname), 11) || '_' || right(replace(u.id::text, '-', ''), 8),
  updated_at = NOW()
FROM ranked r
WHERE u.id = r.id
  AND r.rn > 1;

-- 3) 닉네임 유니크 인덱스 생성 (빈값 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_unique_normalized
  ON public.users ((lower(btrim(nickname))))
  WHERE nickname IS NOT NULL
    AND btrim(nickname) <> '';

-- 4) 신규 가입 시 닉네임 충돌 방지 로직으로 트리거 함수 갱신
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_nickname TEXT;
  candidate_nickname TEXT;
  suffix TEXT;
BEGIN
  base_nickname := NULLIF(
    btrim(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        ''
      )
    ),
    ''
  );

  IF base_nickname IS NULL THEN
    candidate_nickname := 'user_' || right(replace(NEW.id::text, '-', ''), 8);
  ELSE
    candidate_nickname := base_nickname;

    IF EXISTS (
      SELECT 1
      FROM public.users u
      WHERE lower(btrim(u.nickname)) = lower(candidate_nickname)
    ) THEN
      suffix := '_' || right(replace(NEW.id::text, '-', ''), 8);
      candidate_nickname := left(candidate_nickname, GREATEST(1, 20 - char_length(suffix))) || suffix;
    END IF;
  END IF;

  INSERT INTO public.users (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    candidate_nickname,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
