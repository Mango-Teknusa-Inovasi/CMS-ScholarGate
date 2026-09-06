import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Package, Power, Puzzle, Trash2, Upload, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type PluginItem = {
  name: string
  slug: string
  version: string
  description?: string
  author?: string
  is_active: boolean
  icon?: string
}

export function PluginsAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-plugins'],
    queryFn: async () => (await api.get<{ plugins: PluginItem[] }>('/admin/plugins')).data,
  })

  const toggle = useMutation({
    mutationFn: async ({ slug, active }: { slug: string; active: boolean }) =>
      api.post(`/admin/plugins/${encodeURIComponent(slug)}/toggle`, { active }),
    onSuccess: (res) => {
      const msg = (res.data as { message?: string }).message || 'Status plugin diperbarui.'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['admin-plugins'] })
    },
    onError: () => toast.error('Gagal memperbarui status plugin.'),
  })

  const remove = useMutation({
    mutationFn: async (slug: string) =>
      api.delete(`/admin/plugins/${encodeURIComponent(slug)}?drop_tables=true`),
    onSuccess: (res) => {
      const msg = (res.data as { message?: string }).message || 'Plugin berhasil dicopot.'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['admin-plugins'] })
    },
    onError: () => toast.error('Gagal mencopot/menghapus plugin.'),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/admin/plugins/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      const msg = (res.data as { message?: string }).message || 'Plugin berhasil diunggah.'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['admin-plugins'] })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Gagal mengunggah file ZIP plugin.')
    },
  })

  const plugins = data?.plugins || []

  return (
    <div>
      <AdminPageHeader
        title="Plugin & Add-on"
        description="Kelola add-on modul custom ScholarGate (PPDB Online, E-Library, Notifikasi, dll) tanpa merubah kode utama."
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
              {upload.isPending ? 'Mengunggah…' : 'Unggah Plugin (.ZIP)'}
            </button>
          </>
        }
      />

      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-sky-500" />
              Daftar Plugin Terpasang
            </h2>
            <p className="mt-0.5 text-xs text-subtle">
              Plugin disimpan di folder <code>plugins/</code>. Setiap plugin aktif memuat migration & route secara otomatis.
            </p>
          </div>
          <span className="text-xs font-semibold text-subtle bg-page px-3 py-1 rounded-full border border-line">
            {plugins.length} Modul Terdeteksi
          </span>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : plugins.length === 0 ? (
          <div className="mt-12 text-center py-8">
            <Package className="h-12 w-12 text-subtle mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-ink">Belum Ada Plugin Terpasang</p>
            <p className="text-xs text-subtle mt-1">
              Unggah file <code>.zip</code> plugin atau tambahkan folder plugin baru di <code>plugins/</code>.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {plugins.map((p) => (
              <div
                key={p.slug}
                className={`relative flex flex-col justify-between rounded-[14px] border p-4 transition ${
                  p.is_active
                    ? 'border-emerald-200 bg-emerald-50/30 shadow-sm'
                    : 'border-line bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-sky-100 text-sky-600 font-bold text-lg">
                        🧩
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-ink">{p.name}</h3>
                          <span className="text-[10px] font-semibold text-subtle bg-page px-1.5 py-0.5 rounded border border-line">
                            v{p.version}
                          </span>
                        </div>
                        {p.author && (
                          <p className="text-[11px] text-subtle mt-0.5">Oleh: {p.author}</p>
                        )}
                      </div>
                    </div>
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                        <XCircle className="h-3 w-3" /> Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-subtle line-clamp-2">
                    {p.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                  <span className="font-mono text-[10px] text-subtle">plugins/{p.slug}</span>
                  <div className="flex items-center gap-2">
                    {!p.is_active && (
                      <button
                        type="button"
                        disabled={remove.isPending}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Hapus Plugin "${p.name}"?`,
                            message: `Plugin ini akan dicopot permanen dan tabel database khususnya akan dibersihkan. Tindakan ini tidak dapat dibatalkan.`,
                            confirmLabel: 'Hapus Bersih',
                            tone: 'danger',
                          })
                          if (ok) remove.mutate(p.slug)
                        }}
                        className="rounded-[10px] border border-line p-1.5 text-subtle hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus dan bersihkan plugin beserta tabelnya"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ slug: p.slug, active: !p.is_active })}
                      className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-bold transition ${
                        p.is_active
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {p.is_active ? 'Nonaktifkan' : 'Aktifkan Modul'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default PluginsAdminPage

