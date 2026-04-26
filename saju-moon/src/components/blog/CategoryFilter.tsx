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
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleSelect(cat)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            current === cat
              ? 'border-black bg-black text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
