import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, HardDriveDownload, Trash2, Upload } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type BackupItem = {
  filename: string
  size: number
  created_at: string
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
      toast.success('Backup berhasil dibuat.')
      qc.invalidateQueries({ queryKey: ['admin-backups'] })
    },
    onError: () => toast.error('Gagal membuat backup.'),
  })

  const remove = useMutation({
    mutationFn: async (filename: string) =>
      api.delete(`/admin/backups/${encodeURIComponent(filename)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-backups'] })
      toast.success('File backup dihapus.')
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
    const xsrf = document.cookie
      .split('; ')
      .find((r) => r.startsWith('XSRF-TOKEN='))
      ?.split('=')
      .slice(1)
      .join('=')
    const res = await fetch(`/api/v1/admin/backups/${encodeURIComponent(filename)}/download`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
      },
    })
    if (!res.ok) {
      toast.error('Gagal mengunduh backup.')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Unduhan dimulai.')
  }

  const items = data?.backups || []

  return (
    <div>
      <AdminPageHeader
        title="Backup & restore"
        description="JSON portable: MySQL/MariaDB ↔ PostgreSQL (disarankan PG). Konten DB saja, bukan file media R2."
        actions={
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
          >
            <HardDriveDownload className="h-4 w-4" />
            {create.isPending ? 'Membuat…' : 'Buat backup'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold text-ink">Daftar backup</h2>
          <p className="mt-1 text-xs text-subtle">Disimpan di storage server (storage/app/backups).</p>

          {isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="mt-6 text-sm text-subtle">Belum ada backup. Klik “Buat backup”.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {items.map((b) => (
                <li
                  key={b.filename}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{b.filename}</p>
                    <p className="text-xs text-subtle">
                      {formatBytes(b.size)} · {new Date(b.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                          message: `“${b.filename}” akan dihapus dari server.`,
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
              ))}
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
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                  />
                  Merge (updateOrInsert)
                </label>
                <label className="inline-flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                  />
                  Replace (hapus dulu per tabel)
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
