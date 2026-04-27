'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <input
        type="text"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="제목이나 요약으로 글 검색"
        className="h-11 flex-1 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-black"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          검색
        </button>
        {query.trim() ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-black"
          >
            초기화
          </button>
        ) : null}
      </div>
    </form>
  )
}
