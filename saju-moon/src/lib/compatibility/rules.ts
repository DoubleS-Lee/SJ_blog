import type { ManseryeokData } from '@/lib/saju/manseryeok'
import type { CompatibilityPreviewCard, CompatibilitySection } from './types'
import { getCompatibilityCopy } from './copy'

const STEM_TO_OHANG: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  갑: '목',
  을: '목',
  병: '화',
  정: '화',
  무: '토',
  기: '토',
  경: '금',
  신: '금',
  임: '수',
  계: '수',
}

const OHANG_GENERATES: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
}

const DAY_GAN_HE = new Set(['갑기', '을경', '병신', '정임', '무계'])
const DAY_GAN_CHUNG = new Set(['갑경', '을신', '병임', '정계', '무갑', '기을', '경병', '신정', '임무', '계기'])

const DAY_JI_HE = new Set(['자축', '인해', '묘술', '진유', '사신', '오미'])
const DAY_JI_CHUNG = new Set(['자오', '축미', '인신', '묘유', '진술', '사해'])
const DAY_JI_HYEONG = new Set(['자묘', '인사', '사신', '축술', '술미', '진진', '오오', '유유', '해해'])
const DAY_JI_HAE = new Set(['자미', '축오', '인사', '묘진', '신해', '유술'])
const DAY_JI_PO = new Set(['자유', '인미', '묘오', '진축', '사신', '해묘'])

const DAY_JI_SAMHAP_GROUPS = [
  new Set(['신', '자', '진']),
  new Set(['인', '오', '술']),
  new Set(['사', '유', '축']),
  new Set(['해', '묘', '미']),
]

const OHANG_SYMBOL: Record<string, string> = {
  목: '木',
  화: '火',
  토: '土',
  금: '金',
  수: '水',
}

const JOHOO_SYMBOL: Record<string, string> = {
  뜨거움: '열',
  차가움: '냉',
  '중화(쾌적)': '중화',
}

function getDayPillar(data: ManseryeokData) {
  return data.pillars[2]
}

function pairKey(a: string, b: string) {
  return `${a}|${b}`
}

function getStemOhang(stem: string) {
  return STEM_TO_OHANG[stem] ?? null
}

function normalizeElementScore(values: Record<string, number>) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1])
  return entries[0]?.[0] ?? '목'
}

function getOhangState(score: number, total: number) {
  if (total <= 0) return '중화(쾌적)'
  if (score >= total * 0.28) return '과다'
  if (score <= total * 0.12) return '결핍'
  return '중화(쾌적)'
}

function formatOhangCondition(element: string, state: string) {
  return `${element}(${OHANG_SYMBOL[element]})${state}`
}

function classifyDayGan(myGan: string, targetGan: string) {
  const key = pairKey(myGan, targetGan)
  if (myGan === targetGan) return 'same'
  if (DAY_GAN_HE.has(`${myGan}${targetGan}`)) return 'he'
  if (DAY_GAN_CHUNG.has(`${myGan}${targetGan}`)) return 'chung'

  const myOhang = getStemOhang(myGan)
  const targetOhang = getStemOhang(targetGan)
  if (myOhang && targetOhang) {
    if (OHANG_GENERATES[myOhang] === targetOhang) return 'sangsaeng'
    if (OHANG_GENERATES[targetOhang] === myOhang) return 'sangsaeng'
    if (myOhang !== targetOhang) return 'sanggeuk'
  }

  return key
}

function classifyDayJi(myJi: string, targetJi: string) {
  const key = pairKey(myJi, targetJi)
  if (myJi === targetJi) return 'same'
  if (DAY_JI_HE.has(`${myJi}${targetJi}`)) return 'he'
  if (DAY_JI_CHUNG.has(`${myJi}${targetJi}`)) return 'chung'
  if (DAY_JI_HYEONG.has(`${myJi}${targetJi}`)) return 'hyeong'
  if (DAY_JI_HAE.has(`${myJi}${targetJi}`)) return 'hae'
  if (DAY_JI_PO.has(`${myJi}${targetJi}`)) return 'po'

  const sameTrine = DAY_JI_SAMHAP_GROUPS.some((group) => group.has(myJi) && group.has(targetJi))
  if (sameTrine) return 'samhap'

  return key
}

function classifyOhang(my: ManseryeokData, target: ManseryeokData) {
  const myTop = normalizeElementScore(my.ohangScores)
  const targetTop = normalizeElementScore(target.ohangScores)
  const myTotal = Object.values(my.ohangScores).reduce((a, b) => a + b, 0)
  const targetTotal = Object.values(target.ohangScores).reduce((a, b) => a + b, 0)
  const myState = getOhangState(my.ohangScores[myTop] ?? 0, myTotal)
  const targetState = getOhangState(target.ohangScores[targetTop] ?? 0, targetTotal)

  return pairKey(
    formatOhangCondition(myTop, myState),
    formatOhangCondition(targetTop, targetState),
  )
}

function classifyJohoo(my: ManseryeokData, target: ManseryeokData) {
  const heatScore = (data: ManseryeokData) => {
    const fireWood = (data.ohangScores['화'] ?? 0) + (data.ohangScores['목'] ?? 0)
    const waterMetal = (data.ohangScores['수'] ?? 0) + (data.ohangScores['금'] ?? 0)
    return fireWood - waterMetal
  }

  const bucket = (score: number) => {
    if (score >= 6) return '뜨거움'
    if (score <= -6) return '차가움'
    return '중화(쾌적)'
  }

  return pairKey(bucket(heatScore(my)), bucket(heatScore(target)))
}

function getTopSipsungRole(data: ManseryeokData) {
  const entries = Object.entries(data.sipsungScores)
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => b[1] - a[1])

  const top = entries[0]?.[0] ?? '비견'
  if (['비견', '겁재'].includes(top)) return '비겁'
  if (['식신', '상관'].includes(top)) return '식상'
  if (['정재', '편재'].includes(top)) return '재성'
  if (['정관', '편관'].includes(top)) return '관성'
  return '인성'
}

function classifySipsung(my: ManseryeokData, target: ManseryeokData) {
  return pairKey(getTopSipsungRole(my), getTopSipsungRole(target))
}

function sectionLabel(section: CompatibilitySection) {
  switch (section) {
    case 'dayGan':
      return '일간 100'
    case 'dayJi':
      return '일지 144'
    case 'ohang':
      return '오행 40'
    case 'johoo':
      return '조후 9'
    case 'sipsung':
      return '십성 25'
  }
}

function sectionCopyKey(section: CompatibilitySection, male: ManseryeokData, female: ManseryeokData) {
  switch (section) {
    case 'dayGan': {
      const maleDay = getDayPillar(male)
      const femaleDay = getDayPillar(female)
      return pairKey(maleDay.cheonganKR, femaleDay.cheonganKR)
    }
    case 'dayJi': {
      const maleDay = getDayPillar(male)
      const femaleDay = getDayPillar(female)
      return pairKey(maleDay.jijiKR, femaleDay.jijiKR)
    }
    case 'ohang':
      return classifyOhang(male, female)
    case 'johoo':
      return classifyJohoo(male, female)
    case 'sipsung':
      return classifySipsung(male, female)
  }
}

export function buildCompatibilityPreviewCards(
  male: ManseryeokData,
  female: ManseryeokData,
): CompatibilityPreviewCard[] {
  const sections: CompatibilitySection[] = ['dayGan', 'dayJi', 'ohang', 'johoo', 'sipsung']

  return sections
    .map((section) => {
    const copyKey = sectionCopyKey(section, male, female)
    const copy = getCompatibilityCopy(section, copyKey)
    if (!copy) return null
    return {
      section,
      sectionLabel: sectionLabel(section),
      copyKey,
      variant: copy.pattern,
      pattern: copy.pattern,
      detailCase: copy.detailCase,
      maleCondition: copy.maleCondition,
      femaleCondition: copy.femaleCondition,
      title: copy.title,
      summary: copy.summary,
      detail: copy.detail,
    }
    })
    .filter((card): card is CompatibilityPreviewCard => card !== null)
}
