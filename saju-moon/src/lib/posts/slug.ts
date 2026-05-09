export function slugifyTitle(title: string) {
  const normalized = title
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized.slice(0, 80).replace(/-$/g, '') || 'post'
}
