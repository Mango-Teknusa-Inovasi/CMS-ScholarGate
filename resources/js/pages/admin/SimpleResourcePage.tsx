import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/utils'
import { guideForField } from '../../lib/mediaGuide'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

export type FieldDef = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'richtext' | 'number' | 'checkbox' | 'image' | 'file'
  /** Override preview aspect for image fields */
  previewClassName?: string
}

type Props = {
  title: string
  description?: string
  resource: string
  fields: FieldDef[]
}

export function SimpleResourcePage({ title, description, resource, fields }: Props) {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [form, setForm] = useState<Record<string, string | boolean | null>>({})

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', resource],
    queryFn: async () => (await api.get(`/admin/${resource}`)).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      if (editingId) return api.put(`/admin/${resource}/${editingId}`, form)
      return api.post(`/admin/${resource}`, form)
    },
    onSuccess: (_data, _vars, _ctx) => {
      const wasEdit = editingId != null
      qc.invalidateQueries({ queryKey: ['admin', resource] })
      setOpen(false)
      setEditingId(null)
      toast.success(wasEdit ? 'Perubahan disimpan.' : 'Data berhasil ditambahkan.')
    },
    onError: () => toast.error('Gagal menyimpan data.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string | number) => api.delete(`/admin/${resource}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', resource] })
      toast.success('Data dihapus.')
    },
    onError: () => toast.error('Gagal menghapus data.'),
  })

  const openCreate = () => {
    setEditingId(null)
    const init: Record<string, string | boolean | null> = {}
    fields.forEach((f) => {
      init[f.key] = f.type === 'checkbox' ? false : f.type === 'image' ? null : ''
    })
    setForm(init)
    setOpen(true)
  }

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id))
    const init: Record<string, string | boolean | null> = {}
    fields.forEach((f) => {
      const val = row[f.key]
      if (f.type === 'checkbox') init[f.key] = Boolean(val)
      else if (f.type === 'image') init[f.key] = (val as string) || null
      else init[f.key] = String(val ?? '')
    })
    setForm(init)
    setOpen(true)
  }

  const rows = data as Array<Record<string, unknown>>
  const imageField = fields.find((f) => f.type === 'image')

  return (
    <div>
      <AdminPageHeader
        title={title}
        description={description || `Kelola data ${title.toLowerCase()} portal.`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-[12px] bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(20_184_166/0.28)] transition hover:bg-teal-600 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        }
      />

      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-semibold text-ink">Belum ada data</p>
            <p className="mt-1 text-sm text-subtle">Mulai dengan menambahkan item pertama.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 rounded-[12px] bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              + Tambah {title.toLowerCase()}
            </button>
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
                        <p className="font-semibold text-ink">
                          {String(row.title || row.name || row.label || `#${row.id}`)}
                        </p>
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
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-body hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Hapus data?',
                                message: 'Data yang dihapus tidak dapat dikembalikan.',
                                confirmLabel: 'Ya, hapus',
                                tone: 'danger',
                              })
                              if (ok) remove.mutate(String(row.id))
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[20px] bg-white shadow-xl sm:rounded-[20px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <h2 className="text-lg font-bold text-ink">
                {editingId ? 'Edit' : 'Tambah'} {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-line p-2 hover:bg-muted"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 p-5">
              {fields.map((f) => {
                if (f.type === 'image') {
                  const guide = guideForField(resource, f.key)
                  return (
                    <ImageUploadField
                      key={f.key}
                      label={f.label}
                      value={(form[f.key] as string) || null}
                      onChange={(path) => setForm({ ...form, [f.key]: path })}
                      guide={guide}
                      previewClassName={f.previewClassName || 'aspect-video max-h-48'}
                    />
                  )
                }
                if (f.type === 'checkbox') {
                  return (
                    <label
                      key={f.key}
                      className="flex items-center gap-2.5 rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-line text-brand"
                        checked={Boolean(form[f.key])}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                      />
                      <span className="font-medium text-ink">{f.label}</span>
                    </label>
                  )
                }
                return (
                  <div key={f.key}>
                    <label className="mb-1.5 block text-sm font-medium text-ink">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                        rows={3}
                        value={String(form[f.key] ?? '')}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                        value={String(form[f.key] ?? '')}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[12px] border border-line px-4 py-2.5 text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
              >
                {save.isPending ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
