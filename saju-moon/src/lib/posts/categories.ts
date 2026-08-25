import type { Database } from '@/types/supabase'

/**
 * 글 카테고리의 단일 정의처.
 *
 * 타입은 자동 생성되는 supabase 타입에서 파생시킨다 — 즉 DB의
 * posts_category_check 제약(supabase/migrations/20260502000025_fix_posts_category_check.sql)이
 * 정본이고, 제약이 바뀐 뒤 `supabase gen types`를 다시 돌리면 아래 Record가
 * 키 누락/초과로 컴파일 에러를 낸다.
 */
export type PostCategory = Database['public']['Tables']['posts']['Row']['category']

/**
 * 카테고리별 목록 페이지 메타 설명. 키 순서가 곧 UI 노출 순서다.
 * `Record<PostCategory, string>`이라 카테고리를 하나라도 빠뜨리면 타입 에러가 난다.
 */
export const POST_CATEGORY_DESCRIPTIONS: Record<PostCategory, string> = {
  '연애·궁합': '연애 흐름, 궁합, 관계 해석처럼 감정과 인연에 관한 사주 콘텐츠를 모아봅니다.',
  '커리어·이직': '직장, 이직, 커리어의 방향과 관련한 사주 해석 콘텐츠를 한눈에 살펴볼 수 있습니다.',
  '재물·투자': '재물 흐름, 투자 타이밍, 돈의 방향과 연결되는 사주 콘텐츠를 모아봅니다.',
  '건강·체질': '체질과 건강, 컨디션 관리에 도움이 되는 사주 콘텐츠를 확인해 보세요.',
  '육아·자녀교육': '자녀 성향, 교육 방향, 육아 고민과 연결되는 사주 콘텐츠를 모아봅니다.',
  기타: '일상 속 다양한 사주 이야기와 해석 콘텐츠를 폭넓게 살펴볼 수 있습니다.',
}

export const POST_CATEGORIES = Object.keys(POST_CATEGORY_DESCRIPTIONS) as PostCategory[]

/** 목록 필터 UI에서 "필터 없음"을 나타내는 값 — 실제 카테고리가 아니다. */
export const ALL_CATEGORIES_LABEL = '전체'

export function isPostCategory(value: string | null | undefined): value is PostCategory {
  return !!value && value in POST_CATEGORY_DESCRIPTIONS
}
