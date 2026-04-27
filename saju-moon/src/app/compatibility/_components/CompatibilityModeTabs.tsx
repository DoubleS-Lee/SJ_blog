import Link from 'next/link'

type CompatibilityMode = 'total' | 'today' | 'month' | 'year'

interface CompatibilityModeTabsProps {
  active: CompatibilityMode
  selectedId?: string | null
  maleRoleParam?: 'me' | 'target' | null
}

const MODES: Array<{ key: CompatibilityMode; label: string; href: string }> = [
  { key: 'total', label: '궁합 총운', href: '/compatibility' },
  { key: 'today', label: '오늘의 궁합', href: '/compatibility/today' },
  { key: 'month', label: '이달의 궁합', href: '/compatibility/month' },
  { key: 'year', label: '올해의 궁합', href: '/compatibility/year' },
]

function buildHref(
  path: string,
  selectedId?: string | null,
  maleRoleParam?: 'me' | 'target' | null,
) {
  const params = new URLSearchParams()
  if (selectedId) params.set('target', selectedId)
  if (maleRoleParam) params.set('maleRole', maleRoleParam)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export default function CompatibilityModeTabs({
  active,
  selectedId,
  maleRoleParam,
}: CompatibilityModeTabsProps) {
  return (
    <section className="mt-5">
      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => {
          const isActive = mode.key === active
          return (
            <Link
              key={mode.key}
              href={buildHref(mode.href, selectedId, maleRoleParam)}
              scroll={false}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:text-pink-600'
              }`}
            >
              {mode.label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
