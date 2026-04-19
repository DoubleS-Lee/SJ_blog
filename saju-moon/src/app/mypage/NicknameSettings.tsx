'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { updateNickname } from '@/actions/profile'

interface Props {
  initialNickname: string | null
}

export default function NicknameSettings({ initialNickname }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [nickname, setNickname] = useState(initialNickname ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function closeModal() {
    if (isPending) return
    setIsOpen(false)
    setError(null)
    setNickname(initialNickname ?? '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await updateNickname(nickname)
      if (result?.error) {
        setError(result.error)
        return
      }

      setIsOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        닉네임 변경
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">닉네임 변경</h3>
              <p className="mt-1 text-sm text-gray-500">
                변경된 닉네임은 댓글, 상담, 게시글에서 표시됩니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">새 닉네임</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력해 주세요"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'disabled:opacity-60' })}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={buttonVariants({ size: 'sm', className: 'disabled:opacity-60' })}
                >
                  {isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
