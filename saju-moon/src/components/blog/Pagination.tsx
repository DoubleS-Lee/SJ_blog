'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  hasNextPage: boolean
}

export default function Pagination({ currentPage, hasNextPage }: PaginationProps) {
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
        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="이전 페이지"
      >
        <ChevronLeft size={16} />
        <span>이전</span>
      </button>

      <span className="min-w-16 text-center text-sm font-medium text-gray-500">
        {currentPage} 페이지
      </span>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={!hasNextPage}
        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="다음 페이지"
      >
        <span>다음</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
