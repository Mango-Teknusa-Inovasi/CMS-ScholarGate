import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../../lib/api'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@scholargate.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuthToken(data.token)
      navigate('/admin')
    } catch {
      setError('Email atau password tidak valid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md rounded-[20px] border border-line bg-white p-8 shadow-[var(--shadow-card-hover)]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white shadow-[0_2px_10px_rgb(14_165_233/0.3)]">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Login admin</h1>
          <p className="mt-1 text-sm text-subtle">CMS Scholargate</p>
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
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
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
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
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
            className="w-full rounded-[12px] bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.28)] hover:bg-brand-dark active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-subtle">
          Demo: admin@scholargate.test / password
        </p>
        <Link to="/" className="mt-3 block text-center text-sm font-medium text-brand hover:text-brand-dark">
          Kembali ke portal
        </Link>
      </div>
    </div>
  )
}
