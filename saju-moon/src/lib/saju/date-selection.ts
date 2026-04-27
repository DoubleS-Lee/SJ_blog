/* eslint-disable @typescript-eslint/no-require-imports */
const { Solar } = require('lunar-javascript')

import type { Cheongan, Jiji } from '@/types/saju'
import { TAEKIL_LOCAL_COPY, type TaekilUiCopyBundle } from '@/lib/taekil/copy-data'

interface LunarTimeData {
  getGanZhi(): string
  getYi(): string[]
  getJi(): string[]
  getMinHm(): string
  getMaxHm(): string
  getTianShen(): string
  getTianShenLuck(): string
  getChong(): string
}

interface LunarDateData {
  getDayZhiExact(): string
  getDayInGanZhiExact(): string
  getDayYi(sect?: number): string[]
  getDayJi(sect?: number): string[]
  getDayTianShen(): string
  getDayTianShenLuck(): string
  getDayJiShen(): string[]
  getDayXiongSha(): string[]
  getTimes(): LunarTimeData[]
  getMonth(): number
  getDay(): number
}

interface SolarDateData {
  getLunar(): LunarDateData
}

type SolarFactory = {
  fromYmd(year: number, month: number, day: number): SolarDateData
}

const SolarApi = Solar as SolarFactory

export type SelectionPurpose =
  | 'romance'
  | 'marriage'
  | 'moving'
  | 'opening'
  | 'contract'
  | 'interview'
  | 'treatment'
  | 'travel'

type TianShenName =
  | '青龙'
  | '明堂'
  | '天刑'
  | '朱雀'
  | '金匮'
  | '天德'
  | '白虎'
  | '玉堂'
  | '天牢'
  | '玄武'
  | '司命'
  | '勾陈'

export interface DateSelectionUserData {
  year_jiji: Jiji
  month_jiji: Jiji
  day_cheongan: Cheongan
  day_jiji: Jiji
  hour_jiji: Jiji | null
  day_xun_kong?: string | null
}

export interface TimeRecommendation {
  label: string
  start: string
  end: string
  score: number
  reason: string
}

export interface DateSelectionRecommendation {
  date: string
  year: number
  month: number
  day: number
  weekdayLabel: string
  lunarMonth: number
  lunarDay: number
  purpose: SelectionPurpose
  score: number
  level: 'best' | 'good' | 'normal' | 'caution' | 'avoid'
  summary: string
  reasons: string[]
  cautions: string[]
  goodHours: TimeRecommendation[]
  filteredOutReason: string | null
  dayGanji: string
  dayYi: string[]
  dayJi: string[]
  dayJiShen: string[]
  dayXiongSha: string[]
  isHwangdo: boolean
  dayBranch: string
}

export interface DateSelectionMonthResult {
  year: number
  month: number
  purpose: SelectionPurpose
  recommendations: DateSelectionRecommendation[]
  bestDates: DateSelectionRecommendation[]
}

type PurposeConfig = {
  id: SelectionPurpose
  label: string
  shortLabel: string
  description: string
  dayIncludeKeywords: string[]
  dayAvoidKeywords: string[]
  hourIncludeKeywords: string[]
  hourAvoidKeywords: string[]
}

const PURPOSE_CONFIGS: PurposeConfig[] = [
  {
    id: 'romance',
    label: '연애/소개팅',
    shortLabel: '연애',
    description: '대화와 만남의 흐름이 부드러운 날짜를 추천합니다.',
    dayIncludeKeywords: ['会亲友', '出行', '纳采', '订盟'],
    dayAvoidKeywords: ['安葬', '破土', '词讼'],
    hourIncludeKeywords: ['会亲友', '出行', '赴任'],
    hourAvoidKeywords: ['词讼', '安葬'],
  },
  {
    id: 'marriage',
    label: '결혼/상견례',
    shortLabel: '결혼',
    description: '혼인과 만남의 상징이 강한 날짜를 우선 추천합니다.',
    dayIncludeKeywords: ['嫁娶', '纳采', '订盟', '会亲友'],
    dayAvoidKeywords: ['安葬', '破土', '行丧', '掘井'],
    hourIncludeKeywords: ['嫁娶', '纳采', '会亲友'],
    hourAvoidKeywords: ['安葬', '破土'],
  },
  {
    id: 'moving',
    label: '이사',
    shortLabel: '이사',
    description: '이동과 입주 흐름이 안정적인 날짜를 추천합니다.',
    dayIncludeKeywords: ['移徙', '入宅', '安床', '搬家'],
    dayAvoidKeywords: ['破土', '安葬', '掘井'],
    hourIncludeKeywords: ['移徙', '入宅', '安床'],
    hourAvoidKeywords: ['破土', '安葬'],
  },
  {
    id: 'opening',
    label: '개업/오픈',
    shortLabel: '개업',
    description: '문을 열고 손님을 받기 좋은 날짜를 추천합니다.',
    dayIncludeKeywords: ['开市', '开业', '开张', '交易', '立券'],
    dayAvoidKeywords: ['闭市', '安葬', '破土'],
    hourIncludeKeywords: ['开市', '交易', '立券'],
    hourAvoidKeywords: ['安葬', '破土'],
  },
  {
    id: 'contract',
    label: '계약/서명',
    shortLabel: '계약',
    description: '문서와 확정, 거래 흐름이 좋은 날짜를 추천합니다.',
    dayIncludeKeywords: ['交易', '立券', '纳财', '签约'],
    dayAvoidKeywords: ['词讼', '破土', '安葬'],
    hourIncludeKeywords: ['交易', '立券', '纳财'],
    hourAvoidKeywords: ['词讼', '破土'],
  },
  {
    id: 'interview',
    label: '면접/시험',
    shortLabel: '면접',
    description: '말과 평가, 출발 흐름이 무난한 날짜를 추천합니다.',
    dayIncludeKeywords: ['入学', '习艺', '赴任', '出行'],
    dayAvoidKeywords: ['词讼', '安葬', '破土'],
    hourIncludeKeywords: ['入学', '习艺', '赴任'],
    hourAvoidKeywords: ['词讼'],
  },
  {
    id: 'treatment',
    label: '수술/시술',
    shortLabel: '수술',
    description: '치료와 회복 관점에서 비교적 무난한 날짜를 추천합니다.',
    dayIncludeKeywords: ['求医', '治病', '疗病', '针灸'],
    dayAvoidKeywords: ['嫁娶', '远行', '安葬'],
    hourIncludeKeywords: ['求医', '治病', '疗病', '针灸'],
    hourAvoidKeywords: ['远行'],
  },
  {
    id: 'travel',
    label: '여행/출발',
    shortLabel: '여행',
    description: '출행과 이동 흐름이 비교적 편안한 날짜를 추천합니다.',
    dayIncludeKeywords: ['出行', '移徙', '会亲友'],
    dayAvoidKeywords: ['安葬', '破土', '词讼'],
    hourIncludeKeywords: ['出行', '移徙'],
    hourAvoidKeywords: ['词讼', '安葬'],
  },
]

const PURPOSE_MAP = Object.fromEntries(
  PURPOSE_CONFIGS.map((config) => [config.id, config]),
) as Record<SelectionPurpose, PurposeConfig>

const YELLOW_GODS = new Set<TianShenName>(['青龙', '明堂', '金匮', '天德', '玉堂', '司命'])

const GOD_KOREAN_LABELS: Record<TianShenName, string> = {
  青龙: '청룡',
  明堂: '명당',
  天刑: '천형',
  朱雀: '주작',
  金匮: '금궤',
  天德: '천덕',
  白虎: '백호',
  玉堂: '옥당',
  天牢: '천로',
  玄武: '현무',
  司命: '사명',
  勾陈: '구진',
}

const PURPOSE_GOD_WEIGHTS: Record<SelectionPurpose, Record<TianShenName, number>> = {
  romance: {
    青龙: 18, 明堂: 8, 金匮: 4, 天德: 12, 玉堂: 6, 司命: 4,
    天刑: -12, 朱雀: -14, 白虎: -18, 天牢: -10, 玄武: -14, 勾陈: -8,
  },
  marriage: {
    青龙: 10, 明堂: 18, 金匮: 6, 天德: 16, 玉堂: 10, 司命: 6,
    天刑: -10, 朱雀: -10, 白虎: -20, 天牢: -14, 玄武: -10, 勾陈: -8,
  },
  moving: {
    青龙: 14, 明堂: 4, 金匮: 8, 天德: 8, 玉堂: 4, 司命: 6,
    天刑: -8, 朱雀: -8, 白虎: -10, 天牢: -20, 玄武: -10, 勾陈: -18,
  },
  opening: {
    青龙: 8, 明堂: 14, 金匮: 18, 天德: 6, 玉堂: 8, 司命: 8,
    天刑: -10, 朱雀: -12, 白虎: -10, 天牢: -16, 玄武: -16, 勾陈: -16,
  },
  contract: {
    青龙: 4, 明堂: 10, 金匮: 20, 天德: 6, 玉堂: 14, 司命: 16,
    天刑: -18, 朱雀: -18, 白虎: -8, 天牢: -12, 玄武: -20, 勾陈: -12,
  },
  interview: {
    青龙: 6, 明堂: 16, 金匮: 6, 天德: 8, 玉堂: 18, 司命: 14,
    天刑: -16, 朱雀: -12, 白虎: -8, 天牢: -8, 玄武: -8, 勾陈: -8,
  },
  treatment: {
    青龙: 4, 明堂: 6, 金匮: 6, 天德: 14, 玉堂: 8, 司命: 10,
    天刑: -18, 朱雀: -6, 白虎: -20, 天牢: -10, 玄武: -8, 勾陈: -8,
  },
  travel: {
    青龙: 18, 明堂: 4, 金匮: 4, 天德: 8, 玉堂: 4, 司命: 6,
    天刑: -8, 朱雀: -8, 白虎: -16, 天牢: -18, 玄武: -12, 勾陈: -8,
  },
}

const KR_TO_CN_JIJI: Record<Jiji, string> = {
  자: '子',
  축: '丑',
  인: '寅',
  묘: '卯',
  진: '辰',
  사: '巳',
  오: '午',
  미: '未',
  신: '申',
  유: '酉',
  술: '戌',
  해: '亥',
}

const CN_BRANCH_TO_LABEL: Record<string, string> = {
  子: '자',
  丑: '축',
  寅: '인',
  卯: '묘',
  辰: '진',
  巳: '사',
  午: '오',
  未: '미',
  申: '신',
  酉: '유',
  戌: '술',
  亥: '해',
}

const KR_TO_CN_CHEONGAN: Record<Cheongan, string> = {
  갑: '甲',
  을: '乙',
  병: '丙',
  정: '丁',
  무: '戊',
  기: '己',
  경: '庚',
  신: '辛',
  임: '壬',
  계: '癸',
}

const BRANCH_CLASH: Record<string, string> = {
  子: '午',
  丑: '未',
  寅: '申',
  卯: '酉',
  辰: '戌',
  巳: '亥',
  午: '子',
  未: '丑',
  申: '寅',
  酉: '卯',
  戌: '辰',
  亥: '巳',
}

const BRANCH_HARMONY: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  卯: '戌',
  辰: '酉',
  巳: '申',
  午: '未',
  未: '午',
  申: '巳',
  酉: '辰',
  戌: '卯',
  亥: '寅',
}

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
const DI_SHI_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'] as const
const DI_SHI_CONFIG: Record<string, { startBranch: typeof BRANCH_ORDER[number]; direction: 1 | -1 }> = {
  甲: { startBranch: '亥', direction: 1 },
  乙: { startBranch: '午', direction: -1 },
  丙: { startBranch: '寅', direction: 1 },
  丁: { startBranch: '酉', direction: -1 },
  戊: { startBranch: '寅', direction: 1 },
  己: { startBranch: '酉', direction: -1 },
  庚: { startBranch: '巳', direction: 1 },
  辛: { startBranch: '子', direction: -1 },
  壬: { startBranch: '申', direction: 1 },
  癸: { startBranch: '卯', direction: -1 },
}

const FAVORABLE_DI_SHI = new Set(['长生', '冠带', '临官', '帝旺'])
const UNFAVORABLE_DI_SHI = new Set(['衰', '病', '死', '墓', '绝'])
const HYEONG_GROUPS = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
  ['子', '卯'],
] as const
const SELF_HYEONG = new Set(['辰', '午', '酉', '亥'])
const HARD_CLASH_PURPOSES = new Set<SelectionPurpose>(['marriage', 'contract'])
const DAY_CLASH_PENALTIES: Record<SelectionPurpose, number> = {
  romance: 28,
  marriage: 0,
  moving: 20,
  opening: 24,
  contract: 0,
  interview: 24,
  treatment: 18,
  travel: 20,
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function isValidPurpose(value: string | undefined): value is SelectionPurpose {
  if (!value) return false
  return value in PURPOSE_MAP
}

export function getSelectionPurposes() {
  return PURPOSE_CONFIGS
}

export function getDefaultSelectionPurpose(): SelectionPurpose {
  return 'contract'
}

function includesAnyKeyword(values: string[], keywords: string[]) {
  return values.some((value) => keywords.some((keyword) => value.includes(keyword)))
}

function getDiShi(dayStem: Cheongan, branch: string) {
  const stem = KR_TO_CN_CHEONGAN[dayStem]
  const config = DI_SHI_CONFIG[stem]
  const branchIndex = BRANCH_ORDER.indexOf(branch as (typeof BRANCH_ORDER)[number])
  const startIndex = BRANCH_ORDER.indexOf(config.startBranch)

  if (branchIndex < 0 || startIndex < 0) {
    return null
  }

  const offset = config.direction === 1
    ? (branchIndex - startIndex + 12) % 12
    : (startIndex - branchIndex + 12) % 12

  return DI_SHI_STAGES[offset] ?? null
}

function getDiShiScore(stage: string | null) {
  if (!stage) return 0
  if (FAVORABLE_DI_SHI.has(stage)) return 8
  if (UNFAVORABLE_DI_SHI.has(stage)) return -8
  return 0
}

function renderTaekilTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  )
}
function buildDiShiReason(stage: string, copy: TaekilUiCopyBundle) {
  return renderTaekilTemplate(copy.templates.diShiReason, { stage })
}
function buildDiShiCaution(stage: string, copy: TaekilUiCopyBundle) {
  return renderTaekilTemplate(copy.templates.diShiCaution, { stage })
}

function parseXunKongBranches(value: string | null | undefined) {
  if (!value) return []
  return value
    .split('')
    .filter((char) => BRANCH_ORDER.includes(char as (typeof BRANCH_ORDER)[number]))
}

function isHyeong(userBranch: string, targetBranch: string) {
  if (userBranch === targetBranch && SELF_HYEONG.has(userBranch)) {
    return true
  }

  return HYEONG_GROUPS.some((group) => {
    const hasUserBranch = group.some((value) => value === userBranch)
    const hasTargetBranch = group.some((value) => value === targetBranch)
    return hasUserBranch && hasTargetBranch
  })
}

function getPurposeReason(config: PurposeConfig, copy: TaekilUiCopyBundle) {
  const purposeLabel = copy.purposes[config.id]?.shortLabel ?? config.shortLabel
  return renderTaekilTemplate(copy.templates.purposeReason, { purposeLabel })
}

function getHarmonyReason(targetLabel: string, copy: TaekilUiCopyBundle) {
  return renderTaekilTemplate(copy.templates.harmonyReason, { targetLabel })
}

function getGodWeight(purpose: SelectionPurpose, god: TianShenName) {
  return PURPOSE_GOD_WEIGHTS[purpose][god] ?? 0
}

function getGodDisplayLabel(god: TianShenName) {
  const korean = GOD_KOREAN_LABELS[god]
  const suffix = YELLOW_GODS.has(god) ? '황도' : '흑도'
  return `${korean}${suffix}`
}

function buildGodReason(god: TianShenName, purposeLabel: string, copy: TaekilUiCopyBundle) {
  const godLabel = getGodDisplayLabel(god)
  return renderTaekilTemplate(copy.templates.godReasonDefault, { godLabel, purposeLabel })
}

function buildGodCaution(god: TianShenName, purposeLabel: string, copy: TaekilUiCopyBundle) {
  const godLabel = getGodDisplayLabel(god)
  return renderTaekilTemplate(copy.templates.godCautionDefault, { godLabel, purposeLabel })
}

function buildSummary(reasons: string[], cautions: string[], copy: TaekilUiCopyBundle) {
  if (reasons.length > 0) return reasons[0]
  if (cautions.length > 0) return cautions[0]
  return copy.templates.summaryFallback
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function applySeoulTimeOffset(hm: string, offsetMinutes = 32) {
  const [hourText = '0', minuteText = '0'] = hm.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return hm
  }

  const totalMinutes = hour * 60 + minute + offsetMinutes
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const adjustedHour = Math.floor(normalized / 60)
  const adjustedMinute = normalized % 60

  return `${String(adjustedHour).padStart(2, '0')}:${String(adjustedMinute).padStart(2, '0')}`
}

function getLevel(score: number, filteredOutReason: string | null): DateSelectionRecommendation['level'] {
  if (filteredOutReason) return 'avoid'
  if (score >= 60) return 'best'
  if (score >= 35) return 'good'
  if (score >= 15) return 'normal'
  return 'caution'
}

function normalizeRecommendation(
  base: Omit<DateSelectionRecommendation, 'level' | 'summary'>,
  copy: TaekilUiCopyBundle,
): DateSelectionRecommendation {
  const level = getLevel(base.score, base.filteredOutReason)
  const isRecommended = level === 'best' || level === 'good'
  const reasons = isRecommended || level === 'normal' ? base.reasons : []
  const goodHours = isRecommended ? base.goodHours : []
  const cautions = level === 'avoid' ? [] : base.cautions
  return {
    ...base,
    level,
    reasons,
    goodHours,
    cautions,
    summary: buildSummary(
      reasons,
      isRecommended ? cautions : [base.filteredOutReason ?? copy.templates.normalizeAvoidFallback],
      copy,
    ),
  }
}

function scoreTimeRecommendation(
  time: LunarTimeData,
  user: DateSelectionUserData,
  config: PurposeConfig,
  copy: TaekilUiCopyBundle,
): TimeRecommendation | null {
  const yi = time.getYi()
  const ji = time.getJi()
  const timeBranch = time.getGanZhi().slice(1)
  const timeGod = time.getTianShen() as TianShenName
  if (BRANCH_CLASH[KR_TO_CN_JIJI[user.day_jiji]] === timeBranch) {
    return null
  }
  let score = 0
  const reasons: string[] = []
  const matchedIncludeValues = yi.filter((value) =>
    config.hourIncludeKeywords.some((keyword) => value.includes(keyword)),
  )
  const godWeight = getGodWeight(config.id, timeGod)
  const purposeLabel = copy.purposes[config.id]?.shortLabel ?? config.shortLabel
  if (matchedIncludeValues.length > 0) {
    score += 18
    reasons.push(
      renderTaekilTemplate(copy.templates.timeIncludeReason, {
        matchedKeywords: `'${matchedIncludeValues.slice(0, 2).join("', '")}'`,
        purposeLabel,
      }),
    )
  }
  if (godWeight > 0) {
    score += godWeight
    reasons.push(buildGodReason(timeGod, purposeLabel, copy))
  } else if (godWeight < 0) {
    score += godWeight
  }
  if (time.getTianShenLuck() === '길') {
    score += 6
  }
  if (BRANCH_HARMONY[KR_TO_CN_JIJI[user.day_jiji]] === timeBranch) {
    score += 8
    reasons.push(copy.templates.timeDayHarmonyReason)
  }
  if (user.hour_jiji && BRANCH_HARMONY[KR_TO_CN_JIJI[user.hour_jiji]] === timeBranch) {
    score += 5
  }
  if (includesAnyKeyword(ji, config.hourAvoidKeywords)) {
    score -= 12
  }
  if (BRANCH_CLASH[KR_TO_CN_JIJI[user.year_jiji]] === timeBranch) {
    score -= 8
  }
  if (user.hour_jiji && BRANCH_CLASH[KR_TO_CN_JIJI[user.hour_jiji]] === timeBranch) {
    score -= 6
  }
  if (score <= 0) {
    return null
  }
  const adjustedStart = applySeoulTimeOffset(time.getMinHm())
  const adjustedEnd = applySeoulTimeOffset(time.getMaxHm())
  return {
    label: `${adjustedStart}~${adjustedEnd}`,
    start: adjustedStart,
    end: adjustedEnd,
    score,
    reason:
      reasons.length > 1
        ? `${reasons[0]} ${reasons.slice(1, 3).join(' ')}`
        : reasons[0] ?? copy.templates.timeGeneralFallback,
  }
}

function buildDayRecommendation(
  user: DateSelectionUserData,
  year: number,
  month: number,
  day: number,
  purpose: SelectionPurpose,
  copy: TaekilUiCopyBundle,
): DateSelectionRecommendation {
  const config = PURPOSE_MAP[purpose]
  const purposeLabel = copy.purposes[purpose]?.shortLabel ?? config.shortLabel
  const solar = SolarApi.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const dayYi = lunar.getDayYi()
  const dayJi = lunar.getDayJi()
  const dayJiShen = lunar.getDayJiShen()
  const dayXiongSha = lunar.getDayXiongSha()
  const dayBranch = lunar.getDayZhiExact()
  const dayGanji = lunar.getDayInGanZhiExact()
  const dayTianShen = lunar.getDayTianShen() as TianShenName
  const isHwangdo = YELLOW_GODS.has(dayTianShen)
  const dayDiShi = getDiShi(user.day_cheongan, dayBranch)
  const dayXunKongBranches = parseXunKongBranches(user.day_xun_kong)
  const reasons: string[] = []
  const cautions: string[] = []
  let filteredOutReason: string | null = null
  let score = 0
  if (BRANCH_CLASH[KR_TO_CN_JIJI[user.day_jiji]] === dayBranch) {
    if (HARD_CLASH_PURPOSES.has(purpose)) {
      filteredOutReason = copy.templates.filteredReasonDayClash
    } else {
      score -= DAY_CLASH_PENALTIES[purpose]
      cautions.push(copy.templates.cautionDayClash)
    }
  }
  if (
    !filteredOutReason
    && includesAnyKeyword(dayJi, config.dayAvoidKeywords)
    && !includesAnyKeyword(dayYi, config.dayIncludeKeywords)
  ) {
    filteredOutReason = renderTaekilTemplate(copy.templates.filteredReasonDayAvoid, { purposeLabel })
  }
  if (includesAnyKeyword(dayYi, config.dayIncludeKeywords)) {
    score += 30
    reasons.push(getPurposeReason(config, copy))
  }
  if (dayXunKongBranches.includes(dayBranch)) {
    const kongWangPenalty = purpose === 'marriage' || purpose === 'contract' ? 25 : 20
    score -= kongWangPenalty
    cautions.push(renderTaekilTemplate(copy.templates.cautionXunKong, { purposeLabel }))
  }
  const dayGodWeight = getGodWeight(purpose, dayTianShen)
  if (dayGodWeight > 0) {
    score += dayGodWeight
    reasons.push(buildGodReason(dayTianShen, purposeLabel, copy))
  } else if (dayGodWeight < 0) {
    score += dayGodWeight
    cautions.push(buildGodCaution(dayTianShen, purposeLabel, copy))
  }
  if (BRANCH_HARMONY[KR_TO_CN_JIJI[user.year_jiji]] === dayBranch) {
    score += 10
    reasons.push(getHarmonyReason('연지', copy))
  }
  if (user.hour_jiji && BRANCH_HARMONY[KR_TO_CN_JIJI[user.hour_jiji]] === dayBranch) {
    score += 6
    reasons.push(getHarmonyReason('시지', copy))
  }
  if (BRANCH_HARMONY[KR_TO_CN_JIJI[user.day_jiji]] === dayBranch) {
    score += 15
    reasons.push(getHarmonyReason('일지', copy))
  }
  if (BRANCH_HARMONY[KR_TO_CN_JIJI[user.month_jiji]] === dayBranch) {
    score += 8
    reasons.push(getHarmonyReason('월지', copy))
  }
  if (BRANCH_CLASH[KR_TO_CN_JIJI[user.year_jiji]] === dayBranch) {
    score -= 15
    cautions.push(copy.templates.cautionYearClash)
  }
  if (user.hour_jiji && BRANCH_CLASH[KR_TO_CN_JIJI[user.hour_jiji]] === dayBranch) {
    score -= 8
    cautions.push(copy.templates.cautionHourClash)
  }
  if (BRANCH_CLASH[KR_TO_CN_JIJI[user.month_jiji]] === dayBranch) {
    score -= 12
    cautions.push(copy.templates.cautionMonthClash)
  }
  if (isHyeong(KR_TO_CN_JIJI[user.day_jiji], dayBranch)) {
    score -= 10
    cautions.push(copy.templates.cautionHyeong)
  }
  const diShiScore = getDiShiScore(dayDiShi)
  if (diShiScore > 0 && dayDiShi) {
    score += diShiScore
    reasons.push(buildDiShiReason(dayDiShi, copy))
  } else if (diShiScore < 0 && dayDiShi) {
    score += diShiScore
    cautions.push(buildDiShiCaution(dayDiShi, copy))
  }
  if (includesAnyKeyword(dayJi, config.dayAvoidKeywords)) {
    score -= 20
    cautions.push(renderTaekilTemplate(copy.templates.cautionDayAvoidGeneral, { purposeLabel }))
  }
  if (dayXiongSha.length >= 4) {
    score -= 8
    cautions.push(copy.templates.cautionXiongSha)
  }
  const goodHours = lunar
    .getTimes()
    .map((time) => scoreTimeRecommendation(time, user, config, copy))
    .filter((value): value is TimeRecommendation => value !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  if (!filteredOutReason && goodHours.length === 0) {
    cautions.push(copy.templates.cautionNoGoodHours)
  }
  if (goodHours.length >= 3) {
    score += 15
  } else if (goodHours.length > 0) {
    score += 8
  }
  return normalizeRecommendation({
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    year,
    month,
    day,
    weekdayLabel: WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()],
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    purpose,
    score,
    reasons: reasons.slice(0, 3),
    cautions: cautions.slice(0, 3),
    goodHours,
    filteredOutReason,
    dayGanji,
    dayYi,
    dayJi,
    dayJiShen,
    dayXiongSha,
    isHwangdo,
    dayBranch,
  }, copy)
}

export function getDateSelectionMonthResult(
  user: DateSelectionUserData,
  year: number,
  month: number,
  purpose: SelectionPurpose,
  copy: TaekilUiCopyBundle = TAEKIL_LOCAL_COPY,
): DateSelectionMonthResult {
  const safeYear = Number.isFinite(year) ? year : new Date().getFullYear()
  const safeMonth = month >= 1 && month <= 12 ? month : new Date().getMonth() + 1
  const recommendations = Array.from(
    { length: getDaysInMonth(safeYear, safeMonth) },
    (_, index) => buildDayRecommendation(user, safeYear, safeMonth, index + 1, purpose, copy),
  )
  const bestDates = recommendations
    .filter((item) => item.level === 'best' || item.level === 'good')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  return {
    year: safeYear,
    month: safeMonth,
    purpose,
    recommendations,
    bestDates,
  }
}

export function parseSelectionPurpose(value: string | undefined): SelectionPurpose {
  return isValidPurpose(value) ? value : getDefaultSelectionPurpose()
}

export function getBranchLabel(branch: string) {
  return CN_BRANCH_TO_LABEL[branch] ?? branch
}

