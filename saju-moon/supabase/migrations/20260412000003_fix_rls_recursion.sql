-- ============================================================
-- RLS 무한 재귀 수정
-- users 테이블 정책이 users를 다시 조회해서 발생하는 문제 해결
-- SECURITY DEFINER 함수로 RLS를 우회해 admin 여부 확인
-- ============================================================

-- 재귀를 유발하는 기존 admin 정책 제거
DROP POLICY IF EXISTS "users: admin select all" ON public.users;
DROP POLICY IF EXISTS "users: admin update all" ON public.users;
DROP POLICY IF EXISTS "posts: admin all" ON public.posts;
DROP POLICY IF EXISTS "site_settings: admin update" ON public.site_settings;

-- is_admin() 헬퍼 함수 (SECURITY DEFINER = RLS 우회)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- users: 관리자 정책 재생성
CREATE POLICY "users: admin select all"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "users: admin update all"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- posts: 관리자 정책 재생성
CREATE POLICY "posts: admin all"
  ON public.posts FOR ALL
  USING (public.is_admin());

-- site_settings: 관리자 정책 재생성
CREATE POLICY "site_settings: admin update"
  ON public.site_settings FOR UPDATE
  USING (public.is_admin());
