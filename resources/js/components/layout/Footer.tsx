import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, type Settings } from '../../lib/api'
import { Logo } from '../ui/Logo'

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
  })
  const { data: menus } = useQuery({
    queryKey: ['menus'],
    queryFn: async () =>
      (await api.get<{ header: { id: number; label: string; url: string }[]; footer: { id: number; label: string; url: string }[] }>('/menus')).data,
  })

  const siteName = settings?.site_name || 'Portal Resmi'
  const footerLinks = menus?.footer?.length
    ? menus.footer
    : [
        { id: 1, label: 'Beranda', url: '/' },
        { id: 2, label: 'Profil', url: '/profil' },
        { id: 3, label: 'Artikel', url: '/artikel' },
        { id: 4, label: 'Prestasi', url: '/prestasi' },
        { id: 5, label: 'Ekstrakurikuler', url: '/ekstrakurikuler' },
        { id: 6, label: 'Download', url: '/download' },
      ]

  const mid = Math.ceil(footerLinks.length / 2)
  const colA = footerLinks.slice(0, mid)
  const colB = footerLinks.slice(mid)

  return (
    <footer className="mt-16 border-t border-line bg-footer">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo name={siteName} logoPath={settings?.site_logo} size="sm" to="/" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-subtle">
            {settings?.footer_text ||
              'Portal informasi dan layanan pendidikan terintegrasi berbasis teknologi.'}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[
              {
                label: 'Instagram',
                href: settings?.social_instagram || '#',
                cls: 'bg-pink-50 text-pink-600 ring-pink-200/80 hover:bg-pink-100 hover:scale-105',
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                ),
              },
              {
                label: 'Facebook',
                href: settings?.social_facebook || '#',
                cls: 'bg-indigo-50 text-indigo-600 ring-indigo-200/80 hover:bg-indigo-100 hover:scale-105',
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                ),
              },
              {
                label: 'TikTok',
                href: settings?.social_tiktok || '#',
                cls: 'bg-slate-900 text-white ring-slate-700 hover:bg-slate-800 hover:scale-105',
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.36 1.51-1.41 2.51-.12 1.45.86 2.87 2.27 3.26 1.25.37 2.67.06 3.61-.8.77-.67 1.22-1.68 1.24-2.7.04-4.83.01-9.67.02-14.5.01-.01.01-.02.02-.02z" />
                  </svg>
                ),
              },
              {
                label: 'YouTube',
                href: settings?.social_youtube || '#',
                cls: 'bg-rose-50 text-rose-600 ring-rose-200/80 hover:bg-rose-100 hover:scale-105',
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                ),
              },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href && s.href !== '#' ? s.href : '#'}
                target={s.href && s.href !== '#' ? '_blank' : '_self'}
                rel="noreferrer"
                className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset transition ${s.cls}`}
                aria-label={s.label}
                title={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold tracking-wide text-ink">Navigasi</h4>
          <ul className="space-y-2.5 text-sm text-subtle">
            {colA.map((l) => (
              <li key={l.id}>
                <Link to={l.url} className="hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold tracking-wide text-ink">Layanan</h4>
          <ul className="space-y-2.5 text-sm text-subtle">
            {colB.map((l) => (
              <li key={l.id}>
                <Link to={l.url} className="hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold tracking-wide text-ink">Kontak</h4>
          <ul className="space-y-2.5 text-sm text-subtle">
            {settings?.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="hover:text-brand">
                  {settings.contact_email}
                </a>
              </li>
            )}
            {settings?.contact_phone && <li>{settings.contact_phone}</li>}
            <li>
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700">
                Login member
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-4">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-center text-xs text-subtle sm:flex-row sm:text-left">
          <p>
            {settings?.copyright || `© ${new Date().getFullYear()} ${siteName}. Hak cipta dilindungi.`}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link to="/kebijakan-privasi" className="font-medium hover:text-brand">
              Kebijakan Privasi
            </Link>
            <span className="text-line" aria-hidden>
              ·
            </span>
            <Link to="/syarat-ketentuan" className="font-medium hover:text-brand">
              Syarat &amp; Ketentuan
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
