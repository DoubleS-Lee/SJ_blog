'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/global-error]', error)
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: '#F6EFE3',
          color: '#1E2D4D',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, letterSpacing: 6, color: '#B78D3C' }}>ERROR</p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          일시적인 오류가 발생했습니다
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#4a5673' }}>
          잠시 후 다시 시도해 주세요.
          {error.digest ? ` (오류 코드: ${error.digest})` : ''}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 8,
            border: 0,
            borderRadius: 999,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: '#18181b',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  )
}
