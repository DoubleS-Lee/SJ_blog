export const SITE_NAME = '사주로아의 사주이야기'

const FALLBACK_SITE_URL = 'https://example.com'

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    FALLBACK_SITE_URL

  const normalized = raw.startsWith('http') ? raw : `https://${raw}`
  return normalized.replace(/\/+$/, '')
}

export function getSiteUrlObject() {
  return new URL(getSiteUrl())
}

export function buildAbsoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString()
}

export function buildSeoDescription(value: string | null | undefined, fallback: string) {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  return normalized && normalized.length > 0 ? normalized : fallback
}
