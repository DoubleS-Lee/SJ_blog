import { getManseryeokData } from '@/lib/saju/manseryeok'
import type { SajuInput } from '@/lib/saju/calculate'
import {
  DAILY_PAIR_TEXT,
  DAEWOON_SUPPORT_TEXT_BY_KEY,
  DAEWOON_TRACK_TEXT_BY_RELATION,
  DAEWOON_TRANSITION_TEXT,
  MONTHLY_PAIR_TEXT,
  YEARLY_PAIR_TEXT,
  type DualRelationKey,
  type FortuneCopyEntry,
} from './fortune-copy'
import { renderCompatibilityTemplate } from './template'

export type BranchRelation = '충' | '형' | '육합' | '삼합' | '방합' | '해' | '파' | '중립'
export type FortunePeriod = 'today' | 'month' | 'year' | 'daewoon'
export type Ohang = '\u6728' | '\u706b' | '\u571f' | '\u91d1' | '\u6c34'

export interface ReferenceBranches {
  solarDateLabel: string
  solarYear: number
  solarMonth: number
  solarDay: number
  dayBranch: string
  monthBranch: string
  yearBranch: string
}

export interface DualPeriodResult {
  period: Exclude<FortunePeriod, 'daewoon'>
  periodLabel: string
  referenceBranch: string
  meRelation: BranchRelation
  targetRelation: BranchRelation
  combinedScore: number
  combinedGrade: string
  summary: string
  detail: string
}

export interface DaewoonTrackMatch {
  relation: BranchRelation
  summary: string
  detail: string
}

export interface DaewoonElementSupportItem {
  direction: 'B\u2192A' | 'A\u2192B'
  element: Ohang
  summary: string
  detail: string
}

export interface DaewoonTransitionStatus {
  caseKey: 'both' | 'me' | 'target' | 'none'
  summary: string
  detail: string
}

export interface DaewoonPeriodResult {
  period: 'daewoon'
  periodLabel: string
  meDaewoonBranch: string
  targetDaewoonBranch: string
  meDaewoonOhang: Ohang | null
  targetDaewoonOhang: Ohang | null
  trackMatch: DaewoonTrackMatch
  elementSupports: DaewoonElementSupportItem[]
  transition: DaewoonTransitionStatus
  score: number
  grade: string
  summary: string
  detail: string
}

const SIX_HAP: Array<[string, string]> = [
  ['\uC790', '\uCD95'],
  ['\uC778', '\uD574'],
  ['\uBB18', '\uC220'],
  ['\uC9C4', '\uC720'],
  ['\uC0AC', '\uC2E0'],
  ['\uC624', '\uBBF8'],
]

const CHUNG: Array<[string, string]> = [
  ['\uC790', '\uC624'],
  ['\uCD95', '\uBBF8'],
  ['\uC778', '\uC2E0'],
  ['\uBB18', '\uC720'],
  ['\uC9C4', '\uC220'],
  ['\uC0AC', '\uD574'],
]

const PA: Array<[string, string]> = [
  ['\uC790', '\uC720'],
  ['\uCD95', '\uC9C4'],
  ['\uC778', '\uD574'],
  ['\uBB18', '\uC624'],
  ['\uC0AC', '\uC2E0'],
  ['\uBBF8', '\uC220'],
]

const HAE: Array<[string, string]> = [
  ['\uC790', '\uBBF8'],
  ['\uCD95', '\uC624'],
  ['\uC778', '\uC0AC'],
  ['\uBB18', '\uC9C4'],
  ['\uC2E0', '\uD574'],
  ['\uC720', '\uC220'],
]

const SAMHAP_GROUPS = [
  new Set(['\uC2E0', '\uC790', '\uC9C4']),
  new Set(['\uD574', '\uBB18', '\uBBF8']),
  new Set(['\uC778', '\uC624', '\uC220']),
  new Set(['\uC0AC', '\uC720', '\uCD95']),
]

const BANGHAP_GROUPS = [
  new Set(['\uC778', '\uBB18', '\uC9C4']),
  new Set(['\uC0AC', '\uC624', '\uBBF8']),
  new Set(['\uC2E0', '\uC720', '\uC220']),
  new Set(['\uD574', '\uC790', '\uCD95']),
]

const HYEONG_TRIADS = [
  new Set(['\uC778', '\uC0AC', '\uC2E0']),
  new Set(['\uCD95', '\uC220', '\uBBF8']),
]

const SELF_HYEONG = new Set(['\uC9C4', '\uC624', '\uC720', '\uD574'])

const RELATION_SCORE: Record<BranchRelation, number> = {
  육합: 3.0,
  삼합: 2.2,
  방합: 1.6,
  중립: 0,
  해: -1.2,
  파: -1.8,
  형: -2.6,
  충: -3.2,
}

const OHANG_KR_TO_CN = {
  '\ubaa9': '\u6728',
  '\ud654': '\u706b',
  '\ud1a0': '\u571f',
  '\uae08': '\u91d1',
  '\uc218': '\u6c34',
} as const

const OHANG_CN_VALUES = new Set<Ohang>(Object.values(OHANG_KR_TO_CN))

function isPairMatch(a: string, b: string, pairs: Array<[string, string]>) {
  return pairs.some(([left, right]) => (a === left && b === right) || (a === right && b === left))
}

function isInSameGroup(a: string, b: string, groups: Set<string>[]) {
  if (a === b) return false
  return groups.some((group) => group.has(a) && group.has(b))
}

export function detectCompatibilityRelation(a: string | null, b: string | null): BranchRelation {
  if (!a || !b) return '중립'

  if (isPairMatch(a, b, CHUNG)) return '충'

  const isSpecialHyeong = (a === '\uC790' && b === '\uBB18') || (a === '\uBB18' && b === '\uC790')
  if (isSpecialHyeong) return '형'
  if (a === b && SELF_HYEONG.has(a)) return '형'
  if (isInSameGroup(a, b, HYEONG_TRIADS)) return '형'

  if (isPairMatch(a, b, SIX_HAP)) return '육합'
  if (isInSameGroup(a, b, SAMHAP_GROUPS)) return '삼합'
  if (isInSameGroup(a, b, BANGHAP_GROUPS)) return '방합'
  if (isPairMatch(a, b, HAE)) return '해'
  if (isPairMatch(a, b, PA)) return '파'

  return '중립'
}

function toGrade(score: number) {
  if (score >= 4) return '매우 좋음'
  if (score >= 2) return '좋음'
  if (score >= 0) return '보통'
  if (score >= -2) return '주의'
  return '경계'
}

function getDualPairCopy(
  period: Exclude<FortunePeriod, 'daewoon'>,
  meRelation: BranchRelation,
  targetRelation: BranchRelation,
): FortuneCopyEntry | undefined {
  const pairKey = `${meRelation}|${targetRelation}` as DualRelationKey

  if (period === 'today') return DAILY_PAIR_TEXT[pairKey]
  if (period === 'month') return MONTHLY_PAIR_TEXT[pairKey]
  return YEARLY_PAIR_TEXT[pairKey]
}

function buildDualSummary(
  periodLabel: string,
  referenceBranch: string,
  meName: string,
  targetName: string,
  meRelation: BranchRelation,
  targetRelation: BranchRelation,
  combinedGrade: string,
  pairCopy?: FortuneCopyEntry,
) {
  if (pairCopy?.summary) {
    return renderCompatibilityTemplate(pairCopy.summary, {
      meName,
      targetName,
    })
  }

  return `${periodLabel} ?? ${referenceBranch}? ???? ? ${meName}? ${meRelation}, ${targetName}? ${targetRelation} ???? ?? ??? ${combinedGrade}???.`
}

function buildDualDetail(periodLabel: string, meName: string, targetName: string, pairCopy?: FortuneCopyEntry) {
  if (pairCopy?.detail) {
    return renderCompatibilityTemplate(pairCopy.detail, {
      meName,
      targetName,
    })
  }

  return `${periodLabel} ?? ?? ? ?????. ??? ?? ??(?/?/??/??/??/?/?/??)? ?? ??? ????, ?? ???? ?? ??? ?? ?? ???? ?????.`
}

function evaluateDualPeriod(
  period: Exclude<FortunePeriod, 'daewoon'>,
  periodLabel: string,
  meName: string,
  targetName: string,
  meDayBranch: string,
  targetDayBranch: string,
  referenceBranch: string,
): DualPeriodResult {
  const meRelation = detectCompatibilityRelation(meDayBranch, referenceBranch)
  const targetRelation = detectCompatibilityRelation(targetDayBranch, referenceBranch)
  const pairCopy = getDualPairCopy(period, meRelation, targetRelation)
  const combinedScore = RELATION_SCORE[meRelation] + RELATION_SCORE[targetRelation]
  const combinedGrade = toGrade(combinedScore)

  return {
    period,
    periodLabel,
    referenceBranch,
    meRelation,
    targetRelation,
    combinedScore,
    combinedGrade,
    summary: buildDualSummary(periodLabel, referenceBranch, meName, targetName, meRelation, targetRelation, combinedGrade, pairCopy),
    detail: buildDualDetail(periodLabel, meName, targetName, pairCopy),
  }
}

function asOhang(value: string | null | undefined): Ohang | null {
  if (!value) return null

  if (Object.prototype.hasOwnProperty.call(OHANG_KR_TO_CN, value)) {
    return OHANG_KR_TO_CN[value as keyof typeof OHANG_KR_TO_CN]
  }

  if (OHANG_CN_VALUES.has(value as Ohang)) {
    return value as Ohang
  }

  return null
}

export function getCurrentDaewoonCard(data: ReturnType<typeof getManseryeokData> | null) {
  if (!data?.daYun?.length) return null
  return (
    data.daYun.find((item) => item.isCurrent)
    ?? data.daYun.find((item) => data.currentAge >= item.startAge && data.currentAge <= item.endAge)
    ?? data.daYun[0]
    ?? null
  )
}

export function getCurrentDaewoonBranch(data: ReturnType<typeof getManseryeokData> | null) {
  return getCurrentDaewoonCard(data)?.jijiKR ?? null
}

export function getCurrentDaewoonOhang(data: ReturnType<typeof getManseryeokData> | null) {
  return asOhang(getCurrentDaewoonCard(data)?.jijiOhang)
}

export function isNearDaewoonTransition(data: ReturnType<typeof getManseryeokData> | null, yearWindow = 1) {
  if (!data?.daYun?.length) return false
  const currentCard = getCurrentDaewoonCard(data)
  if (!currentCard) return false

  const age = data.currentAge
  const distanceToStart = Math.abs(age - currentCard.startAge)
  const distanceToEnd = Math.abs(currentCard.endAge - age)
  return Math.min(distanceToStart, distanceToEnd) <= yearWindow
}

export function getDeficitOhangElements(data: ReturnType<typeof getManseryeokData> | null): Ohang[] {
  if (!data?.ohangScores) return []

  const readScore = (kr: keyof typeof OHANG_KR_TO_CN, cn: Ohang) => {
    const krScore = data.ohangScores[kr]
    if (Number.isFinite(krScore)) return krScore

    const cnScore = data.ohangScores[cn]
    if (Number.isFinite(cnScore)) return cnScore

    return Number.MAX_SAFE_INTEGER
  }

  const scored = (Object.entries(OHANG_KR_TO_CN) as Array<[keyof typeof OHANG_KR_TO_CN, Ohang]>).map(
    ([kr, cn]) => ({
      element: cn,
      score: readScore(kr, cn),
    }),
  )

  const validScores = scored.map((item) => item.score).filter((score) => Number.isFinite(score))
  if (validScores.length === 0) return []

  const minScore = Math.min(...validScores)
  if (!Number.isFinite(minScore) || minScore === Number.MAX_SAFE_INTEGER) return []

  return scored
    .filter((item) => item.score === minScore)
    .map((item) => item.element)
}

function buildDaewoonTrackMatch(relation: BranchRelation): DaewoonTrackMatch {
  const copy = DAEWOON_TRACK_TEXT_BY_RELATION[relation]
  return {
    relation,
    summary: copy.summary,
    detail: copy.detail,
  }
}

function buildDaewoonSupportKey(direction: 'B\u2192A' | 'A\u2192B', ohang: Ohang) {
  return `${direction}|${ohang}` as const
}

function buildElementSupports(params: {
  meDeficitOhang: Ohang[]
  targetDeficitOhang: Ohang[]
  meDaewoonOhang: Ohang | null
  targetDaewoonOhang: Ohang | null
}): DaewoonElementSupportItem[] {
  const results: DaewoonElementSupportItem[] = []

  if (params.targetDaewoonOhang && params.meDeficitOhang.includes(params.targetDaewoonOhang)) {
    const copy = DAEWOON_SUPPORT_TEXT_BY_KEY[buildDaewoonSupportKey('B\u2192A', params.targetDaewoonOhang)]
    results.push({
      direction: 'B\u2192A',
      element: params.targetDaewoonOhang,
      summary: copy.summary,
      detail: copy.detail,
    })
  }

  if (params.meDaewoonOhang && params.targetDeficitOhang.includes(params.meDaewoonOhang)) {
    const copy = DAEWOON_SUPPORT_TEXT_BY_KEY[buildDaewoonSupportKey('A\u2192B', params.meDaewoonOhang)]
    results.push({
      direction: 'A\u2192B',
      element: params.meDaewoonOhang,
      summary: copy.summary,
      detail: copy.detail,
    })
  }

  return results
}

function buildTransitionStatus(meNearTransition: boolean, targetNearTransition: boolean): DaewoonTransitionStatus {
  const caseKey: DaewoonTransitionStatus['caseKey'] =
    meNearTransition && targetNearTransition
      ? 'both'
      : meNearTransition
        ? 'me'
        : targetNearTransition
          ? 'target'
          : 'none'

  return {
    caseKey,
    summary: DAEWOON_TRANSITION_TEXT[caseKey].summary,
    detail: DAEWOON_TRANSITION_TEXT[caseKey].detail,
  }
}

export function buildDaewoonCompatibilityResult(input: {
  meName: string
  targetName: string
  meDaewoonBranch: string
  targetDaewoonBranch: string
  meDaewoonOhang: Ohang | null
  targetDaewoonOhang: Ohang | null
  meDeficitOhang: Ohang[]
  targetDeficitOhang: Ohang[]
  meNearTransition: boolean
  targetNearTransition: boolean
}): DaewoonPeriodResult {
  const relation = detectCompatibilityRelation(input.meDaewoonBranch, input.targetDaewoonBranch)
  const trackMatchRaw = buildDaewoonTrackMatch(relation)
  const elementSupportsRaw = buildElementSupports({
    meDeficitOhang: input.meDeficitOhang,
    targetDeficitOhang: input.targetDeficitOhang,
    meDaewoonOhang: input.meDaewoonOhang,
    targetDaewoonOhang: input.targetDaewoonOhang,
  })
  const transitionRaw = buildTransitionStatus(input.meNearTransition, input.targetNearTransition)

  const trackMatch: DaewoonTrackMatch = {
    ...trackMatchRaw,
    summary: renderCompatibilityTemplate(trackMatchRaw.summary, {
      meName: input.meName,
      targetName: input.targetName,
    }),
    detail: renderCompatibilityTemplate(trackMatchRaw.detail, {
      meName: input.meName,
      targetName: input.targetName,
    }),
  }
  const elementSupports = elementSupportsRaw.map((item) => ({
    ...item,
    summary: renderCompatibilityTemplate(item.summary, {
      meName: input.meName,
      targetName: input.targetName,
    }),
    detail: renderCompatibilityTemplate(item.detail, {
      meName: input.meName,
      targetName: input.targetName,
    }),
  }))
  const transition: DaewoonTransitionStatus = {
    ...transitionRaw,
    summary: renderCompatibilityTemplate(transitionRaw.summary, {
      meName: input.meName,
      targetName: input.targetName,
    }),
    detail: renderCompatibilityTemplate(transitionRaw.detail, {
      meName: input.meName,
      targetName: input.targetName,
    }),
  }

  const supportScore = elementSupports.length * 1.1
  const transitionScore =
    transition.caseKey === 'both'
      ? -1.0
      : transition.caseKey === 'none'
        ? 0.6
        : -0.5
  const score = RELATION_SCORE[relation] * 2 + supportScore + transitionScore
  const grade = toGrade(score)

  const supportSummary =
    elementSupports.length > 0
      ? `?? ?? ${elementSupports.length}?? ?????.`
      : '?? ?? ?? ??? ?? ???? ???? ????.'

  const detailSections = [
    trackMatch.detail,
    ...elementSupports.map((item) => item.detail),
    transition.detail,
  ].filter((item) => item && item.trim().length > 0)

  return {
    period: 'daewoon',
    periodLabel: '대운 궁합',
    meDaewoonBranch: input.meDaewoonBranch,
    targetDaewoonBranch: input.targetDaewoonBranch,
    meDaewoonOhang: input.meDaewoonOhang,
    targetDaewoonOhang: input.targetDaewoonOhang,
    trackMatch,
    elementSupports,
    transition,
    score,
    grade,
    summary: renderCompatibilityTemplate(
      `궤도 매칭은 ${relation}이며, ${supportSummary} 교운기 판정은 ${transition.summary}`,
      { meName: input.meName, targetName: input.targetName },
    ),
    detail: detailSections.join('\n\n'),
  }
}

function getSeoulNowParts(baseDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(baseDate)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

export function getCurrentReferenceBranches(baseDate = new Date()): ReferenceBranches {
  const now = getSeoulNowParts(baseDate)
  const input: SajuInput = {
    birth_year: now.year,
    birth_month: now.month,
    birth_day: now.day,
    birth_hour: now.hour,
    birth_minute: now.minute,
    gender: 'male',
    is_lunar: false,
  }
  const nowManseryeok = getManseryeokData(input)

  return {
    solarDateLabel: `${now.year}.${String(now.month).padStart(2, '0')}.${String(now.day).padStart(2, '0')}`,
    solarYear: now.year,
    solarMonth: now.month,
    solarDay: now.day,
    dayBranch: nowManseryeok.pillars[2]?.jijiKR ?? '',
    monthBranch: nowManseryeok.pillars[1]?.jijiKR ?? '',
    yearBranch: nowManseryeok.pillars[0]?.jijiKR ?? '',
  }
}

export function buildDailyCompatibilityFortuneResult(input: {
  meName: string
  targetName: string
  meDayBranch: string
  targetDayBranch: string
  reference: ReferenceBranches
}) {
  const today = evaluateDualPeriod(
    'today',
    '오늘의 궁합',
    input.meName,
    input.targetName,
    input.meDayBranch,
    input.targetDayBranch,
    input.reference.dayBranch,
  )

  const month = evaluateDualPeriod(
    'month',
    '이달의 궁합',
    input.meName,
    input.targetName,
    input.meDayBranch,
    input.targetDayBranch,
    input.reference.monthBranch,
  )

  const year = evaluateDualPeriod(
    'year',
    '올해의 궁합',
    input.meName,
    input.targetName,
    input.meDayBranch,
    input.targetDayBranch,
    input.reference.yearBranch,
  )

  return { today, month, year }
}
