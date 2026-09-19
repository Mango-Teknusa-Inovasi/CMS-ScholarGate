import React, { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Palette, Power, Upload, XCircle, LayoutTemplate } from 'lucide-react'
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
      setTimeout(() => {
        window.location.reload()
      }, 600)
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
    <div>
      <AdminPageHeader
        title="Manajemen Tema & Layout"
        description="Kelola dan ganti tata letak visual utama website portal sekolah secara modular."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload.mutate(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending ? 'Mengunggah…' : 'Unggah Tema (.ZIP)'}
            </button>
          </>
        }
      />

      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Palette className="h-5 w-5 text-sky-500" />
              Daftar Tema Terpasang
            </h2>
            <p className="mt-0.5 text-xs text-subtle">
              Tema disimpan di folder <code>resources/js/themes/</code>. Pilih tema yang ingin digunakan untuk halaman depan portal.
            </p>
          </div>
          <span className="text-xs font-semibold text-subtle bg-page px-3 py-1 rounded-full border border-line">
            {themes.length} Tema Terdeteksi
          </span>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-24 w-full rounded-[14px]" />
            <Skeleton className="h-24 w-full rounded-[14px]" />
          </div>
        ) : themes.length === 0 ? (
          <div className="mt-12 text-center py-8">
            <LayoutTemplate className="h-12 w-12 text-subtle mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-ink">Belum Ada Tema Terpasang</p>
            <p className="text-xs text-subtle mt-1">
              Unggah file <code>.zip</code> tema atau tambahkan folder tema di <code>resources/js/themes/</code>.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {themes.map((t) => {
              const isActive = t.slug === activeSlug

              return (
                <div
                  key={t.slug}
                  className={`relative flex flex-col justify-between rounded-[14px] border p-4 transition ${
                    isActive
                      ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                      : 'border-line bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                          isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-600'
                        } font-bold text-lg`}>
                          🎨
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-ink">{t.name}</h3>
                            <span className="text-[10px] font-semibold text-subtle bg-page px-1.5 py-0.5 rounded border border-line">
                              v{t.version}
                            </span>
                          </div>
                          {t.author && (
                            <p className="text-[11px] text-subtle mt-0.5">Oleh: {t.author}</p>
                          )}
                        </div>
                      </div>

                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                          <XCircle className="h-3.5 w-3.5 text-slate-400" /> Nonaktif
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-subtle line-clamp-2">
                      {t.description || 'Tidak ada deskripsi tema.'}
                    </p>

                    {t.supported_slots && t.supported_slots.length > 0 && (
                      <div className="mt-3 pt-2">
                        <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                          Supported Hook Slots:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {t.supported_slots.map((slot) => (
                            <span
                              key={slot}
                              className="rounded bg-page px-1.5 py-0.5 text-[10px] font-mono text-subtle border border-line"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                    <span className="font-mono text-[10px] text-subtle">themes/{t.slug}</span>
                    <div className="flex items-center gap-2">
                      {!isActive ? (
                        <button
                          type="button"
                          disabled={activate.isPending}
                          onClick={() => activate.mutate(t.slug)}
                          className="inline-flex items-center gap-1.5 rounded-[10px] bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {activate.isPending ? 'Mengaktifkan…' : 'Aktifkan Tema'}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">
                          Sedang Digunakan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default ThemesAdminPage
