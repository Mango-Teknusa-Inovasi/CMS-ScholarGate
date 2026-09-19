import React, { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Palette, Power, Upload, Sparkles, LayoutTemplate } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

type ThemeItem = {
  name: string
  slug: string
  version: string
  description?: string
  author?: string
  screenshot?: string
  supported_slots?: string[]
  is_active: boolean
}

export function ThemesAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => (await api.get<{ data: ThemeItem[]; active_theme: string }>('/admin/themes')).data,
  })

  const activate = useMutation({
    mutationFn: async (slug: string) =>
      api.post(`/admin/themes/${encodeURIComponent(slug)}/activate`),
    onSuccess: (res) => {
      const msg = (res.data as { message?: string }).message || 'Tema berhasil diaktifkan.'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['admin-themes'] })
      // Reload window so Inertia re-fetches shared active_theme prop
      setTimeout(() => {
        window.location.reload()
      }, 800)
    },
    onError: () => toast.error('Gagal mengaktifkan tema.'),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/admin/themes/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      const msg = (res.data as { message?: string }).message || 'Tema baru berhasil diunggah.'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['admin-themes'] })
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: (err: unknown) => {
      const resp = (err as { response?: { data?: { message?: string } } })?.response?.data
      toast.error(resp?.message || 'Gagal mengunggah file tema ZIP.')
      if (fileRef.current) fileRef.current.value = ''
    },
  })

  const themes = data?.data || []
  const activeSlug = data?.active_theme || 'default'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Manajemen Tema & Layout (Theme Engine)"
        description="Kelola dan ganti tata letak visual utama website portal sekolah secara modular."
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) upload.mutate(file)
              }}
            />
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending ? 'Mengunggah...' : 'Unggah Tema ZIP'}
            </button>
          </div>
        }
      />

      {/* Info Banner */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold">Dual Theme & Hook Engine Aktif:</span> Tema mengontrol seluruh desain halaman publik (layout, navbar, footer, & bento), sementara <strong>Plugin</strong> menyuntikkan widget ke dalam slot tema secara otomatis.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <LayoutTemplate className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            Belum ada tema tambahan yang terinstall.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isActive = theme.slug === activeSlug

            return (
              <div
                key={theme.slug}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                  isActive
                    ? 'border-emerald-500/80 bg-emerald-50/30 ring-2 ring-emerald-500/20 dark:border-emerald-500/60 dark:bg-emerald-950/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        <LayoutTemplate className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{theme.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          v{theme.version} • Oleh {theme.author || 'Developer'}
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Tidak Aktif
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {theme.description || 'Tidak ada deskripsi tema.'}
                  </p>

                  {theme.supported_slots && theme.supported_slots.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Supported Hook Slots:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {theme.supported_slots.map((slot) => (
                          <span
                            key={slot}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  {!isActive ? (
                    <button
                      type="button"
                      disabled={activate.isPending}
                      onClick={() => activate.mutate(theme.slug)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-50"
                    >
                      <Power className="h-3.5 w-3.5" />
                      Aktifkan Tema Ini
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Sedang Digunakan
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ThemesAdminPage
