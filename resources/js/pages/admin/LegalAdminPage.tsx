import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, RefreshCw, Scale, Shield } from 'lucide-react'
import { api, ensureCsrf } from '../../lib/api'
import { RichTextEditor } from '../../components/admin/RichTextEditor'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { Link } from 'react-router-dom'

type LegalPageRow = {
  id?: number
  key: 'privacy' | 'terms'
  title: string
  body: string
  is_published: boolean
  updated_at?: string
}

type IndexResponse = {
  pages: LegalPageRow[]
  institution: string
}

const TABS: Array<{ key: 'privacy' | 'terms'; label: string; path: string; icon: typeof Shield }> = [
  { key: 'privacy', label: 'Kebijakan Privasi', path: '/kebijakan-privasi', icon: Shield },
  { key: 'terms', label: 'Syarat & Ketentuan', path: '/syarat-ketentuan', icon: Scale },
]

export function LegalAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [tab, setTab] = useState<'privacy' | 'terms'>('privacy')
  const [form, setForm] = useState<LegalPageRow>({
    key: 'privacy',
    title: '',
    body: '',
    is_published: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-legal-pages'],
    queryFn: async () => (await api.get<IndexResponse>('/admin/legal-pages')).data,
  })

  useEffect(() => {
    const row = data?.pages?.find((p) => p.key === tab)
    if (row) {
      setForm({
        key: row.key,
        title: row.title || '',
        body: row.body || '',
        is_published: row.is_published !== false,
        id: row.id,
        updated_at: row.updated_at,
      })
    } else {
      setForm({
        key: tab,
        title: tab === 'privacy' ? 'Kebijakan Privasi' : 'Syarat & Ketentuan',
        body: '',
        is_published: true,
      })
    }
  }, [data, tab])

  const save = useMutation({
    mutationFn: async () => {
      await ensureCsrf()
      return api.put(`/admin/legal-pages/${tab}`, {
        title: form.title,
        body: form.body,
        is_published: form.is_published,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-legal-pages'] })
      qc.invalidateQueries({ queryKey: ['legal'] })
      toast.success('Halaman legal disimpan.')
    },
    onError: () => toast.error('Gagal menyimpan halaman legal.'),
  })

  const resetDefaults = useMutation({
    mutationFn: async (onlyCurrent: boolean) => {
      await ensureCsrf()
      return api.post('/admin/legal-pages/reset-defaults', onlyCurrent ? { key: tab } : {})
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-legal-pages'] })
      qc.invalidateQueries({ queryKey: ['legal'] })
      toast.success(res.data?.message || 'Default dipulihkan.')
    },
    onError: () => toast.error('Gagal memulihkan default.'),
  })

  const onReset = async (onlyCurrent: boolean) => {
    const org = data?.institution || 'lembaga'
    const ok = await confirm({
      title: onlyCurrent ? 'Pulihkan halaman ini?' : 'Pulihkan semua legal default?',
      message: `Konten diganti template bawaan dengan nama “${org}”. Perubahan manual akan tertimpa.`,
      confirmLabel: 'Ya, pulihkan',
      tone: 'danger',
    })
    if (ok) resetDefaults.mutate(onlyCurrent)
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const meta = TABS.find((t) => t.key === tab)!
  const Icon = meta.icon

  return (
    <div>
      <AdminPageHeader
        title="Syarat & Privasi"
        description={`Konten legal portal. Template seed memakai nama lembaga: “${data?.institution || '…'}”. Dapat diedit kapan saja.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onReset(true)}
              disabled={resetDefaults.isPending}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-line bg-white px-3 py-2 text-sm font-semibold text-body hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset halaman ini
            </button>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="rounded-[12px] bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
            >
              {save.isPending ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key
          const TabIcon = t.icon
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'border border-line bg-white text-body hover:bg-muted'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-subtle">
            <Icon className="h-4 w-4 text-brand" />
            <span>
              URL publik:{' '}
              <Link to={meta.path} className="font-semibold text-brand hover:underline" target="_blank">
                {meta.path}
              </Link>
            </span>
            <a
              href={meta.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-subtle hover:text-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka
            </a>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="rounded border-line"
            />
            Dipublikasikan
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="legal-title">
            Judul
          </label>
          <input
            id="legal-title"
            className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Isi dokumen</label>
          <RichTextEditor
            value={form.body}
            onChange={(html) => setForm((f) => ({ ...f, body: html }))}
            placeholder="Tulis kebijakan atau syarat di sini…"
          />
        </div>

        <p className="text-xs leading-relaxed text-subtle">
          Tombol <strong>Reset halaman ini</strong> mengisi ulang template bawaan dengan nama lembaga
          saat ini ({data?.institution || 'site_name'}). Setelah diganti nama di Pengaturan, reset
          ulang agar teks legal menyesuaikan.
        </p>
      </div>
    </div>
  )
}

export default LegalAdminPage
