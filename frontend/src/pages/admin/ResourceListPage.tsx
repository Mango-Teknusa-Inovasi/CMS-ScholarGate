import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/utils'
import type { ResourceConfig } from '../../admin/resourceConfigs'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'

type Props = { config: ResourceConfig }

export function ResourceListPage({ config }: Props) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', config.slug],
    queryFn: async () => (await api.get(`/admin/${config.slug}`)).data,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/${config.slug}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', config.slug] }),
  })

  const rows = data as Array<Record<string, unknown>>
  const imageField = config.fields.find((f) => f.type === 'image')

  return (
    <div>
      <AdminPageHeader
        title={config.title}
        description={config.description || `Kelola ${config.title.toLowerCase()} portal.`}
        actions={
          <Link
            to={`${config.listPath}/new`}
            className="inline-flex items-center gap-2 rounded-[12px] bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(20_184_166/0.28)] transition hover:bg-teal-600 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah {config.singular}
          </Link>
        }
      />

      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Memuat data">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-semibold text-ink">Belum ada data</p>
            <p className="mt-1 text-sm text-subtle">Buat {config.singular} pertama di halaman penuh.</p>
            <Link
              to={`${config.listPath}/new`}
              className="mt-4 inline-flex rounded-[12px] bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              + Tambah {config.singular}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-peach-soft/60 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  {imageField && <th className="px-5 py-3.5">Gambar</th>}
                  <th className="px-5 py-3.5">Item</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Detail</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => {
                  const imgPath = imageField
                    ? (row[imageField.key] as string | undefined)
                    : undefined
                  const img = mediaUrl(imgPath)
                  const id = Number(row.id)
                  return (
                    <tr key={String(row.id)} className="hover:bg-page/80">
                      {imageField && (
                        <td className="px-5 py-3">
                          <div className="h-12 w-16 overflow-hidden rounded-lg border border-line bg-muted">
                            {img ? (
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-subtle">
                                —
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <Link
                          to={`${config.listPath}/${id}/edit`}
                          className="font-semibold text-ink hover:text-brand"
                        >
                          {String(row.title || row.name || row.label || `#${row.id}`)}
                        </Link>
                        <p className="mt-0.5 text-xs text-subtle md:hidden">
                          {String(row.subtitle || row.description || row.slug || row.location || '')}
                        </p>
                      </td>
                      <td className="hidden max-w-md truncate px-5 py-4 text-subtle md:table-cell">
                        {String(
                          row.subtitle ||
                            row.description ||
                            row.slug ||
                            row.location ||
                            row.schedule ||
                            '—',
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`${config.listPath}/${id}/edit`}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-body hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Pindahkan ke sampah / hapus item ini?'))
                                remove.mutate(id)
                            }}
                            className="inline-flex items-center gap-1 rounded-[10px] bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
