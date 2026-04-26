export type SupportedImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

const IMAGE_TYPE_TO_EXTENSION: Record<SupportedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false
  return signature.every((value, index) => bytes[index] === value)
}

function isGif(bytes: Uint8Array) {
  const gif87a = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]
  const gif89a = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
  return startsWithBytes(bytes, gif87a) || startsWithBytes(bytes, gif89a)
}

function isWebp(bytes: Uint8Array) {
  if (bytes.length < 12) return false
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
}

export function detectImageMimeType(bytes: Uint8Array): SupportedImageType | null {
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (isGif(bytes)) return 'image/gif'
  if (isWebp(bytes)) return 'image/webp'
  return null
}

export function getImageExtension(mimeType: SupportedImageType) {
  return IMAGE_TYPE_TO_EXTENSION[mimeType]
}
