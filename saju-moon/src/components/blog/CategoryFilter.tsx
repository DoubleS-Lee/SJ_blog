'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ALL_CATEGORIES_LABEL, POST_CATEGORIES } from '@/lib/posts/categories'

const CATEGORIES = [ALL_CATEGORIES_LABEL, ...POST_CATEGORIES]

export default function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? ALL_CATEGORIES_LABEL

  function handleSelect(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category === ALL_CATEGORIES_LABEL) {
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
