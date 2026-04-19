'use client'

import { useRef, useState, useTransition } from 'react'
import { buttonVariants } from '@/components/ui/button'
import IlganBadge from '@/components/saju/IlganBadge'
import { setProfileAvatar } from '@/actions/profile'
import { resolveAvatarImageUrl, type IlganAvatarMap } from '@/lib/saju/ilgan-avatar'

interface Props {
  initialAvatarUrl: string | null
  ilgan: string | null
  nickname: string | null
  ilganAvatarMap: IlganAvatarMap
}

export default function ProfileAvatarSettings({
  initialAvatarUrl,
  ilgan,
  nickname,
  ilganAvatarMap,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [showEditor, setShowEditor] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, startRemoveTransition] = useTransition()

  const previewImageUrl = resolveAvatarImageUrl({
    avatarUrl,
    ilganAvatarMap,
    ilgan,
  })

  function resetMessage() {
    setError(null)
    setSuccess(null)
  }

  async function handleUpload(file: File | null) {
    if (!file) return

    resetMessage()
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      })

      const uploadResult = await uploadResponse.json()
      if (!uploadResponse.ok || !uploadResult.url) {
        throw new Error(uploadResult.error || '이미지 업로드에 실패했습니다.')
      }

      const saveResult = await setProfileAvatar(uploadResult.url)
      if (saveResult?.error) {
        throw new Error(saveResult.error)
      }

      setAvatarUrl(uploadResult.url)
      setSuccess('프로필 이미지를 저장했습니다.')
      setShowEditor(false)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '프로필 이미지를 저장하지 못했습니다.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove() {
    resetMessage()
    startRemoveTransition(async () => {
      const result = await setProfileAvatar(null)
      if (result?.error) {
        setError(result.error)
        return
      }

      setAvatarUrl(null)
      setSuccess('프로필 이미지를 삭제했습니다.')
      setShowEditor(false)
    })
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">프로필 이미지</h2>
          <p className="mt-1 text-sm text-gray-500">댓글과 상담 대화에서 보이는 프로필 이미지입니다.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowEditor((prev) => !prev)
            resetMessage()
          }}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          {showEditor ? '닫기' : '수정'}
        </button>
      </div>

      <div className="rounded-xl bg-gray-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IlganBadge
              ilgan={ilgan}
              imageUrl={previewImageUrl}
              fallbackText={nickname?.trim().charAt(0) || '??'}
              className="h-10 w-10 text-lg"
            />
            {avatarUrl ? <p className="text-sm font-semibold text-gray-900">사용자 프로필 이미지 사용 중</p> : null}
          </div>
        </div>

        {showEditor ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              {isUploading ? '업로드 중...' : avatarUrl ? '이미지 바꾸기' : '이미지 업로드'}
            </button>

            {avatarUrl ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isRemoving ? '삭제 중...' : '이미지 삭제'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </section>
  )
}
