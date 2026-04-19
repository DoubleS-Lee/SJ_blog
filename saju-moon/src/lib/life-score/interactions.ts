import {
  CHEONGAN_HE_PAIRS,
  HYEONG_GROUPS,
  SAMHAP_GROUPS,
  SELF_HYEONG_BRANCHES,
  SIX_CHUNG_PAIRS,
  SIX_HAE_PAIRS,
  SIX_HAP_PAIRS,
  SIX_PA_PAIRS,
} from './constants'
import { loadLifeScoreRules } from './load-rules'
import type { InteractionEvent, InteractionType, LifeDomain, Palace } from './types'

export function isBranchInGongMang(branch: string, gongMang: string): boolean {
  if (!branch || !gongMang) return false
  return gongMang.includes(branch)
}

export function detectBranchRelation(a: string, b: string): InteractionType | null {
  if (!a || !b) return null
  const pair = `${a}-${b}`

  if (SIX_HAP_PAIRS.has(pair)) return 'he'
  if (SIX_CHUNG_PAIRS.has(pair)) return 'chung'
  if (SIX_PA_PAIRS.has(pair)) return 'pa'
  if (SIX_HAE_PAIRS.has(pair)) return 'hae'
  if (a === b && SELF_HYEONG_BRANCHES.has(a)) return 'hyeong'
  if (HYEONG_GROUPS.some((group) => group.has(a) && group.has(b))) return 'hyeong'

  return null
}

export function detectStemRelation(a: string, b: string): InteractionType | null {
  if (!a || !b) return null
  const pair = `${a}-${b}`
  if (CHEONGAN_HE_PAIRS.has(pair)) return 'cheongan_he'
  return null
}

export function detectSamhap(branches: string[]): string[] {
  const branchSet = new Set(branches.filter(Boolean))
  return SAMHAP_GROUPS.filter((group) => [...group].every((branch) => branchSet.has(branch))).map((group) =>
    [...group].join('-'),
  )
}

export function completesSamhap(targetBranch: string, existingBranches: string[]): boolean {
  const branchSet = new Set([targetBranch, ...existingBranches].filter(Boolean))
  return SAMHAP_GROUPS.some((group) => [...group].every((branch) => branchSet.has(branch)))
}

export function scoreInteractionEvent(
  type: InteractionType,
  palace: Palace,
  domain: LifeDomain,
  intensity = 1,
): number {
  const rules = loadLifeScoreRules().interactionRules
  const base = rules.base_weights[type]
  const palaceMul = rules.palace_multipliers[palace]
  const domainMul = rules.domain_multipliers[type][domain]

  const score = base * palaceMul * domainMul * intensity
  return Math.max(-1, Math.min(1, score))
}

export function scoreInteractionEventsByDomain(
  events: InteractionEvent[],
): Record<LifeDomain, number> {
  const result = {
    wealth: 0,
    health: 0,
    business: 0,
    career: 0,
    relationship: 0,
    study: 0,
    social: 0,
  } satisfies Record<LifeDomain, number>

  const domains = Object.keys(result) as LifeDomain[]

  for (const event of events) {
    for (const domain of domains) {
      result[domain] += scoreInteractionEvent(event.type, event.palace, domain, event.intensity)
    }
  }

  return result
}

export function buildBranchInteractionEvent(
  sourceBranch: string,
  targetBranch: string,
  palace: Palace,
  intensity = 1,
  note?: string,
): InteractionEvent | null {
  const type = detectBranchRelation(sourceBranch, targetBranch)
  if (!type) return null

  return {
    type,
    palace,
    intensity,
    note,
  }
}
