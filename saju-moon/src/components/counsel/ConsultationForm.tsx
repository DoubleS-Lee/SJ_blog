'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createConsultation } from '@/actions/consultations'
import { buttonVariants } from '@/components/ui/button'

export default function ConsultationForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createConsultation({
        title,
        body,
        contentUsageAgreed: agreed,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.id) {
        router.push(`/counsel/${result.id}`, { scroll: false })
        router.refresh()
      }
    })
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">제목</label>
        <input
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder="예: 연애 문제로 너무 지쳐요"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">사연</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={12}
          className={`${inputCls} resize-y leading-relaxed`}
          placeholder="상황을 최대한 자세히 적어 주세요. 언제부터, 어떤 일이 있었는지, 마음이 어떻게 변했는지까지 적어 주시면 상담으로 이어질 확률이 높아집니다. 다만 실명, 연락처, 학교명, 회사명, 주소 같은 식별 정보는 적지 않는 것을 권장합니다."
        />
        <p className="mt-2 text-xs text-gray-400">{body.trim().length}/5000</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-black"
          />
          <div className="text-sm text-gray-600 leading-relaxed">
            <p className="font-medium text-gray-900">
              [필수] 고민 상담 게시판 이용 및 익명 콘텐츠 활용 동의
            </p>
            <p className="mt-1">
              작성한 사연은 관리자에 의해 열람·검토되며, 답변 제공과 서비스 운영을 위해 사용됩니다.
              또한 식별 정보를 제거한 뒤 요약·편집되어 블로그, 유튜브 쇼츠, 인스타 릴스 등 익명 콘텐츠로 활용될 수 있습니다.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              동의하지 않으면 고민 상담 게시판을 이용할 수 없습니다.
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/counsel', { scroll: false })}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          className={buttonVariants({ size: 'sm', className: 'disabled:opacity-50' })}
        >
          {isPending ? '등록 중...' : '익명 상담 등록'}
        </button>
      </div>
    </form>
  )
}
