import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { RichTextEditor } from '../../components/admin/RichTextEditor'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'

type Tab = { key: string; label: string; content_html: string }

type ProfilePage = {
  id?: number
  title: string
  subtitle?: string
  tabs: Tab[]
}

export function ProfileContentAdminPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-profile-page'],
    queryFn: async () => (await api.get<ProfilePage | null>('/admin/profile-page')).data,
  })

  const [form, setForm] = useState<ProfilePage>({
    title: '',
    subtitle: '',
    tabs: [],
  })
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        tabs: data.tabs || [],
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: async () => api.put('/admin/profile-page', form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-profile-page'] }),
  })

  const updateTab = (i: number, patch: Partial<Tab>) => {
    setForm((f) => {
      const tabs = [...f.tabs]
      tabs[i] = { ...tabs[i], ...patch }
      return { ...f, tabs }
    })
  }

  const addTab = () => {
    setForm((f) => ({
      ...f,
      tabs: [
        ...f.tabs,
        {
          key: `tab-${Date.now()}`,
          label: 'Tab baru',
          content_html: '<p>Konten tab…</p>',
        },
      ],
    }))
    setActiveTab(form.tabs.length)
  }

  const removeTab = (i: number) => {
    setForm((f) => ({ ...f, tabs: f.tabs.filter((_, idx) => idx !== i) }))
    setActiveTab(0)
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Memuat konten profil">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-12 w-full rounded-[12px]" />
        <Skeleton className="h-10 w-full max-w-md rounded-[12px]" />
        <Skeleton className="h-64 w-full rounded-[16px]" />
      </div>
    )
  }

  const tab = form.tabs[activeTab]

  return (
    <div>
      <AdminPageHeader
        title="Konten profil"
        description="Judul halaman, subtitle, dan tab (tugas pokok, struktur, program, dll.)."
        actions={
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan'}
          </button>
        }
      />

      <div className="mb-4 space-y-3 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <input
          className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 font-semibold outline-none focus:border-brand focus:bg-white"
          placeholder="Judul halaman profil"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
          placeholder="Subtitle"
          value={form.subtitle || ''}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />
      </div>

      <div className="rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {form.tabs.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`rounded-[12px] px-3 py-1.5 text-sm font-medium ${
                i === activeTab ? 'bg-brand-soft text-brand-dark' : 'hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={addTab}
            className="inline-flex items-center gap-1 rounded-[12px] border border-line px-3 py-1.5 text-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Tab
          </button>
        </div>

        {tab ? (
          <div className="space-y-3 p-5">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-[12px] border border-line px-3 py-2 text-sm"
                value={tab.label}
                onChange={(e) => updateTab(activeTab, { label: e.target.value })}
                placeholder="Label tab"
              />
              <button
                type="button"
                onClick={() => removeTab(activeTab)}
                className="rounded-[12px] bg-rose-50 px-3 text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <RichTextEditor
              value={tab.content_html}
              onChange={(html) => updateTab(activeTab, { content_html: html })}
            />
          </div>
        ) : (
          <p className="p-6 text-sm text-subtle">Belum ada tab. Klik + Tab untuk menambah.</p>
        )}
      </div>

      {save.isSuccess && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Konten profil tersimpan.
        </p>
      )}
    </div>
  )
}
