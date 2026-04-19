'use client'

import { useMemo, useRef, useState } from 'react'
import { LIFE_DOMAINS, type LifeDomain, type LifeGraphSeriesPoint } from '@/lib/life-score/types'

const AGE_TICKS = [0, 20, 40, 60, 80, 100]
const Y_TICKS = [0, 20, 40, 60, 80, 100]
const CHART_WIDTH = 920
const CHART_HEIGHT = 320
const SUB_CHART_HEIGHT = 120

type DomainMeta = Record<
  LifeDomain,
  { label: string; description: string; color: string; bgClass: string; textClass: string }
>

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function formatScore(value: number) {
  return Math.round(value * 10) / 10
}

function getLinePath(
  points: Array<{ age: number; value: number }>,
  width: number,
  height: number,
  maxAge: number,
) {
  if (points.length === 0) {
    return ''
  }

  return points
    .map((point, index) => {
      const x = (point.age / maxAge) * width
      const y = height - (clamp(point.value, 0, 100) / 100) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function getAreaPath(
  points: Array<{ age: number; value: number }>,
  width: number,
  height: number,
  maxAge: number,
) {
  if (points.length === 0) {
    return ''
  }

  const linePath = getLinePath(points, width, height, maxAge)
  const lastX = (points[points.length - 1].age / maxAge) * width
  return `${linePath} L ${lastX.toFixed(2)} ${height} L 0 ${height} Z`
}

function getScoreSummary(values: number[]) {
  let max = -Infinity
  let min = Infinity
  let maxAge = 0
  let minAge = 0

  values.forEach((value, index) => {
    if (value > max) {
      max = value
      maxAge = index
    }
    if (value < min) {
      min = value
      minAge = index
    }
  })

  return { max, min, maxAge, minAge }
}

export function LifeGraphChart({
  fullSeries,
  currentAge,
  currentPoint,
  domainMeta,
}: {
  fullSeries: LifeGraphSeriesPoint[]
  currentAge: number
  currentPoint: LifeGraphSeriesPoint
  domainMeta: DomainMeta
}) {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<LifeDomain[]>([
    'wealth',
    'career',
    'relationship',
  ])
  const [focusedAge, setFocusedAge] = useState<number>(currentAge)

  const visibleDomains = selectedDomains.length > 0 ? selectedDomains : [...LIFE_DOMAINS]
  const focusedPoint =
    fullSeries.find((point) => point.age === focusedAge) ??
    fullSeries[fullSeries.length - 1] ??
    currentPoint

  const domainPaths = useMemo<Record<LifeDomain, string>>(() => {
    const entries = LIFE_DOMAINS.map((domain) => [
      domain,
      getLinePath(
        fullSeries.map((point) => ({ age: point.age, value: point.domains[domain] })),
        CHART_WIDTH,
        CHART_HEIGHT,
        100,
      ),
    ]) as Array<[LifeDomain, string]>

    return Object.fromEntries(entries) as Record<LifeDomain, string>
  }, [fullSeries])

  const intensityPath = useMemo(
    () =>
      getLinePath(
        fullSeries.map((point) => ({ age: point.age, value: point.intensity })),
        CHART_WIDTH,
        SUB_CHART_HEIGHT,
        100,
      ),
    [fullSeries],
  )

  const intensityAreaPath = useMemo(
    () =>
      getAreaPath(
        fullSeries.map((point) => ({ age: point.age, value: point.intensity })),
        CHART_WIDTH,
        SUB_CHART_HEIGHT,
        100,
      ),
    [fullSeries],
  )

  const volatilityPath = useMemo(
    () =>
      getLinePath(
        fullSeries.map((point) => ({ age: point.age, value: point.volatility })),
        CHART_WIDTH,
        SUB_CHART_HEIGHT,
        100,
      ),
    [fullSeries],
  )

  const volatilityAreaPath = useMemo(
    () =>
      getAreaPath(
        fullSeries.map((point) => ({ age: point.age, value: point.volatility })),
        CHART_WIDTH,
        SUB_CHART_HEIGHT,
        100,
      ),
    [fullSeries],
  )

  const currentHighlightStartAge = Math.max(0, currentAge - 5)
  const currentHighlightEndAge = Math.min(100, currentAge + 5)
  const currentHighlightX = (currentHighlightStartAge / 100) * CHART_WIDTH
  const currentHighlightWidth = ((currentHighlightEndAge - currentHighlightStartAge) / 100) * CHART_WIDTH
  const currentAgeX = (currentAge / 100) * CHART_WIDTH
  const focusedAgeX = (focusedAge / 100) * CHART_WIDTH

  function toggleDomain(domain: LifeDomain) {
    setSelectedDomains((prev) => {
      if (prev.includes(domain)) {
        return prev.filter((item) => item !== domain)
      }
      return [...prev, domain]
    })
  }

  function selectAllDomains() {
    setSelectedDomains([...LIFE_DOMAINS])
  }

  function resetFocusDomains() {
    setSelectedDomains(['wealth', 'career', 'relationship'])
  }

  function jumpToAge(age: number) {
    setFocusedAge(age)
    chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-8">
      <div ref={chartRef} className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">생애 흐름 그래프</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              보고 싶은 도메인만 골라서 흐름을 읽을 수 있게 토글을 붙였습니다. 올해 위치는 세로 점선으로,
              클릭한 최고점·저점 나이는 별도 기준선으로 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
              <p className="font-medium">올해 기준</p>
              <p className="mt-1 text-base font-semibold">{currentAge}세</p>
            </div>
            <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-700">
              <p className="font-medium">선택한 나이</p>
              <p className="mt-1 text-base font-semibold">{focusedAge}세</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {LIFE_DOMAINS.map((domain) => {
            const active = visibleDomains.includes(domain)
            return (
              <button
                key={domain}
                type="button"
                onClick={() => toggleDomain(domain)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? `${domainMeta[domain].bgClass} ${domainMeta[domain].textClass} border-transparent`
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                aria-pressed={active}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: domainMeta[domain].color, opacity: active ? 1 : 0.45 }}
                />
                {domainMeta[domain].label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAllDomains}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            전체 보기
          </button>
          <button
            type="button"
            onClick={resetFocusDomains}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            핵심 3개만 보기
          </button>
          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
            올해 기준 ±5세 하이라이트
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 56}`}
            className="min-w-[920px]"
            role="img"
            aria-label="사주 생애 그래프"
          >
            <rect
              x={currentHighlightX}
              y="0"
              width={currentHighlightWidth}
              height={CHART_HEIGHT}
              fill="#e0f2fe"
              opacity="0.45"
              rx="14"
            />

            {Y_TICKS.map((tick) => {
              const y = CHART_HEIGHT - (tick / 100) * CHART_HEIGHT
              return (
                <g key={`y-${tick}`}>
                  <line
                    x1="0"
                    y1={y}
                    x2={CHART_WIDTH}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                  <text x="-8" y={y + 4} textAnchor="end" fontSize="12" fill="#94a3b8">
                    {tick}
                  </text>
                </g>
              )
            })}

            {AGE_TICKS.map((tick) => {
              const x = (tick / 100) * CHART_WIDTH
              return (
                <g key={`x-${tick}`}>
                  <line x1={x} y1="0" x2={x} y2={CHART_HEIGHT} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={x} y={CHART_HEIGHT + 24} textAnchor="middle" fontSize="12" fill="#94a3b8">
                    {tick}세
                  </text>
                </g>
              )
            })}

            {visibleDomains.map((domain) => (
              <path
                key={domain}
                d={domainPaths[domain]}
                fill="none"
                stroke={domainMeta[domain].color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            <line
              x1={currentAgeX}
              y1="0"
              x2={currentAgeX}
              y2={CHART_HEIGHT}
              stroke="#0f172a"
              strokeOpacity="0.28"
              strokeDasharray="5 7"
            />
            <line
              x1={focusedAgeX}
              y1="0"
              x2={focusedAgeX}
              y2={CHART_HEIGHT}
              stroke="#7c3aed"
              strokeOpacity="0.45"
              strokeDasharray="2 6"
            />
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleDomains.map((domain) => (
            <span
              key={domain}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${domainMeta[domain].bgClass} ${domainMeta[domain].textClass}`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: domainMeta[domain].color }}
              />
              {domainMeta[domain].label} · 현재 {formatScore(currentPoint.domains[domain])} · 선택{' '}
              {formatScore(focusedPoint.domains[domain])}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-sky-900">사건 강도</h3>
                <p className="mt-1 text-sm leading-6 text-sky-700">
                  좋은 해와 별개로, 일이 얼마나 많이 몰리는지 보는 보조 지표입니다.
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700">
                현재 {formatScore(currentPoint.intensity)}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${SUB_CHART_HEIGHT + 28}`}
                className="min-w-[920px]"
                role="img"
                aria-label="사건 강도 그래프"
              >
                <rect
                  x={currentHighlightX}
                  y="0"
                  width={currentHighlightWidth}
                  height={SUB_CHART_HEIGHT}
                  fill="#dbeafe"
                  opacity="0.35"
                  rx="12"
                />
                <line
                  x1="0"
                  y1={SUB_CHART_HEIGHT / 2}
                  x2={CHART_WIDTH}
                  y2={SUB_CHART_HEIGHT / 2}
                  stroke="#bae6fd"
                  strokeDasharray="4 6"
                />
                <path d={intensityAreaPath} fill="rgba(14, 165, 233, 0.15)" />
                <path
                  d={intensityPath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={currentAgeX}
                  y1="0"
                  x2={currentAgeX}
                  y2={SUB_CHART_HEIGHT}
                  stroke="#0f172a"
                  strokeOpacity="0.18"
                  strokeDasharray="5 7"
                />
                <line
                  x1={focusedAgeX}
                  y1="0"
                  x2={focusedAgeX}
                  y2={SUB_CHART_HEIGHT}
                  stroke="#7c3aed"
                  strokeOpacity="0.3"
                  strokeDasharray="2 6"
                />
                {AGE_TICKS.map((tick) => {
                  const x = (tick / 100) * CHART_WIDTH
                  return (
                    <text
                      key={`intensity-${tick}`}
                      x={x}
                      y={SUB_CHART_HEIGHT + 18}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#64748b"
                    >
                      {tick}세
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-amber-900">변동성</h3>
                <p className="mt-1 text-sm leading-6 text-amber-700">
                  만족도와 별개로, 해석이 요동치거나 선택 압박이 커지는 시기를 보는 지표입니다.
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700">
                현재 {formatScore(currentPoint.volatility)}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${SUB_CHART_HEIGHT + 28}`}
                className="min-w-[920px]"
                role="img"
                aria-label="변동성 그래프"
              >
                <rect
                  x={currentHighlightX}
                  y="0"
                  width={currentHighlightWidth}
                  height={SUB_CHART_HEIGHT}
                  fill="#fef3c7"
                  opacity="0.35"
                  rx="12"
                />
                <line
                  x1="0"
                  y1={SUB_CHART_HEIGHT / 2}
                  x2={CHART_WIDTH}
                  y2={SUB_CHART_HEIGHT / 2}
                  stroke="#fde68a"
                  strokeDasharray="4 6"
                />
                <path d={volatilityAreaPath} fill="rgba(245, 158, 11, 0.18)" />
                <path
                  d={volatilityPath}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={currentAgeX}
                  y1="0"
                  x2={currentAgeX}
                  y2={SUB_CHART_HEIGHT}
                  stroke="#0f172a"
                  strokeOpacity="0.18"
                  strokeDasharray="5 7"
                />
                <line
                  x1={focusedAgeX}
                  y1="0"
                  x2={focusedAgeX}
                  y2={SUB_CHART_HEIGHT}
                  stroke="#7c3aed"
                  strokeOpacity="0.3"
                  strokeDasharray="2 6"
                />
                {AGE_TICKS.map((tick) => {
                  const x = (tick / 100) * CHART_WIDTH
                  return (
                    <text
                      key={`volatility-${tick}`}
                      x={x}
                      y={SUB_CHART_HEIGHT + 18}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#64748b"
                    >
                      {tick}세
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">도메인별 미니 그래프</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              최고점이나 저점을 누르면 메인 그래프의 선택 기준선이 그 나이로 이동합니다.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {LIFE_DOMAINS.map((domain) => {
            const values = fullSeries.map((point) => point.domains[domain])
            const summary = getScoreSummary(values)
            const path = getLinePath(
              fullSeries.map((point) => ({ age: point.age, value: point.domains[domain] })),
              320,
              120,
              100,
            )

            return (
              <article
                key={domain}
                className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{domainMeta[domain].label}</h3>
                    <p className="mt-1 text-xs text-gray-500">{currentPoint.labels[domain]}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${domainMeta[domain].bgClass} ${domainMeta[domain].textClass}`}
                  >
                    현재 {formatScore(currentPoint.domains[domain])}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                  <svg
                    viewBox="0 0 320 120"
                    className="w-full"
                    role="img"
                    aria-label={`${domainMeta[domain].label} 미니 그래프`}
                  >
                    <line x1="0" y1="60" x2="320" y2="60" stroke="#e5e7eb" strokeDasharray="4 6" />
                    <line
                      x1={(focusedAge / 100) * 320}
                      y1="0"
                      x2={(focusedAge / 100) * 320}
                      y2="120"
                      stroke="#7c3aed"
                      strokeOpacity="0.28"
                      strokeDasharray="2 6"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={domainMeta[domain].color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => jumpToAge(summary.maxAge)}
                    className="rounded-2xl border border-gray-100 px-4 py-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50"
                  >
                    <p className="text-xs font-medium text-gray-500">최고점 구간</p>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                      {summary.maxAge}세 · {formatScore(summary.max)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpToAge(summary.minAge)}
                    className="rounded-2xl border border-gray-100 px-4 py-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50"
                  >
                    <p className="text-xs font-medium text-gray-500">저점 구간</p>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                      {summary.minAge}세 · {formatScore(summary.min)}
                    </p>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
