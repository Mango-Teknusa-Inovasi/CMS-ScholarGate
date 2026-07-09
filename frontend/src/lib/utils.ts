import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function mediaUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `/storage/${path.replace(/^\/?storage\//, '')}`
}

/** Soft peach solid class — fallback jika tanpa foto */
export function softMediaClass(seed = 0) {
  const tones = [
    'media-placeholder',
    'media-placeholder media-placeholder-alt',
    'media-placeholder media-placeholder-deep',
    'media-placeholder',
    'media-placeholder media-placeholder-alt',
  ]
  return tones[seed % tones.length]
}

/**
 * Foto placeholder profesional (sekolah/kampus) — seed stabil per item.
 * Diganti otomatis saat admin upload cover_path.
 */
export function demoImage(
  seed: string | number,
  w = 1200,
  h = 800,
  grayscale = false,
) {
  const s = encodeURIComponent(String(seed).replace(/\s+/g, '-').toLowerCase())
  const g = grayscale ? '?grayscale' : ''
  return `https://picsum.photos/seed/scholargate-${s}/${w}/${h}${g}`
}

export function coverSrc(
  path: string | null | undefined,
  seed: string | number,
  w = 1200,
  h = 800,
) {
  return mediaUrl(path) || demoImage(seed, w, h)
}

/** @deprecated */
export function placeholderGradient(seed = 0) {
  return softMediaClass(seed)
}
