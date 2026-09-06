import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Edit3,
  Key,
  Search,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  UserCheck,
  ShieldAlert,
} from 'lucide-react'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useConfirm } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'

type UserRow = {
  id: string | number
  name: string
  email: string
  role: string
  created_at: string
}

export function UsersAdminPage() {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)

  // New user form
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Edit user form
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'editor',
    password: '',
  })
  const [showEditPassword, setShowEditPassword] = useState(false)

  const { data = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<UserRow[]>('/admin/users')).data,
  })

  // Create user
  const createUser = useMutation({
    mutationFn: async () => api.post('/admin/users', newForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setIsNewModalOpen(false)
      setNewForm({ name: '', email: '', password: '', role: 'editor' })
      toast.success('Pengguna baru berhasil ditambahkan.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Gagal menambahkan pengguna.'
      toast.error(msg)
    },
  })

  // Update user (including Reset Password)
  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editingUser) return
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      }
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim()
      }
      return api.put(`/admin/users/${editingUser.id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setEditingUser(null)
      setEditForm({ name: '', email: '', role: 'editor', password: '' })
      toast.success('Data pengguna & password berhasil diperbarui.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Gagal memperbarui pengguna.'
      toast.error(msg)
    },
  })

  // Delete user
  const removeUser = useMutation({
    mutationFn: async (id: string | number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Pengguna telah dihapus.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Gagal menghapus pengguna.'
      toast.error(msg)
    },
  })

  const openEditModal = (user: UserRow) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'editor',
      password: '',
    })
    setShowEditPassword(false)
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
    let res = ''
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return res
  }

  // Filtered users
  const filteredUsers = data.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Manajemen Pengguna"
        description="Kelola akun admin dan editor CMS. Tambahkan pengguna baru, edit nama/email/role, serta reset password pengguna."
        actions={
          <button
            type="button"
            onClick={() => {
              setNewForm({ name: '', email: '', password: generateRandomPassword(), role: 'editor' })
              setShowNewPassword(true)
              setIsNewModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-[12px] bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah Pengguna Baru
          </button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[12px] border border-line bg-white pl-10 pr-4 py-2 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-subtle">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-[12px] border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-brand"
          >
            <option value="all">Semua Peran ({data.length})</option>
            <option value="admin">Admin ({data.filter((u) => u.role === 'admin').length})</option>
            <option value="editor">Editor ({data.filter((u) => u.role === 'editor').length})</option>
            <option value="member">Member Portal ({data.filter((u) => u.role === 'member').length})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Memuat pengguna">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-subtle">
            <UserCheck className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="font-medium">Tidak ada pengguna yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-peach-soft/60 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  <th className="px-5 py-3.5">Pengguna</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Peran</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Terdaftar</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((u) => {
                  const isAdminRole = u.role === 'admin'
                  const isEditorRole = u.role === 'editor'
                  return (
                    <tr key={u.id} className="hover:bg-page/70 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 uppercase">
                            {u.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-ink">{u.name}</p>
                            <p className="text-[11px] text-subtle md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-body font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            isAdminRole
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : isEditorRole
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isAdminRole ? 'Admin CMS' : isEditorRole ? 'Editor' : 'Member Portal'}
                        </span>
                      </td>
                      <td className="hidden px-5 py-4 text-subtle text-xs md:table-cell">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1.5 rounded-[10px] bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            title="Edit nama, email, role, & reset password"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                            Edit / Reset PW
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Hapus pengguna?',
                                message: `Akun “${u.name}” (${u.email}) akan dihapus dari panel admin. Tindakan ini tidak dapat dibatalkan.`,
                                confirmLabel: 'Ya, Hapus Pengguna',
                                tone: 'danger',
                              })
                              if (ok) removeUser.mutate(u.id)
                            }}
                            className="inline-flex items-center gap-1 rounded-[10px] bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                            title="Hapus pengguna"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[20px] border border-line bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Tambah Pengguna Baru</h3>
                <p className="text-xs text-subtle">Buat akun pengelola untuk panel admin CMS</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-xl border border-line p-1.5 text-subtle hover:bg-page hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Subagyo"
                  className="w-full rounded-[12px] border border-line bg-page px-3.5 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Email</label>
                <input
                  type="email"
                  placeholder="contoh@sman1gedeg.sch.id"
                  className="w-full rounded-[12px] border border-line bg-page px-3.5 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Peran (Role)</label>
                <select
                  className="w-full rounded-[12px] border border-line bg-page px-3.5 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                >
                  <option value="member">Member (Hanya akses akun member publik)</option>
                  <option value="editor">Editor (Bisa kelola artikel, galeri, media)</option>
                  <option value="admin">Admin (Akses penuh termasuk pengguna & backup)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-ink">Password</label>
                  <button
                    type="button"
                    onClick={() => setNewForm({ ...newForm, password: generateRandomPassword() })}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" /> ACAK PASSWORD
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-[12px] border border-line bg-page pl-3.5 pr-10 py-2 text-sm outline-none focus:border-brand focus:bg-white font-mono"
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-[12px] border border-line px-4 py-2 text-xs font-semibold text-body hover:bg-page"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={createUser.isPending || !newForm.name || !newForm.email || newForm.password.length < 8}
                  onClick={() => createUser.mutate()}
                  className="rounded-[12px] bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createUser.isPending ? 'Menyimpan…' : 'Simpan Pengguna'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Pengguna & Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[20px] border border-line bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Edit Pengguna & Reset Password</h3>
                <p className="text-xs text-subtle">
                  Perbarui profil atau reset password untuk <span className="font-semibold text-ink">{editingUser.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-xl border border-line p-1.5 text-subtle hover:bg-page hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Nama Lengkap</label>
                <input
                  type="text"
                  className="w-full rounded-[12px] border border-line bg-page px-3.5 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Email</label>
                <input
                  type="email"
                  className="w-full rounded-[12px] border border-line bg-page px-3.5 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Peran (Role)</label>
                <select
                  className="w-full rounded-[12px] border border-line bg-page px-3.5 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="member">Member (Hanya akses akun member publik)</option>
                  <option value="editor">Editor (Bisa kelola artikel, galeri, media)</option>
                  <option value="admin">Admin (Akses penuh termasuk pengguna & backup)</option>
                </select>
              </div>

              <div className="rounded-[14px] border border-amber-200 bg-amber-50/70 p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Key className="h-3.5 w-3.5 text-amber-700" />
                    Reset Password Pengguna
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({ ...editForm, password: generateRandomPassword() })
                      setShowEditPassword(true)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" /> ACAK PASSWORD
                  </button>
                </div>
                <p className="text-[11px] text-amber-700 mb-2">
                  Kosongkan jika tidak ingin mengubah password pengguna ini.
                </p>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Masukkan password baru (minimal 8 karakter)"
                    className="w-full rounded-[10px] border border-amber-300 bg-white pl-3 pr-10 py-1.5 text-sm outline-none focus:border-amber-500 font-mono"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 hover:text-amber-900"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-[12px] border border-line px-4 py-2 text-xs font-semibold text-body hover:bg-page"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={updateUser.isPending || !editForm.name || !editForm.email}
                  onClick={() => updateUser.mutate()}
                  className="rounded-[12px] bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateUser.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersAdminPage
