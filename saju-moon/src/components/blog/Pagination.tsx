'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  hasNextPage: boolean
  totalPages: number
}

export default function Pagination({ currentPage, hasNextPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (currentPage <= 1 && !hasNextPage) return null

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())

    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }

    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false })
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
        style={{ borderColor: 'rgba(30,45,77,0.2)', color: '#4a5673' }}
        aria-label="이전 페이지"
      >
        <ChevronLeft size={16} />
        <span>이전</span>
      </button>

      <span className="min-w-20 text-center text-sm font-medium" style={{ color: '#1E2D4D' }}>
        {currentPage} / {totalPages} 페이지
      </span>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={!hasNextPage}
        className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
        style={{ borderColor: 'rgba(30,45,77,0.2)', color: '#4a5673' }}
        aria-label="다음 페이지"
      >
        <span>다음</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
