'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['전체', '연애·궁합', '커리어·이직', '재물·투자', '건강·체질', '육아·자녀교육', '기타']

export default function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? '전체'

  function handleSelect(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category === '전체') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    params.delete('page')
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleSelect(cat)}
          className="rounded-full border-[3px] px-3 py-1.5 text-xs transition-all"
          style={
            current === cat
              ? { borderColor: '#1E2D4D', background: '#1E2D4D', color: '#F6EFE3' }
              : { borderColor: 'rgba(30,45,77,0.2)', color: '#4a5673' }
          }
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
