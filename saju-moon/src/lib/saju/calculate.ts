/**
 * 만세력 계산 모듈
 * ⚠️ 서버 전용 — 클라이언트 컴포넌트에서 import 금지
 *
 * 핵심 규칙 (CLAUDE.md):
 * - 생시 있음: 입력 시각 - 32분 후 lunar-javascript 전달 (서울 진태양시 보정)
 * - 생시 모름: 32분 보정 절대 미적용, 시주 관련 데이터 전부 null
 * - 오행/십성 점수: 생시 있음 → 100점 만점, 생시 모름 → 85점 만점 (정규화 없음)
 */

/* eslint-disable @typescript-eslint/no-require-imports */
// lunar-javascript는 CJS 전용 — require로 로드
const { Solar, Lunar } = require('lunar-javascript')

import type { Cheongan, Jiji, Ohang, Sipsung, Gender, OhangData, SipsungData } from '@/types/saju'

// ─────────────────────────────────────────────
// 매핑 테이블 (Chinese → Korean)
// ─────────────────────────────────────────────

const CN_CHEONGAN: Record<string, Cheongan> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
}

const CN_JIJI: Record<string, Jiji> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
}

const CN_OHANG: Record<string, Ohang> = {
  木: '목', 火: '화', 土: '토', 金: '금', 水: '수',
}

const CN_SIPSUNG: Record<string, Sipsung> = {
  比肩: '비견', 劫财: '겁재', 食神: '식신', 伤官: '상관', 偏财: '편재',
  正财: '정재', 七杀: '편관', 正官: '정관', 偏印: '편인', 正印: '정인',
}

// 위치별 오행/십성 가중치
const WEIGHTS: Record<string, number> = {
  year_cheongan: 5,
  year_jiji: 5,
  month_cheongan: 10,
  month_jiji: 30,
  day_cheongan: 20,
  day_jiji: 15,
  hour_cheongan: 10,
  hour_jiji: 5,
}

// 위치 한국어 표기
const POSITION_KR: Record<string, string> = {
  year_cheongan: '연간',
  year_jiji: '연지',
  month_cheongan: '월간',
  month_jiji: '월지',
  day_cheongan: '일간',
  day_jiji: '일지',
  hour_cheongan: '시간',
  hour_jiji: '시지',
}

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

function toCheongan(cn: string): Cheongan {
  const kr = CN_CHEONGAN[cn]
  if (!kr) throw new Error(`Unknown cheongan: ${cn}`)
  return kr
}

function toJiji(cn: string): Jiji {
  const kr = CN_JIJI[cn]
  if (!kr) throw new Error(`Unknown jiji: ${cn}`)
  return kr
}

function toOhang(cn: string): Ohang {
  const kr = CN_OHANG[cn]
  if (!kr) throw new Error(`Unknown ohang: ${cn}`)
  return kr
}

function toSipsung(cn: string): Sipsung | null {
  return CN_SIPSUNG[cn] ?? null
}

/** 서울 진태양시 보정: 입력 시각 - 32분 */
function applySeoulCorrection(
  year: number, month: number, day: number,
  hour: number, minute: number
): { year: number; month: number; day: number; hour: number; minute: number } {
  const totalMinutes = hour * 60 + minute - 32

  if (totalMinutes >= 0) {
    return { year, month, day, hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 }
  }

  // 자정을 넘어가면 하루 전날로
  const adjusted = new Date(year, month - 1, day)
  adjusted.setDate(adjusted.getDate() - 1)
  const carry = totalMinutes + 24 * 60
  return {
    year: adjusted.getFullYear(),
    month: adjusted.getMonth() + 1,
    day: adjusted.getDate(),
    hour: Math.floor(carry / 60),
    minute: carry % 60,
  }
}

/** 오행/십성 빈 데이터 초기화 */
function emptyOhangData(): OhangData {
  const ohangList: Ohang[] = ['목', '화', '토', '금', '수']
  return {
    positions: Object.fromEntries(ohangList.map((o) => [o, []])) as unknown as Record<Ohang, string[]>,
    scores: Object.fromEntries(ohangList.map((o) => [o, 0])) as unknown as Record<Ohang, number>,
  }
}

function emptySipsungData(): SipsungData {
  const sipsungList: Sipsung[] = [
    '비견', '겁재', '식신', '상관', '편재',
    '정재', '편관', '정관', '편인', '정인',
  ]
  return {
    positions: Object.fromEntries(sipsungList.map((s) => [s, []])) as unknown as Record<Sipsung, string[]>,
    scores: Object.fromEntries(sipsungList.map((s) => [s, 0])) as unknown as Record<Sipsung, number>,
  }
}

/** 오행/십성 집계: 해당 위치의 오행/십성에 가중치 누적 */
function accumulateOhang(data: OhangData, ohang: Ohang, position: string) {
  data.positions[ohang].push(POSITION_KR[position])
  data.scores[ohang] += WEIGHTS[position]
}

function accumulateSipsung(data: SipsungData, sipsung: Sipsung | null, position: string) {
  if (!sipsung) return
  data.positions[sipsung].push(POSITION_KR[position])
  data.scores[sipsung] += WEIGHTS[position]
}

// ─────────────────────────────────────────────
// 입력 타입
// ─────────────────────────────────────────────

export interface SajuInput {
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null   // null = 생시 모름
  birth_minute: number | null // null = 생시 모름
  gender: Gender
  is_lunar: boolean
}

export interface SajuResult {
  // 8글자
  year_cheongan: Cheongan
  year_jiji: Jiji
  year_ganji: string
  month_cheongan: Cheongan
  month_jiji: Jiji
  month_ganji: string
  day_cheongan: Cheongan
  day_jiji: Jiji
  day_ganji: string
  hour_cheongan: Cheongan | null
  hour_jiji: Jiji | null
  hour_ganji: string | null
  // 인덱스용 일간
  ilgan: Cheongan
  // 오행
  ohang_data: OhangData
  has_mok: boolean
  has_hwa: boolean
  has_to: boolean
  has_geum: boolean
  has_su: boolean
  // 십성
  sipsung_data: SipsungData
  has_bigyeon: boolean
  has_geopjae: boolean
  has_sikshin: boolean
  has_sangwan: boolean
  has_pyeonjae: boolean
  has_jeongjae: boolean
  has_pyeongwan: boolean
  has_jeongwan: boolean
  has_pyeonin: boolean
  has_jeongin: boolean
  // 전체 데이터 (대운/세운 포함)
  full_saju_data: Record<string, unknown>
  // 보정 후 실제 계산에 사용한 양력 날짜/시각
  calc_year: number
  calc_month: number
  calc_day: number
  calc_hour: number | null
  calc_minute: number | null
}

// ─────────────────────────────────────────────
// 메인 계산 함수
// ─────────────────────────────────────────────

export function calculateSaju(input: SajuInput): SajuResult {
  const { birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar } = input

  // 1. 음력이면 양력으로 변환
  let solarYear = birth_year
  let solarMonth = birth_month
  let solarDay = birth_day

  if (is_lunar) {
    const lunarDate = Lunar.fromYmd(birth_year, birth_month, birth_day)
    const solarDate = lunarDate.getSolar()
    solarYear = solarDate.getYear()
    solarMonth = solarDate.getMonth()
    solarDay = solarDate.getDay()
  }

  // 2. 서울 진태양시 보정 (생시 있을 때만)
  let calcYear = solarYear
  let calcMonth = solarMonth
  let calcDay = solarDay
  let calcHour: number | null = null
  let calcMinute: number | null = null

  if (birth_hour !== null && birth_minute !== null) {
    const corrected = applySeoulCorrection(solarYear, solarMonth, solarDay, birth_hour, birth_minute)
    calcYear = corrected.year
    calcMonth = corrected.month
    calcDay = corrected.day
    calcHour = corrected.hour
    calcMinute = corrected.minute
  }

  // 3. lunar-javascript Solar 객체 생성
  const solar =
    calcHour !== null
      ? Solar.fromYmdHms(calcYear, calcMonth, calcDay, calcHour, calcMinute ?? 0, 0)
      : Solar.fromYmd(calcYear, calcMonth, calcDay)

  const lunar = solar.getLunar()
  const bazi = lunar.getEightChar()
  bazi.setSect(2) // sect 2: 현대 표준 절입 기준

  // 4. 8글자 추출
  const yearCG = toCheongan(bazi.getYearGan())
  const yearJJ = toJiji(bazi.getYearZhi())
  const monthCG = toCheongan(bazi.getMonthGan())
  const monthJJ = toJiji(bazi.getMonthZhi())
  const dayCG = toCheongan(bazi.getDayGan())
  const dayJJ = toJiji(bazi.getDayZhi())

  let hourCG: Cheongan | null = null
  let hourJJ: Jiji | null = null
  if (calcHour !== null) {
    hourCG = toCheongan(bazi.getTimeGan())
    hourJJ = toJiji(bazi.getTimeZhi())
  }

  // 5. 오행 집계
  const ohangData = emptyOhangData()
  const yearWX = bazi.getYearWuXing() as string   // e.g., "金火"
  const monthWX = bazi.getMonthWuXing() as string
  const dayWX = bazi.getDayWuXing() as string

  accumulateOhang(ohangData, toOhang(yearWX[0]), 'year_cheongan')
  accumulateOhang(ohangData, toOhang(yearWX[1]), 'year_jiji')
  accumulateOhang(ohangData, toOhang(monthWX[0]), 'month_cheongan')
  accumulateOhang(ohangData, toOhang(monthWX[1]), 'month_jiji')
  accumulateOhang(ohangData, toOhang(dayWX[0]), 'day_cheongan')
  accumulateOhang(ohangData, toOhang(dayWX[1]), 'day_jiji')

  if (calcHour !== null) {
    const timeWX = bazi.getTimeWuXing() as string
    accumulateOhang(ohangData, toOhang(timeWX[0]), 'hour_cheongan')
    accumulateOhang(ohangData, toOhang(timeWX[1]), 'hour_jiji')
  }

  // 6. 십성 집계 (일간은 日主 — 제외)
  const sipsungData = emptySipsungData()
  // getYearShiShenZhi() 는 배열(지장간) — 첫 번째 값이 대표 십성
  accumulateSipsung(sipsungData, toSipsung(bazi.getYearShiShenGan()), 'year_cheongan')
  accumulateSipsung(sipsungData, toSipsung((bazi.getYearShiShenZhi() as string[])[0]), 'year_jiji')
  accumulateSipsung(sipsungData, toSipsung(bazi.getMonthShiShenGan()), 'month_cheongan')
  accumulateSipsung(sipsungData, toSipsung((bazi.getMonthShiShenZhi() as string[])[0]), 'month_jiji')
  // day_cheongan = 일간 = 日主, skip
  accumulateSipsung(sipsungData, toSipsung((bazi.getDayShiShenZhi() as string[])[0]), 'day_jiji')

  if (calcHour !== null) {
    accumulateSipsung(sipsungData, toSipsung(bazi.getTimeShiShenGan()), 'hour_cheongan')
    accumulateSipsung(sipsungData, toSipsung((bazi.getTimeShiShenZhi() as string[])[0]), 'hour_jiji')
  }

  // 7. 대운/세운 계산 (full_saju_data에 저장)
  const genderNum = gender === 'male' ? 1 : 0
  const yun = bazi.getYun(genderNum, 2)
  const daYunList = (yun.getDaYun() as unknown[]).slice(0, 10)

  const daYunData = daYunList.map((dy: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = dy as any
    const ganZhi = d.getGanZhi() as string
    if (!ganZhi) return null // 대운 전 공백 기간 skip
    const liuNianList = (d.getLiuNian() as unknown[]).slice(0, 10)
    return {
      ganzi: ganZhi,
      start_age: d.getStartAge() as number,
      end_age: d.getEndAge() as number,
      liuNian: liuNianList.map((ln: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const l = ln as any
        return { year: l.getYear() as number, ganzi: l.getGanZhi() as string }
      }),
    }
  }).filter(Boolean)

  const fullSajuData: Record<string, unknown> = {
    yun_start_year: yun.getStartYear(),
    yun_start_month: yun.getStartMonth(),
    yun_start_day: yun.getStartDay(),
    da_yun: daYunData,
    year_xun_kong: bazi.getYearXunKong(),
    month_xun_kong: bazi.getMonthXunKong(),
    day_xun_kong: bazi.getDayXunKong(),
    time_xun_kong: calcHour !== null ? bazi.getTimeXunKong() : null,
    year_nayin: bazi.getYearNaYin(),
    month_nayin: bazi.getMonthNaYin(),
    day_nayin: bazi.getDayNaYin(),
    time_nayin: calcHour !== null ? bazi.getTimeNaYin() : null,
  }

  // 8. 불리언 플래그
  const ohangScores = ohangData.scores
  const sipsungScores = sipsungData.scores

  return {
    year_cheongan: yearCG,
    year_jiji: yearJJ,
    year_ganji: `${yearCG}${yearJJ}`,
    month_cheongan: monthCG,
    month_jiji: monthJJ,
    month_ganji: `${monthCG}${monthJJ}`,
    day_cheongan: dayCG,
    day_jiji: dayJJ,
    day_ganji: `${dayCG}${dayJJ}`,
    hour_cheongan: hourCG,
    hour_jiji: hourJJ,
    hour_ganji: hourCG && hourJJ ? `${hourCG}${hourJJ}` : null,
    ilgan: dayCG,
    ohang_data: ohangData,
    has_mok: ohangScores['목'] > 0,
    has_hwa: ohangScores['화'] > 0,
    has_to: ohangScores['토'] > 0,
    has_geum: ohangScores['금'] > 0,
    has_su: ohangScores['수'] > 0,
    sipsung_data: sipsungData,
    has_bigyeon: sipsungScores['비견'] > 0,
    has_geopjae: sipsungScores['겁재'] > 0,
    has_sikshin: sipsungScores['식신'] > 0,
    has_sangwan: sipsungScores['상관'] > 0,
    has_pyeonjae: sipsungScores['편재'] > 0,
    has_jeongjae: sipsungScores['정재'] > 0,
    has_pyeongwan: sipsungScores['편관'] > 0,
    has_jeongwan: sipsungScores['정관'] > 0,
    has_pyeonin: sipsungScores['편인'] > 0,
    has_jeongin: sipsungScores['정인'] > 0,
    full_saju_data: fullSajuData,
    calc_year: calcYear,
    calc_month: calcMonth,
    calc_day: calcDay,
    calc_hour: calcHour,
    calc_minute: calcMinute,
  }
}
