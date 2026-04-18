'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createConsultationComment,
  updateConsultationComment,
  deleteConsultationComment,
} from '@/actions/consultations'
import { buttonVariants } from '@/components/ui/button'
import IlganBadge from '@/components/saju/IlganBadge'
import {
  getIlganDisplayLabel,
  resolveAvatarImageUrl,
  type IlganAvatarMap,
} from '@/lib/saju/ilgan-avatar'
import type { ConsultationComment } from '@/types/consultation'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CommentComposer({
  consultationId,
  initialValue = '',
  commentId,
  onCancel,
  submitLabel,
}: {
  consultationId: string
  initialValue?: string
  commentId?: string
  onCancel?: () => void
  submitLabel: string
}) {
  const router = useRouter()
  const [body, setBody] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = commentId
        ? await updateConsultationComment({ consultationId, commentId, body })
        : await createConsultationComment({ consultationId, body })

      if (result?.error) {
        setError(result.error)
        return
      }

      router.refresh()
      if (!commentId) setBody('')
      onCancel?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="답변이나 추가 상황을 남겨 주세요."
        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-black"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">{body.trim().length}/2000</span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className={buttonVariants({ size: 'sm', className: 'disabled:opacity-50' })}
          >
            {isPending ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  )
}

export default function ConsultationConversation({
  consultationId,
  comments,
  canWrite,
  ilganAvatarMap,
}: {
  consultationId: string
  comments: ConsultationComment[]
  canWrite: boolean
  ilganAvatarMap: IlganAvatarMap
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">상담 대화</h2>
          <p className="mt-1 text-sm text-gray-400">
            작성자와 관리자만 이 대화를 볼 수 있습니다.
          </p>
        </div>
      </div>

      {canWrite && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <CommentComposer consultationId={consultationId} submitLabel="댓글 남기기" />
        </div>
      )}

      {comments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              consultationId={consultationId}
              comment={comment}
              canWrite={canWrite}
              ilganAvatarMap={ilganAvatarMap}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
          아직 대화가 시작되지 않았습니다.
        </div>
      )}
    </section>
  )
}

function CommentItem({
  consultationId,
  comment,
  canWrite,
  ilganAvatarMap,
}: {
  consultationId: string
  comment: ConsultationComment
  canWrite: boolean
  ilganAvatarMap: IlganAvatarMap
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('이 댓글을 삭제할까요?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteConsultationComment({
        commentId: comment.id,
        consultationId,
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IlganBadge
            ilgan={comment.author_ilgan}
            imageUrl={resolveAvatarImageUrl({
              avatarUrl: comment.author_avatar_url,
              ilganAvatarMap,
              ilgan: comment.author_ilgan,
            })}
            fallbackText={comment.role_label}
          />
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-semibold text-gray-900">{comment.role_label}</p>
              {comment.author_ilgan && (
                <span className="text-xs text-gray-400">
                  {getIlganDisplayLabel(comment.author_ilgan)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{formatDate(comment.created_at)}</p>
          </div>
        </div>
        {canWrite && comment.is_mine && !comment.is_deleted && !editing && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              {isPending ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        {comment.is_deleted ? (
          <p className="text-sm italic text-gray-400">삭제된 댓글입니다.</p>
        ) : editing ? (
          <CommentComposer
            consultationId={consultationId}
            commentId={comment.id}
            initialValue={comment.body}
            submitLabel="수정 저장"
            onCancel={() => setEditing(false)}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{comment.body}</p>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
