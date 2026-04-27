import type { Metadata } from 'next'
import TextCopyGuard from '@/components/common/TextCopyGuard'
import MenuHero from '@/components/layout/MenuHero'
import { buildCompatibilityPreviewCardsWithDb } from '@/lib/compatibility/copy-service'
import type { CompatibilitySection } from '@/lib/compatibility/types'
import { loadCompatibilityPageContext } from '@/lib/compatibility/page-context'
import { renderCompatibilityTemplate } from '@/lib/compatibility/template'
import CompatibilityModeTabs from './_components/CompatibilityModeTabs'
import CompatibilityPairPanel from './_components/CompatibilityPairPanel'

export const metadata: Metadata = {
  title: '궁합 | 사주로아의 사주이야기',
  description: '내 사주와 저장된 상대 사주를 비교하는 궁합 페이지입니다.',
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const HERO_PALETTE = {
  borderClass: 'border-pink-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,207,232,0.26),_transparent_24%),linear-gradient(135deg,_#fff8fb_0%,_#ffffff_58%,_#fdf2f8_100%)]',
  eyebrowClass: 'text-pink-500',
}

function getCompatibilityMetricLabel(section: CompatibilitySection) {
  switch (section) {
    case 'dayGan':
      return '대화 티키타카 & 소울메이트 지수'
    case 'dayJi':
      return '라이프스타일 & 속궁합 지수'
    case 'ohang':
      return '퍼즐 조각 매칭 지수 (서로의 빈틈 채우기)'
    case 'johoo':
      return '힐링 & 본능적 끌림 지수'
    case 'sipsung':
      return '연애 스타일 & 밀당 지수'
  }
}

function splitDetailIntoParagraphs(detail: string) {
  const normalized = detail.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim()
  if (!normalized) return []

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length <= 2) return [normalized]

  const paragraphs: string[] = []
  const chunkSize = 3

  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join(' '))
  }

  return paragraphs
}

export default async function CompatibilityPage({ searchParams }: Props) {
  const params = await searchParams
  const context = await loadCompatibilityPageContext(params)

  const previewCards =
    context.maleManseryeok && context.femaleManseryeok
      ? await buildCompatibilityPreviewCardsWithDb(context.maleManseryeok, context.femaleManseryeok)
      : []
  const targetName = context.selectedEntry?.nickname ?? '상대'
  const maleName = context.validMaleRole === 'me' ? context.myDisplayName : targetName
  const femaleName = context.validFemaleRole === 'me' ? context.myDisplayName : targetName

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Compatibility"
        title="궁합 총운"
        description={`내 사주와 저장된 상대의 사주를 함께 분석해 궁합을 보여드립니다.
          사주로아가 직접 설계한 궁합 로직을 바탕으로, 5가지 주제별 결과를 근거와 함께 풀어드립니다.`}
        palette={HERO_PALETTE}
      />

      <CompatibilityModeTabs
        active="total"
        selectedId={context.selectedId}
        maleRoleParam={context.maleRoleParam}
      />

      <CompatibilityPairPanel
        context={context}
        basePath="/compatibility"
        showRoleSelector
      />

      {previewCards.length > 0 && (
        <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">궁합 결과</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                선택한 두 사람의 사주를 기준으로 항목별 궁합 해설을 보여줍니다.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {previewCards.map((card) => (
              (() => {
                const summary = renderCompatibilityTemplate(card.summary, {
                  meName: context.myDisplayName,
                  targetName,
                  maleName,
                  femaleName,
                })
                const detail = renderCompatibilityTemplate(card.detail, {
                  meName: context.myDisplayName,
                  targetName,
                  maleName,
                  femaleName,
                })

                return (
                  <article
                    key={card.section}
                    className="rounded-[1.25rem] border border-gray-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getCompatibilityMetricLabel(card.section)}
                    </h3>
                    <TextCopyGuard className="mt-3">
                      <p className="text-sm font-semibold leading-6 text-gray-700">{summary}</p>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-500">
                        {splitDetailIntoParagraphs(detail).map((paragraph, index) => (
                          <p key={`${card.section}-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    </TextCopyGuard>
                  </article>
                )
              })()
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
