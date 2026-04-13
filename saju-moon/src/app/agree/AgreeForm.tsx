'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { agreeTerms } from '@/actions/agreeTerms'

interface Props {
  next: string
}

export default function AgreeForm({ next }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (!fd.get('terms') || !fd.get('privacy')) {
      setError('필수 항목에 모두 동의해 주세요.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await agreeTerms(next)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 필수 동의 항목 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <label className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 accent-black"
          />
          <div className="flex-1">
            <span className="text-sm font-medium">
              <span className="text-black">[필수]</span> 이용약관 동의
            </span>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              사주 Moon 서비스를 이용하기 위해 이용약관에 동의합니다.
              서비스는 사주 기반 콘텐츠 제공을 목적으로 하며, 무속·점술 서비스가 아닙니다.
            </p>
          </div>
        </label>

        <div className="border-t border-gray-100" />

        <label className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            name="privacy"
            className="mt-0.5 accent-black"
          />
          <div className="flex-1">
            <span className="text-sm font-medium">
              <span className="text-black">[필수]</span> 개인정보 처리방침 동의
            </span>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              생년월일·성별 등 개인정보 수집 및 처리에 동의합니다.{' '}
              <Link href="/privacy" target="_blank" className="underline hover:text-black">
                개인정보 처리방침 보기
              </Link>
            </p>
          </div>
        </label>

        <div className="border-t border-gray-100" />

        <label className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            name="marketing"
            className="mt-0.5 accent-black"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-500">
              [선택] 마케팅 정보 수신 동의
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              새 콘텐츠 및 서비스 알림을 받습니다. (동의하지 않아도 서비스 이용 가능)
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-black text-white text-sm font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {isPending ? '처리 중...' : '동의하고 시작하기'}
      </button>
    </form>
  )
}
