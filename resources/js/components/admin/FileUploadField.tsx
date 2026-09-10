import { useState, useRef, useEffect } from 'react'
import {
  UploadCloud,
  FileText,
  Link2,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File,
} from 'lucide-react'
import { mediaUrl } from '../../lib/utils'
import { api } from '../../lib/api'

type Props = {
  label: string
  value?: string | null
  fileName?: string | null
  onChange: (path: string | null) => void
  onFileNameChange?: (fileName: string) => void
  accept?: string
}

function getFileIcon(filenameOrUrl: string) {
  const ext = filenameOrUrl.split('?')[0].split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) {
    return <FileText className="h-7 w-7 text-rose-500" />
  }
  if (['doc', 'docx', 'odt'].includes(ext)) {
    return <FileText className="h-7 w-7 text-blue-600" />
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
  }
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return <FileText className="h-7 w-7 text-amber-600" />
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="h-7 w-7 text-purple-600" />
  }
  if (['txt', 'json', 'xml'].includes(ext)) {
    return <FileCode className="h-7 w-7 text-slate-600" />
  }
  return <File className="h-7 w-7 text-teal-600" />
}

export function FileUploadField({
  label,
  value,
  fileName,
  onChange,
  onFileNameChange,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,.odt,.ods,.odp',
}: Props) {
  const isUrlMode = value ? value.startsWith('http://') || value.startsWith('https://') : false
  const [mode, setMode] = useState<'upload' | 'link'>(isUrlMode ? 'link' : 'upload')
  const [urlInput, setUrlInput] = useState(isUrlMode ? value || '' : '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      setUrlInput(value)
    }
  }, [value])

  const handleUpload = async (file: File) => {
    setError('')
    if (file.size > 50 * 1024 * 1024) {
      setError('Ukuran berkas terlalu besar. Maksimal 50 MB.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', file.name)

      const res = await api.post('/admin/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const fileUrl = res.data.url || res.data.path
      onChange(fileUrl)
      if (onFileNameChange) {
        onFileNameChange(file.name)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Gagal mengunggah berkas. Pastikan tipe berkas diizinkan.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleUrlSubmit = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    setUrlInput(trimmed)
    setError('')

    if (!trimmed) {
      onChange(null)
      return
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Tautan harus diawali dengan http:// atau https://')
      return
    }

    onChange(trimmed)

    // Suggest filename if empty
    if (onFileNameChange && !fileName) {
      try {
        const parsed = new URL(trimmed)
        const parts = parsed.pathname.split('/').filter(Boolean)
        const last = parts[parts.length - 1]
        if (last && last.includes('.')) {
          onFileNameChange(decodeURIComponent(last))
        } else if (parsed.hostname.includes('drive.google.com')) {
          onFileNameChange('Google Drive Document')
        }
      } catch {
        // ignore
      }
    }
  }

  const displayUrl = mediaUrl(value)
  const displayName = fileName || (value ? value.split('/').pop() : '') || 'Berkas Terunggah'

  return (
    <div className="rounded-[16px] border border-line bg-page p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-sm font-bold text-ink">{label}</label>
          <p className="text-xs text-subtle">
            Unggah file lokal (PDF/DOCX/ZIP) atau gunakan tautan eksternal (Google Drive/Dropbox).
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center rounded-xl border border-line bg-white p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              mode === 'upload'
                ? 'bg-teal-500 text-white shadow-xs'
                : 'text-subtle hover:text-ink'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Berkas
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              mode === 'link'
                ? 'bg-teal-500 text-white shadow-xs'
                : 'text-subtle hover:text-ink'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            Link Eksternal
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded state card */}
      {value ? (
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs ring-1 ring-black/5">
              {getFileIcon(displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink" title={displayName}>
                {displayName}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-800">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isUrlMode ? 'Tautan Eksternal Terhubung' : 'Berkas Siap Diunduh'}
                </span>
                {displayUrl && (
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-teal-700 underline hover:text-teal-900"
                  >
                    Pratinjau / Tes Unduh <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {mode === 'upload' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-muted"
              >
                Ganti Berkas
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setUrlInput('')
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          </div>
        </div>
      ) : null}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mode 1: Upload Drag & Drop Area */}
      {mode === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            isDragOver
              ? 'border-teal-500 bg-teal-50/50'
              : 'border-line bg-white/70 hover:border-teal-400 hover:bg-white'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-3 text-teal-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-semibold">Sedang mengunggah berkas ke storage…</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-ink">
                Klik untuk memilih berkas atau seret ke sini
              </p>
              <p className="mt-1 text-xs text-subtle">
                Mendukung PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), ZIP, RAR (Maks. 50 MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Mode 2: External Link Input */}
      {mode === 'link' && (
        <div className="space-y-3 rounded-xl border border-line bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Tautan Dokumen / File URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlSubmit(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view atau https://..."
                className="w-full rounded-[10px] border border-line bg-page px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
              />
              {urlInput && (
                <a
                  href={urlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-line bg-page px-3 py-2 text-xs font-semibold text-ink hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Tes Link
                </a>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-sky-50 p-2.5 text-xs text-sky-800 leading-relaxed">
            💡 <strong>Tips Google Drive:</strong> Pastikan setelan berbagi berkas Google Drive Anda telah diatur ke{' '}
            <em>&ldquo;Siapa saja yang memiliki tautan dapat melihat&rdquo;</em> (Anyone with the link).
          </div>
        </div>
      )}
    </div>
  )
}
