'use client'

import { useRef, useState, useTransition } from 'react'
import IlganBadge from '@/components/saju/IlganBadge'
import { setProfileAvatar } from '@/actions/profile'
import {
  resolveAvatarImageUrl,
  type IlganAvatarMap,
} from '@/lib/saju/ilgan-avatar'

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
    })
  }

  return (
    <section className="mb-8 border-b border-gray-100 pb-8">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900">프로필 이미지</h2>
        <p className="mt-1 text-sm text-gray-500">
          댓글과 상담 대화에서 보이는 프로필 이미지입니다.
          <br />
          업로드한 이미지가 없으면 일간별 기본 아이콘이 자동으로 적용됩니다.
          <br />
          2MB 이하의 JPG, PNG, WEBP, GIF 파일을 올릴 수 있습니다.
          <br />
          권장 크기는 512x512 정사각형입니다.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <IlganBadge
            ilgan={ilgan}
            imageUrl={previewImageUrl}
            fallbackText={nickname?.trim().charAt(0) || '나'}
            className="h-14 w-14 text-2xl"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {avatarUrl ? '사용자 프로필 이미지 적용 중' : '일간 기본 아이콘 자동 적용 중'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              업로드한 이미지가 있으면 그 이미지가 우선 표시되고, 없으면 내 일간에 맞는 기본 아이콘이
              표시됩니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {isUploading ? '업로드 중..' : avatarUrl ? '이미지 바꾸기' : '이미지 업로드'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {isRemoving ? '삭제 중..' : '이미지 삭제'}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </section>
  )
}
