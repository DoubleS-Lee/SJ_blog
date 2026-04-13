-- ============================================================
-- RLS 정책
-- ============================================================

-- ──────────────────────────────
-- users
-- ──────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 본인 조회
CREATE POLICY "users: own select"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 본인 수정
CREATE POLICY "users: own update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 관리자 전체 조회
CREATE POLICY "users: admin select all"
  ON public.users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- 관리자 등급 변경
CREATE POLICY "users: admin update all"
  ON public.users FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- ──────────────────────────────
-- user_saju / ohang / sipsung
-- ──────────────────────────────
ALTER TABLE public.user_saju ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saju_ohang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saju_sipsung ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_saju: own all"
  ON public.user_saju FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_saju_ohang: own all"
  ON public.user_saju_ohang FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_saju_sipsung: own all"
  ON public.user_saju_sipsung FOR ALL
  USING (auth.uid() = user_id);

-- 판정 시스템이 회원 데이터를 읽기 위한 service_role 우회는
-- Server Action에서 service_role 클라이언트 사용으로 처리

-- ──────────────────────────────
-- posts
-- ──────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 발행된 글 전체 공개
CREATE POLICY "posts: published select"
  ON public.posts FOR SELECT
  USING (is_published = true);

-- 관리자 전체 CRUD (미발행 포함)
CREATE POLICY "posts: admin all"
  ON public.posts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- ──────────────────────────────
-- site_settings
-- ──────────────────────────────
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 전체 공개 읽기 (등급 분리 스위치 확인용)
CREATE POLICY "site_settings: public select"
  ON public.site_settings FOR SELECT
  USING (true);

-- 관리자 수정
CREATE POLICY "site_settings: admin update"
  ON public.site_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );
