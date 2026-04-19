export const LIFE_DOMAINS = [
  'wealth',
  'health',
  'business',
  'career',
  'relationship',
  'study',
  'social',
] as const

export type LifeDomain = (typeof LIFE_DOMAINS)[number]

export const TEN_GODS = [
  'bigeon',
  'geopjae',
  'siksin',
  'sanggwan',
  'pyeonjae',
  'jeongjae',
  'pyeongwan',
  'jeonggwan',
  'pyeonin',
  'jeongin',
] as const

export type TenGod = (typeof TEN_GODS)[number]

export const INTERACTION_TYPES = [
  'he',
  'chung',
  'hyeong',
  'pa',
  'hae',
  'samhap',
  'cheongan_he',
  'gongmang',
] as const
export type InteractionType = (typeof INTERACTION_TYPES)[number]

export const PALACES = ['year_branch', 'month_branch', 'day_branch', 'time_branch'] as const
export type Palace = (typeof PALACES)[number]

export type DomainScoreMap = Record<LifeDomain, number>
export type TenGodWeightMap = Record<TenGod, number>

export type DomainScoreContributor = {
  domain: LifeDomain
  source: 'star' | 'interaction' | 'health' | 'daeyun' | 'sewoon' | 'yongheegi'
  label: string
  value: number
}

export type LifeGraphPoint = {
  age: number
  domains: DomainScoreMap
  intensity: number
  volatility: number
  tokens: string[]
}

export type BaseScoreBreakdown = {
  domain: LifeDomain
  starScore: number
  interactionScore: number
  healthAdjustmentScore: number
  johuScore: number
  yongheeScore: number
  contributors: DomainScoreContributor[]
  total: number
}

export type BaseScoreResult = {
  domains: DomainScoreMap
  breakdowns: BaseScoreBreakdown[]
}

export type InteractionEvent = {
  type: InteractionType
  palace: Palace
  intensity: number
  note?: string
}

export type LifeScoreEngineSnapshot = {
  baseScore: BaseScoreResult
  intensity: number
  volatility: number
  tokens: string[]
}

export type LifeGraphSeriesPoint = {
  age: number
  year: number
  domains: DomainScoreMap
  labels: Record<LifeDomain, string>
  intensity: number
  volatility: number
}
