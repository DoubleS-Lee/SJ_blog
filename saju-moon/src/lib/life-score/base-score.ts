import type { ManseryeokData } from '@/lib/saju/manseryeok'
import {
  INTERACTION_LABELS,
  PALACE_LABELS,
  TEN_GOD_CODE_TO_KR,
  TEN_GOD_KR_TO_CODE,
} from './constants'
import { calculateDomainScoresFromStarStrengths } from './domain-weights'
import { calculateHealthAdjustment } from './health-adjust'
import { calculateJohooAdjustments } from './johoo'
import { detectBranchRelation, detectSamhap, detectStemRelation, isBranchInGongMang, scoreInteractionEvent, scoreInteractionEventsByDomain } from './interactions'
import { calculateStarStrength, type StarStrengthBreakdown, type StarStrengthInput } from './star-strength'
import { calculateYongheegiAdjustments } from './yongheegi'
import { TEN_GODS, type BaseScoreBreakdown, type BaseScoreResult, type DomainScoreContributor, type InteractionEvent, type Palace, type TenGod } from './types'

const BRANCH_PALACES: Palace[] = ['year_branch', 'month_branch', 'day_branch', 'time_branch']
const PALACE_PRIORITY: Record<Palace, number> = {
  year_branch: 1,
  month_branch: 3,
  day_branch: 4,
  time_branch: 2,
}

function getDominantPalace(a: Palace, b: Palace): Palace {
  return PALACE_PRIORITY[a] >= PALACE_PRIORITY[b] ? a : b
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeStarRaw(value: number) {
  return clamp(value / 3, -1, 1)
}

function normalizeInteractionRaw(value: number) {
  return clamp(value / 2, -1, 1)
}

function normalizeHealthRaw(value: number) {
  return clamp(value, -1, 1)
}

function normalizeJohuRaw(value: number) {
  return clamp(value, -1, 1)
}

function normalizeYongheeRaw(value: number) {
  return clamp(value, -1, 1)
}

function createEmptyBreakdown(domain: BaseScoreBreakdown['domain']): BaseScoreBreakdown {
  return {
    domain,
    starScore: 0,
    interactionScore: 0,
    healthAdjustmentScore: 0,
    johuScore: 0,
    yongheeScore: 0,
    contributors: [],
    total: 50,
  }
}

function buildStarStrengthInputs(data: ManseryeokData): StarStrengthInput[] {
  const inputs = new Map<TenGod, StarStrengthInput>()

  for (const star of TEN_GODS) {
    inputs.set(star, {
      star,
      visibleStemCount: 0,
      hiddenStemCount: 0,
      monthSupport: 'neutral',
      rootSupportKeys: [],
      stemExposureKeys: [],
      hiddenStemGrades: [],
      interactionAdjustments: [],
    })
  }

  data.pillars.forEach((pillar, index) => {
    const palace = BRANCH_PALACES[index]
    const topStar = pillar.sipsung_top ? TEN_GOD_KR_TO_CODE[pillar.sipsung_top] : null
    const botStar = pillar.sipsung_bot ? TEN_GOD_KR_TO_CODE[pillar.sipsung_bot] : null

    if (topStar) {
      const current = inputs.get(topStar)!
      current.visibleStemCount = (current.visibleStemCount ?? 0) + 1
      if (palace === 'month_branch') {
        current.monthSupport = 'favorable'
        current.stemExposureKeys?.push('month_stem')
      } else if (palace === 'time_branch') {
        current.stemExposureKeys?.push('time_stem')
      } else if (palace === 'year_branch') {
        current.stemExposureKeys?.push('year_stem')
      }
    }

    if (botStar) {
      const current = inputs.get(botStar)!
      current.hiddenStemCount = (current.hiddenStemCount ?? 0) + 1
      current.hiddenStemGrades?.push('main_qi')

      if (palace === 'month_branch') {
        current.monthSupport = 'favorable'
        current.rootSupportKeys?.push('month_main_root')
      } else if (palace === 'day_branch') {
        current.rootSupportKeys?.push('day_main_root')
      } else if (palace === 'time_branch') {
        current.rootSupportKeys?.push('time_main_root')
      } else {
        current.rootSupportKeys?.push('year_main_root')
      }

      if (pillar.diShi) {
        current.diShi = current.diShi ?? pillar.diShi
      }

    }
  })

  return [...inputs.values()]
}

function buildInteractionEvents(data: ManseryeokData): InteractionEvent[] {
  const branchItems = data.pillars
    .map((pillar, index) => ({
      branch: pillar.jijiKR,
      palace: BRANCH_PALACES[index],
      kongMang: pillar.kongMang,
    }))
    .filter((item) => Boolean(item.branch))

  const stemItems = data.pillars
    .map((pillar, index) => ({
      stem: pillar.cheonganKR,
      palace: BRANCH_PALACES[index],
    }))
    .filter((item) => Boolean(item.stem))

  const events: InteractionEvent[] = []
  const dedupe = new Set<string>()
  const dayPillarKongMang = data.pillars[2]?.kongMang ?? ''

  for (let i = 0; i < branchItems.length; i += 1) {
    for (let j = i + 1; j < branchItems.length; j += 1) {
      const left = branchItems[i]
      const right = branchItems[j]
      const relation = detectBranchRelation(left.branch, right.branch)
      if (!relation) continue

      const palace = getDominantPalace(left.palace, right.palace)
      const key = [relation, left.palace, right.palace, left.branch, right.branch].join(':')
      if (dedupe.has(key)) continue
      dedupe.add(key)
      events.push({
        type: relation,
        palace,
        intensity: 1,
        note: `${PALACE_LABELS[left.palace]}-${PALACE_LABELS[right.palace]} ${INTERACTION_LABELS[relation]}`,
      })
    }
  }

  for (let i = 0; i < stemItems.length; i += 1) {
    for (let j = i + 1; j < stemItems.length; j += 1) {
      const left = stemItems[i]
      const right = stemItems[j]
      const relation = detectStemRelation(left.stem, right.stem)
      if (!relation) continue
      const palace = getDominantPalace(left.palace, right.palace)
      const key = [relation, left.palace, right.palace, left.stem, right.stem].join(':')
      if (dedupe.has(key)) continue
      dedupe.add(key)
      events.push({
        type: relation,
        palace,
        intensity: 0.8,
        note: `${PALACE_LABELS[left.palace]}-${PALACE_LABELS[right.palace]} ${INTERACTION_LABELS[relation]}`,
      })
    }
  }

  const samhapGroups = detectSamhap(branchItems.map((item) => item.branch))
  for (const samhap of samhapGroups) {
    const members = samhap.split('-')
    const matched = branchItems.filter((item) => members.includes(item.branch))
    const palace = matched.reduce((best, item) => getDominantPalace(best, item.palace), matched[0]?.palace ?? 'year_branch')
    const key = ['samhap', samhap, palace].join(':')
    if (dedupe.has(key)) continue
    dedupe.add(key)
    events.push({
      type: 'samhap',
      palace,
      intensity: 1,
      note: `${samhap} ${INTERACTION_LABELS.samhap}`,
    })
  }

  for (let i = 0; i < branchItems.length; i += 1) {
    for (let j = 0; j < branchItems.length; j += 1) {
      if (i === j) continue
      const source = branchItems[i]
      const target = branchItems[j]
      if (!source.kongMang || !isBranchInGongMang(target.branch, source.kongMang)) continue
      const palace = getDominantPalace(source.palace, target.palace)
      const key = ['gongmang', source.palace, target.palace, source.branch, target.branch].join(':')
      if (dedupe.has(key)) continue
      dedupe.add(key)
      events.push({
        type: 'gongmang',
        palace,
        intensity: source.palace === 'day_branch' || target.palace === 'day_branch' ? 1 : 0.78,
        note: `${PALACE_LABELS[source.palace]} 공망이 ${PALACE_LABELS[target.palace]}에 걸림`,
      })
    }
  }

  if (dayPillarKongMang) {
    for (const item of branchItems) {
      if (item.palace === 'day_branch') continue
      if (!isBranchInGongMang(item.branch, dayPillarKongMang)) continue
      const key = ['day-gongmang', item.palace, item.branch].join(':')
      if (dedupe.has(key)) continue
      dedupe.add(key)
      events.push({
        type: 'gongmang',
        palace: getDominantPalace('day_branch', item.palace),
        intensity: 1,
        note: `일주 공망이 ${PALACE_LABELS[item.palace]}에 닿아 있습니다.`,
      })
    }
  }

  return events
}

export type BaseScoreComputation = {
  result: BaseScoreResult
  starStrengths: Partial<Record<TenGod, StarStrengthBreakdown>>
  interactionEvents: InteractionEvent[]
}

export function calculateBaseScore(data: ManseryeokData): BaseScoreComputation {
  const starStrengthInputs = buildStarStrengthInputs(data)
  const starStrengthBreakdowns = Object.fromEntries(
    starStrengthInputs.map((input) => [input.star, calculateStarStrength(input)]),
  ) as Partial<Record<TenGod, StarStrengthBreakdown>>

  const starStrengthScores = Object.fromEntries(
    Object.entries(starStrengthBreakdowns).map(([star, breakdown]) => [star, breakdown.score]),
  ) as Partial<Record<TenGod, number>>

  const { scores: starScores, contributions: starContributions } = calculateDomainScoresFromStarStrengths(starStrengthScores)
  const interactionEvents = buildInteractionEvents(data)
  const interactionScores = scoreInteractionEventsByDomain(interactionEvents)
  const healthAdjustment = calculateHealthAdjustment(data)
  const johooAdjustments = calculateJohooAdjustments(data)
  const yongheegiAdjustments = calculateYongheegiAdjustments(data, starStrengthScores)

  const breakdowns = (Object.keys(starScores) as Array<keyof typeof starScores>).map((domain) => {
    const starScore = normalizeStarRaw(starScores[domain])
    const interactionScore = normalizeInteractionRaw(interactionScores[domain])
    const healthAdjustmentScore = domain === 'health' ? normalizeHealthRaw(healthAdjustment.score) : 0
    const johuScore = normalizeJohuRaw(johooAdjustments[domain].score)
    const yongheeScore = normalizeYongheeRaw(yongheegiAdjustments[domain].score)

    const domainStarContributors: DomainScoreContributor[] = starContributions
      .filter((item) => item.domain === domain && Math.abs(item.contribution) >= 0.08)
      .map((item) => ({
        domain,
        source: 'star',
        label: `${TEN_GOD_CODE_TO_KR[item.star]} 영향이 ${item.contribution > 0 ? '버팀목이 되어' : '부담으로 작용해'} ${domain === 'health' ? '건강 흐름' : '기본 흐름'}에 반영됩니다.`,
        value: item.contribution,
      }))

    const domainInteractionContributors: DomainScoreContributor[] = interactionEvents
      .map((event) => ({
        domain,
        source: 'interaction' as const,
        label: event.note ?? `${PALACE_LABELS[event.palace]} ${INTERACTION_LABELS[event.type]}`,
        value: scoreInteractionEvent(event.type, event.palace, domain, event.intensity),
      }))
      .filter((item) => Math.abs(item.value) >= 0.18)

    const contributors = [
      ...domainStarContributors,
      ...domainInteractionContributors,
      ...(domain === 'health' ? healthAdjustment.contributors : []),
      ...johooAdjustments[domain].contributors,
      ...yongheegiAdjustments[domain].contributors,
    ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

    const total = clamp(50 + starScore * 22 + interactionScore * 12 + healthAdjustmentScore * 10 + johuScore * 8 + yongheeScore * 10, 0, 100)

    return {
      ...createEmptyBreakdown(domain),
      starScore,
      interactionScore,
      healthAdjustmentScore,
      johuScore,
      yongheeScore,
      contributors,
      total,
    }
  })

  const domains = breakdowns.reduce<BaseScoreResult['domains']>((acc, breakdown) => {
    acc[breakdown.domain] = breakdown.total
    return acc
  }, {
    wealth: 0,
    health: 0,
    business: 0,
    career: 0,
    relationship: 0,
    study: 0,
    social: 0,
  })

  return {
    result: {
      domains,
      breakdowns,
    },
    starStrengths: starStrengthBreakdowns,
    interactionEvents,
  }
}
