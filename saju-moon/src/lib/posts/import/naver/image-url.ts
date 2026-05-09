type Parse5Node = {
  attrs?: Array<{ name: string; value: string }>
}

function getAttr(node: Parse5Node, name: string) {
  return node.attrs?.find((attr) => attr.name === name)?.value ?? null
}

function unwrapNaverProxyUrl(value: string) {
  try {
    const url = new URL(value)
    const nested = url.searchParams.get('src')
    if (!nested) return value
    return decodeURIComponent(nested)
  } catch {
    return value
  }
}

function normalizeNaverImageUrl(value: string, baseUrl: string) {
  try {
    const resolved = new URL(value, baseUrl).toString()
    return unwrapNaverProxyUrl(resolved)
  } catch {
    return null
  }
}

export function resolveBestNaverImageUrl(node: Parse5Node, baseUrl: string) {
  const candidates = [
    getAttr(node, 'data-lazy-src'),
    getAttr(node, 'data-src'),
    getAttr(node, 'data-image-src'),
    getAttr(node, 'data-original'),
    getAttr(node, 'src'),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0 && !value.startsWith('data:'))

  for (const candidate of candidates) {
    const normalized = normalizeNaverImageUrl(candidate, baseUrl)
    if (normalized) return normalized
  }

  return null
}
