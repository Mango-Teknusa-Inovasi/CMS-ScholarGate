import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { MediaGridSkeleton } from '../../components/ui/Skeleton'
import { uploadSmart } from '../../lib/upload'
import { cn } from '../../lib/utils'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type MediaItem = {
  id: number
  path: string
  filename: string
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
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibraryPage() {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [editingAlt, setEditingAlt] = useState<number | null>(null)
  const [altDraft, setAltDraft] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-media', q],
    queryFn: async () =>
      (
        await api.get<{ data: MediaItem[] }>('/admin/media-library', {
          params: { q: q || undefined, per_page: 48 },
        })
      ).data,
  })

  const items = data?.data || []

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        await uploadSmart(file, { alt, maxWidth: 1920 })
      }
      qc.invalidateQueries({ queryKey: ['admin-media'] })
      toast.success(`${files.length} file berhasil diunggah.`)
    } catch {
      toast.error('Gagal mengunggah file.')
    } finally {
      setUploading(false)
    }
  }

  const saveAlt = useMutation({
    mutationFn: async ({ id, alt }: { id: number; alt: string }) =>
      api.put(`/admin/media-library/${id}`, { alt }),
    onSuccess: () => {
      setEditingAlt(null)
      qc.invalidateQueries({ queryKey: ['admin-media'] })
      toast.success('Teks alternatif disimpan.')
    },
    onError: () => toast.error('Gagal menyimpan alt text.'),
  })

  const remove = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 1) return api.delete(`/admin/media-library/${ids[0]}`)
      return api.post('/admin/media-library/bulk-delete', { ids })
    },
    onSuccess: () => {
      setSelected([])
      qc.invalidateQueries({ queryKey: ['admin-media'] })
      toast.success('Media dihapus.')
    },
    onError: () => toast.error('Gagal menghapus media.'),
  })

  const toggle = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopied(item.id)
      toast.success('URL disalin ke papan klip.')
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Gagal menyalin URL.')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Perpustakaan media"
        description="Gambar: kompres lokal → R2. PDF/dokumen: presign langsung ke R2 (lebih cepat)."
        actions={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.28)] transition hover:bg-sky-600">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Mengunggah…' : 'Tambah file'}
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void upload(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama file…"
          className="w-full max-w-md rounded-[12px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        {selected.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm({
                title: 'Hapus file terpilih?',
                message: `${selected.length} file akan dihapus dari perpustakaan media.`,
                confirmLabel: 'Ya, hapus',
                tone: 'danger',
              })
              if (ok) remove.mutate(selected)
            }}
            className="inline-flex items-center gap-2 rounded-[12px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            Hapus terpilih ({selected.length})
          </button>
        )}
      </div>

      {isLoading ? (
        <MediaGridSkeleton count={12} />
      ) : items.length === 0 ? (
        <div className="rounded-[16px] border border-line bg-white px-5 py-14 text-center shadow-[var(--shadow-card)]">
          <p className="font-semibold text-ink">Belum ada media</p>
          <p className="mt-1 text-sm text-subtle">Upload gambar dari tombol di atas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isImage = (item.mime || '').startsWith('image/')
            const active = selected.includes(item.id)
            return (
              <div
                key={item.id}
                className={cn(
                  'group overflow-hidden rounded-[14px] border bg-white shadow-sm transition',
                  active ? 'border-brand ring-2 ring-brand/30' : 'border-line',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="relative block aspect-square w-full overflow-hidden bg-muted"
                >
                  {isImage ? (
                    <img src={item.url} alt={item.alt || item.filename} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-subtle">
                      {item.filename}
                    </div>
                  )}
                  {item.optimized && (
                    <span className="absolute left-2 top-2 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      WebP
                    </span>
                  )}
                  {active && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
                <div className="space-y-1 p-2.5">
                  <p className="truncate text-xs font-medium text-ink" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-[10px] text-subtle">
                    {formatBytes(item.size)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                  </p>
                  {editingAlt === item.id ? (
                    <div className="space-y-1">
                      <input
                        value={altDraft}
                        onChange={(e) => setAltDraft(e.target.value)}
                        className="w-full rounded-lg border border-line px-2 py-1 text-[10px] outline-none focus:border-brand"
                        placeholder="Alt text SEO"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => saveAlt.mutate({ id: item.id, alt: altDraft })}
                          className="flex-1 rounded-lg bg-brand py-1 text-[10px] font-semibold text-white"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAlt(null)}
                          className="rounded-lg border border-line px-2 py-1 text-[10px]"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlt(item.id)
                        setAltDraft(item.alt || '')
                      }}
                      className="w-full truncate rounded-lg border border-dashed border-line px-1.5 py-1 text-left text-[10px] text-subtle hover:border-brand hover:text-brand"
                      title="Edit alt text (SEO)"
                    >
                      alt: {item.alt || '— klik isi —'}
                    </button>
                  )}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void copyUrl(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-1 text-[10px] font-semibold hover:bg-muted"
                    >
                      {copied === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Hapus file?',
                          message: `“${item.filename}” akan dihapus.`,
                          confirmLabel: 'Ya, hapus',
                          tone: 'danger',
                        })
                        if (ok) remove.mutate([item.id])
                      }}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MediaLibraryPage
