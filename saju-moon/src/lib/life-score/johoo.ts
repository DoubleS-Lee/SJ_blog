import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { loadLifeScoreRules } from './load-rules'
import type { DomainScoreContributor, DomainScoreMap, LifeDomain } from './types'

type JohooDomainAdjustment = {
  score: number
  contributors: DomainScoreContributor[]
}

type JohooAdjustmentMap = Record<LifeDomain, JohooDomainAdjustment>

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createBaseResult(): JohooAdjustmentMap {
  return {
    wealth: { score: 0, contributors: [] },
    health: { score: 0, contributors: [] },
    business: { score: 0, contributors: [] },
    career: { score: 0, contributors: [] },
    relationship: { score: 0, contributors: [] },
    study: { score: 0, contributors: [] },
    social: { score: 0, contributors: [] },
  }
}

export function getThermalProfile(data: ManseryeokData) {
  const rules = loadLifeScoreRules().johooRules
  const monthBranch = data.pillars[1]?.jijiKR ?? ''
  const fire = data.ohangScores['화'] ?? 0
  const wood = data.ohangScores['목'] ?? 0
  const water = data.ohangScores['수'] ?? 0
  const metal = data.ohangScores['금'] ?? 0

  let coldBias = 0
  let hotBias = 0

  if (rules.season_bias.cold_branches.includes(monthBranch)) coldBias += 0.45
  if (rules.season_bias.hot_branches.includes(monthBranch)) hotBias += 0.45

  const hotSupport = fire + wood
  const coldSupport = water + metal
  const diff = hotSupport - coldSupport

  if (diff >= 14) hotBias += 0.35
  else if (diff >= 6) hotBias += 0.2
  else if (diff <= -14) coldBias += 0.35
  else if (diff <= -6) coldBias += 0.2

  const imbalance = Math.abs(hotBias - coldBias)

  return {
    monthBranch,
    coldBias,
    hotBias,
    imbalance,
    dominant: hotBias === coldBias ? 'balanced' : hotBias > coldBias ? 'hot' : 'cold',
  } as const
}

export function calculateJohooAdjustments(data: ManseryeokData): JohooAdjustmentMap {
  const rules = loadLifeScoreRules().johooRules
  const result = createBaseResult()
  const profile = getThermalProfile(data)

  let base = rules.base_adjustments.balanced
  let note = '조후 균형이 크게 무너지지 않아 기본 흐름을 받쳐줍니다.'

  if (profile.imbalance >= 0.5) {
    base = rules.base_adjustments.heavily_imbalanced
    note =
      profile.dominant === 'cold'
        ? '한습 쏠림이 강해 에너지 회복과 관계 온도 관리가 중요합니다.'
        : '조열 쏠림이 강해 과열·과속을 조절하는 편이 유리합니다.'
  } else if (profile.imbalance >= 0.25) {
    base = rules.base_adjustments.slightly_imbalanced
    note =
      profile.dominant === 'cold'
        ? '차가운 흐름이 다소 강해 몸과 마음의 온기를 살리는 관리가 필요합니다.'
        : '뜨거운 흐름이 다소 강해 속도 조절과 휴식 리듬이 중요합니다.'
  }

  for (const domain of Object.keys(result) as LifeDomain[]) {
    const weighted = clamp(base * rules.domain_weights[domain], -1, 1)
    result[domain].score = weighted
    result[domain].contributors.push({
      domain,
      source: 'health',
      label: note,
      value: weighted,
    })
  }

  return result
}
