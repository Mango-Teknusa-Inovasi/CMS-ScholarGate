import React from 'react'
import {
  Calendar,
  Check,
  CheckCheck,
  Copy,
  FileText,
  HardDrive,
  Loader2,
  Maximize2,
} from 'lucide-react'
import { mediaUrl } from '../../lib/utils'

export type MediaItem = {
  id: string | number
  path: string
  filename: string
  original_filename?: string
  url: string
  mime?: string
  size: number
  alt?: string
  width?: number
  height?: number
  optimized?: boolean
  created_at: string
}

function formatBytes(n: number) {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function MediaItemDetailSidebar({
  selectedItem,
  altDraft,
  setAltDraft,
  isUpdatingAlt,
  handleSaveAlt,
  copied,
  copyUrl,
  handleConfirmSelect,
}: {
  selectedItem: MediaItem
  altDraft: string
  setAltDraft: (v: string) => void
  isUpdatingAlt: boolean
  handleSaveAlt: () => void
  copied: boolean
  copyUrl: (url: string) => void
  handleConfirmSelect: () => void
}) {
  const isImg =
    selectedItem.mime?.startsWith('image/') ||
    /\.(webp|jpg|jpeg|png|gif)$/i.test(selectedItem.filename)
  const fullUrl = mediaUrl(selectedItem.url || selectedItem.path)

  return (
    <div className="flex flex-col h-full bg-page/30 p-4 sm:p-5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-subtle mb-3">
        Rincian Media
      </h4>

      {/* Preview Box */}
      <div className="relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-line bg-white p-2">
        {isImg && fullUrl ? (
          <img
            src={fullUrl}
            alt={selectedItem.alt || selectedItem.filename}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <FileText className="h-12 w-12 text-sky-500" />
            <span className="mt-2 text-xs font-semibold text-ink line-clamp-1">
              {selectedItem.filename}
            </span>
          </div>
        )}
      </div>

      {/* Info List */}
      <div className="space-y-2.5 text-xs">
        <div>
          <p className="font-bold text-ink break-all text-sm">{selectedItem.filename}</p>
          {selectedItem.original_filename &&
            selectedItem.original_filename !== selectedItem.filename && (
              <p className="text-[11px] text-subtle truncate">
                Asli: {selectedItem.original_filename}
              </p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-y border-line py-2.5 text-[11px] text-body">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-subtle shrink-0" />
            <span>{formatBytes(selectedItem.size)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-subtle shrink-0" />
            <span>{formatDate(selectedItem.created_at)}</span>
          </div>
          {selectedItem.width && selectedItem.height && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Maximize2 className="h-3.5 w-3.5 text-subtle shrink-0" />
              <span>
                {selectedItem.width} × {selectedItem.height} piksel
              </span>
            </div>
          )}
        </div>

        {/* Copy URL */}
        <div>
          <label className="block text-[11px] font-semibold text-subtle mb-1">URL Media</label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={fullUrl || ''}
              className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 font-mono text-[10px] text-body outline-none"
            />
            <button
              type="button"
              onClick={() => copyUrl(fullUrl || '')}
              className="rounded-lg border border-line bg-white p-1.5 text-body hover:bg-page transition shrink-0"
              title="Salin URL"
            >
              {copied ? (
                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Alt Text Form */}
        <div>
          <label className="block text-[11px] font-semibold text-subtle mb-1">
            Alt Text (SEO & Aksesibilitas)
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              placeholder="Deskripsikan gambar ini..."
              className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-sky-500"
            />
            <button
              type="button"
              disabled={isUpdatingAlt || altDraft === (selectedItem.alt || '')}
              onClick={handleSaveAlt}
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40 shrink-0"
            >
              {isUpdatingAlt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      {/* Select Action Button */}
      <div className="mt-auto pt-4 border-t border-line">
        <button
          type="button"
          onClick={handleConfirmSelect}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600"
        >
          <Check className="h-4 w-4 stroke-[3]" />
          <span>Gunakan Media Ini</span>
        </button>
      </div>
    </div>
  )
}
