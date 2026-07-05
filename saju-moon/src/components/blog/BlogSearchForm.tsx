'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface BlogSearchFormProps {
  category?: string
  defaultQuery?: string
}

export default function BlogSearchForm({
  category,
  defaultQuery = '',
}: BlogSearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)

  function buildUrl(nextQuery: string) {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    const trimmed = nextQuery.trim()
    if (trimmed) params.set('q', trimmed)
    const queryString = params.toString()
    return queryString ? `/?${queryString}` : '/'
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(buildUrl(query), { scroll: false })
  }

  function handleReset() {
    setQuery('')
    router.push(buildUrl(''), { scroll: false })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="글 검색"
            className="h-10 w-full rounded-full border pl-4 pr-10 text-sm outline-none transition"
            style={{ borderColor: 'rgba(30,45,77,0.15)', background: '#FBF7EE', color: '#1E2D4D' }}
          />
          {query.trim() && (
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
              style={{ color: '#9a8e7a' }}
              aria-label="초기화"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
          style={{ background: '#1E2D4D', color: '#F6EFE3' }}
          aria-label="검색"
        >
          <Search size={15} />
        </button>
      </div>
    </form>
  )
}
