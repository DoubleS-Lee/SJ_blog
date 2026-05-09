'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { importNaverPost } from '@/actions/importNaverPost'
import { buttonVariants } from '@/components/ui/button'

export default function NaverPostImportForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await importNaverPost({ url })
      if (result.error) {
        setError(result.error)
        return
      }

      if (result.redirectTo) {
        router.push(result.redirectTo)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900">네이버 글 가져오기</h1>
        <p className="text-sm text-gray-500">
          공개 네이버 블로그 글 URL 1개를 입력하면 제목, 본문, 이미지를 읽어 초안으로 만듭니다.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <label htmlFor="naver-post-url" className="block text-sm font-medium text-gray-700">
          네이버 블로그 글 URL
        </label>
        <input
          id="naver-post-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://blog.naver.com/... 또는 https://m.blog.naver.com/..."
          className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-black"
          required
        />
        <p className="text-xs text-gray-400">현재는 공개 글만 지원하며 저장은 항상 초안으로 진행됩니다.</p>
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" disabled={isPending} className={buttonVariants({ size: 'sm' })}>
          {isPending ? '가져오는 중..' : '가져와서 초안 만들기'}
        </button>
      </div>
    </form>
  )
}
