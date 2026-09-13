import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  MessageSquareWarning,
  User,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, type Settings } from '../../lib/api'
import { cn } from '../../lib/utils'
import { easeOutExpo } from '../../lib/motion'
import { Logo } from '../ui/Logo'
import { Gravatar } from '../ui/Gravatar'
import { useMemberAuth } from '../../hooks/useMemberAuth'
import { safeHref } from '../../lib/sanitize'

type MenuChild = {
  id: number
  label: string
  url: string
  open_in_new_tab?: boolean
}

type MenuItem = {
  id: number
  label: string
  url: string
  open_in_new_tab?: boolean
  children?: MenuChild[]
}

const fallbackNav: MenuItem[] = [
  { id: 1, label: 'Beranda', url: '/' },
  {
    id: 2,
    label: 'Profil',
    url: '/profil',
    children: [
      { id: 21, label: 'Tentang', url: '/profil' },
      { id: 22, label: 'Kontak', url: '/profil#kontak' },
    ],
  },
  { id: 3, label: 'Artikel', url: '/artikel' },
  { id: 4, label: 'Prestasi', url: '/prestasi' },
  { id: 5, label: 'Ekstrakurikuler', url: '/ekstrakurikuler' },
  { id: 6, label: 'Download', url: '/download' },
]

function isInternal(url: string) {
  const safe = safeHref(url)
  return Boolean(safe && safe.startsWith('/') && !safe.startsWith('//'))
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-1 rounded-[12px] px-3 py-2 text-sm font-medium text-body transition hover:bg-muted',
    isActive && 'bg-cyan-soft font-semibold text-cyan-mid',
  )

export function Header() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, loading: authLoading, isLoggedIn, logout } = useMemberAuth()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
  })
  const { data: menus } = useQuery({
    queryKey: ['menus'],
    queryFn: async () =>
      (await api.get<{ header: MenuItem[]; footer: MenuItem[] }>('/menus')).data,
  })

  const siteName = settings?.site_name || 'Portal Resmi'
  const reportUrl = safeHref(settings?.report_url) || '#'
  const siteLogo = settings?.site_logo
  const nav = menus?.header?.length ? menus.header : fallbackNav

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const onLogout = async () => {
    setAccountOpen(false)
    setOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 shadow-[var(--shadow-header)] backdrop-blur-md">
      <div className="container-page flex h-[72px] items-center justify-between gap-4 md:h-20">
        <Logo name={siteName} logoPath={siteLogo} />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
          {nav.map((item) =>
            item.children && item.children.length > 0 ? (
              <div key={item.url || item.id} className="group relative">
                <NavLink to={item.url || '#'} className={navClass}>
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-55 transition group-hover:rotate-180" />
                </NavLink>
                <div className="invisible absolute left-0 top-full z-20 min-w-[200px] translate-y-1 rounded-2xl border border-line bg-white p-1.5 opacity-0 shadow-[var(--shadow-card-hover)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) =>
                    isInternal(child.url) ? (
                      <Link
                        key={child.id}
                        to={safeHref(child.url) || '/'}
                        className="block rounded-xl px-3 py-2.5 text-sm text-body hover:bg-muted hover:text-ink"
                      >
                        {child.label}
                      </Link>
                    ) : safeHref(child.url) ? (
                      <a
                        key={child.id}
                        href={safeHref(child.url)}
                        target={child.open_in_new_tab ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="block rounded-xl px-3 py-2.5 text-sm text-body hover:bg-muted"
                      >
                        {child.label}
                      </a>
                    ) : (
                      <span
                        key={child.id}
                        className="block rounded-xl px-3 py-2.5 text-sm text-subtle"
                      >
                        {child.label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : isInternal(item.url) ? (
              <NavLink
                key={item.url || item.id}
                to={safeHref(item.url) || '/'}
                className={navClass}
                end={(safeHref(item.url) || '/') === '/'}
              >
                {item.label}
              </NavLink>
            ) : safeHref(item.url) ? (
              <a
                key={item.url || item.id}
                href={safeHref(item.url)}
                target={item.open_in_new_tab ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="rounded-[12px] px-3 py-2 text-sm font-medium text-body hover:bg-muted"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.url || item.id}
                className="rounded-[12px] px-3 py-2 text-sm font-medium text-subtle"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={reportUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-[12px] border border-rose-400/80 bg-white px-4 py-2 text-sm font-semibold text-rose-500 shadow-sm transition hover:bg-rose-50 active:scale-[0.98]"
          >
            <MessageSquareWarning className="h-4 w-4" />
            Lapor
          </a>

          {/* Member area: login ATAU menu akun + Gravatar */}
          {authLoading ? (
            <div className="h-10 w-28 animate-pulse rounded-[12px] bg-muted" />
          ) : isLoggedIn && user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-page py-1 pl-1 pr-2.5 text-sm font-semibold text-ink transition hover:bg-muted active:scale-[0.98]"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <Gravatar
                  url={user.gravatar_url}
                  email={user.email}
                  name={user.name}
                  size={32}
                />
                <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 text-subtle transition', accountOpen && 'rotate-180')}
                />
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: easeOutExpo }}
                    className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card-hover)]"
                  >
                    <div className="border-b border-line bg-peach-soft/50 px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Gravatar
                          url={user.gravatar_url}
                          email={user.email}
                          name={user.name}
                          size={40}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                          <p className="truncate text-[11px] text-subtle">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/akun"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-body hover:bg-muted"
                      >
                        <User className="h-4 w-4 text-sky-600" />
                        Akun saya
                      </Link>
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-body hover:bg-muted"
                        >
                          <User className="h-4 w-4 text-violet-600" />
                          Panel CMS
                        </Link>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void onLogout()}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-[12px] bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(20_184_166/0.3)] transition hover:bg-teal-600 active:scale-[0.98]"
            >
              Login
              <LogIn className="h-4 w-4" />
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl border border-line bg-white p-2.5 text-ink shadow-sm hover:bg-muted lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="overflow-hidden border-t border-line bg-white lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: easeOutExpo }}
          >
            <div className="container-page flex flex-col gap-0.5 py-3">
              {nav.map((item, i) => (
                <motion.div
                  key={item.url || item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 + i * 0.03, duration: 0.28, ease: easeOutExpo }}
                >
                  <Link
                    to={item.url || '#'}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-sm font-medium text-body hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {isLoggedIn && user ? (
                <div className="mt-2 space-y-2 border-t border-line pt-3 pb-2">
                  <div className="flex items-center gap-3 px-2">
                    <Gravatar
                      url={user.gravatar_url}
                      email={user.email}
                      name={user.name}
                      size={40}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-subtle">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/akun"
                    onClick={() => setOpen(false)}
                    className="block rounded-[12px] bg-sky-50 px-3 py-2.5 text-center text-sm font-semibold text-sky-700"
                  >
                    Akun saya
                  </Link>
                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="w-full rounded-[12px] bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2 pb-2">
                  <a
                    href={reportUrl}
                    className="flex-1 rounded-[12px] border border-rose-400/80 bg-white px-3 py-2.5 text-center text-sm font-semibold text-rose-500 hover:bg-rose-50"
                  >
                    Lapor
                  </a>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-[12px] bg-teal-500 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-600"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
