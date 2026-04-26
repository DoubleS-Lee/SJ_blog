'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePostLike } from '@/actions/posts'

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean
      init: (key: string) => void
      Share: {
        sendDefault: (payload: Record<string, unknown>) => void
      }
    }
  }
}

interface PostEngagementBarProps {
  postId: string
  title: string
  summary: string | null
  thumbnailUrl: string | null
  initialLikeCount: number
  initialLikedByMe: boolean
  isLoggedIn: boolean
}

const KAKAO_SDK_ID = 'kakao-share-sdk'
const HOT_PINK = '#ff1493'

let kakaoSdkPromise: Promise<void> | null = null

function toAbsoluteImageUrl(imageUrl: string | null, origin: string) {
  if (!imageUrl) return `${origin}/moon.png`
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  if (imageUrl.startsWith('/')) return `${origin}${imageUrl}`
  return `${origin}/${imageUrl}`
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? HOT_PINK : 'none'}
      stroke={HOT_PINK}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6c-1.8-1.7-4.6-1.7-6.3.1L12 7.2 9.5 4.7C7.8 2.9 5 2.9 3.2 4.6 1.3 6.4 1.3 9.3 3.1 11.1L12 20l8.9-8.9c1.8-1.8 1.8-4.7-.1-6.5Z" />
    </svg>
  )
}

function loadKakaoSdk(key: string) {
  if (typeof window === 'undefined') return Promise.reject(new Error('browser only'))
  if (window.Kakao) {
    if (!window.Kakao.isInitialized()) window.Kakao.init(key)
    return Promise.resolve()
  }

  if (kakaoSdkPromise) return kakaoSdkPromise

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (!window.Kakao) {
          reject(new Error('Kakao SDK was not loaded.'))
          return
        }
        if (!window.Kakao.isInitialized()) window.Kakao.init(key)
        resolve()
      })
      existingScript.addEventListener('error', () => reject(new Error('Kakao SDK load failed.')))
      return
    }

    const script = document.createElement('script')
    script.id = KAKAO_SDK_ID
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.async = true
    script.onload = () => {
      if (!window.Kakao) {
        reject(new Error('Kakao SDK was not loaded.'))
        return
      }
      if (!window.Kakao.isInitialized()) window.Kakao.init(key)
      resolve()
    }
    script.onerror = () => reject(new Error('Kakao SDK load failed.'))
    document.head.appendChild(script)
  })

  return kakaoSdkPromise
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Some browsers block clipboard permissions even in secure contexts.
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

export default function PostEngagementBar({
  postId,
  title,
  summary,
  thumbnailUrl,
  initialLikeCount,
  initialLikedByMe,
  isLoggedIn,
}: PostEngagementBarProps) {
  const router = useRouter()
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [isLikePending, startLikeTransition] = useTransition()
  const [isSharePending, startShareTransition] = useTransition()
  const shareWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!shareWrapRef.current) return
      if (!shareWrapRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }

    if (shareOpen) {
      window.addEventListener('mousedown', handleOutsideClick)
      return () => window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [shareOpen])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY
    if (!key) return
    void loadKakaoSdk(key).catch(() => {
      kakaoSdkPromise = null
    })
  }, [])

  function handleLikeClick() {
    setFeedback(null)

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    startLikeTransition(async () => {
      const result = await togglePostLike({ postId })
      if (result?.error) {
        setFeedback(result.error)
        return
      }
      if (typeof result?.liked === 'boolean') setLikedByMe(result.liked)
      if (typeof result?.likeCount === 'number') setLikeCount(result.likeCount)
      router.refresh()
    })
  }

  function copyLink() {
    setFeedback(null)
    startShareTransition(async () => {
      const copied = await copyTextToClipboard(window.location.href)
      setFeedback(copied ? '링크가 복사되었습니다.' : '링크 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.')
      setShareOpen(false)
    })
  }

  function shareToKakao() {
    setFeedback(null)
    setShareOpen(false)
    startShareTransition(async () => {
      const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY
      if (!key) {
        setFeedback('카카오 공유 키가 설정되지 않았습니다.')
        return
      }

      try {
        await loadKakaoSdk(key)
        const url = window.location.href
        const origin = window.location.origin
        const image = toAbsoluteImageUrl(thumbnailUrl, origin)

        window.Kakao?.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description: summary ?? '',
            imageUrl: image,
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
          buttons: [
            {
              title: '글 보러 가기',
              link: {
                mobileWebUrl: url,
                webUrl: url,
              },
            },
          ],
        })
      } catch (error) {
        console.error('[PostEngagementBar][shareToKakao]', error)
        setFeedback('카카오톡 공유에 실패했습니다. 카카오 JavaScript 키와 등록 도메인을 확인해 주세요.')
      }
    })
  }

  return (
    <section className="mt-10 border-t border-gray-100 pt-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={isLikePending}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            likedByMe
              ? 'border-pink-200 bg-pink-50 text-pink-600'
              : 'border-pink-200 bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600'
          }`}
        >
          <HeartIcon filled={likedByMe} />
          <span>{isLikePending ? '처리 중...' : `좋아요 ${likeCount.toLocaleString('ko-KR')}`}</span>
        </button>

        <div className="relative" ref={shareWrapRef}>
          <button
            type="button"
            onClick={() => setShareOpen((v) => !v)}
            disabled={isSharePending}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-black disabled:opacity-60"
          >
            공유
          </button>

          {shareOpen && (
            <div className="absolute left-0 z-10 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={copyLink}
                disabled={isSharePending}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                링크 복사
              </button>
              <button
                type="button"
                onClick={shareToKakao}
                disabled={isSharePending}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                카카오톡 공유
              </button>
            </div>
          )}
        </div>
      </div>

      {feedback && <p className="mt-3 text-xs text-gray-500">{feedback}</p>}
    </section>
  )
}
