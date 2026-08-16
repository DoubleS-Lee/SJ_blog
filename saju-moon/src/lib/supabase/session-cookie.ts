/**
 * @supabase/ssr는 세션을 `sb-<project-ref>-auth-token` 쿠키(용량이 크면 `.0`, `.1`로 분할)에 저장한다.
 * 이 쿠키가 없다는 건 로그인한 적이 없다는 뜻이므로, 굳이 Supabase Auth 서버에
 * 네트워크 왕복(auth.getUser())을 보내지 않고 바로 비로그인으로 처리해도 결과는 동일하다.
 */
export function hasSupabaseSessionCookie(cookieList: { name: string }[]) {
  return cookieList.some((cookie) => /^sb-.*-auth-token/.test(cookie.name))
}
