import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, KeyRound, Loader2, LogOut, ShieldCheck, User, UserCheck } from 'lucide-react'
import { api, ensureCsrf } from '../lib/api'
import { useMemberAuth } from '../hooks/useMemberAuth'
import { Gravatar } from '../components/ui/Gravatar'
import { SeoHead } from '../components/seo/SeoHead'
import { useToast } from '../components/ui/Toast'

export function MemberAccountPage() {
  const { user, loading, logout, isLoggedIn, reload } = useMemberAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()

  // Form State Profile
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Form State Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const saveProfile = useMutation({
    mutationFn: async () => {
      setProfileError('')
      setProfileSuccess('')
      await ensureCsrf()
      const { data } = await api.put<{ user: any; message: string }>('/auth/profile', {
        name,
        email,
      })
      return data
    },
    onSuccess: (data) => {
      setProfileSuccess(data.message || 'Profil berhasil diperbarui.')
      toast.success(data.message || 'Profil diperbarui.')
      void reload()
      qc.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.name?.[0] ||
        err.response?.data?.message ||
        'Gagal memperbarui profil.'
      setProfileError(msg)
      toast.error(msg)
    },
  })

  const savePassword = useMutation({
    mutationFn: async () => {
      setPasswordError('')
      setPasswordSuccess('')
      if (newPassword !== confirmPassword) {
        throw new Error('Konfirmasi password baru tidak cocok.')
      }
      await ensureCsrf()
      const { data } = await api.put<{ message: string }>('/auth/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      return data
    },
    onSuccess: (data) => {
      setPasswordSuccess(data.message || 'Password berhasil diperbarui.')
      toast.success('Password diperbarui.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: any) => {
      const msg =
        err.message ||
        err.response?.data?.errors?.current_password?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.message ||
        'Gagal memperbarui password.'
      setPasswordError(msg)
      toast.error(msg)
    },
  })

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-subtle">Memuat akun…</div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="font-semibold text-ink">Anda belum masuk</p>
        <Link
          to="/login"
          className="mt-4 inline-flex rounded-[12px] bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          Login member
        </Link>
      </div>
    )
  }

  const onLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div>
      <SeoHead kind="page" page="artikel" fallbackTitle="Akun Saya | Scholargate" />
      
      <section className="page-hero-band">
        <div className="container-page py-8 md:py-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-600">
            Pengaturan Akun & Profil
          </p>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Akun Saya</h1>
          <p className="mt-1 text-sm text-subtle">
            Kelola identitas profil, email, dan keamanan kata sandi akun Anda.
          </p>
        </div>
      </section>

      <div className="container-page max-w-4xl py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          
          {/* Sidebar Ringkasan Akun */}
          <div className="space-y-6">
            <div className="rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-card)] text-center">
              <div className="flex justify-center mb-4">
                <Gravatar
                  url={user.gravatar_url}
                  email={user.email}
                  name={user.name}
                  size={96}
                  className="ring-4 ring-sky-100 shadow-sm"
                />
              </div>
              <h2 className="text-lg font-bold text-ink truncate">{user.name}</h2>
              <p className="text-xs text-subtle truncate mt-0.5">{user.email}</p>
              
              <div className="mt-3">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold capitalize text-sky-700 ring-1 ring-inset ring-sky-200/80">
                  {user.role === 'admin' || user.role === 'editor' ? 'Staf / Admin' : 'Member Portal'}
                </span>
              </div>

              <div className="mt-6 border-t border-line pt-5 space-y-2">
                {user.is_admin && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-600"
                  >
                    <User className="h-4 w-4" />
                    Buka Dashboard CMS
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Keluar
                </button>
              </div>
            </div>

            <div className="rounded-[16px] border border-line bg-surface p-4 text-xs leading-relaxed text-subtle space-y-2">
              <p className="font-semibold text-ink flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-sky-500" />
                Foto Profil Gravatar
              </p>
              <p>
                Foto profil otomatis tersinkronisasi menggunakan <strong>Gravatar</strong> berdasarkan alamat email Anda. Ubah foto di{' '}
                <a
                  href="https://gravatar.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-sky-600 underline"
                >
                  gravatar.com
                </a>.
              </p>
            </div>
          </div>

          {/* Form Pengaturan (Identitas & Password) */}
          <div className="space-y-6">
            
            {/* Form 1: Identitas Profil */}
            <section className="rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Identitas Profil</h2>
                  <p className="text-xs text-subtle">Perbarui nama lengkap dan email akun Anda</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveProfile.mutate()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                {profileSuccess && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {profileSuccess}
                  </p>
                )}
                {profileError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
                    {profileError}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveProfile.isPending}
                    className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-60"
                  >
                    {saveProfile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saveProfile.isPending ? 'Menyimpan…' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </section>

            {/* Form 2: Keamanan & Password */}
            <section className="rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Keamanan & Password</h2>
                  <p className="text-xs text-subtle">Ganti kata sandi akun secara berkala</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  savePassword.mutate()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Password Saat Ini
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Password Baru (Min 8 karakter)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                {passwordSuccess && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {passwordSuccess}
                  </p>
                )}
                {passwordError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
                    {passwordError}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savePassword.isPending}
                    className="inline-flex items-center gap-2 rounded-[12px] bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {savePassword.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {savePassword.isPending ? 'Memperbarui…' : 'Perbarui Password'}
                  </button>
                </div>
              </form>
            </section>

          </div>

        </div>
      </div>
    </div>
  )
}

export default MemberAccountPage
