'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p
        className="mb-4 tracking-[6px]"
        style={{
          fontFamily: 'var(--font-cormorant-garamond), serif',
          fontSize: 14,
          fontWeight: 600,
          color: '#B78D3C',
        }}
      >
        ERROR
      </p>

      <h1 className="mb-3 text-2xl font-bold tracking-tight">일시적인 오류가 발생했습니다</h1>

      <p className="mb-10 text-sm leading-7 text-gray-500">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 잠시 뒤에 새로고침해 주세요.
        {error.digest && (
          <>
            <br />
            <span className="text-xs text-gray-400">오류 코드: {error.digest}</span>
          </>
        )}
      </p>

      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
      >
        다시 시도
      </button>
    </div>
  )
}
