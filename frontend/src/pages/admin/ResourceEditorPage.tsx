import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { guideForField } from '../../lib/mediaGuide'
import type { ResourceConfig } from '../../admin/resourceConfigs'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'

type Props = { config: ResourceConfig }

export function ResourceEditorPage({ config }: Props) {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<Record<string, string | boolean | null>>({})
  const [ready, setReady] = useState(isNew)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', config.slug, id],
    queryFn: async () => {
      // generic resources don't have show endpoint - load from list
      const list = (await api.get(`/admin/${config.slug}`)).data as Array<Record<string, unknown>>
      const row = list.find((r) => String(r.id) === String(id))
      if (!row) throw new Error('Not found')
      return row
    },
    enabled: !isNew,
  })

  useEffect(() => {
    if (isNew) {
      const init: Record<string, string | boolean | null> = {}
      config.fields.forEach((f) => {
        init[f.key] = f.type === 'checkbox' ? false : f.type === 'image' ? null : ''
      })
      setForm(init)
      setReady(true)
      return
    }
    if (data) {
      const init: Record<string, string | boolean | null> = {}
      config.fields.forEach((f) => {
        const val = data[f.key]
        if (f.type === 'checkbox') init[f.key] = Boolean(val)
        else if (f.type === 'image') init[f.key] = (val as string) || null
        else init[f.key] = String(val ?? '')
      })
      setForm(init)
      setReady(true)
    }
  }, [data, isNew, config.fields])

  const save = useMutation({
    mutationFn: async () => {
      if (isNew) return api.post(`/admin/${config.slug}`, form)
      return api.put(`/admin/${config.slug}/${id}`, form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', config.slug] })
      navigate(config.listPath)
    },
  })

  if ((!isNew && isLoading) || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-[16px]" />
      </div>
    )
  }

  return (
    <div>
      {/* Top bar editor */}
      <div className="mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={config.listPath}
            className="mt-0.5 rounded-xl border border-line bg-white p-2 hover:bg-muted"
            title="Kembali ke daftar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-medium text-subtle">
              {config.title} / {isNew ? 'Tambah baru' : 'Edit'}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {isNew ? `Tambah ${config.singular}` : `Edit ${config.singular}`}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={config.listPath}
            className="rounded-[12px] border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Batal
          </Link>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {save.isPending ? 'Menyimpan…' : isNew ? 'Terbitkan' : 'Perbarui'}
          </button>
        </div>
      </div>

      {config.description && (
        <p className="mb-4 rounded-[12px] border border-line bg-peach px-4 py-3 text-sm text-body">
          {config.description}
        </p>
      )}

      <div className="mx-auto max-w-3xl space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)] md:p-6">
        {config.fields.map((f) => {
          if (f.type === 'image') {
            const guide = guideForField(config.slug, f.key)
            return (
              <ImageUploadField
                key={f.key}
                label={f.label}
                value={(form[f.key] as string) || null}
                onChange={(path) => setForm({ ...form, [f.key]: path })}
                guide={guide}
                previewClassName={f.previewClassName || 'aspect-video max-h-56'}
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
                  rows={4}
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

        {save.isError && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Gagal menyimpan. Periksa isian lalu coba lagi.
          </p>
        )}
      </div>

      <div className="mx-auto mt-4 flex max-w-3xl justify-end gap-2">
        <Link
          to={config.listPath}
          className="rounded-[12px] border border-line bg-white px-4 py-2.5 text-sm font-medium"
        >
          Kembali ke daftar
        </Link>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-[12px] bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-60"
        >
          {save.isPending ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}
