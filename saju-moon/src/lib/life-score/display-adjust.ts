import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { findDaYunForAge } from './daewoon-score'
import { loadLifeScoreRules } from './load-rules'
import type { DomainScoreMap, LifeDomain } from './types'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createEmptyDomainScoreMap(): DomainScoreMap {
  return {
    wealth: 0,
    health: 0,
    business: 0,
    career: 0,
    relationship: 0,
    study: 0,
    social: 0,
  }
}

export function getAgeActivationMeta(age: number) {
  const rules = loadLifeScoreRules().ageActivationRules
  const multipliers = createEmptyDomainScoreMap()
  const labels = {
    wealth: '재물운',
    health: '건강운',
    business: '사업운',
    career: '직장운',
    relationship: '연애/관계운',
    study: '학업/성장운',
    social: '대인관계운',
  } satisfies Record<LifeDomain, string>

  for (const domain of Object.keys(rules) as LifeDomain[]) {
    const band = rules[domain].find((item) => age >= item.age_min && age <= item.age_max)
    multipliers[domain] = band?.multiplier ?? 1
    labels[domain] = band?.label ?? labels[domain]
  }

  return { multipliers, labels }
}

export function applyAgeActivation(scores: DomainScoreMap, age: number): DomainScoreMap {
  const { multipliers } = getAgeActivationMeta(age)
  const result = createEmptyDomainScoreMap()

  for (const domain of Object.keys(result) as LifeDomain[]) {
    result[domain] = scores[domain] * multipliers[domain]
  }

  return result
}

export function getTransitionPenalty(data: ManseryeokData, age: number): DomainScoreMap {
  const result = createEmptyDomainScoreMap()
  const rules = loadLifeScoreRules().transitionRules
  const current = findDaYunForAge(data, age)

  if (!current) return result

  const isTransitionAge =
    Math.abs(age - current.startAge) <= rules.transition_window
    || Math.abs(age - current.endAge) <= rules.transition_window

  if (!isTransitionAge) return result

  for (const domain of Object.keys(result) as LifeDomain[]) {
    result[domain] = rules.penalties[domain]
  }

  return result
}

export function getTransitionVolatilityBonus(data: ManseryeokData, age: number): number {
  const rules = loadLifeScoreRules().transitionRules
  const current = findDaYunForAge(data, age)

  if (!current) return 0

  const isTransitionAge =
    Math.abs(age - current.startAge) <= rules.transition_window
    || Math.abs(age - current.endAge) <= rules.transition_window

  if (!isTransitionAge) return 0

  return Object.values(rules.volatility_bonus).reduce((sum, value) => sum + value, 0) / 7
}

export function applyDisplayAdjust(scores: DomainScoreMap, previous?: DomainScoreMap | null): DomainScoreMap {
  const result = createEmptyDomainScoreMap()

  for (const domain of Object.keys(result) as LifeDomain[]) {
    const withFloor = clamp(scores[domain], 18, 92)
    const smoothed = previous
      ? previous[domain] * 0.35 + withFloor * 0.65
      : withFloor

    result[domain] = clamp(smoothed, 0, 100)
  }

  return result
}
