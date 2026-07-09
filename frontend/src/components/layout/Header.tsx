import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, LogIn, Menu, MessageSquareWarning, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, type Settings } from '../../lib/api'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/Logo'

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
  return url.startsWith('/') && !url.startsWith('//')
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-1 rounded-[12px] px-3 py-2 text-sm font-medium text-body transition hover:bg-muted',
    isActive && 'bg-cyan-soft font-semibold text-cyan-mid',
  )

export function Header() {
  const [open, setOpen] = useState(false)
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
  })
  const { data: menus } = useQuery({
    queryKey: ['menus'],
    queryFn: async () =>
      (await api.get<{ header: MenuItem[]; footer: MenuItem[] }>('/menus')).data,
  })

  const siteName = settings?.site_name || 'Scholargate'
  const reportUrl = settings?.report_url || '#'
  const siteLogo = settings?.site_logo
  const nav = menus?.header?.length ? menus.header : fallbackNav

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 shadow-[var(--shadow-header)] backdrop-blur-md">
      <div className="container-page flex h-[72px] items-center justify-between gap-4 md:h-20">
        <Logo name={siteName} logoPath={siteLogo} />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
          {nav.map((item) =>
            item.children && item.children.length > 0 ? (
              <div key={item.id} className="group relative">
                <NavLink to={item.url || '#'} className={navClass}>
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-55 transition group-hover:rotate-180" />
                </NavLink>
                <div className="invisible absolute left-0 top-full z-20 min-w-[200px] translate-y-1 rounded-2xl border border-line bg-white p-1.5 opacity-0 shadow-[var(--shadow-card-hover)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) =>
                    isInternal(child.url) ? (
                      <Link
                        key={child.id}
                        to={child.url}
                        className="block rounded-xl px-3 py-2.5 text-sm text-body hover:bg-muted hover:text-ink"
                      >
                        {child.label}
                      </Link>
                    ) : (
                      <a
                        key={child.id}
                        href={child.url}
                        target={child.open_in_new_tab ? '_blank' : undefined}
                        rel="noreferrer"
                        className="block rounded-xl px-3 py-2.5 text-sm text-body hover:bg-muted"
                      >
                        {child.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            ) : isInternal(item.url) ? (
              <NavLink key={item.id} to={item.url} className={navClass} end={item.url === '/'}>
                {item.label}
              </NavLink>
            ) : (
              <a
                key={item.id}
                href={item.url}
                target={item.open_in_new_tab ? '_blank' : undefined}
                rel="noreferrer"
                className="rounded-[12px] px-3 py-2 text-sm font-medium text-body hover:bg-muted"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={reportUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-[12px] border border-brand/80 bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm hover:bg-brand-soft active:scale-[0.98]"
          >
            <MessageSquareWarning className="h-4 w-4" />
            Lapor
          </a>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 rounded-[12px] bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.3)] hover:bg-brand-dark active:scale-[0.98]"
          >
            Login
            <LogIn className="h-4 w-4" />
          </Link>
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

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <div className="container-page flex flex-col gap-0.5 py-3">
            {nav.map((item) => (
              <Link
                key={item.id}
                to={item.url || '#'}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-body hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 pb-2">
              <a
                href={reportUrl}
                className="flex-1 rounded-[12px] border border-brand px-3 py-2.5 text-center text-sm font-semibold text-brand"
              >
                Lapor
              </a>
              <Link
                to="/admin/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[12px] bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
