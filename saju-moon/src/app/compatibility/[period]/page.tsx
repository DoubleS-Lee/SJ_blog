import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MenuHero from '@/components/layout/MenuHero'
import CompatibilityModeTabs from '../_components/CompatibilityModeTabs'
import CompatibilityPairPanel from '../_components/CompatibilityPairPanel'
import { loadCompatibilityPageContext } from '@/lib/compatibility/page-context'
import {
  buildDailyCompatibilityFortuneResult,
  getCurrentReferenceBranches,
} from '@/lib/compatibility/fortune'

interface Props {
  params: Promise<{ period: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const HERO_PALETTE = {
  borderClass: 'border-pink-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,207,232,0.26),_transparent_24%),linear-gradient(135deg,_#fff8fb_0%,_#ffffff_58%,_#fdf2f8_100%)]',
  eyebrowClass: 'text-pink-500',
}

const PERIOD_META = {
  today: {
    title: '오늘의 궁합',
    description: '월덕요정이 직접 설계한 궁합 로직을 바탕으로, 오늘의 궁합을 보여드립니다.',
  },
  month: {
    title: '이달의 궁합',
    description: '월덕요정이 직접 설계한 궁합 로직을 바탕으로, 이달의 궁합을 보여드립니다.',
  },
  year: {
    title: '올해의 궁합',
    description: '월덕요정이 직접 설계한 궁합 로직을 바탕으로, 올해의 궁합을 보여드립니다.',
  },
} as const

type PeriodKey = keyof typeof PERIOD_META

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { period } = await params
  const key = period as PeriodKey
  const meta = PERIOD_META[key]
  if (!meta) {
    return { title: '궁합 | 월덕요정의 사주이야기' }
  }
  return {
    title: `${meta.title} | 월덕요정의 사주이야기`,
    description: meta.description,
  }
}

function splitTextIntoParagraphs(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim()
  if (!normalized) return []

  const sentences = normalized
    .split(/(?<=[.!?。])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length <= 2) {
    return [normalized]
  }

  const paragraphSize = 3
  const paragraphs: string[] = []

  for (let index = 0; index < sentences.length; index += paragraphSize) {
    paragraphs.push(sentences.slice(index, index + paragraphSize).join(' '))
  }

  return paragraphs
}

export default async function CompatibilityPeriodPage({ params, searchParams }: Props) {
  const { period } = await params
  const key = period as PeriodKey
  const meta = PERIOD_META[key]

  if (!meta) {
    notFound()
  }

  const rawSearchParams = await searchParams
  const context = await loadCompatibilityPageContext(rawSearchParams)
  const basePath = `/compatibility/${key}`
  const reference = getCurrentReferenceBranches()

  const meDayBranch = context.myManseryeok?.pillars[2]?.jijiKR ?? null
  const targetDayBranch = context.targetManseryeok?.pillars[2]?.jijiKR ?? null

  const hasDailyInputs = Boolean(meDayBranch && targetDayBranch)

  const dailyFortuneResult = hasDailyInputs
    ? buildDailyCompatibilityFortuneResult({
      meName: context.myDisplayName,
      targetName: context.selectedEntry?.nickname ?? '상대',
      meDayBranch: meDayBranch!,
      targetDayBranch: targetDayBranch!,
      reference,
    })
    : null

  const activeTab =
    key === 'today' || key === 'month' || key === 'year'
      ? key
      : 'today'

  const resultCard = dailyFortuneResult
    ? key === 'today'
      ? dailyFortuneResult.today
      : key === 'month'
        ? dailyFortuneResult.month
        : key === 'year'
          ? dailyFortuneResult.year
          : null
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Compatibility"
        title={meta.title}
        description={meta.description}
        palette={HERO_PALETTE}
      />

      <CompatibilityModeTabs
        active={activeTab}
        selectedId={context.selectedId}
        maleRoleParam={context.maleRoleParam}
      />

      <CompatibilityPairPanel
        context={context}
        basePath={basePath}
        showRoleSelector={false}
      />

      <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex flex-wrap items-end gap-2 text-lg font-semibold text-gray-900">
              <span>{meta.title} 결과</span>
              <span className="text-xs font-medium text-gray-400">{`기준일: ${reference.solarDateLabel}`}</span>
            </h2>
          </div>
        </div>

        {!context.selectedEntry ? (
          <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            먼저 저장된 상대를 선택해 주세요.
          </div>
        ) : !resultCard ? (
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            사주 데이터가 충분하지 않아 {meta.title} 계산을 완료하지 못했습니다. 출생 정보(특히 일지)를 확인해 주세요.
          </div>
        ) : (
          <article className="mt-5 rounded-[1.25rem] border border-gray-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-5 shadow-sm">
            <>
              <p className="mt-3 text-sm font-semibold leading-6 text-gray-800">{resultCard.summary}</p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600">
                {splitTextIntoParagraphs(resultCard.detail).map((paragraph, index) => (
                  <p key={`period-detail-${index}`}>{paragraph}</p>
                ))}
              </div>
            </>
          </article>
        )}
      </section>
    </div>
  )
}
