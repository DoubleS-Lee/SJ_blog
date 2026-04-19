import type { InteractionType, LifeDomain, Palace, TenGod, TenGodWeightMap } from './types'

export type DomainWeightsRules = Record<LifeDomain, TenGodWeightMap>

export type StarStrengthRules = {
  presence: {
    visible_stem: number
    hidden_stem: number
  }
  month_support: {
    favorable: number
    neutral: number
    unfavorable: number
  }
  root_support: {
    month_main_root: number
    month_mid_root: number
    month_sub_root: number
    day_main_root: number
    time_main_root: number
    year_main_root: number
  }
  stem_exposure: {
    month_stem: number
    time_stem: number
    year_stem: number
  }
  hidden_stem_grade: {
    main_qi: number
    mid_qi: number
    sub_qi: number
  }
  di_shi: {
    strong: number
    neutral: number
    weak: number
  }
  interaction: {
    he: number
    chung: number
    hyeong: number
    pa: number
    hae: number
    samhap: number
    cheongan_he: number
    gongmang: number
  }
}

export type InteractionRules = {
  base_weights: Record<InteractionType, number>
  palace_multipliers: Record<Palace, number>
  domain_multipliers: Record<InteractionType, Record<LifeDomain, number>>
}

export type AgeActivationBand = {
  age_min: number
  age_max: number
  multiplier: number
  label: string
}

export type AgeActivationRules = Record<LifeDomain, AgeActivationBand[]>

export type TransitionRules = {
  transition_window: number
  penalties: Record<LifeDomain, number>
  volatility_bonus: Record<LifeDomain, number>
}

export type JohooRules = {
  season_bias: {
    cold_branches: string[]
    hot_branches: string[]
    mild_branches: string[]
  }
  element_bias: {
    cold_support_elements: string[]
    hot_support_elements: string[]
  }
  base_adjustments: {
    balanced: number
    slightly_imbalanced: number
    heavily_imbalanced: number
  }
  domain_weights: Record<LifeDomain, number>
}

export type YongheegiRules = {
  strength_thresholds: {
    weak_max: number
    strong_min: number
  }
  role_weights: {
    weak: Record<'self' | 'resource' | 'output' | 'wealth' | 'officer', number>
    balanced: Record<'self' | 'resource' | 'output' | 'wealth' | 'officer', number>
    strong: Record<'self' | 'resource' | 'output' | 'wealth' | 'officer', number>
  }
  domain_weights: Record<LifeDomain, number>
  thermal_weights: {
    cold: {
      favorable_elements: string[]
      unfavorable_elements: string[]
      bonus: number
    }
    hot: {
      favorable_elements: string[]
      unfavorable_elements: string[]
      bonus: number
    }
    balanced: {
      bonus: number
    }
  }
}

export type LifeScoreRulesBundle = {
  domainWeights: DomainWeightsRules
  starStrengthRules: StarStrengthRules
  interactionRules: InteractionRules
  ageActivationRules: AgeActivationRules
  transitionRules: TransitionRules
  johooRules: JohooRules
  yongheegiRules: YongheegiRules
}

export function isKnownTenGod(value: string): value is TenGod {
  return [
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
  ].includes(value)
}
