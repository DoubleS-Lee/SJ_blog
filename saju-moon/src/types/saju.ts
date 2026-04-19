// 사주 기본 타입 정의

export type Cheongan =
  | '갑'
  | '을'
  | '병'
  | '정'
  | '무'
  | '기'
  | '경'
  | '신'
  | '임'
  | '계'

export type Jiji =
  | '자'
  | '축'
  | '인'
  | '묘'
  | '진'
  | '사'
  | '오'
  | '미'
  | '신'
  | '유'
  | '술'
  | '해'

export type SixtyGanji = `${Cheongan}${Jiji}`

export type Ohang = '목' | '화' | '토' | '금' | '수'

export type Sipsung =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인'

export type Gender = 'male' | 'female'

export interface SajuPillar {
  cheongan: Cheongan
  jiji: Jiji
  sixty_ganji: SixtyGanji
}

export interface UserSaju {
  user_id: string
  saju_name: string
  year_cheongan: Cheongan
  year_jiji: Jiji
  month_cheongan: Cheongan
  month_jiji: Jiji
  day_cheongan: Cheongan
  day_jiji: Jiji
  hour_cheongan: Cheongan | null
  hour_jiji: Jiji | null
  month_ganji: SixtyGanji
  day_ganji: SixtyGanji
  year_ganji: SixtyGanji
  hour_ganji: SixtyGanji | null
  ilgan: Cheongan
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  birth_minute: number | null
  gender: Gender
  is_lunar: boolean
  full_saju_data: Record<string, unknown>
}

export interface OhangData {
  positions: Record<Ohang, string[]>
  scores: Record<Ohang, number>
}

export interface SipsungData {
  positions: Record<Sipsung, string[]>
  scores: Record<Sipsung, number>
}
