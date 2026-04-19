/**
 * 만세력 상세 표시용 계산 모듈
 * ⚠️ 서버 전용 — 클라이언트 컴포넌트에서 import 금지
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const { Solar, Lunar } = require('lunar-javascript')

import type { SajuInput } from './calculate'
import { calculateSaju } from './calculate'

// ─────────────────────────────────────────────
// 매핑 테이블
// ─────────────────────────────────────────────

const CN_TO_KR_CHEONGAN: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
}

const CN_TO_KR_JIJI: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
}

// 표준 한국 사주 지장간 (여기→중기→정기 순)
// lunar-javascript 내장 테이블보다 우선 적용
const JIJI_HIDEKAN_KR: Record<string, string[]> = {
  자: ['임', '계'],
  축: ['계', '신', '기'],
  인: ['무', '병', '갑'],
  묘: ['갑', '을'],
  진: ['을', '계', '무'],
  사: ['무', '경', '병'],
  오: ['병', '기', '정'],
  미: ['정', '을', '기'],
  신: ['무', '임', '경'],
  유: ['경', '신'],
  술: ['신', '정', '무'],
  해: ['갑', '임'],
}

// 포태법(胞胎法) 12운성 — 일간(天干) × 지지(地支) 조합
const DISHE_TABLE: Record<string, Record<string, string>> = {
  갑: { 해: '장생', 자: '목욕', 축: '관대', 인: '건록', 묘: '제왕', 진: '쇠', 사: '병', 오: '사', 미: '묘', 신: '절', 유: '태', 술: '양' },
  을: { 오: '장생', 사: '목욕', 진: '관대', 묘: '건록', 인: '제왕', 축: '쇠', 자: '병', 해: '사', 술: '묘', 유: '절', 신: '태', 미: '양' },
  병: { 인: '장생', 묘: '목욕', 진: '관대', 사: '건록', 오: '제왕', 미: '쇠', 신: '병', 유: '사', 술: '묘', 해: '절', 자: '태', 축: '양' },
  정: { 유: '장생', 신: '목욕', 미: '관대', 오: '건록', 사: '제왕', 진: '쇠', 묘: '병', 인: '사', 축: '묘', 자: '절', 해: '태', 술: '양' },
  무: { 인: '장생', 묘: '목욕', 진: '관대', 사: '건록', 오: '제왕', 미: '쇠', 신: '병', 유: '사', 술: '묘', 해: '절', 자: '태', 축: '양' },
  기: { 유: '장생', 신: '목욕', 미: '관대', 오: '건록', 사: '제왕', 진: '쇠', 묘: '병', 인: '사', 축: '묘', 자: '절', 해: '태', 술: '양' },
  경: { 사: '장생', 오: '목욕', 미: '관대', 신: '건록', 유: '제왕', 술: '쇠', 해: '병', 자: '사', 축: '묘', 인: '절', 묘: '태', 진: '양' },
  신: { 자: '장생', 해: '목욕', 술: '관대', 유: '건록', 신: '제왕', 미: '쇠', 오: '병', 사: '사', 진: '묘', 묘: '절', 인: '태', 축: '양' },
  임: { 신: '장생', 유: '목욕', 술: '관대', 해: '건록', 자: '제왕', 축: '쇠', 인: '병', 묘: '사', 진: '묘', 사: '절', 오: '태', 미: '양' },
  계: { 묘: '장생', 인: '목욕', 축: '관대', 자: '건록', 해: '제왕', 술: '쇠', 유: '병', 신: '사', 미: '묘', 오: '절', 사: '태', 진: '양' },
}

// 포태법 12운성 조회
function getDiShi(ilganKR: string, jjKR: string): string {
  return DISHE_TABLE[ilganKR]?.[jjKR] ?? ''
}

// 지지 본기(정기) 십성 계산
function getJijiSipsung(ilganKR: string, jjKR: string): string {
  const hidekan = JIJI_HIDEKAN_KR[jjKR] ?? []
  const bongi = hidekan[hidekan.length - 1] ?? ''
  return bongi ? getSipsung(ilganKR, bongi) : ''
}

export const KR_TO_CN_CHEONGAN: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
  기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
}

export const KR_TO_CN_JIJI: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
  오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
}

// 오행 (천간)
const CHEONGAN_OHANG: Record<string, string> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토',
  기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
}

// 오행 (지지)
const JIJI_OHANG: Record<string, string> = {
  인: '목', 묘: '목',
  사: '화', 오: '화',
  신: '금', 유: '금',
  해: '수', 자: '수',
  진: '토', 술: '토', 축: '토', 미: '토',
}

// 오행 대표 한자
export const OHANG_CN: Record<string, string> = {
  목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
}

// 오행 대표 한국어 별칭
export const OHANG_ALT: Record<string, string> = {
  목: '나무', 화: '불', 토: '흙', 금: '쇠', 수: '물',
}

// 12운성 중국어 → 한국어
const DISHY_CN_TO_KR: Record<string, string> = {
  '长生': '장생', '沐浴': '목욕', '冠带': '관대', '临官': '임관',
  '帝旺': '제왕', '衰': '쇠', '病': '병', '死': '사',
  '墓': '묘', '绝': '절', '胎': '태', '养': '양',
}

// 십성 중국어 → 한국어
const CN_TO_KR_SIPSUNG: Record<string, string> = {
  '比肩': '비견', '劫财': '겁재', '食神': '식신', '伤官': '상관',
  '偏财': '편재', '正财': '정재', '七杀': '편관', '正官': '정관',
  '偏印': '편인', '正印': '정인', '日主': '일원',
}

// 양간 (陽干)
const YANG_CHEONGAN = new Set(['갑', '병', '무', '경', '임'])

// 오행 상생 (generates): A → B (A가 B를 생한다)
const GENERATES: Record<string, string> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
}

// 십성 계산 (일간 기준 타간)
function getSipsung(ilgan: string, target: string): string {
  const ilOhang = CHEONGAN_OHANG[ilgan]
  const tgOhang = CHEONGAN_OHANG[target]
  if (!ilOhang || !tgOhang) return ''

  const ilYang = YANG_CHEONGAN.has(ilgan)
  const tgYang = YANG_CHEONGAN.has(target)
  const sameYY = ilYang === tgYang

  if (tgOhang === ilOhang) return sameYY ? '비견' : '겁재'
  if (GENERATES[ilOhang] === tgOhang) return sameYY ? '식신' : '상관'
  if (GENERATES[tgOhang] === ilOhang) return sameYY ? '편인' : '정인'
  if (GENERATES[ilOhang] !== tgOhang && GENERATES[tgOhang] !== ilOhang) {
    // 재성: 일간이 극하는 오행
    const controls: Record<string, string> = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' }
    if (controls[ilOhang] === tgOhang) return sameYY ? '편재' : '정재'
  }
  // 관성: 타간이 일간을 극하는 경우
  const controls: Record<string, string> = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' }
  if (controls[tgOhang] === ilOhang) return sameYY ? '편관' : '정관'
  return ''
}

// ─────────────────────────────────────────────
// 반환 타입
// ─────────────────────────────────────────────

export interface PillarDisplay {
  label: string
  yunLabel: string
  sipsung_top: string | null      // 천간 십성 (한국어)
  cheonganCN: string
  cheonganKR: string
  cheonganOhang: string
  jijiCN: string
  jijiKR: string
  jijiOhang: string
  sipsung_bot: string | null      // 지장간 대표 십성 (한국어)
  hideGanKR: string[]             // 지장간 한국어 목록
  diShi: string                   // 12운성 한국어
  kongMang: string                // 공망
}

export interface DaYunCard {
  startAge: number
  endAge: number
  ageLabel: string
  cheonganCN: string
  cheonganKR: string
  cheonganOhang: string
  jijiCN: string
  jijiKR: string
  jijiOhang: string
  sipsung_gan: string
  sipsung_jiji: string
  diShi: string
  isCurrent: boolean
}

export interface SeWunCard {
  year: number
  cheonganCN: string
  cheonganKR: string
  cheonganOhang: string
  jijiCN: string
  jijiKR: string
  jijiOhang: string
  sipsung_gan: string
  sipsung_jiji: string
  diShi: string
  isCurrent: boolean
}

export interface MoonCard {
  month: number
  cheonganCN: string
  cheonganKR: string
  cheonganOhang: string
  jijiCN: string
  jijiKR: string
  jijiOhang: string
  sipsung_gan: string
  sipsung_jiji: string
  diShi: string
  isCurrent: boolean
}

export interface ManseryeokData {
  // 입력 메타
  solarYear: number; solarMonth: number; solarDay: number
  solarHour: number | null; solarMinute: number | null
  lunarYear: number; lunarMonth: number; lunarDay: number
  isLunarLeap: boolean
  gender: 'male' | 'female'
  hasHour: boolean
  // 사주원국 4주
  pillars: [PillarDisplay, PillarDisplay, PillarDisplay, PillarDisplay] // 년/월/일/시 순서
  // 오행
  ohangScores: Record<string, number>   // 목/화/토/금/수 → 점수
  totalScore: number
  // 십성
  sipsungScores: Record<string, number>
  // 신강신약
  strength: number        // 0~100 환산
  ilganOhang: string      // 일간 오행 (오행-십성 동적 매핑용)
  // 대운
  daYun: DaYunCard[]
  // 세운 (현재 대운 기준)
  seWun: SeWunCard[]
  // 세운 (생애 전체)
  allSeWun: SeWunCard[]
  // 월운 (현재 연도 12개월)
  moonCards: MoonCard[]
  // 현재 나이
  currentAge: number
}

// ─────────────────────────────────────────────
// 메인 계산
// ─────────────────────────────────────────────

export function getManseryeokData(input: SajuInput): ManseryeokData {
  const base = calculateSaju(input)

  // bazi 재생성 (추가 API 호출용)
  const solar = base.calc_hour !== null
    ? Solar.fromYmdHms(base.calc_year, base.calc_month, base.calc_day, base.calc_hour, base.calc_minute ?? 0, 0)
    : Solar.fromYmd(base.calc_year, base.calc_month, base.calc_day)

  const lunarObj = solar.getLunar()
  const bazi = lunarObj.getEightChar()
  bazi.setSect(2)

  // ── 공망 파싱 (e.g., "戌亥" → ['술', '해']) ──────────────────────────
  function parseKongMang(raw: string): string {
    if (!raw) return ''
    return [...raw].map(ch => CN_TO_KR_JIJI[ch] || ch).join('')
  }

  // ── 지장간 한국어 변환 ────────────────────────────────────────────────
  function hideGanToKR(cnArr: string[]): string[] {
    return cnArr.map(cn => CN_TO_KR_CHEONGAN[cn] || cn)
  }

  // ── 지지 시장간 대표 십성 ─────────────────────────────────────────────
  function jijiSipsung(cnArr: string[]): string | null {
    if (!cnArr?.length) return null
    const kr = CN_TO_KR_SIPSUNG[cnArr[0]]
    return kr ?? null
  }

  // ── 12운성 한국어 ─────────────────────────────────────────────────────
  function diShiKR(cn: string): string {
    return DISHY_CN_TO_KR[cn] ?? cn
  }

  // ── 단주 빌더 ─────────────────────────────────────────────────────────
  function buildPillar(
    label: string, yunLabel: string,
    sipsungTopCN: string | null,
    cg: string, jj: string,
    hideGanCN: string[],
    jijiSipsungCN: string[],
    diShiCN: string,
    kongMangRaw: string,
  ): PillarDisplay {
    const cgKR = CN_TO_KR_CHEONGAN[cg] || cg
    const jjKR = CN_TO_KR_JIJI[jj] || jj
    return {
      label,
      yunLabel,
      sipsung_top: sipsungTopCN ? (CN_TO_KR_SIPSUNG[sipsungTopCN] ?? sipsungTopCN) : null,
      cheonganCN: cg,
      cheonganKR: cgKR,
      cheonganOhang: CHEONGAN_OHANG[cgKR] ?? '토',
      jijiCN: jj,
      jijiKR: jjKR,
      jijiOhang: JIJI_OHANG[jjKR] ?? '토',
      sipsung_bot: jijiSipsung(jijiSipsungCN),
      hideGanKR: JIJI_HIDEKAN_KR[jjKR] ?? hideGanToKR(hideGanCN),
      diShi: diShiKR(diShiCN),
      kongMang: parseKongMang(kongMangRaw),
    }
  }

  // ── 년주 ──────────────────────────────────────────────────────────────
  const yearPillar = buildPillar(
    '년주', '초년운',
    bazi.getYearShiShenGan() as string,
    bazi.getYearGan(), bazi.getYearZhi(),
    bazi.getYearHideGan() as string[],
    bazi.getYearShiShenZhi() as string[],
    bazi.getYearDiShi() as string,
    bazi.getYearXunKong() as string,
  )

  // ── 월주 ──────────────────────────────────────────────────────────────
  const monthPillar = buildPillar(
    '월주', '청년운',
    bazi.getMonthShiShenGan() as string,
    bazi.getMonthGan(), bazi.getMonthZhi(),
    bazi.getMonthHideGan() as string[],
    bazi.getMonthShiShenZhi() as string[],
    bazi.getMonthDiShi() as string,
    bazi.getMonthXunKong() as string,
  )

  // ── 일주 ──────────────────────────────────────────────────────────────
  const dayPillar = buildPillar(
    '일주', '장년운',
    null,  // 일간은 日主 — 십성 없음
    bazi.getDayGan(), bazi.getDayZhi(),
    bazi.getDayHideGan() as string[],
    bazi.getDayShiShenZhi() as string[],
    bazi.getDayDiShi() as string,
    bazi.getDayXunKong() as string,
  )

  // ── 시주 ──────────────────────────────────────────────────────────────
  let hourPillar: PillarDisplay
  if (base.hour_cheongan && base.hour_jiji) {
    hourPillar = buildPillar(
      '시주', '말년운',
      bazi.getTimeShiShenGan() as string,
      bazi.getTimeGan(), bazi.getTimeZhi(),
      bazi.getTimeHideGan() as string[],
      bazi.getTimeShiShenZhi() as string[],
      bazi.getTimeDiShi() as string,
      bazi.getTimeXunKong() as string,
    )
  } else {
    // 생시 모름 — 빈 시주
    hourPillar = {
      label: '시주', yunLabel: '말년운',
      sipsung_top: null, cheonganCN: '', cheonganKR: '', cheonganOhang: '',
      jijiCN: '', jijiKR: '', jijiOhang: '',
      sipsung_bot: null, hideGanKR: [], diShi: '', kongMang: '',
    }
  }

  // ── 음력 날짜 (표시용) ─────────────────────────────────────────────────
  // 입력이 양력인 경우에도 음력을 표시하기 위해 lunar 객체에서 추출
  // base.calc_year/month/day는 보정 후 값이므로 원본 입력 양력을 사용
  let displaySolarYear = input.birth_year
  let displaySolarMonth = input.birth_month
  let displaySolarDay = input.birth_day

  if (input.is_lunar) {
    const ls = Lunar.fromYmd(input.birth_year, input.birth_month, input.birth_day)
    const s = ls.getSolar()
    displaySolarYear = s.getYear()
    displaySolarMonth = s.getMonth()
    displaySolarDay = s.getDay()
  }

  const displaySolar = Solar.fromYmd(displaySolarYear, displaySolarMonth, displaySolarDay)
  const displayLunar = displaySolar.getLunar()
  const lunarYear = displayLunar.getYear() as number
  const lunarMonth = Math.abs(displayLunar.getMonth() as number)
  const lunarDay = displayLunar.getDay() as number
  const isLunarLeap = (displayLunar.getMonth() as number) < 0

  // ── 오행 / 십성 점수 ────────────────────────────────────────────────────
  const ohangScores: Record<string, number> = {
    목: base.ohang_data.scores['목'] ?? 0,
    화: base.ohang_data.scores['화'] ?? 0,
    토: base.ohang_data.scores['토'] ?? 0,
    금: base.ohang_data.scores['금'] ?? 0,
    수: base.ohang_data.scores['수'] ?? 0,
  }
  const totalScore = Object.values(ohangScores).reduce((a, b) => a + b, 0) // 100 또는 85

  const sipsungScores: Record<string, number> = {
    비견: base.sipsung_data.scores['비견'] ?? 0,
    겁재: base.sipsung_data.scores['겁재'] ?? 0,
    식신: base.sipsung_data.scores['식신'] ?? 0,
    상관: base.sipsung_data.scores['상관'] ?? 0,
    편재: base.sipsung_data.scores['편재'] ?? 0,
    정재: base.sipsung_data.scores['정재'] ?? 0,
    편관: base.sipsung_data.scores['편관'] ?? 0,
    정관: base.sipsung_data.scores['정관'] ?? 0,
    편인: base.sipsung_data.scores['편인'] ?? 0,
    정인: base.sipsung_data.scores['정인'] ?? 0,
  }

  // ── 신강신약: 일간 오행 + 인성 오행 점수 합산 / 총점 * 100 ──────────
  // 비겁(일간과 같은 오행) + 인성(일간을 생하는 오행)
  const ilganOhang = CHEONGAN_OHANG[base.day_cheongan] ?? ''
  // 인성 오행 = 일간을 생하는 오행 (역생: A→ilgan이면 A가 인성)
  const GENERATES_FWD: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }
  const inseongOhang = Object.keys(GENERATES_FWD).find(k => GENERATES_FWD[k] === ilganOhang) ?? ''
  const supportScore = (ohangScores[ilganOhang] ?? 0) + (ohangScores[inseongOhang] ?? 0)
  const strength = totalScore > 0 ? Math.round(supportScore / totalScore * 100) : 0

  // ── 대운 ──────────────────────────────────────────────────────────────
  const fullData = base.full_saju_data as any
  const daYunRaw: any[] = fullData?.da_yun ?? []
  const currentYear = new Date().getFullYear()
  const currentAge = currentYear - input.birth_year

  const ilganKR = base.day_cheongan  // 일간 한국어 (십성 계산용)

  function ganziToCards(
    ganziCN: string,
    isCurrent: boolean,
    sipsungGan?: string,
  ): Omit<DaYunCard, 'startAge' | 'endAge' | 'ageLabel' | 'isCurrent'> & { isCurrent: boolean } {
    const cg = ganziCN[0] ?? ''
    const jj = ganziCN[1] ?? ''
    const cgKR = CN_TO_KR_CHEONGAN[cg] || ''
    const jjKR = CN_TO_KR_JIJI[jj] || ''
    return {
      cheonganCN: cg,
      cheonganKR: cgKR,
      cheonganOhang: CHEONGAN_OHANG[cgKR] ?? '',
      jijiCN: jj,
      jijiKR: jjKR,
      jijiOhang: JIJI_OHANG[jjKR] ?? '',
      sipsung_gan: sipsungGan ?? getSipsung(ilganKR, cgKR),
      sipsung_jiji: getJijiSipsung(ilganKR, jjKR),
      diShi: getDiShi(ilganKR, jjKR),
      isCurrent,
    }
  }

  const daYun: DaYunCard[] = daYunRaw
    .filter((d: any) => d?.ganzi)
    .map((d: any) => {
      const isCurrent = d.start_age <= currentAge && currentAge < d.end_age
      return {
        startAge: Number(d.start_age ?? 0),
        endAge: Number(d.end_age ?? 0),
        ageLabel: String(d.start_age),
        ...ganziToCards(d.ganzi, isCurrent),
      }
    })

  // ── 세운 (현재 대운에 포함된 liuNian) ─────────────────────────────────
  const currentDaYun = daYunRaw.find((d: any) => d.start_age <= currentAge && currentAge < d.end_age)
  const liuNianSource: any[] = currentDaYun?.liuNian ?? daYunRaw[0]?.liuNian ?? []

  const seWun: SeWunCard[] = liuNianSource.map((ln: any) => {
    const ganziCN: string = ln.ganzi ?? ''
    const year: number = ln.year
    const cg = ganziCN[0] ?? ''
    const jj = ganziCN[1] ?? ''
    const cgKR = CN_TO_KR_CHEONGAN[cg] || ''
    const jjKR = CN_TO_KR_JIJI[jj] || ''
    return {
      year,
      cheonganCN: cg,
      cheonganKR: cgKR,
      cheonganOhang: CHEONGAN_OHANG[cgKR] ?? '',
      jijiCN: jj,
      jijiKR: jjKR,
      jijiOhang: JIJI_OHANG[jjKR] ?? '',
      sipsung_gan: getSipsung(ilganKR, cgKR),
      sipsung_jiji: getJijiSipsung(ilganKR, jjKR),
      diShi: getDiShi(ilganKR, jjKR),
      isCurrent: year === currentYear,
    }
  })

  const allSeWun: SeWunCard[] = daYunRaw
    .flatMap((d: any) => d?.liuNian ?? [])
    .filter((ln: any) => ln?.ganzi && Number.isFinite(ln?.year))
    .map((ln: any) => {
      const ganziCN: string = ln.ganzi ?? ''
      const year: number = ln.year
      const cg = ganziCN[0] ?? ''
      const jj = ganziCN[1] ?? ''
      const cgKR = CN_TO_KR_CHEONGAN[cg] || ''
      const jjKR = CN_TO_KR_JIJI[jj] || ''
      return {
        year,
        cheonganCN: cg,
        cheonganKR: cgKR,
        cheonganOhang: CHEONGAN_OHANG[cgKR] ?? '',
        jijiCN: jj,
        jijiKR: jjKR,
        jijiOhang: JIJI_OHANG[jjKR] ?? '',
        sipsung_gan: getSipsung(ilganKR, cgKR),
        sipsung_jiji: getJijiSipsung(ilganKR, jjKR),
        diShi: getDiShi(ilganKR, jjKR),
        isCurrent: year === currentYear,
      }
    })

  // ── 월운 (현재 세운의 12개월) ────────────────────────────────────────
  const genderNum = input.gender === 'male' ? 1 : 0
  const yunObj = bazi.getYun(genderNum, 2)
  const currentMonth = new Date().getMonth() + 1
  const currentLiuNian = (yunObj.getDaYun() as any[])
    .flatMap((dy: any) => (dy.getLiuNian() as any[]))
    .find((ln: any) => (ln.getYear() as number) === currentYear)

  const moonCards: MoonCard[] = currentLiuNian
    ? (currentLiuNian.getLiuYue() as any[]).map((lm: any) => {
      const ganziCN: string = lm.getGanZhi() as string
      const month: number = (lm.getIndex() as number) + 1
      const cg = ganziCN[0] ?? ''
      const jj = ganziCN[1] ?? ''
      const cgKR = CN_TO_KR_CHEONGAN[cg] || ''
      const jjKR = CN_TO_KR_JIJI[jj] || ''
      return {
        month,
        cheonganCN: cg, cheonganKR: cgKR, cheonganOhang: CHEONGAN_OHANG[cgKR] ?? '',
        jijiCN: jj, jijiKR: jjKR, jijiOhang: JIJI_OHANG[jjKR] ?? '',
        sipsung_gan: getSipsung(ilganKR, cgKR),
        sipsung_jiji: getJijiSipsung(ilganKR, jjKR),
        diShi: getDiShi(ilganKR, jjKR),
        isCurrent: month === currentMonth,
      }
    })
    : []

  return {
    solarYear: displaySolarYear,
    solarMonth: displaySolarMonth,
    solarDay: displaySolarDay,
    solarHour: input.birth_hour,
    solarMinute: input.birth_minute,
    lunarYear,
    lunarMonth,
    lunarDay,
    isLunarLeap,
    gender: input.gender,
    hasHour: input.birth_hour !== null,
    pillars: [yearPillar, monthPillar, dayPillar, hourPillar],
    ohangScores,
    totalScore,
    sipsungScores,
    strength,
    ilganOhang,
    daYun,
    seWun,
    allSeWun,
    moonCards,
    currentAge,
  }
}
