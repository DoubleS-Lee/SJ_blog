'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createConsultation } from '@/actions/consultations'

export default function ConsultationForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fullBody = contact.trim()
      ? `[연락처: ${contact.trim()}]\n\n${body}`
      : body

    startTransition(async () => {
      const result = await createConsultation({
        title,
        body: fullBody,
        contentUsageAgreed: true,
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

  const inputStyle = {
    background: '#FBF7EE',
    borderColor: 'rgba(30,45,77,0.18)',
    color: '#1E2D4D',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: '#1E2D4D' }}>
          제목
        </label>
        <input
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
          style={inputStyle}
          placeholder="예: 연애 문제로 너무 지쳐요"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: '#1E2D4D' }}>
          사연
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={12}
          className="w-full resize-y rounded-2xl border px-4 py-3 text-sm leading-relaxed outline-none transition"
          style={inputStyle}
          placeholder="생년월일시(양력/음력)와 현재 상황을 자세히 적어 주세요. 언제부터 어떤 일이 있었는지, 지금 가장 고민되는 부분을 구체적으로 써 주실수록 더 깊이 있는 상담이 가능합니다."
        />
        <p className="mt-2 text-xs" style={{ color: '#9a8e7a' }}>{body.trim().length}/5000</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: '#1E2D4D' }}>
          연락처 <span className="font-normal text-xs ml-1" style={{ color: '#9a8e7a' }}>(결제 안내를 위해 필요합니다)</span>
        </label>
        <input
          type="text"
          maxLength={100}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
          style={inputStyle}
          placeholder="카카오톡 ID, 이메일 또는 전화번호"
        />
      </div>

      {error && (
        <p className="rounded-xl px-4 py-3 text-sm text-red-600" style={{ background: 'rgba(220,38,38,0.07)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/counsel', { scroll: false })}
          className="rounded-full px-5 py-2.5 text-sm transition-opacity hover:opacity-60"
          style={{ color: '#4a5673' }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: '#1E2D4D' }}
        >
          {isPending ? '신청 중...' : '1:1 맞춤 상담 신청하기'}
        </button>
      </div>
    </form>
  )
}
