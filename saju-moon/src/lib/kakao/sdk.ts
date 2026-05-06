'use client'

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean
      init: (key: string) => void
      Auth: {
        authorize: (options: {
          redirectUri: string
          state?: string
          scope?: string
          prompt?: string
        }) => void
        setAccessToken?: (token: string) => void
      }
      Share: {
        sendDefault: (payload: Record<string, unknown>) => void
      }
    }
  }
}

const KAKAO_SDK_ID = 'kakao-sdk'

let kakaoSdkPromise: Promise<void> | null = null

export function loadKakaoSdk(key: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('browser only'))
  }

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

export function resetKakaoSdkPromise() {
  kakaoSdkPromise = null
}
