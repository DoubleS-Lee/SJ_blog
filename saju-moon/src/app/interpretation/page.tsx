import type { Metadata } from 'next'
import { Fragment, type ReactNode } from 'react'
import MenuHero from '@/components/layout/MenuHero'
import { getCurrentUserAdminState } from '@/lib/auth/admin'
import { generateReport, type Ohang, type ReportUserData, type Sipsung, type SipsungGroup } from '@/lib/interpretation/report'

export const metadata: Metadata = {
  title: '사주 해석 | 월덕요정의 사주이야기',
  description:
    '총운 요약, 재물운, 직업운, 건강운, 연애운, 결혼운, 학업/성장운, 대인관계운 카테고리로 사주 해석을 제공합니다.',
}

const HERO_PALETTE = {
  borderClass: 'border-violet-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(216,180,254,0.2),_transparent_24%),linear-gradient(135deg,_#fcfaff_0%,_#ffffff_58%,_#f5f3ff_100%)]',
  eyebrowClass: 'text-violet-500',
} as const

const CATEGORIES = ['재물운', '직업운', '건강운', '연애운', '결혼운', '학업/성장운', '대인관계운'] as const

interface OhangScoresRow {
  mok_score: number
  hwa_score: number
  to_score: number
  geum_score: number
  su_score: number
}

interface SipsungScoresRow {
  bigyeon_score: number
  gyeopjae_score: number
  sikshin_score: number
  sanggwan_score: number
  pyeonjae_score: number
  jeongjae_score: number
  pyeongwan_score: number
  jeonggwan_score: number
  pyeonin_score: number
  jeongin_score: number
}

const EXCESSIVE_THRESHOLD = 40
const DEFICIENT_THRESHOLD = 0

function renderBoldInline(text: string): ReactNode[] {
  const parts = text.split(/('(?:[^']*)')/g).filter(Boolean)
  return parts.map((part, index) => {
    if (part.startsWith("'") && part.endsWith("'")) {
      const inner = part.slice(1, -1)
      return (
        <strong key={`bold-${index}`} className="font-semibold text-gray-900">
          {inner}
        </strong>
      )
    }

    return <Fragment key={`plain-${index}`}>{part}</Fragment>
  })
}

function renderReportMarkdownLike(report: string) {
  const paragraphs = report
    .trim()
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n')

    return (
      <p key={`report-paragraph-${paragraphIndex}`} className="text-sm leading-8 text-gray-700 sm:text-base">
        {lines.map((line, lineIndex) => (
          <Fragment key={`report-line-${paragraphIndex}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderBoldInline(line)}
          </Fragment>
        ))}
      </p>
    )
  })
}

function buildReportUserData(params: {
  userName: string
  ilgan: string
  ohang: OhangScoresRow
  sipsung: SipsungScoresRow
}): ReportUserData {
  const ohangScores: Array<{ key: Ohang; score: number }> = [
    { key: '목', score: params.ohang.mok_score },
    { key: '화', score: params.ohang.hwa_score },
    { key: '토', score: params.ohang.to_score },
    { key: '금', score: params.ohang.geum_score },
    { key: '수', score: params.ohang.su_score },
  ]

  const dominantOhang = ohangScores.reduce((best, current) => {
    return current.score > best.score ? current : best
  }, ohangScores[0]).key

  const deficientOhang = ohangScores.filter((entry) => entry.score === DEFICIENT_THRESHOLD).map((entry) => entry.key)
  const excessiveOhang = ohangScores.filter((entry) => entry.score >= EXCESSIVE_THRESHOLD).map((entry) => entry.key)

  const sipsungScores: Array<{ key: Sipsung; score: number }> = [
    { key: '비견', score: params.sipsung.bigyeon_score },
    { key: '겁재', score: params.sipsung.gyeopjae_score },
    { key: '식신', score: params.sipsung.sikshin_score },
    { key: '상관', score: params.sipsung.sanggwan_score },
    { key: '편재', score: params.sipsung.pyeonjae_score },
    { key: '정재', score: params.sipsung.jeongjae_score },
    { key: '편관', score: params.sipsung.pyeongwan_score },
    { key: '정관', score: params.sipsung.jeonggwan_score },
    { key: '편인', score: params.sipsung.pyeonin_score },
    { key: '정인', score: params.sipsung.jeongin_score },
  ]

  sipsungScores.sort((a, b) => b.score - a.score)

  const topSipsung = sipsungScores[0]?.key ?? '비견'
  const secondSipsung = sipsungScores[1]?.key ?? '겁재'

  const sipsungGroupScores: Array<{ key: SipsungGroup; score: number }> = [
    { key: '비겁', score: params.sipsung.bigyeon_score + params.sipsung.gyeopjae_score },
    { key: '식상', score: params.sipsung.sikshin_score + params.sipsung.sanggwan_score },
    { key: '재성', score: params.sipsung.pyeonjae_score + params.sipsung.jeongjae_score },
    { key: '관성', score: params.sipsung.pyeongwan_score + params.sipsung.jeonggwan_score },
    { key: '인성', score: params.sipsung.pyeonin_score + params.sipsung.jeongin_score },
  ]

  const deficientSipsungGroups = sipsungGroupScores
    .filter((entry) => entry.score === DEFICIENT_THRESHOLD)
    .map((entry) => entry.key)
  const excessiveSipsungGroups = sipsungGroupScores
    .filter((entry) => entry.score >= EXCESSIVE_THRESHOLD)
    .map((entry) => entry.key)

  return {
    userName: params.userName,
    ilgan: params.ilgan,
    dominantOhang,
    topSipsung,
    secondSipsung,
    deficientOhang,
    excessiveOhang,
    deficientSipsungGroups,
    excessiveSipsungGroups,
  }
}

export default async function InterpretationPage() {
  const { supabase, user, isAdmin } = await getCurrentUserAdminState()

  const profilePromise = user
    ? supabase.from('users').select('nickname').eq('id', user.id).maybeSingle()
    : Promise.resolve({ data: null, error: null })
  const sajuPromise = user
    ? supabase.from('user_saju').select('saju_name, ilgan').eq('user_id', user.id).maybeSingle()
    : Promise.resolve({ data: null, error: null })
  const ohangPromise = user
    ? supabase
        .from('user_saju_ohang')
        .select('mok_score, hwa_score, to_score, geum_score, su_score')
        .eq('user_id', user.id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null })
  const sipsungPromise = user
    ? supabase
        .from('user_saju_sipsung')
        .select(
          'bigyeon_score, gyeopjae_score, sikshin_score, sanggwan_score, pyeonjae_score, jeongjae_score, pyeongwan_score, jeonggwan_score, pyeonin_score, jeongin_score',
        )
        .eq('user_id', user.id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null })

  const [profile, saju, ohang, sipsung] = await Promise.all([profilePromise, sajuPromise, ohangPromise, sipsungPromise])

  const canBuildReport = Boolean(user && saju.data && ohang.data && sipsung.data)

  let reportText: string | null = null
  if (canBuildReport) {
    const userName =
      saju.data?.saju_name?.trim() ||
      profile.data?.nickname?.trim() ||
      user?.email?.split('@')[0]?.trim() ||
      '회원'

    const reportUserData = buildReportUserData({
      userName,
      ilgan: saju.data?.ilgan ?? '갑',
      ohang: ohang.data as OhangScoresRow,
      sipsung: sipsung.data as SipsungScoresRow,
    })

    reportText = generateReport(reportUserData)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Saju Interpretation"
        title="사주 해석"
        description={`내 사주를 바탕으로 총운을 해석해 드립니다.
재물운, 직업운, 건강운 등 카테고리별 상세 해석은 순차적으로 업데이트될 예정입니다.`}
        palette={HERO_PALETTE}
        actions={
          !user
            ? [{ href: '/login', label: '로그인' }]
            : !canBuildReport
              ? [{ href: '/mypage/saju', label: '내 만세력 입력' }]
              : undefined
        }
      />

      <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">총운 요약</h2>
        {reportText ? (
          <div className="mt-4 space-y-4 rounded-2xl border border-violet-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fcfaff_100%)] p-5">
            {renderReportMarkdownLike(reportText)}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-600">
            로그인 후 만세력과 오행/십성 데이터가 준비되면 총운 요약 리포트를 자동 생성해 보여드립니다.
          </div>
        )}
      </section>

      {isAdmin ? (
        <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">해석 카테고리</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <article
                key={category}
                className="rounded-2xl border border-gray-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-4"
              >
                <p className="text-sm font-semibold text-gray-900">{category}</p>
                <p className="mt-2 text-xs leading-6 text-gray-500">문구/로직 연결 준비됨</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
