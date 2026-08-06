import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useMemberAuth } from '../hooks/useMemberAuth'
import { Gravatar } from '../components/ui/Gravatar'
import { SeoHead } from '../components/seo/SeoHead'

export function MemberAccountPage() {
  const { user, loading, logout, isLoggedIn } = useMemberAuth()
  const navigate = useNavigate()

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
          className="mt-4 inline-flex rounded-[12px] bg-teal-500 px-4 py-2 text-sm font-semibold text-white"
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
      <SeoHead kind="page" page="artikel" fallbackTitle="Akun saya | Scholargate" />
      <section className="page-hero-band">
        <div className="container-page py-10">
          <p className="mb-2 text-sm text-subtle">Beranda / Akun</p>
          <h1 className="text-3xl font-bold text-ink">Akun saya</h1>
          <p className="mt-2 text-subtle">Area member portal Scholargate</p>
        </div>
      </section>

      <div className="container-page max-w-lg py-10">
        <div className="rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-4">
            <Gravatar
              url={user.gravatar_url}
              email={user.email}
              name={user.name}
              size={80}
              className="ring-4 ring-sky-50"
            />
            <div className="min-w-0">
              <p className="text-xl font-bold text-ink">{user.name}</p>
              <p className="text-sm text-subtle">{user.email}</p>
              <p className="mt-1 inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-teal-700 ring-1 ring-inset ring-teal-200/80">
                {user.role === 'admin' || user.role === 'editor' ? 'Staf / Admin' : 'Member'}
              </p>
            </div>
          </div>

          <p className="mt-6 rounded-[12px] bg-peach-soft px-4 py-3 text-xs leading-relaxed text-body">
            Foto profil memakai <strong>Gravatar</strong> (wajib) berdasarkan email akun. Ubah foto di{' '}
            <a
              href="https://gravatar.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-600 hover:underline"
            >
              gravatar.com
            </a>{' '}
            dengan email yang sama.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {user.is_admin && (
              <Link
                to="/admin"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600"
              >
                <User className="h-4 w-4" />
                Buka CMS Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberAccountPage
