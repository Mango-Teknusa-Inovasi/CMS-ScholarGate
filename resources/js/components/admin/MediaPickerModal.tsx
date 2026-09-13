import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Search,
  UploadCloud,
  Check,
  Image as ImageIcon,
  FileText,
  Copy,
  CheckCheck,
  Loader2,
  Calendar,
  Maximize2,
  HardDrive,
  RefreshCw,
} from 'lucide-react'
import { api } from '../../lib/api'
import { mediaUrl, cn } from '../../lib/utils'
import { uploadSmart } from '../../lib/upload'
import { useToast } from '../ui/Toast'

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

type PaginatedResponse = {
  data: MediaItem[]
  current_page: number
  last_page: number
  total: number
  per_page: number
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

type Props = {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaItem) => void
  title?: string
  filterType?: 'all' | 'image' | 'document'
  selectedPathOrUrl?: string | null
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Pilih Media',
  filterType: defaultFilter = 'image',
  selectedPathOrUrl,
}: Props) {
  const qc = useQueryClient()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document'>(defaultFilter)
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [altDraft, setAltDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Sync initial filter
  useEffect(() => {
    setFilterType(defaultFilter)
  }, [defaultFilter])

  // Query media list
  const { data, isLoading, refetch, isFetching } = useQuery<PaginatedResponse>({
    queryKey: ['admin-media-picker', debouncedSearch, filterType, page],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse>('/admin/media-library', {
        params: {
          q: debouncedSearch || undefined,
          type: filterType === 'all' ? undefined : filterType,
          page,
          per_page: 30,
        },
      })
      return res.data
    },
    enabled: isOpen,
    staleTime: 10_000,
  })

  const items = data?.data || []
  const totalItems = data?.total || 0
  const totalPages = data?.last_page || 1

  // Pre-select item matching selectedPathOrUrl if available
  useEffect(() => {
    if (selectedPathOrUrl && items.length > 0 && !selectedItem) {
      const match = items.find(
        (it) => it.url === selectedPathOrUrl || it.path === selectedPathOrUrl
      )
      if (match) {
        setSelectedItem(match)
        setAltDraft(match.alt || '')
      }
    }
  }, [items, selectedPathOrUrl, selectedItem])

  // Mutation to update alt text
  const updateAlt = useMutation({
    mutationFn: async ({ id, alt }: { id: string | number; alt: string }) =>
      api.put(`/admin/media-library/${id}`, { alt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-media-picker'] })
      qc.invalidateQueries({ queryKey: ['admin-media'] })
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, alt: altDraft })
      }
      toast.success('Alt text berhasil diperbarui.')
    },
    onError: () => {
      toast.error('Gagal memperbarui alt text.')
    },
  })

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      let lastUploaded: MediaItem | null = null
      for (const file of Array.from(files)) {
        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        const res = await uploadSmart(file, { alt, maxWidth: 1920 })
        if (res.media) {
          lastUploaded = res.media as MediaItem
        }
      }
      await qc.invalidateQueries({ queryKey: ['admin-media-picker'] })
      await qc.invalidateQueries({ queryKey: ['admin-media'] })
      toast.success(`${files.length} berkas berhasil diunggah.`)
      setActiveTab('library')
      if (lastUploaded) {
        setSelectedItem(lastUploaded)
        setAltDraft(lastUploaded.alt || '')
      }
    } catch {
      toast.error('Gagal mengunggah berkas. Periksa format dan ukuran file.')
    } finally {
      setUploading(false)
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('URL media berhasil disalin.')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Gagal menyalin URL.')
    }
  }

  const handleConfirmSelect = () => {
    if (!selectedItem) return
    onSelect(selectedItem)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-2 sm:p-4 md:p-6 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex h-[92vh] max-h-[820px] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 id="media-picker-title" className="text-lg font-bold text-ink">
                {title}
              </h2>
              <p className="text-xs text-subtle">
                Pilih media dari pustaka atau unggah file baru untuk digunakan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex rounded-xl bg-page p-1 border border-line">
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                  activeTab === 'library'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-subtle hover:text-ink'
                )}
              >
                Pustaka Media {totalItems > 0 ? `(${totalItems})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                  activeTab === 'upload'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-subtle hover:text-ink'
                )}
              >
                Unggah Berkas
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line p-2 text-subtle hover:bg-page hover:text-ink transition"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab: Unggah Berkas */}
        {activeTab === 'upload' && (
          <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                if (e.dataTransfer.files) void handleUpload(e.dataTransfer.files)
              }}
              className={cn(
                'flex w-full max-w-xl flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-10 text-center transition',
                isDragOver
                  ? 'border-sky-500 bg-sky-50/50'
                  : 'border-line bg-page hover:border-sky-400/60'
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-line text-sky-600 shadow-sm">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>

              <h3 className="mt-4 text-base font-bold text-ink">
                {uploading ? 'Mengunggah & Mengoptimasi Media…' : 'Tarik & Lepas File ke Sini'}
              </h3>
              <p className="mt-1 text-xs text-subtle max-w-sm">
                Mendukung gambar JPG, PNG, WebP, GIF, serta dokumen PDF & Office. Gambar akan dioptimasi otomatis.
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                <span>{uploading ? 'Sedang Memproses…' : 'Pilih File dari Komputer'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) void handleUpload(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>

              <div className="mt-4 flex items-center gap-4 text-[11px] text-subtle">
                <span>Maksimal ~25 MB per file</span>
                <span>•</span>
                <span>Otomatis dikonversi ke WebP</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pustaka Media */}
        {activeTab === 'library' && (
          <div className="flex flex-1 min-h-0 flex-col md:flex-row">
            {/* Main Grid Area */}
            <div className="flex flex-1 flex-col min-w-0 border-b md:border-b-0 md:border-r border-line">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-page/40 p-3 sm:px-5">
                <div className="relative min-w-[200px] flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama berkas atau alt text…"
                    className="w-full rounded-xl border border-line bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-sky-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as 'all' | 'image' | 'document')
                      setPage(1)
                    }}
                    className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-body outline-none focus:border-sky-500"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="image">Gambar Saja</option>
                    <option value="document">Dokumen Saja</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="rounded-xl border border-line bg-white p-2 text-subtle hover:bg-page hover:text-ink transition disabled:opacity-50"
                    title="Segarkan data"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                  </button>
                </div>
              </div>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square animate-pulse rounded-xl bg-page border border-line"
                      />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-page border border-line text-subtle">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-ink">Tidak ada media ditemukan</p>
                    <p className="mt-1 text-xs text-subtle max-w-xs">
                      {search
                        ? `Tidak ada hasil untuk pencarian "${search}".`
                        : 'Belum ada file dalam pustaka media.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600 transition"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Unggah File Baru
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((item) => {
                      const isSelected = selectedItem?.id === item.id
                      const isImg = item.mime?.startsWith('image/') || /\.(webp|jpg|jpeg|png|gif)$/i.test(item.filename)
                      const preview = mediaUrl(item.url || item.path)

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item)
                            setAltDraft(item.alt || '')
                          }}
                          onDoubleClick={handleConfirmSelect}
                          className={cn(
                            'group relative aspect-square cursor-pointer overflow-hidden rounded-xl border bg-page transition select-none',
                            isSelected
                              ? 'border-sky-500 ring-2 ring-sky-500 bg-sky-50/20'
                              : 'border-line hover:border-sky-400 hover:shadow-xs'
                          )}
                          title={`${item.filename} (Dobel klik untuk memilih)`}
                        >
                          {isImg && preview ? (
                            <img
                              src={preview}
                              alt={item.alt || item.filename}
                              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                              <FileText className="h-10 w-10 text-sky-600/70" />
                              <span className="mt-2 line-clamp-2 text-[10px] font-medium text-subtle">
                                {item.filename}
                              </span>
                            </div>
                          )}

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm ring-2 ring-white">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Dimension / Extension Badge */}
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                            <span className="truncate max-w-[90px]">{item.filename}</span>
                            <span className="shrink-0 font-mono text-[9px] uppercase">
                              {item.filename.split('.').pop()}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line bg-white px-5 py-2.5 text-xs text-subtle">
                  <span>
                    Halaman {page} dari {totalPages} ({totalItems} media)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-line px-2.5 py-1 font-medium hover:bg-page disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-lg border border-line px-2.5 py-1 font-medium hover:bg-page disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Details Panel */}
            <div className="w-full md:w-80 shrink-0 bg-peach-soft/30 p-5 overflow-y-auto border-t md:border-t-0 border-line">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subtle">
                Detail Berkas
              </h3>

              {selectedItem ? (
                <div className="mt-3 space-y-4">
                  {/* Thumbnail Preview */}
                  <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
                    {selectedItem.mime?.startsWith('image/') ||
                    /\.(webp|jpg|jpeg|png|gif)$/i.test(selectedItem.filename) ? (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={mediaUrl(selectedItem.url || selectedItem.path) || ''}
                          alt={selectedItem.alt || selectedItem.filename}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-muted">
                        <FileText className="h-12 w-12 text-subtle" />
                      </div>
                    )}
                  </div>

                  {/* Metadata List */}
                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-ink break-all">
                      {selectedItem.original_filename || selectedItem.filename}
                    </p>
                    <div className="flex items-center gap-2 text-subtle">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(selectedItem.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-subtle">
                      <HardDrive className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatBytes(selectedItem.size)}</span>
                      {selectedItem.optimized && (
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                          WebP Optimized
                        </span>
                      )}
                    </div>
                    {selectedItem.width && selectedItem.height ? (
                      <div className="flex items-center gap-2 text-subtle">
                        <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {selectedItem.width} × {selectedItem.height} px
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Alt Text Input */}
                  <div className="space-y-1.5 pt-2 border-t border-line">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-subtle">
                      Teks Alternatif (Alt Text)
                    </label>
                    <input
                      type="text"
                      value={altDraft}
                      onChange={(e) => setAltDraft(e.target.value)}
                      placeholder="Jelaskan gambar ini untuk SEO…"
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                    />
                    {altDraft !== (selectedItem.alt || '') && (
                      <button
                        type="button"
                        onClick={() => updateAlt.mutate({ id: selectedItem.id, alt: altDraft })}
                        disabled={updateAlt.isPending}
                        className="rounded-lg bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600 disabled:opacity-60 transition"
                      >
                        {updateAlt.isPending ? 'Menyimpan…' : 'Simpan Alt'}
                      </button>
                    )}
                  </div>

                  {/* Copy URL Button */}
                  <div className="pt-2 border-t border-line">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(selectedItem.url || selectedItem.path)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-body hover:bg-page transition"
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 text-teal-600" />
                          <span className="text-teal-600">Tautan Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-subtle" />
                          <span>Salin Tautan Media</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-12 text-center text-xs text-subtle">
                  <p>Klik salah satu media pada daftar untuk melihat detail dan memilihnya.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-line bg-white px-5 py-3.5 sm:px-6">
          <div className="text-xs text-subtle truncate max-w-[300px] sm:max-w-md">
            {selectedItem ? (
              <span>
                Dipilih:{' '}
                <strong className="text-ink font-semibold">
                  {selectedItem.original_filename || selectedItem.filename}
                </strong>
              </span>
            ) : (
              <span>Belum ada media yang dipilih</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-body hover:bg-page transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleConfirmSelect}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] hover:bg-sky-600 disabled:opacity-50 transition"
            >
              <Check className="h-4 w-4" />
              <span>Gunakan Media Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
