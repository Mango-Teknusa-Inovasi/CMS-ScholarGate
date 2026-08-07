import { useState } from 'react'
import { ImagePlus, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { mediaUrl } from '../../lib/utils'
import type { MediaGuide } from '../../lib/mediaGuide'
import { sizeHintText } from '../../lib/mediaGuide'
import { uploadOptimized } from '../../lib/upload'

type Props = {
  label: string
  value?: string | null
  onChange: (path: string | null) => void
  guide?: MediaGuide
  /** Preview aspect class, e.g. aspect-video, aspect-[4/5] */
  previewClassName?: string
  /** Suggested alt for SEO (sent with upload when provided) */
  altHint?: string
}

export function ImageUploadField({
  label,
  value,
  onChange,
  guide,
  previewClassName = 'aspect-video',
  altHint,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [optimizedNote, setOptimizedNote] = useState('')
  const [alt, setAlt] = useState(altHint || '')

  const preview = mediaUrl(value)

  const upload = async (file: File) => {
    setError('')
    setOptimizedNote('')
    const maxMb = guide?.maxMb ?? 2
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File terlalu besar. Maksimal ~${maxMb} MB.`)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP).')
      return
    }

    setUploading(true)
    try {
      // Path A: kompres lokal di server → baru upload R2 (wajib untuk banner/cover)
      const data = await uploadOptimized(file, {
        alt: alt.trim() || undefined,
        maxWidth: 1920,
        endpoint: '/admin/media',
      })
      onChange(data.url || data.path)
      if (data.optimized) {
        setOptimizedNote('Kompres lokal → R2: WebP · resize · strip EXIF')
      } else {
        setOptimizedNote('Tersimpan ke object storage')
      }
    } catch {
      setError('Gagal mengunggah. Coba lagi atau periksa koneksi API.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-[14px] border border-dashed border-line bg-page p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          {guide && (
            <p className="mt-0.5 text-xs leading-relaxed text-subtle">{sizeHintText(guide)}</p>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOptimizedNote('')
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        )}
      </div>

      {preview ? (
        <div
          className={`mb-3 overflow-hidden rounded-xl border border-line bg-white ${previewClassName}`}
        >
          <img
            src={preview}
            alt={alt || label}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`mb-3 flex items-center justify-center rounded-xl border border-line bg-white/70 text-xs text-subtle ${previewClassName}`}
        >
          Belum ada gambar
        </div>
      )}

      <div className="mb-3">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-subtle">
          Alt text (SEO gambar)
        </label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Deskripsi singkat gambar, mis. Kepala sekolah di aula"
          className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-line bg-white px-3.5 py-2 text-sm font-semibold text-body shadow-sm hover:bg-muted">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
        ) : (
          <ImagePlus className="h-4 w-4 text-brand" />
        )}
        {uploading ? 'Mengoptimasi & unggah…' : value ? 'Ganti gambar' : 'Upload gambar'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void upload(f)
            e.target.value = ''
          }}
        />
      </label>
      <p className="mt-1.5 text-[11px] text-subtle">
        Alur: proses & kompres di server (lokal) → upload R2. Bukan presign (agar kualitas terkontrol).
      </p>

      {optimizedNote && (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {optimizedNote}
        </p>
      )}

      {guide?.tips && (
        <p className="mt-2 text-[11px] leading-relaxed text-subtle">
          <span className="font-semibold text-body">Saran:</span> {guide.tips}
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
