/**
 * AdSense supports a nonce-based strict CSP rather than a changing domain list.
 * HTTPS resource destinations remain available to trusted ad scripts. Inline
 * application scripts require a fresh nonce; object embedding is still denied.
 * https://support.google.com/adsense/answer/16283098
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean) {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' https:`,
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    `connect-src 'self' https:${isDev ? ' ws: wss:' : ''}`,
    "frame-src 'self' https:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    ...(!isDev ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}
