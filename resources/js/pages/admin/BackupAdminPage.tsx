import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cloud, Download, HardDriveDownload, Trash2, Upload } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type BackupItem = {
  filename: string
  size: number
  created_at: string
  storage_location?: 'r2' | 'r2_and_local' | 'local'
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function BackupAdminPage() {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: async () => (await api.get<{ backups: BackupItem[] }>('/admin/backups')).data,
  })

  const create = useMutation({
    mutationFn: async () => api.post('/admin/backups'),
    onSuccess: () => {
      toast.success('Backup berhasil dibuat dan tersinkronisasi ke Cloud Storage R2.')
      qc.invalidateQueries({ queryKey: ['admin-backups'] })
    },
    onError: () => toast.error('Gagal membuat backup.'),
  })

  const remove = useMutation({
    mutationFn: async (filename: string) =>
      api.delete(`/admin/backups/${encodeURIComponent(filename)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-backups'] })
      toast.success('File backup dihapus dari server & cloud storage.')
    },
    onError: () => toast.error('Gagal menghapus backup.'),
  })

  const restore = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mode', mode)
      return api.post('/admin/backups/restore', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      const d = res.data as {
        tables?: number
        rows?: number
        mode?: string
        source?: string | null
        target?: string
      }
      const cross =
        d.source && d.target && d.source !== d.target
          ? ` · pindah DB ${d.source} → ${d.target}`
          : d.target
            ? ` · DB ${d.target}`
            : ''
      toast.success(
        `Restore berhasil · ${d.tables ?? 0} tabel · ${d.rows ?? 0} baris (${d.mode})${cross}`,
      )
      qc.invalidateQueries()
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Restore gagal.')
    },
  })

  const download = async (filename: string) => {
    try {
      const res = await api.get(`/admin/backups/${encodeURIComponent(filename)}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Unduhan dimulai.')
    } catch {
      toast.error('Gagal mengunduh backup.')
    }
  }


  const items = data?.backups || []

  return (
    <div>
      <AdminPageHeader
        title="Backup & restore"
        description="JSON portable: MySQL/MariaDB ↔ PostgreSQL. Otomatis tersinkronisasi ke Cloud Storage R2 & storage lokal."
        actions={
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
          >
            <HardDriveDownload className="h-4 w-4" />
            {create.isPending ? 'Membuat & Sync Cloud…' : 'Buat backup'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Daftar backup</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              <Cloud className="h-3 w-3 text-sky-500" /> Cloud R2 + Server
            </span>
          </div>
          <p className="mt-1 text-xs text-subtle">
            Tersimpan ganda: di Cloud Storage R2 (static-cdn-r2) dan server lokal.
          </p>

          {isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="mt-6 text-sm text-subtle">Belum ada backup. Klik “Buat backup”.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {items.map((b) => {
                const loc = b.storage_location
                return (
                  <li
                    key={b.filename}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{b.filename}</p>
                        {loc === 'r2_and_local' && (
                          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ☁️ Cloud + Server
                          </span>
                        )}
                        {loc === 'r2' && (
                          <span className="shrink-0 text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            ☁️ Cloud R2
                          </span>
                        )}
                        {loc === 'local' && (
                          <span className="shrink-0 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            🖥️ Server Lokal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-subtle mt-0.5">
                        {formatBytes(b.size)} · {new Date(b.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void download(b.filename)}
                        className="inline-flex items-center gap-1 rounded-[10px] border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Hapus file backup?',
                            message: `“${b.filename}” akan dihapus dari Cloud Storage R2 dan server.`,
                            confirmLabel: 'Ya, hapus',
                            tone: 'danger',
                          })
                          if (ok) remove.mutate(b.filename)
                        }}
                        className="inline-flex items-center gap-1 rounded-[10px] bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>


        <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold text-ink">Restore dari file</h2>
          <p className="mt-1 text-xs text-subtle">
            Upload file <code>.json</code> atau <code>.zip</code> hasil backup Scholargate.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">
                Mode restore
              </p>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 rounded-[12px] border border-line p-3 text-sm transition hover:bg-page cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    className="mt-0.5"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                  />
                  <div>
                    <span className="font-bold text-ink">Merge (Konten CMS Saja)</span>
                    <p className="text-xs text-subtle mt-0.5">
                      Hanya menambah/mengupdate konten CMS (artikel, berita, galeri, ekskul, dll) tanpa merubah/menimpa Pengaturan Sistem & Kontak Sekolah.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 transition hover:bg-amber-100/60 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    className="mt-0.5"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                  />
                  <div>
                    <span className="font-bold text-amber-950">Replace (Semua Sak Seting-setingnya)</span>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Mengosongkan & menimpa SELURUH data tabel termasuk Pengaturan Sistem, Menu Navigasi, Kontak, & Syarat Ketentuan dari file backup.
                    </p>
                  </div>
                </label>
              </div>

            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".json,.zip,application/json,application/zip"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                if (mode === 'replace') {
                  const ok = await confirm({
                    title: 'Mode replace?',
                    message:
                      'Data di tabel terkait akan dikosongkan dulu sebelum diisi ulang dari backup. Lanjutkan?',
                    confirmLabel: 'Ya, restore replace',
                    tone: 'warning',
                  })
                  if (!ok) {
                    e.target.value = ''
                    return
                  }
                }
                restore.mutate(f)
                e.target.value = ''
              }}
            />

            <button
              type="button"
              disabled={restore.isPending}
              onClick={() => fileRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-line bg-page px-4 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {restore.isPending ? 'Merestore…' : 'Pilih file & restore'}
            </button>

            <div className="rounded-[12px] border border-line bg-muted px-3 py-2.5 text-xs leading-relaxed text-body">
              <p className="font-semibold text-ink">Catatan</p>
              <ul className="mt-1 list-disc pl-4">
                <li>Backup ini adalah <strong>konten CMS</strong> (bukan full pg_dump).</li>
                <li>File media di R2 tidak ikut di-zip; path media tetap di DB.</li>
                <li>
                  Full SQL: <code>./scripts/backup-db.sh</code> di server.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}

export default BackupAdminPage
