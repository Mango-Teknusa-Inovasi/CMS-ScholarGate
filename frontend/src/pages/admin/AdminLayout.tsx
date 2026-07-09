import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  LayoutDashboard,
  Image,
  LogOut,
  Settings,
  Tags,
  ImageIcon,
  Users,
  HandHeart,
  Contact,
  Menu as MenuIcon,
  Trophy,
  Download,
  Layers,
  Building2,
  PanelTop,
  ExternalLink,
  X,
  ChevronRight,
  BookImage,
  Handshake,
  Images,
  UserCog,
} from 'lucide-react'
import { api, setAuthToken } from '../../lib/api'
import { cn } from '../../lib/utils'
import { Logo } from '../../components/ui/Logo'
import { Skeleton } from '../../components/ui/Skeleton'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Utama',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/articles', label: 'Artikel', icon: FileText },
      { to: '/admin/categories', label: 'Kategori', icon: Tags },
      { to: '/admin/media', label: 'Media', icon: Images },
    ],
  },
  {
    title: 'Tampilan portal',
    items: [
      { to: '/admin/menus', label: 'Menu navigasi', icon: MenuIcon },
      { to: '/admin/banners', label: 'Banner', icon: Image },
      { to: '/admin/welcome', label: 'Sambutan & foto', icon: HandHeart },
      { to: '/admin/profile-content', label: 'Konten profil', icon: Building2 },
      { to: '/admin/services', label: 'Layanan home', icon: Layers },
      { to: '/admin/gallery', label: 'Galeri', icon: ImageIcon },
      { to: '/admin/partners', label: 'Mitra / logo', icon: Handshake },
    ],
  },
  {
    title: 'Konten sekolah',
    items: [
      { to: '/admin/achievements', label: 'Prestasi', icon: Trophy },
      { to: '/admin/ekstrakurikuler', label: 'Ekstrakurikuler', icon: Users },
      { to: '/admin/contacts', label: 'Kontak', icon: Contact },
      { to: '/admin/quick-services', label: 'Layanan cepat', icon: PanelTop },
      { to: '/admin/downloads', label: 'Download', icon: Download },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { to: '/admin/users', label: 'Pengguna', icon: UserCog },
      { to: '/admin/media-guide', label: 'Ukuran gambar', icon: BookImage },
      { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
]

const pathTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/articles': 'Artikel',
  '/admin/articles/new': 'Tambah artikel',
  '/admin/media': 'Media',
  '/admin/users': 'Pengguna',
  '/admin/categories': 'Kategori',
  '/admin/menus': 'Menu navigasi',
  '/admin/banners': 'Banner',
  '/admin/welcome': 'Sambutan',
  '/admin/profile-content': 'Konten profil',
  '/admin/services': 'Layanan home',
  '/admin/gallery': 'Galeri',
  '/admin/partners': 'Mitra / logo',
  '/admin/achievements': 'Prestasi',
  '/admin/ekstrakurikuler': 'Ekstrakurikuler',
  '/admin/contacts': 'Kontak',
  '/admin/quick-services': 'Layanan cepat',
  '/admin/downloads': 'Download',
  '/admin/media-guide': 'Ukuran gambar',
  '/admin/settings': 'Pengaturan',
}

function resolvePageTitle(pathname: string): string {
  if (pathTitles[pathname]) return pathTitles[pathname]
  if (pathname.match(/^\/admin\/articles\/\d+\/edit$/)) return 'Edit artikel'
  if (pathname.endsWith('/new')) return 'Tambah baru'
  if (pathname.endsWith('/edit')) return 'Edit'
  return 'Admin'
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 p-3" aria-label="Menu admin">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-soft text-brand-dark shadow-sm'
                      : 'text-body hover:bg-muted hover:text-ink',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => (await api.get('/auth/me')).data,
    retry: false,
  })

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setAuthToken(null)
    navigate('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="w-full max-w-sm space-y-3 p-6">
          <Skeleton className="mx-auto h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
      </div>
    )
  }

  if (isError || !data?.user) {
    navigate('/admin/login')
    return null
  }

  const pageTitle = resolvePageTitle(location.pathname)
  const initials = data.user.name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line px-4 py-4">
          <Logo name="Scholargate" size="sm" to="/admin" />
          <p className="mt-1 px-0.5 text-xs text-subtle">Panel CMS</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-line p-3">
          <Link
            to="/"
            target="_blank"
            className="mb-1 inline-flex w-full items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm font-medium text-body hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            Lihat portal
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex w-full items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm font-medium text-body hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Logo name="Scholargate" size="sm" to="/admin" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-line p-2"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-line p-3">
              <button
                type="button"
                onClick={logout}
                className="inline-flex w-full items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm font-medium text-body hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 shadow-[var(--shadow-header)] backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-line bg-white p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="hidden items-center gap-1 text-xs text-subtle sm:flex">
                <span>Admin</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-body">{pageTitle}</span>
              </div>
              <p className="truncate text-sm font-semibold text-ink sm:hidden">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-[12px] border border-line px-3 py-2 text-xs font-semibold text-body hover:bg-muted sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Portal
            </Link>
            <div className="flex items-center gap-2.5 rounded-[12px] border border-line bg-page px-2.5 py-1.5 sm:px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-ink">{data.user.name}</p>
                <p className="truncate text-[11px] text-subtle">{data.user.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
