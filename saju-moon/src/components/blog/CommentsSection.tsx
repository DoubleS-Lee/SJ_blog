'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  createPostComment,
  updatePostComment,
  deletePostComment,
  togglePostCommentLike,
} from '@/actions/comments'
import { buttonVariants } from '@/components/ui/button'
import IlganBadge from '@/components/saju/IlganBadge'
import {
  getIlganDisplayLabel,
  resolveAvatarImageUrl,
  type IlganAvatarMap,
} from '@/lib/saju/ilgan-avatar'
import type { CommentNode } from '@/types/comment'

const MAX_COMMENT_LENGTH = 2000

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitial(authorName: string) {
  return authorName.trim().charAt(0) || '?'
}

interface CommentFormProps {
  mode: 'create' | 'reply' | 'edit'
  postId: string
  commentId?: string
  parentId?: string | null
  initialValue?: string
  placeholder: string
  submitLabel: string
  cancelLabel?: string
  onCancel?: () => void
  onSuccess?: () => void
}

function CommentForm({
  mode,
  postId,
  commentId,
  parentId,
  initialValue = '',
  placeholder,
  submitLabel,
  cancelLabel = '취소',
  onCancel,
  onSuccess,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const trimmed = body.trim()
      if (!trimmed) {
        setError('내용을 입력해 주세요.')
        return
      }

      const result =
        mode === 'edit'
          ? await updatePostComment({ commentId: commentId!, body: trimmed })
          : await createPostComment({ postId, parentId, body: trimmed })

      if (result?.error) {
        setError(result.error)
        return
      }

      if (mode !== 'edit') setBody('')
      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={mode === 'create' ? 4 : 3}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-black"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">
          {body.trim().length}/{MAX_COMMENT_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              {cancelLabel}
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

interface CommentItemProps {
  postId: string
  comment: CommentNode
  currentUserId: string | null
  isLoggedIn: boolean
  ilganAvatarMap: IlganAvatarMap
  depth?: 0 | 1
}

function CommentItem({
  postId,
  comment,
  currentUserId,
  isLoggedIn,
  ilganAvatarMap,
  depth = 0,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isLikePending, startLikeTransition] = useTransition()
  const [isDeletePending, startDeleteTransition] = useTransition()

  const isOwner = currentUserId === comment.user_id
  const canReply = depth === 0 && !comment.is_deleted
  const canEdit = isOwner && !comment.is_deleted
  const canDelete = isOwner && !comment.is_deleted

  function handleLike() {
    if (!isLoggedIn) return
    setActionError(null)
    startLikeTransition(async () => {
      const result = await togglePostCommentLike({ commentId: comment.id })
      if (result?.error) setActionError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm('이 댓글을 삭제할까요? 대댓글이 있어도 스레드는 유지됩니다.')) return
    setActionError(null)
    startDeleteTransition(async () => {
      const result = await deletePostComment({ commentId: comment.id })
      if (result?.error) setActionError(result.error)
    })
  }

  return (
    <div className={`${depth === 1 ? 'ml-6 border-l border-gray-100 pl-4' : ''}`}>
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <IlganBadge
            ilgan={comment.author_ilgan}
            imageUrl={resolveAvatarImageUrl({
              avatarUrl: comment.author_avatar_url,
              ilganAvatarMap,
              ilgan: comment.author_ilgan,
            })}
            fallbackText={getInitial(comment.author_name)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-gray-900">
                {comment.author_name}
              </span>
              {comment.author_ilgan && (
                <span className="text-xs text-gray-400">
                  {getIlganDisplayLabel(comment.author_ilgan)}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {formatDate(comment.created_at)}
              </span>
              {!comment.is_deleted && comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-300">수정됨</span>
              )}
            </div>

            <div className="mt-2">
              {comment.is_deleted ? (
                <p className="text-sm italic text-gray-400">삭제된 댓글입니다.</p>
              ) : editOpen ? (
                <CommentForm
                  mode="edit"
                  postId={postId}
                  commentId={comment.id}
                  initialValue={comment.body}
                  placeholder="댓글을 수정하세요."
                  submitLabel="수정 저장"
                  onCancel={() => setEditOpen(false)}
                  onSuccess={() => setEditOpen(false)}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {comment.body}
                </p>
              )}
            </div>

            {!editOpen && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={!isLoggedIn || comment.is_deleted || isLikePending}
                  className={`text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    comment.liked_by_me ? 'font-semibold text-black' : 'text-gray-400 hover:text-black'
                  }`}
                >
                  {isLikePending ? '처리 중...' : `좋아요 ${comment.like_count}`}
                </button>

                {canReply && (
                  <button
                    type="button"
                    onClick={() => setReplyOpen((value) => !value)}
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    {replyOpen ? '답글 닫기' : '답글'}
                  </button>
                )}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    수정
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeletePending}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {isDeletePending ? '삭제 중...' : '삭제'}
                  </button>
                )}
              </div>
            )}

            {actionError && <p className="mt-2 text-sm text-red-500">{actionError}</p>}
          </div>
        </div>
      </div>

      {replyOpen && (
        <div className="mt-3 ml-6">
          <CommentForm
            mode="reply"
            postId={postId}
            parentId={comment.id}
            placeholder="대댓글을 입력하세요."
            submitLabel="답글 등록"
            onCancel={() => setReplyOpen(false)}
            onSuccess={() => setReplyOpen(false)}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              postId={postId}
              comment={reply}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              ilganAvatarMap={ilganAvatarMap}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentsSectionProps {
  postId: string
  comments: CommentNode[]
  currentUserId: string | null
  isLoggedIn: boolean
  ilganAvatarMap: IlganAvatarMap
}

export default function CommentsSection({
  postId,
  comments,
  currentUserId,
  isLoggedIn,
  ilganAvatarMap,
}: CommentsSectionProps) {
  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">댓글</h2>
          <p className="mt-1 text-sm text-gray-400">
            총 {comments.length}개의 댓글이 있습니다.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        {isLoggedIn ? (
          <CommentForm
            mode="create"
            postId={postId}
            placeholder="이 글에 대한 생각을 남겨보세요."
            submitLabel="댓글 등록"
          />
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              로그인하면 댓글과 대댓글을 작성하고 좋아요를 누를 수 있습니다.
            </p>
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              로그인
            </Link>
          </div>
        )}
      </div>

      {comments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              postId={postId}
              comment={comment}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              ilganAvatarMap={ilganAvatarMap}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </div>
      )}
    </section>
  )
}
