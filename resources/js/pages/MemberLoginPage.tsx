import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LogIn } from 'lucide-react'
import { easeOutExpo } from '../lib/motion'
import { memberLogin } from '../lib/auth'
import { useMemberAuth } from '../hooks/useMemberAuth'
import { Logo } from '../components/ui/Logo'
import { Skeleton } from '../components/ui/Skeleton'
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons'

export function MemberLoginPage() {
  const navigate = useNavigate()
  const { isLoggedIn, loading: authLoading } = useMemberAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Sudah login member → ke beranda
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isLoggedIn, navigate])

  const location = useLocation()

  // Tangkap error dari callback OAuth jika ada
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const err = params.get('error')
    if (err) setError(err)
  }, [location.search])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await memberLogin(email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Email atau password tidak valid.')
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
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <motion.div
        className="w-full max-w-md rounded-[20px] border border-line bg-white p-8 shadow-[var(--shadow-card-hover)]"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center">
            <Logo name="Scholargate" size="sm" to="/" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Masuk Member</h1>
          <p className="mt-1 text-sm text-subtle">
            Area anggota portal — bukan panel admin CMS.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
              required
              autoComplete="username"
            />
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
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
              required
              autoComplete="current-password"
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
            <LogIn className="h-4 w-4" />
            {loading ? 'Masuk…' : 'Masuk ke akun'}
          </button>
        </form>

        <SocialLoginButtons intent="member" />

        <p className="mt-6 text-center text-xs text-subtle">
          Belum punya akun?{' '}
          <Link to="/daftar" className="font-semibold text-teal-600 hover:underline">
            Daftar member
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-subtle">
          Admin CMS?{' '}
          <Link to="/admin/login" className="font-semibold text-sky-600 hover:underline">
            Login admin
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

export default MemberLoginPage
