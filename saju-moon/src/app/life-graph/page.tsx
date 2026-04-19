import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getManseryeokData } from '@/lib/saju/manseryeok'
import type { SajuInput } from '@/lib/saju/calculate'
import type { Gender } from '@/types/saju'
import { LIFE_DOMAINS, type LifeDomain } from '@/lib/life-score/types'
import { buildLifeGraphSeries, buildLifeScoreEngineSnapshot } from '@/lib/life-score/engine'
import { buildDomainExplanations, buildNearFutureSummary } from '@/lib/life-score/explanations'
import { LifeGraphChart } from './LifeGraphChart'
import MenuHero from '@/components/layout/MenuHero'

export const metadata: Metadata = {
  title: '사주 생애 그래프 | 사주 Moon',
}

const DOMAIN_META: Record<
  LifeDomain,
  { label: string; description: string; color: string; bgClass: string; textClass: string }
> = {
  wealth: {
    label: '재물운',
    description: '수익 흐름, 재물 안정, 자산 감각을 보는 축',
    color: '#0f766e',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
  },
  health: {
    label: '건강운',
    description: '체력, 회복력, 과로 위험을 보는 축',
    color: '#ea580c',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
  },
  business: {
    label: '사업운',
    description: '실행력, 수익화, 확장성을 보는 축',
    color: '#7c3aed',
    bgClass: 'bg-violet-50',
    textClass: 'text-violet-700',
  },
  career: {
    label: '직장운',
    description: '조직 적응, 책임, 평판 흐름을 보는 축',
    color: '#2563eb',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
  },
  relationship: {
    label: '연애/관계운',
    description: '인연 유입, 관계 안정, 감정 교류를 보는 축',
    color: '#db2777',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-700',
  },
  study: {
    label: '학업/성장운',
    description: '흡수력, 성취, 자기계발 흐름을 보는 축',
    color: '#4f46e5',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
  },
  social: {
    label: '대인관계운',
    description: '관계 형성, 협업, 네트워크 흐름을 보는 축',
    color: '#0891b2',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
  },
}

const SAMPLE_AGES = [0, 10, 20, 30, 40, 50, 60, 70]
const HERO_PALETTE = {
  borderClass: 'border-sky-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_24%),linear-gradient(135deg,_#f7fbff_0%,_#ffffff_55%,_#f0fdfa_100%)]',
  eyebrowClass: 'text-sky-500',
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function formatScore(value: number) {
  return Math.round(value * 10) / 10
}

export default async function LifeGraphPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const saju = user
    ? await supabase
        .from('user_saju')
        .select('birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar')
        .eq('user_id', user.id)
        .maybeSingle()
    : null

  const hasSaju = Boolean(saju?.data)

  let snapshot = null
  let fullSeries = [] as ReturnType<typeof buildLifeGraphSeries>
  let sampleSeries = [] as ReturnType<typeof buildLifeGraphSeries>
  let currentAge = 0
  let domainExplanations = null as ReturnType<typeof buildDomainExplanations> | null
  let nearFutureSummary = null as ReturnType<typeof buildNearFutureSummary> | null

  if (saju?.data) {
    const input: SajuInput = {
      birth_year: saju.data.birth_year,
      birth_month: saju.data.birth_month,
      birth_day: saju.data.birth_day,
      birth_hour: saju.data.birth_hour ?? null,
      birth_minute: saju.data.birth_minute ?? null,
      gender: (saju.data.gender as Gender) ?? 'male',
      is_lunar: saju.data.is_lunar ?? false,
    }

    const manseryeokData = getManseryeokData(input)
    snapshot = buildLifeScoreEngineSnapshot(manseryeokData)
    fullSeries = buildLifeGraphSeries(manseryeokData, { startAge: 0, endAge: 100 })
    sampleSeries = fullSeries.filter((point) => SAMPLE_AGES.includes(point.age))
    currentAge = clamp(new Date().getFullYear() - manseryeokData.solarYear, 0, 100)
    domainExplanations = buildDomainExplanations(
      manseryeokData,
      snapshot.baseScore,
      fullSeries,
      currentAge,
    )
    nearFutureSummary = buildNearFutureSummary(fullSeries, currentAge)
  }

  const currentPoint =
    fullSeries.find((point) => point.age === currentAge) ??
    fullSeries[fullSeries.length - 1] ??
    null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Saju Life Graph"
        title="사주 생애 그래프"
        description={`사주 원국, 대운, 세운 흐름을 점수 엔진으로 구조화해 0세부터 100세까지의 흐름을 시각화하는 메뉴입니다.
지금은 1차 엔진 결과를 그래프 UI로 연결한 단계라서, 도메인별 흐름과 보조 지표를 함께 보며 숫자 감각을 검증할 수 있습니다.`}
        palette={HERO_PALETTE}
        actions={
          !user
            ? [
                { href: '/login', label: '로그인' },
                { href: '/mypage/saju', label: '사주 정보 안내', variant: 'ghost' },
              ]
            : hasSaju
              ? undefined
              : [
                  { href: '/mypage/saju', label: '사주 정보 입력하기' },
                  { href: '/mypage', label: '마이페이지', variant: 'ghost' },
                ]
        }
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LIFE_DOMAINS.map((domain) => (
          <article
            key={domain}
            className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{DOMAIN_META[domain].label}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${DOMAIN_META[domain].bgClass} ${DOMAIN_META[domain].textClass}`}
              >
                그래프 연결 완료
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-500">{DOMAIN_META[domain].description}</p>
          </article>
        ))}
      </section>

      {snapshot && currentPoint && (
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <LifeGraphChart
            fullSeries={fullSeries}
            currentAge={currentAge}
            currentPoint={currentPoint}
            domainMeta={DOMAIN_META}
          />

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">현재 흐름 요약</h2>
              <div className="mt-5 space-y-3">
                {LIFE_DOMAINS.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{DOMAIN_META[domain].label}</p>
                      <p className="mt-1 text-xs text-gray-500">{currentPoint.labels[domain]}</p>
                    </div>
                    <p className="text-lg font-semibold" style={{ color: DOMAIN_META[domain].color }}>
                      {formatScore(currentPoint.domains[domain])}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">보조 지표</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-sky-50 px-4 py-4">
                  <p className="text-sm font-medium text-sky-600">원국 사건 강도</p>
                  <p className="mt-2 text-2xl font-bold text-sky-900">{formatScore(snapshot.intensity)}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                  <p className="text-sm font-medium text-amber-600">원국 변동성</p>
                  <p className="mt-2 text-2xl font-bold text-amber-900">{formatScore(snapshot.volatility)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-4">
                  <p className="text-sm font-medium text-gray-600">현재 시점 변동성</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{formatScore(currentPoint.volatility)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {nearFutureSummary && (
        <section className="mt-8 rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(135deg,_#f0f9ff_0%,_#ffffff_55%,_#f8fafc_100%)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-500">Next 10 Years</p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                {nearFutureSummary.currentAge}세부터 {nearFutureSummary.futureAge}세까지 흐름 요약
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">{nearFutureSummary.summary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-[360px]">
              <div className="rounded-2xl bg-white/90 px-4 py-4">
                <p className="text-xs font-medium text-gray-500">상승 가능성 큰 분야</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {nearFutureSummary.risingDomains.length > 0
                    ? nearFutureSummary.risingDomains.map((domain) => DOMAIN_META[domain].label).join(', ')
                    : '고른 흐름'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/90 px-4 py-4">
                <p className="text-xs font-medium text-gray-500">조정 가능성 큰 분야</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {nearFutureSummary.fallingDomains.length > 0
                    ? nearFutureSummary.fallingDomains.map((domain) => DOMAIN_META[domain].label).join(', ')
                    : '뚜렷한 약세 적음'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/90 px-4 py-4">
                <p className="text-xs font-medium text-gray-500">평균 사건 강도</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{nearFutureSummary.avgIntensity}</p>
              </div>
              <div className="rounded-2xl bg-white/90 px-4 py-4">
                <p className="text-xs font-medium text-gray-500">평균 변동성</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{nearFutureSummary.avgVolatility}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {domainExplanations && (
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">도메인별 해설</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              현재 점수, 최근 10년 흐름, 대운과 세운의 방향을 묶어서 읽기 쉬운 해설로 정리한 영역입니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {LIFE_DOMAINS.map((domain) => {
              const explanation = domainExplanations[domain]
              return (
                <article
                  key={`explanation-${domain}`}
                  className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{DOMAIN_META[domain].label}</h3>
                      <p className={`mt-1 text-sm font-medium ${DOMAIN_META[domain].textClass}`}>
                        {explanation.headline}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${DOMAIN_META[domain].bgClass} ${DOMAIN_META[domain].textClass}`}
                    >
                      현재 해설
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-7 text-gray-600">
                    <p>{explanation.summary}</p>
                    <p>{explanation.currentReason}</p>
                    <p>{explanation.trendReason}</p>
                    <p className="text-gray-500">{explanation.caution}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {sampleSeries.length > 0 && (
        <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">검증용 샘플 표</h2>
              <p className="mt-1 text-sm text-gray-500">
                10세 단위로 점수를 잘라서 보는 임시 표입니다. 그래프 아래에서도 숫자를 직접 검증할 수 있게
                남겨둔 영역입니다.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
              검증용
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">나이</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">연도</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">재물</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">건강</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">사업</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">직장</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">연애/관계</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">학업/성장</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">대인관계</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">강도</th>
                  <th className="border-b border-gray-100 px-3 py-3 font-medium">변동성</th>
                </tr>
              </thead>
              <tbody>
                {sampleSeries.map((point) => (
                  <tr key={point.age} className="text-gray-700">
                    <td className="border-b border-gray-50 px-3 py-3 font-semibold">{point.age}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{point.year}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.wealth)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.health)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.business)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.career)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.relationship)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.study)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.domains.social)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.intensity)}</td>
                    <td className="border-b border-gray-50 px-3 py-3">{formatScore(point.volatility)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">다음 구현 단계</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-sky-400" />
            <span>상승 요인과 하락 요인을 자동 추출해서 각 도메인 그래프 아래 설명문으로 더 깊게 연결합니다.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-sky-400" />
            <span>용신·희신·기신, 조후 엔진이 붙으면 BaseScore의 정밀도를 한 단계 더 올릴 수 있습니다.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-sky-400" />
            <span>그래프 결과를 저장하거나 공유할 수 있는 요약 카드 레이아웃도 다음 단계에서 붙일 수 있습니다.</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
