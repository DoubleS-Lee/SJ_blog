import type { InteractionType, Palace, TenGod } from './types'

export const TEN_GOD_KR_TO_CODE: Record<string, TenGod> = {
  비견: 'bigeon',
  겁재: 'geopjae',
  식신: 'siksin',
  상관: 'sanggwan',
  편재: 'pyeonjae',
  정재: 'jeongjae',
  편관: 'pyeongwan',
  정관: 'jeonggwan',
  편인: 'pyeonin',
  정인: 'jeongin',
}

export const TEN_GOD_CODE_TO_KR: Record<TenGod, string> = {
  bigeon: '비견',
  geopjae: '겁재',
  siksin: '식신',
  sanggwan: '상관',
  pyeonjae: '편재',
  jeongjae: '정재',
  pyeongwan: '편관',
  jeonggwan: '정관',
  pyeonin: '편인',
  jeongin: '정인',
}

export const STRONG_DI_SHI = new Set(['장생', '관대', '건록', '제왕'])
export const WEAK_DI_SHI = new Set(['병', '사', '묘', '절'])

export const SIX_HAP_PAIRS = new Set([
  '자-축',
  '축-자',
  '인-해',
  '해-인',
  '묘-술',
  '술-묘',
  '진-유',
  '유-진',
  '사-신',
  '신-사',
  '오-미',
  '미-오',
])

export const SIX_CHUNG_PAIRS = new Set([
  '자-오',
  '오-자',
  '축-미',
  '미-축',
  '인-신',
  '신-인',
  '묘-유',
  '유-묘',
  '진-술',
  '술-진',
  '사-해',
  '해-사',
])

export const SIX_PA_PAIRS = new Set([
  '자-유',
  '유-자',
  '축-진',
  '진-축',
  '인-해',
  '해-인',
  '묘-오',
  '오-묘',
  '사-신',
  '신-사',
  '미-술',
  '술-미',
])

export const SIX_HAE_PAIRS = new Set([
  '자-미',
  '미-자',
  '축-오',
  '오-축',
  '인-사',
  '사-인',
  '묘-진',
  '진-묘',
  '신-해',
  '해-신',
  '유-술',
  '술-유',
])

export const HYEONG_GROUPS = [
  new Set(['인', '사', '신']),
  new Set(['축', '술', '미']),
  new Set(['자', '묘']),
]

export const SELF_HYEONG_BRANCHES = new Set(['진', '오', '유', '해'])

export const SAMHAP_GROUPS = [
  new Set(['신', '자', '진']),
  new Set(['인', '오', '술']),
  new Set(['사', '유', '축']),
  new Set(['해', '묘', '미']),
]

export const CHEONGAN_HE_PAIRS = new Set([
  '갑-기',
  '기-갑',
  '을-경',
  '경-을',
  '병-신',
  '신-병',
  '정-임',
  '임-정',
  '무-계',
  '계-무',
])

export const PALACE_LABELS: Record<Palace, string> = {
  year_branch: '년지',
  month_branch: '월지',
  day_branch: '일지',
  time_branch: '시지',
}

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  he: '합',
  chung: '충',
  hyeong: '형',
  pa: '파',
  hae: '해',
  samhap: '삼합',
  cheongan_he: '천간합',
  gongmang: '공망',
}
