import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, HardDriveDownload, Trash2, Upload } from 'lucide-react'
import { api, getAuthToken } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'

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
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: async () => (await api.get<{ backups: BackupItem[] }>('/admin/backups')).data,
  })

  const create = useMutation({
    mutationFn: async () => api.post('/admin/backups'),
    onSuccess: () => {
      setMsg('Backup berhasil dibuat.')
      setErr('')
      qc.invalidateQueries({ queryKey: ['admin-backups'] })
    },
    onError: () => setErr('Gagal membuat backup.'),
  })

  const remove = useMutation({
    mutationFn: async (filename: string) =>
      api.delete(`/admin/backups/${encodeURIComponent(filename)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-backups'] }),
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
      setErr('')
      const d = res.data as {
        tables?: number
        rows?: number
        mode?: string
        source?: string | null
        target?: string
        skipped?: string[]
      }
      const cross =
        d.source && d.target && d.source !== d.target
          ? ` · pindah DB ${d.source} → ${d.target}`
          : d.target
            ? ` · DB ${d.target}`
            : ''
      setMsg(
        `Restore OK · ${d.tables ?? 0} tabel · ${d.rows ?? 0} baris (${d.mode})${cross}`,
      )
      qc.invalidateQueries()
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      setErr(ax.response?.data?.message || 'Restore gagal.')
      setMsg('')
    },
  })

  const download = async (filename: string) => {
    const token = getAuthToken()
    const res = await fetch(`/api/v1/admin/backups/${encodeURIComponent(filename)}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      setErr('Gagal mengunduh backup.')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
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
                      onClick={() => {
                        if (confirm(`Hapus ${b.filename}?`)) remove.mutate(b.filename)
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
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                if (
                  mode === 'replace' &&
                  !confirm('Replace akan mengosongkan data tabel terkait dulu. Lanjut?')
                ) {
                  e.target.value = ''
                  return
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

      {msg && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {err}
        </p>
      )}
    </div>
  )
}
