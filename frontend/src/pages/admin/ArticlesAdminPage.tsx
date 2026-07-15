import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type ArticleRow = {
  id: number
  title: string
  slug: string
  status: string
  is_featured: boolean
  views: number
  published_at?: string
  deleted_at?: string
  category?: { id: number; name: string } | null
}

export function ArticlesAdminPage() {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [trash, setTrash] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', q, status, trash],
    queryFn: async () =>
      (
        await api.get<{ data: ArticleRow[] }>('/admin/articles', {
          params: {
            q: q || undefined,
            status: !trash && status ? status : undefined,
            trash: trash ? 1 : undefined,
          },
        })
      ).data,
  })

  const remove = useMutation({
    mutationFn: async (id: number) =>
      trash ? api.delete(`/admin/articles/${id}/force`) : api.delete(`/admin/articles/${id}`),
    onSuccess: () => {
      setSelected([])
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      toast.success(trash ? 'Artikel dihapus permanen.' : 'Artikel dipindah ke sampah.')
    },
    onError: () => toast.error('Gagal menghapus artikel.'),
  })

  const restore = useMutation({
    mutationFn: async (id: number) => api.post(`/admin/articles/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      toast.success('Artikel dipulihkan.')
    },
    onError: () => toast.error('Gagal memulihkan artikel.'),
  })

  const bulk = useMutation({
    mutationFn: async () =>
      api.post('/admin/articles/bulk-delete', { ids: selected, force: trash }),
    onSuccess: () => {
      setSelected([])
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      toast.success(trash ? 'Artikel terpilih dihapus permanen.' : 'Artikel terpilih dipindah ke sampah.')
    },
    onError: () => toast.error('Gagal memproses artikel terpilih.'),
  })

  const rows = data?.data || []
  const allSelected = rows.length > 0 && selected.length === rows.length

  return (
    <div>
      <AdminPageHeader
        title="Artikel"
        description="Daftar artikel portal. Buka editor untuk menulis atau ubah. Tab Sampah untuk pulihkan yang dihapus."
        actions={
          <Link
            to="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded-[12px] bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(139_92_246/0.28)] transition hover:bg-violet-600 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah baru
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setTrash(false)
              setSelected([])
            }}
            className={cn(
              'rounded-[10px] px-3 py-1.5 text-sm font-semibold',
              !trash ? 'bg-brand-soft text-brand-dark' : 'bg-white text-subtle ring-1 ring-line',
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => {
              setTrash(true)
              setSelected([])
            }}
            className={cn(
              'rounded-[10px] px-3 py-1.5 text-sm font-semibold',
              trash ? 'bg-brand-soft text-brand-dark' : 'bg-white text-subtle ring-1 ring-line',
            )}
          >
            Sampah
          </button>
          {!trash && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-[10px] border border-line bg-white px-3 py-1.5 text-sm"
            >
              <option value="">Semua status</option>
              <option value="published">Terbit</option>
              <option value="draft">Draf</option>
              <option value="archived">Arsip</option>
            </select>
          )}
        </div>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul…"
            className="w-full rounded-[12px] border border-line bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-[12px] border border-line bg-peach px-3 py-2 text-sm">
          <span className="font-medium text-ink">{selected.length} dipilih</span>
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm({
                title: trash ? 'Hapus permanen?' : 'Pindah ke sampah?',
                message: trash
                  ? `${selected.length} artikel akan dihapus permanen dan tidak dapat dipulihkan.`
                  : `${selected.length} artikel akan dipindah ke sampah.`,
                confirmLabel: trash ? 'Ya, hapus permanen' : 'Ya, pindahkan',
                tone: 'danger',
              })
              if (ok) bulk.mutate()
            }}
            className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"
          >
            {trash ? 'Hapus permanen' : 'Pindah ke sampah'}
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs font-medium text-subtle hover:text-ink"
          >
            Batal
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Memuat artikel">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-semibold text-ink">
              {trash ? 'Sampah kosong' : 'Belum ada artikel'}
            </p>
            {!trash && (
              <Link
                to="/admin/articles/new"
                className="mt-4 inline-flex rounded-[12px] bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
              >
                Tulis artikel pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-muted text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  <th className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(e.target.checked ? rows.map((r) => r.id) : [])
                      }
                    />
                  </th>
                  <th className="px-5 py-3.5">Judul</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Views</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Tanggal</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-page/70">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(row.id) ? s.filter((x) => x !== row.id) : [...s, row.id],
                          )
                        }
                      />
                    </td>
                    <td className="px-5 py-4">
                      {trash ? (
                        <span className="font-semibold text-ink">{row.title}</span>
                      ) : (
                        <Link
                          to={`/admin/articles/${row.id}/edit`}
                          className="font-semibold text-ink hover:text-brand"
                        >
                          {row.title}
                        </Link>
                      )}
                      <div className="mt-0.5 text-xs text-subtle">
                        {row.category?.name || 'Tanpa kategori'}
                        {row.is_featured ? ' · Unggulan' : ''}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={trash ? 'archived' : row.status} />
                    </td>
                    <td className="px-5 py-4 tabular-nums text-body">{row.views}</td>
                    <td className="hidden px-5 py-4 text-subtle md:table-cell">
                      {formatDate(trash ? row.deleted_at : row.published_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {trash ? (
                          <>
                            <button
                              type="button"
                              onClick={() => restore.mutate(row.id)}
                              className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Pulihkan
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await confirm({
                                  title: 'Hapus permanen?',
                                  message: `Artikel “${row.title}” akan dihapus permanen.`,
                                  confirmLabel: 'Ya, hapus',
                                  tone: 'danger',
                                })
                                if (ok) remove.mutate(row.id)
                              }}
                              className="inline-flex items-center gap-1 rounded-[10px] bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to={`/admin/articles/${row.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await confirm({
                                  title: 'Pindah ke sampah?',
                                  message: `Artikel “${row.title}” dipindah ke sampah dan bisa dipulihkan nanti.`,
                                  confirmLabel: 'Ya, pindahkan',
                                  tone: 'warning',
                                })
                                if (ok) remove.mutate(row.id)
                              }}
                              className="inline-flex items-center gap-1 rounded-[10px] bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Sampah
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
