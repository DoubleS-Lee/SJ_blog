'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/actions/deleteAccount'

export default function DeleteAccountButton() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('정말 탈퇴하시겠습니까?\n\n모든 사주 데이터와 계정 정보가 삭제되며 되돌릴 수 없습니다.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteAccount()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {isPending ? '처리 중...' : '회원 탈퇴'}
      </button>
    </div>
  )
}
