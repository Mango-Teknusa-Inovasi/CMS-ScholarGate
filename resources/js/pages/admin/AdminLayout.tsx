import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
  ChevronDown,
  BookImage,
  Handshake,
  Images,
  UserCog,
  DatabaseBackup,
  Scale,
} from 'lucide-react'
import { api } from '../../lib/api'
import { adminLogout, setAdminToken, type AuthUser } from '../../lib/auth'
import { cn } from '../../lib/utils'
import {
  accordionPanel,
  drawerVariants,
  easeOutExpo,
  overlayVariants,
  springSnappy,
} from '../../lib/motion'
import { Logo } from '../../components/ui/Logo'
import { Skeleton } from '../../components/ui/Skeleton'
import { AnimatedPage } from '../../components/motion/PageTransition'
import { BrandIcons } from '../../components/seo/BrandIcons'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

type NavGroup = {
  id: string
  title: string
  items: NavItem[]
}

/** Always visible — not inside accordion */
const primaryNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
]

const navGroups: NavGroup[] = [
  {
    id: 'utama',
    title: 'Utama',
    items: [
      { to: '/admin/articles', label: 'Artikel', icon: FileText },
      { to: '/admin/media', label: 'Media', icon: Images },
      { to: '/admin/categories', label: 'Kategori', icon: Tags },
    ],
  },
  {
    id: 'portal',
    title: 'Portal',
    items: [
      { to: '/admin/banners', label: 'Banner', icon: Image },
      { to: '/admin/welcome', label: 'Sambutan', icon: HandHeart },
      { to: '/admin/menus', label: 'Menu', icon: MenuIcon },
      { to: '/admin/services', label: 'Layanan', icon: Layers },
      { to: '/admin/gallery', label: 'Galeri', icon: ImageIcon },
      { to: '/admin/partners', label: 'Mitra', icon: Handshake },
      { to: '/admin/profile-content', label: 'Profil', icon: Building2 },
      { to: '/admin/legal', label: 'Syarat & Privasi', icon: Scale },
    ],
  },
  {
    id: 'sekolah',
    title: 'Sekolah',
    items: [
      { to: '/admin/achievements', label: 'Prestasi', icon: Trophy },
      { to: '/admin/ekstrakurikuler', label: 'Ekskul', icon: Users },
      { to: '/admin/downloads', label: 'Download', icon: Download },
      { to: '/admin/contacts', label: 'Kontak', icon: Contact },
      { to: '/admin/quick-services', label: 'Akses cepat', icon: PanelTop },
    ],
  },
  {
    id: 'sistem',
    title: 'Sistem',
    items: [
      { to: '/admin/users', label: 'Pengguna', icon: UserCog },
      { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
      { to: '/admin/backups', label: 'Backup', icon: DatabaseBackup },
      { to: '/admin/media-guide', label: 'Ukuran gambar', icon: BookImage },
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
  '/admin/menus': 'Menu',
  '/admin/banners': 'Banner',
  '/admin/welcome': 'Sambutan',
  '/admin/profile-content': 'Profil',
  '/admin/legal': 'Syarat & Privasi',
  '/admin/services': 'Layanan',
  '/admin/gallery': 'Galeri',
  '/admin/partners': 'Mitra',
  '/admin/achievements': 'Prestasi',
  '/admin/ekstrakurikuler': 'Ekskul',
  '/admin/contacts': 'Kontak',
  '/admin/quick-services': 'Akses cepat',
  '/admin/downloads': 'Download',
  '/admin/media-guide': 'Ukuran gambar',
  '/admin/settings': 'Pengaturan',
  '/admin/backups': 'Backup & restore',
}

function resolvePageTitle(pathname: string): string {
  if (pathTitles[pathname]) return pathTitles[pathname]
  if (pathname.match(/^\/admin\/articles\/\d+\/edit$/)) return 'Edit artikel'
  if (pathname.endsWith('/new')) return 'Tambah baru'
  if (pathname.endsWith('/edit')) return 'Edit'
  return 'Admin'
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(item.to + '/')
}

function groupHasActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isItemActive(pathname, item))
}

function NavItemLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  const reduce = useReducedMotion()

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium',
          isActive
            ? 'bg-brand-soft text-brand-dark'
            : 'text-body hover:bg-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <motion.span
          className="flex w-full items-center gap-2.5"
          whileHover={reduce ? undefined : { x: 2 }}
          whileTap={reduce ? undefined : { scale: 0.985 }}
          transition={springSnappy}
        >
          <motion.span
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand"
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              scaleY: isActive ? 1 : 0.4,
            }}
            transition={{ duration: 0.22, ease: easeOutExpo }}
            aria-hidden
          />
          <item.icon
            className={cn(
              'h-[17px] w-[17px] shrink-0 transition-opacity',
              isActive ? 'text-brand-dark opacity-100' : 'opacity-70 group-hover:opacity-100',
            )}
            strokeWidth={1.75}
          />
          <span className="truncate">{item.label}</span>
        </motion.span>
      )}
    </NavLink>
  )
}

function SidebarNav({
  pathname,
  onNavigate,
  isSuperAdmin,
}: {
  pathname: string
  onNavigate?: () => void
  isSuperAdmin?: boolean
}) {
  const reduce = useReducedMotion()
  const visibleGroups = navGroups
    .map((group) => {
      if (isSuperAdmin) return group
      const filtered = group.items.filter(
        (item) => item.to !== '/admin/users' && item.to !== '/admin/backups',
      )
      return { ...group, items: filtered }
    })
    .filter((group) => group.items.length > 0)

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    visibleGroups.forEach((group) => {
      init[group.id] = groupHasActive(pathname, group)
    })
    return init
  })

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <nav className="space-y-3 px-2 py-3" aria-label="Navigasi Admin">
      {/* Primary (Dashboard) */}
      <div className="space-y-0.5">
        {primaryNav.map((item) => (
          <NavItemLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Accordion groups */}
      {visibleGroups.map((group) => {
        const isOpen = openGroups[group.id] ?? false
        const hasActive = groupHasActive(pathname, group)

        return (
          <div key={group.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-[10px] px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition',
                hasActive ? 'text-brand-dark' : 'text-subtle hover:text-ink',
              )}
            >
              <span>{group.title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2, ease: easeOutExpo }}
              >
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul
                  variants={accordionPanel}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pl-1.5 pt-0.5">
                    {group.items.map((item, i) => (
                      <motion.li
                        key={item.to}
                        initial={reduce ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <NavItemLink item={item} onNavigate={onNavigate} />
                      </motion.li>
                    ))}
                  </div>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )
}

function SidebarChrome({
  pathname,
  userName,
  userEmail,
  userInitials,
  onLogout,
  onNavigate,
  showClose,
  onClose,
  isSuperAdmin,
  settings,
}: {
  pathname: string
  userName: string
  userEmail: string
  userInitials: string
  onLogout: () => void
  onNavigate?: () => void
  showClose?: boolean
  onClose?: () => void
  isSuperAdmin?: boolean
  settings?: Record<string, string>
}) {
  const siteTitle = settings?.site_title || settings?.school_name || 'Scholargate'
  const siteLogo = settings?.site_logo || settings?.logo_path || null
  const panelSubtitle = `Panel CMS — ${siteTitle}`

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-3.5">
        <div className="min-w-0">
          <Logo name={siteTitle} logoPath={siteLogo} size="sm" to="/admin" />
          <p className="mt-1 pl-0.5 truncate text-[11px] font-medium text-subtle" title={panelSubtitle}>
            {panelSubtitle}
          </p>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line p-2 text-body hover:bg-muted active:scale-95"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <SidebarNav pathname={pathname} onNavigate={onNavigate} isSuperAdmin={isSuperAdmin} />
      </div>

      <div className="border-t border-line bg-peach-soft/40 p-2.5">
        <div className="mb-2 flex items-center gap-2.5 rounded-[12px] border border-line bg-white px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[11px] font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{userName}</p>
            <p className="truncate text-[11px] text-subtle">{userEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <Link
            to="/"
            target="_blank"
            onClick={onNavigate}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-xs font-semibold text-body transition hover:bg-white active:scale-[0.98]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Portal
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-xs font-semibold text-body transition hover:bg-white active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}

export function AdminLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const page = usePage<{ auth?: { user: AuthUser | null } }>()
  const sharedUser = page.props.auth?.user ?? null
  const [mobileOpen, setMobileOpen] = useState(false)
  const reduce = useReducedMotion()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth-me-admin', sharedUser?.id ?? 'session'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data as { user: AuthUser }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    initialData: sharedUser?.is_admin || sharedUser?.role === 'admin' || sharedUser?.role === 'editor'
      ? { user: sharedUser }
      : undefined,
  })

  const { data: publicSettings } = useQuery<Record<string, string>>({
    queryKey: ['public-settings'],
    queryFn: async () => (await api.get('/settings/public')).data,
    staleTime: 1000 * 60 * 5,
  })

  const isSuperAdmin =
    data?.user?.is_super_admin === true || data?.user?.role === 'admin'

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Editor tidak boleh buka users / backups
  useEffect(() => {
    if (!data?.user) return
    const path = location.pathname
    const needsSuper =
      path.startsWith('/admin/users') || path.startsWith('/admin/backups')
    if (needsSuper && !isSuperAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [data?.user, isSuperAdmin, location.pathname, navigate])

  const logout = async () => {
    setAdminToken(null)
    await adminLogout()
  }

  const user = data?.user
  const canAccessAdmin =
    !!user && (user.is_admin === true || user.role === 'admin' || user.role === 'editor')

  useEffect(() => {
    if (isLoading) return
    if (isError || !user || !canAccessAdmin) {
      setAdminToken(null)
      if (location.pathname !== '/admin/login') {
        navigate('/admin/login', { replace: true })
      }
    }
  }, [isLoading, isError, user, canAccessAdmin, location.pathname, navigate])

  if (isLoading || isError || !user || !canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <motion.div
          className="w-full max-w-sm space-y-3 p-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
        >
          <Skeleton className="mx-auto h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mx-auto h-4 w-40" />
        </motion.div>
      </div>
    )
  }

  const siteTitle = publicSettings?.site_title || publicSettings?.school_name || 'Scholargate'
  const pageTitle = resolvePageTitle(location.pathname)
  const documentTitle = `${pageTitle} — ${siteTitle}`

  const initials = user.name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const chromeProps = {
    pathname: location.pathname,
    userName: user.name,
    userEmail: user.email,
    userInitials: initials,
    onLogout: logout,
    isSuperAdmin,
    settings: publicSettings,
  }

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[248px_1fr]">
      <Helmet>
        <title>{documentTitle}</title>
      </Helmet>
      <BrandIcons />
      <motion.aside
        className="sticky top-0 hidden h-screen flex-col border-r border-line bg-white lg:flex"
        initial={reduce ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: easeOutExpo }}
      >
        <SidebarChrome {...chromeProps} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-white shadow-xl"
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <SidebarChrome
                {...chromeProps}
                showClose
                onClose={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 shadow-[var(--shadow-header)] backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-line bg-white p-2 transition active:scale-95 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="hidden items-center gap-1 text-xs text-subtle sm:flex">
                <span>Admin</span>
                <ChevronRight className="h-3 w-3" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={pageTitle}
                    className="font-medium text-body"
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: easeOutExpo }}
                  >
                    {pageTitle}
                  </motion.span>
                </AnimatePresence>
              </div>
              <p className="truncate text-sm font-semibold text-ink sm:hidden">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-[12px] border border-line px-3 py-2 text-xs font-semibold text-body transition hover:bg-muted active:scale-[0.98] sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Portal
            </Link>
            <div className="flex items-center gap-2.5 rounded-[12px] border border-line bg-page px-2.5 py-1.5 sm:px-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="truncate text-[11px] text-subtle">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          <AnimatedPage>{children}</AnimatedPage>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
