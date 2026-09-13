import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserPlus } from 'lucide-react'
import { easeOutExpo } from '../lib/motion'
import { ensureCsrf, api } from '../lib/api'
import { type AuthUser } from '../lib/auth'
import { useMemberAuth } from '../hooks/useMemberAuth'
import { useSiteName } from '../hooks/useSiteName'
import { Logo } from '../components/ui/Logo'
import { Skeleton } from '../components/ui/Skeleton'

export function MemberRegisterPage() {
  const siteName = useSiteName()
  const navigate = useNavigate()
  const { isLoggedIn, loading: authLoading } = useMemberAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isLoggedIn, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      await ensureCsrf()
      await api.post<{ user: AuthUser; token?: string }>('/auth/member/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } }
      }
      const errors = ax.response?.data?.errors
      const first =
        errors?.email?.[0] ||
        errors?.password?.[0] ||
        errors?.name?.[0] ||
        ax.response?.data?.message ||
        'Registrasi gagal. Coba lagi.'
      setError(String(first))
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <p className="text-center text-sm text-subtle">
            {isLoggedIn ? 'Mengalihkan…' : 'Memeriksa sesi…'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <motion.div
        className="w-full max-w-md rounded-[20px] border border-line bg-white p-8 shadow-[var(--shadow-card-hover)]"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center">
            <Logo name={siteName} size="sm" to="/" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Daftar Member</h1>
          <p className="mt-1 text-sm text-subtle">{"Buat akun portal resmi " + siteName}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="name">
              Nama lengkap
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              required
              autoComplete="email"
            />
            <p className="mt-1 text-[11px] text-subtle">
              Foto profil memakai Gravatar dari email ini.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password2">
              Ulangi password
            </label>
            <input
              id="password2"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-teal-500 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(20_184_166/0.3)] transition hover:bg-teal-600 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Mendaftar…' : 'Daftar sekarang'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-subtle">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-teal-600 hover:underline">
            Login member
          </Link>
        </p>
        <p className="mt-2 text-center text-xs">
          <Link to="/" className="text-subtle hover:text-ink">
            ← Kembali ke beranda
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default MemberRegisterPage
