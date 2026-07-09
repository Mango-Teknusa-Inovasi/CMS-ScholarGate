import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { easeOutExpo } from '../../lib/motion'
import { useQueryClient } from '@tanstack/react-query'
import { adminLogin, getAdminToken } from '../../lib/auth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [email, setEmail] = useState('admin@scholargate.test')
  const [password, setPassword] = useState('Scholargate!Admin2026')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await adminLogin(email, password)
      if (!data?.token && !getAdminToken()) {
        setError('Login gagal: token tidak diterima.')
        return
      }
      // Bersihkan cache auth lama (member) agar panel admin fresh
      await qc.invalidateQueries({ queryKey: ['auth-me-admin'] })
      qc.removeQueries({ queryKey: ['auth-me'] })
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: { email?: string[] } } } }
      const msg =
        ax?.response?.data?.errors?.email?.[0] ||
        ax?.response?.data?.message ||
        'Email atau password tidak valid / bukan admin.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
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
          <motion.div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-lg font-bold text-white shadow-[0_2px_10px_rgb(20_184_166/0.3)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 360, damping: 22 }}
          >
            S
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Login Admin CMS</h1>
          <p className="mt-1 text-sm text-subtle">Panel pengelolaan konten — bukan member portal</p>
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
            <motion.p
              className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full rounded-[12px] bg-violet-500 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(139_92_246/0.3)] transition hover:bg-violet-600 disabled:opacity-60"
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.985 }}
          >
            {loading ? 'Masuk…' : 'Masuk CMS'}
          </motion.button>
        </form>
        <p className="mt-4 rounded-[12px] bg-peach-soft px-3 py-2 text-center text-[11px] leading-relaxed text-subtle">
          Demo admin: <code className="font-semibold text-ink">admin@scholargate.test</code>
          <br />
          Password: <code className="font-semibold text-ink">Scholargate!Admin2026</code>
        </p>
        <p className="mt-4 text-center text-xs text-subtle">
          Member portal?{' '}
          <Link to="/login" className="font-semibold text-teal-600 hover:underline">
            Login member
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
