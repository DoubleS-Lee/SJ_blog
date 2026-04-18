'use client'
import { useRef, useState, useTransition } from 'react'
import IlganBadge from '@/components/saju/IlganBadge'
import { setIlganAvatarSettings } from '@/actions/updateSettings'
import {
  ILGAN_OPTIONS,
  getIlganDisplayLabel,
  type IlganAvatarMap,
} from '@/lib/saju/ilgan-avatar'
import type { Cheongan } from '@/types/saju'

interface Props {
  initialAvatarMap: IlganAvatarMap
}

export default function AdminIlganAvatarSettings({ initialAvatarMap }: Props) {
  const [avatarMap, setAvatarMap] = useState<IlganAvatarMap>(initialAvatarMap)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [isSaving, startTransition] = useTransition()
  const inputRefs = useRef<Partial<Record<Cheongan, HTMLInputElement | null>>>({})

  function setFlashMessage(next: { error?: string | null; success?: string | null }) {
    setError(next.error ?? null)
    setSuccess(next.success ?? null)
  }

  function updateAvatar(key: Cheongan, value: string | null) {
    setAvatarMap((current) => {
      const next = { ...current }
      if (value && value.trim()) {
        next[key] = value.trim()
      } else {
        delete next[key]
      }
      return next
    })
  }

  async function uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    if (!response.ok || !result.url) {
      throw new Error(result.error || '업로드에 실패했습니다.')
    }

    return result.url as string
  }

  async function handleFileChange(key: Cheongan, file: File | null) {
    if (!file) return

    setFlashMessage({})
    setUploadingKey(key)

    try {
      const url = await uploadImage(file)
      updateAvatar(key, url)
    } catch (uploadError) {
      setFlashMessage({
        error: uploadError instanceof Error ? uploadError.message : '업로드에 실패했습니다.',
      })
    } finally {
      setUploadingKey(null)
      const input = inputRefs.current[key]
      if (input) input.value = ''
    }
  }

  function handleSave() {
    setFlashMessage({})

    startTransition(async () => {
      const result = await setIlganAvatarSettings(avatarMap)
      if (result?.error) {
        setFlashMessage({ error: result.error })
        return
      }

      setFlashMessage({ success: '일간 기본 아이콘 설정을 저장했습니다.' })
    })
  }

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold">일간 기본 아이콘 설정</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          각 일간별 기본 이미지를 등록할 수 있습니다. 사용자가 직접 프로필 이미지를 올리지 않은 경우에만
          이 기본 이미지가 노출됩니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ILGAN_OPTIONS.map((option) => {
          const imageUrl = avatarMap[option.value] ?? null
          const uploading = uploadingKey === option.value

          return (
            <div key={option.value} className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <IlganBadge
                  ilgan={option.value}
                  imageUrl={imageUrl}
                  className="h-12 w-12 text-2xl"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {getIlganDisplayLabel(option.value)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {imageUrl ? '기본 이미지 적용 중' : '기본 한자 배지 사용 중'}
                  </p>
                </div>
              </div>

              {imageUrl && <p className="mt-3 truncate text-xs text-gray-400">{imageUrl}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRefs.current[option.value]?.click()}
                  className="rounded-md bg-black px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  {uploading ? '업로드 중..' : imageUrl ? '이미지 바꾸기' : '이미지 업로드'}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => updateAvatar(option.value, null)}
                    className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    기본 배지로 되돌리기
                  </button>
                )}
              </div>

              <input
                ref={(node) => {
                  inputRefs.current[option.value] = node
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileChange(option.value, event.target.files?.[0] ?? null)}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? '저장 중..' : '일간 기본 아이콘 저장'}
        </button>
      </div>

      {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </section>
  )
}
