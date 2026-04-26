'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'kakao' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signInWith(provider: 'google' | 'kakao') {
    setLoading(provider)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('로그인에 실패했습니다. 다시 시도해 주세요.')
      setLoading(null)
    }
    // 성공 시 Supabase가 소셜 로그인 페이지로 리다이렉트 — 여기서 끝
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* 헤더 */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            월덕요정의 사주이야기
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => signInWith('kakao')}
            disabled={loading !== null}
            className="flex items-center justify-center gap-3 w-full h-11 rounded-md font-medium text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            {loading === 'kakao' ? (
              <span className="animate-pulse">연결 중...</span>
            ) : (
              <>
                <KakaoIcon />
                카카오로 계속하기
              </>
            )}
          </button>

          <button
            onClick={() => signInWith('google')}
            disabled={loading !== null}
            className="flex items-center justify-center gap-3 w-full h-11 rounded-md border border-gray-200 bg-white font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {loading === 'google' ? (
              <span className="animate-pulse">연결 중...</span>
            ) : (
              <>
                <GoogleIcon />
                Google로 계속하기
              </>
            )}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        {/* 약관 안내 */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          계속하면 월덕요정의 사주이야기의{' '}
          <Link href="/terms" className="underline underline-offset-2">
            이용약관
          </Link>{' '}
          및{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            개인정보 처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>

        {/* 뒤로 */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-black transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.38c0 2.073 1.32 3.894 3.318 4.962l-.846 3.15a.187.187 0 0 0 .288.2L8.1 13.38A9.16 9.16 0 0 0 9 13.26c4.142 0 7.5-2.634 7.5-5.88S13.142 1.5 9 1.5Z"
        fill="#000000"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}
