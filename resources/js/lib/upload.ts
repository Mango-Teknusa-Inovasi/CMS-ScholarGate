import { api } from './api'

/**
 * Raster yang WAJIB dikompres app (lokal → R2).
 * Selain ini → presigned PUT langsung ke R2.
 */
export function needsAppCompression(file: File): boolean {
  const mime = (file.type || '').toLowerCase()
  if (!mime || mime.includes('svg')) return false
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/x-ms-bmp',
    'image/heic',
    'image/heif',
    'image/avif',
  ].includes(mime)
}

export type UploadResult = {
  path: string
  url: string
  optimized: boolean
  mode: string
  mime?: string
  width?: number | null
  height?: number | null
  media?: unknown
}

/**
 * Path A — kompres di server (temp lokal → R2).
 */
export async function uploadOptimized(
  file: File,
  opts?: { alt?: string; maxWidth?: number; endpoint?: string },
): Promise<UploadResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('max_width', String(opts?.maxWidth ?? 1920))
  fd.append('force', 'optimize')
  if (opts?.alt) fd.append('alt', opts.alt)

  const endpoint = opts?.endpoint ?? '/admin/media-library'
  const { data } = await api.post(endpoint, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return {
    path: data.path,
    url: data.url,
    optimized: !!data.optimized,
    mode: data.mode || 'local_then_r2',
    mime: data.mime,
    width: data.width,
    height: data.height,
    media: data,
  }
}

/**
 * Path B — presign token, client PUT ke R2 (cepat, tanpa lewat PHP body).
 */
export async function uploadPresigned(
  file: File,
  opts?: { alt?: string },
): Promise<UploadResult> {
  const { data: presign } = await api.post('/admin/media-library/presign', {
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    size: file.size,
    alt: opts?.alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
  })

  // Fallback server (dev tanpa R2)
  if (presign.mode === 'server_fallback') {
    return uploadOptimized(file, { alt: opts?.alt })
  }

  const headers: Record<string, string> = {
    ...(presign.headers || {}),
  }
  // Jangan kirim Authorization ke R2
  delete headers.Authorization
  delete headers.authorization

  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = file.type || 'application/octet-stream'
  }

  const putRes = await fetch(presign.upload_url, {
    method: presign.method || 'PUT',
    headers,
    body: file,
  })

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '')
    throw new Error(`Presign upload gagal (${putRes.status}): ${text.slice(0, 200)}`)
  }

  const { data: confirmed } = await api.post('/admin/media-library/confirm', {
    path: presign.path,
    filename: presign.filename,
    original_filename: file.name,
    mime: file.type || presign.content_type,
    size: file.size,
    alt: opts?.alt || presign.alt,
    disk: presign.disk,
  })

  return {
    path: confirmed.path,
    url: confirmed.url || presign.public_url,
    optimized: false,
    mode: 'presign',
    mime: confirmed.mime,
    media: confirmed,
  }
}

/**
 * Auto: gambar raster → optimize; lain → presign.
 */
export async function uploadSmart(
  file: File,
  opts?: { alt?: string; maxWidth?: number },
): Promise<UploadResult> {
  if (needsAppCompression(file)) {
    return uploadOptimized(file, opts)
  }
  return uploadPresigned(file, { alt: opts?.alt })
}

/** @deprecated session auth — no token needed */
export function _adminToken() {
  return null
}
