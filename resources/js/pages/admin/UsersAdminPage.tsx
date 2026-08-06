import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type UserRow = {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export function UsersAdminPage() {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const toast = useToast()
  const [mode, setMode] = useState<'list' | 'new'>('list')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor',
  })

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<UserRow[]>('/admin/users')).data,
  })

  const save = useMutation({
    mutationFn: async () => api.post('/admin/users', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setMode('list')
      setForm({ name: '', email: '', password: '', role: 'editor' })
      toast.success('Pengguna baru ditambahkan.')
    },
    onError: () => toast.error('Gagal menambahkan pengguna.'),
  })

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Pengguna dihapus.')
    },
    onError: () => toast.error('Gagal menghapus pengguna.'),
  })

  if (mode === 'new') {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="rounded-xl border border-line p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-subtle">Pengguna / Tambah baru</p>
            <h1 className="text-2xl font-bold text-ink">Tambah pengguna</h1>
          </div>
        </div>
        <div className="mx-auto max-w-lg space-y-3 rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nama</label>
            <input
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Peran</label>
            <select
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="rounded-[12px] border border-line px-4 py-2.5 text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={save.isPending || !form.name || !form.email || form.password.length < 8}
              onClick={() => save.mutate()}
              className="rounded-[12px] bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:opacity-50"
            >
              {save.isPending ? 'Menyimpan…' : 'Tambah pengguna'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Pengguna"
        description="Kelola akun yang dapat masuk ke panel admin (admin & editor)."
        actions={
          <button
            type="button"
            onClick={() => setMode('new')}
            className="inline-flex items-center gap-2 rounded-[12px] bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Tambah pengguna
          </button>
        }
      />

      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Memuat pengguna">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
            ))}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-peach-soft/60 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                <th className="px-5 py-3.5">Nama</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Peran</th>
                <th className="hidden px-5 py-3.5 md:table-cell">Terdaftar</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-page/70">
                  <td className="px-5 py-4 font-semibold text-ink">{u.name}</td>
                  <td className="px-5 py-4 text-body">{u.email}</td>
                  <td className="px-5 py-4 capitalize text-body">{u.role}</td>
                  <td className="hidden px-5 py-4 text-subtle md:table-cell">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Hapus pengguna?',
                          message: `Akun “${u.name}” (${u.email}) akan dihapus dari panel admin.`,
                          confirmLabel: 'Ya, hapus',
                          tone: 'danger',
                        })
                        if (ok) remove.mutate(u.id)
                      }}
                      className="inline-flex items-center gap-1 rounded-[10px] bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Link to="/admin" className="hidden">
        x
      </Link>
    </div>
  )
}

export default UsersAdminPage
