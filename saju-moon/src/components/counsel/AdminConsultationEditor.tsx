'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateConsultationByAdmin } from '@/actions/consultations'
import { buttonVariants } from '@/components/ui/button'
import type { ConsultationStatus } from '@/types/consultation'

export default function AdminConsultationEditor({
  consultationId,
  initialStatus,
  initialAdminNote,
  initialAnonymizedContent,
  initialIsExternalUseReady,
}: {
  consultationId: string
  initialStatus: ConsultationStatus
  initialAdminNote: string | null
  initialAnonymizedContent: string | null
  initialIsExternalUseReady: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<ConsultationStatus>(initialStatus)
  const [adminNote, setAdminNote] = useState(initialAdminNote ?? '')
  const [anonymizedContent, setAnonymizedContent] = useState(initialAnonymizedContent ?? '')
  const [isExternalUseReady, setIsExternalUseReady] = useState(initialIsExternalUseReady)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateConsultationByAdmin({
        consultationId,
        status,
        adminNote,
        anonymizedContent,
        isExternalUseReady,
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">상담 상태</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as ConsultationStatus)} className={inputCls}>
          <option value="submitted">접수됨</option>
          <option value="answered">답변 완료</option>
          <option value="closed">상담 종결</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">관리자 메모</label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={4}
          className={`${inputCls} resize-y leading-relaxed`}
          placeholder="내부 운영 메모를 남겨 주세요."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">외부 공개용 익명화본</label>
        <textarea
          value={anonymizedContent}
          onChange={(e) => setAnonymizedContent(e.target.value)}
          rows={8}
          className={`${inputCls} resize-y leading-relaxed`}
          placeholder="원문을 그대로 쓰지 말고, 식별 정보를 제거한 공개용 문안만 여기에 정리해 주세요."
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={isExternalUseReady}
          onChange={(e) => setIsExternalUseReady(e.target.checked)}
          className="mt-1 accent-black"
        />
        <div>
          <p className="text-sm font-medium text-gray-900">외부 공개 준비 완료</p>
          <p className="mt-1 text-xs text-gray-400">
            원문을 수동 익명화했고, 바로 블로그/쇼츠/릴스 제작에 써도 되는 상태일 때만 체크하세요.
          </p>
        </div>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={buttonVariants({ size: 'sm', className: 'disabled:opacity-50' })}
        >
          {isPending ? '저장 중...' : '관리 정보 저장'}
        </button>
      </div>
    </form>
  )
}
