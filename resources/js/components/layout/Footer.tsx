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

  const siteName = settings?.site_name || 'Scholargate'
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
          <div className="mt-5 flex gap-2">
            {[
              {
                label: 'Facebook',
                href: settings?.social_facebook || '#',
                cls: 'bg-indigo-50 text-indigo-600 ring-indigo-200/80 hover:bg-indigo-100',
              },
              {
                label: 'Instagram',
                href: settings?.social_instagram || '#',
                cls: 'bg-pink-50 text-pink-600 ring-pink-200/80 hover:bg-pink-100',
              },
              {
                label: 'YouTube',
                href: settings?.social_youtube || '#',
                cls: 'bg-rose-50 text-rose-600 ring-rose-200/80 hover:bg-rose-100',
              },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-[11px] font-semibold ring-1 ring-inset transition ${s.cls}`}
                aria-label={s.label}
              >
                {s.label.slice(0, 2)}
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
