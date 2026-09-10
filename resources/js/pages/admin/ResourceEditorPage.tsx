import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePage } from '@inertiajs/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'
import { guideForField } from '../../lib/mediaGuide'
import { RESOURCE_CONFIGS, type ResourceConfig } from '../../admin/resourceConfigs'
import type { FieldDef } from '../../pages/admin/SimpleResourcePage'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { FileUploadField } from '../../components/admin/FileUploadField'
import { RichTextEditor } from '../../components/admin/RichTextEditor'
import { AchievementAiModal, type AchievementAiResult } from '../../components/admin/AchievementAiModal'
import { Skeleton } from '../../components/ui/Skeleton'

type Props = { config: ResourceConfig }

export function ResourceEditorPage({ config }: Props) {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<Record<string, string | boolean | null>>({})
  const [ready, setReady] = useState(isNew)
  const [isAchievementAiOpen, setIsAchievementAiOpen] = useState(false)

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
        init[f.key] = f.type === 'checkbox' ? false : f.type === 'image' || f.type === 'file' ? null : ''
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
        else if (f.type === 'image' || f.type === 'file') init[f.key] = (val as string) || null
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

  const handleAchievementGenerated = (res: AchievementAiResult) => {
    setForm((prev) => ({
      ...prev,
      title: res.title || prev.title,
      slug: res.slug || prev.slug,
      badge_label: res.badge_label || prev.badge_label,
      excerpt: res.excerpt || prev.excerpt,
      body: res.body_html || prev.body,
      status: prev.status || 'published',
    }))
  }

  if ((!isNew && isLoading) || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-[16px]" />
      </div>
    )
  }

  const renderField = (f: FieldDef) => {
    if (f.type === 'image') {
      const guide = guideForField(config.slug, f.key)
      return (
        <ImageUploadField
          key={f.key}
          label={f.label}
          value={(form[f.key] as string) || null}
          onChange={(path) => setForm((prev) => ({ ...prev, [f.key]: path }))}
          guide={guide}
          previewClassName={f.previewClassName || 'aspect-video max-h-56'}
        />
      )
    }
    if (f.type === 'file') {
      return (
        <FileUploadField
          key={f.key}
          label={f.label}
          value={(form[f.key] as string) || null}
          fileName={(form['file_name'] as string) || ''}
          onChange={(path) => setForm((prev) => ({ ...prev, [f.key]: path }))}
          onFileNameChange={(name) => {
            setForm((prev) => {
              const next = { ...prev }
              if (!next.file_name) next.file_name = name
              if (!next.title && isNew) {
                const cleanTitle = name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ')
                next.title = cleanTitle
              }
              return next
            })
          }}
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
            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.checked }))}
          />
          <span className="font-medium text-ink">{f.label}</span>
        </label>
      )
    }
    if (f.type === 'richtext') {
      return (
        <div key={f.key}>
          <label className="mb-1.5 block text-sm font-semibold text-ink">{f.label}</label>
          <RichTextEditor
            value={String(form[f.key] ?? '')}
            onChange={(html) => setForm((prev) => ({ ...prev, [f.key]: html }))}
            placeholder={`Tulis ${f.label.toLowerCase()} di sini…`}
          />
        </div>
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
            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
          />
        ) : (
          <input
            type={f.type === 'number' ? 'number' : 'text'}
            className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            value={String(form[f.key] ?? '')}
            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
          />
        )}
      </div>
    )
  }

  const isSideField = (f: FieldDef) => {
    if (f.type === 'image' || f.type === 'checkbox') return true
    const sideKeys = [
      'status',
      'badge_label',
      'sort_order',
      'schedule',
      'coach',
      'icon',
      'url',
      'open_in_new_tab',
      'link_url',
      'link_label',
      'color',
    ]
    return sideKeys.includes(f.key)
  }

  const mainFields = config.fields.filter((f) => !isSideField(f))
  const sideFields = config.fields.filter((f) => isSideField(f))

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
        <div className="flex flex-wrap items-center gap-2">
          {config.aiGenerator === 'achievement' && (
            <button
              type="button"
              onClick={() => setIsAchievementAiOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-brand/10 to-sky-500/10 px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-2xs transition hover:brightness-105 dark:text-amber-300"
              title="Buat rilis berita prestasi otomatis dengan AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Liputan Prestasi AI</span>
            </button>
          )}
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

      {config.wideLayout ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content column (wide) */}
          <div className="min-w-0 space-y-4">
            <div className="space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)] md:p-6">
              {mainFields.map(renderField)}
            </div>
          </div>

          {/* Sidebar column */}
          <div className="space-y-4">
            <div className="space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)] md:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subtle">
                Pengaturan & Atribut
              </h3>
              {sideFields.map(renderField)}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)] md:p-6">
          {config.fields.map(renderField)}
        </div>
      )}

      {save.isError && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Gagal menyimpan. Periksa isian lalu coba lagi.
        </p>
      )}

      <div
        className={`mt-4 flex justify-end gap-2 ${
          config.wideLayout ? '' : 'mx-auto max-w-3xl'
        }`}
      >
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

      {config.aiGenerator === 'achievement' && (
        <AchievementAiModal
          isOpen={isAchievementAiOpen}
          onClose={() => setIsAchievementAiOpen(false)}
          onGenerated={handleAchievementGenerated}
        />
      )}
    </div>
  )
}

export default function ResourceEditorPageInertia() {
  const { resource } = usePage<{ resource?: string }>().props
  const config = resource ? RESOURCE_CONFIGS[resource] : undefined
  if (!config) {
    return (
      <div className="rounded-xl border border-line bg-white p-6 text-sm text-subtle">
        Resource tidak ditemukan.
      </div>
    )
  }
  return <ResourceEditorPage config={config} />
}
