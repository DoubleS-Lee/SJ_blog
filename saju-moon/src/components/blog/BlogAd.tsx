'use client'

import Script from 'next/script'
import { useCallback, useRef, useState } from 'react'
import { useScriptNonce } from '@/components/common/ScriptNonceProvider'

const AD_CLIENT = 'ca-pub-5713452367621432'

type AdWindow = Window & { adsbygoogle?: Record<string, unknown>[] }

/** Manual display unit. Auto ads must be OFF in the AdSense dashboard. */
export default function BlogAd({ slot }: { slot: string }) {
  const nonce = useScriptNonce()
  const element = useRef<HTMLModElement>(null)
  const requested = useRef(false)
  const [failed, setFailed] = useState(false)

  const requestAd = useCallback(() => {
    const node = element.current
    if (!node || !node.isConnected || requested.current || node.dataset.adsbygoogleStatus) return
    // Do not request an ad in a hidden/zero-width container.
    if (node.getBoundingClientRect().width === 0) return
    requested.current = true
    try {
      const adWindow = window as AdWindow
      ;(adWindow.adsbygoogle = adWindow.adsbygoogle || []).push({})
    } catch {
      setFailed(true)
    }
  }, [])

  if (!/^\d+$/.test(slot) || failed) return null

  return (
    <section aria-label="광고" className="my-10 border-t border-gray-100 pt-5 has-[ins[data-ad-status=unfilled]]:hidden">
      <p className="mb-2 text-center text-xs text-gray-400">광고</p>
      <ins
        ref={element}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-adtest={process.env.NODE_ENV === 'production' ? undefined : 'on'}
      />
      <Script
        id="blog-adsense"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
        nonce={nonce}
        onReady={requestAd}
        onError={() => setFailed(true)}
      />
    </section>
  )
}
