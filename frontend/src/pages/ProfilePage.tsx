import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Building2,
  Calendar,
  Download,
  FileText,
  HandCoins,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  Printer,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { api, type ContactInfo, type QuickService, type WelcomeBlock } from '../lib/api'
import { cn } from '../lib/utils'
import { SeoHead } from '../components/seo/SeoHead'
import { PageSkeleton } from '../components/ui/Skeleton'
import { softTones, toneAt } from '../lib/buttonTones'
import { SafeHtml } from '../components/ui/SafeHtml'
import { safeHref } from '../lib/sanitize'

const iconMap: Record<string, LucideIcon> = {
  'map-pin': MapPin,
  mail: Mail,
  phone: Phone,
  printer: Printer,
  map: MapPin,
  'file-text': FileText,
  'badge-check': BadgeCheck,
  calendar: Calendar,
  'hand-coins': HandCoins,
  newspaper: Newspaper,
  download: Download,
}

type ProfilePayload = {
  page: {
    title: string
    subtitle?: string
    tabs: { key: string; label: string; content_html: string }[]
  } | null
  welcome: WelcomeBlock | null
  contacts: ContactInfo[]
  quick_services: QuickService[]
}

export function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get<ProfilePayload>('/profile')).data,
  })
  const [tab, setTab] = useState(0)

  if (isLoading || !data) {
    return <PageSkeleton />
  }

  const tabs = data.page?.tabs || []
  const active = tabs[tab]

  return (
    <div>
      <SeoHead kind="page" page="profil" fallbackTitle="Profil | Scholargate" />
      <section className="page-hero-band" data-layer data-parallax="3">
        <div className="container-page py-10">
          <p className="mb-2 text-sm text-subtle">Beranda / Profil</p>
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-xl bg-white p-2 shadow-sm">
              <Building2 className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ink">{data.page?.title || 'Profil'}</h1>
              {data.page?.subtitle && (
                <p className="mt-2 max-w-2xl text-subtle">{data.page.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {data.welcome && (
        <section className="container-page py-10">
          <div className="grid items-center gap-8 rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-card)] md:grid-cols-[260px_1fr] md:p-8">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-[20px] border border-line">
              <img
                src={
                  data.welcome.image_path
                    ? `/storage/${String(data.welcome.image_path).replace(/^\/?storage\//, '')}`
                    : 'https://picsum.photos/seed/scholargate-profile-welcome/640/800'
                }
                alt={data.welcome.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {data.welcome.badge_left && (
                <span className="absolute left-3 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-brand shadow">
                  {data.welcome.badge_left}
                </span>
              )}
              {data.welcome.badge_right && (
                <span className="absolute bottom-4 right-3 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow">
                  {data.welcome.badge_right}
                </span>
              )}
            </div>
            <div className="rounded-[16px] bg-peach p-6 md:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">Sambutan</p>
              <h2 className="text-balance text-2xl font-bold tracking-tight text-ink">{data.welcome.title}</h2>
              <SafeHtml
                className="prose-article mt-4 leading-relaxed text-body"
                html={data.welcome.body}
                plainFallback
              />
            </div>
          </div>
        </section>
      )}

      <section id="kontak" className="container-page pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.contacts.map((c, i) => {
            const Icon = iconMap[c.icon || ''] || MapPin
            const tone = softTones[toneAt(i)]
            return (
              <div
                key={c.id}
                className="rounded-[16px] border border-line bg-white p-4 shadow-sm"
              >
                <div
                  className={cn(
                    'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
                    tone.chip,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-subtle">{c.label}</p>
                <p className="mt-1 whitespace-pre-line text-sm font-medium text-ink">{c.value}</p>
                {safeHref(c.link_url) && (
                  <a
                    href={safeHref(c.link_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'mt-3 inline-flex rounded-[12px] px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98]',
                      softTones.sky.solid,
                    )}
                  >
                    Buka Google Maps
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {tabs.length > 0 && (
        <section className="container-page pb-10">
          <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-sm">
            <div className="flex flex-wrap gap-1 border-b border-line p-2">
              {tabs.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => setTab(i)}
                  className={cn(
                    'rounded-[12px] px-4 py-2 text-sm font-semibold transition',
                    i === tab
                      ? softTones[toneAt(i)].soft
                      : 'text-subtle hover:bg-muted',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <SafeHtml className="prose-article p-6 md:p-8" html={active?.content_html} />
          </div>
        </section>
      )}

      <section className="container-page pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink">Layanan Cepat</h2>
          <p className="mt-1 text-subtle">
            Akses layanan dan halaman penting yang sering dibutuhkan.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {data.quick_services.map((item, i) => {
            const Icon = iconMap[item.icon] || Sparkles
            const tone = softTones[toneAt(i)]
            const href = safeHref(item.link_url) || '#'
            return (
              <a
                key={item.id}
                href={href}
                {...(href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="rounded-[16px] border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={cn(
                    'mb-3 flex h-12 w-12 items-center justify-center rounded-2xl',
                    tone.chip,
                  )}
                  style={
                    item.color
                      ? { backgroundColor: `${item.color}18`, color: item.color }
                      : undefined
                  }
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-xs text-subtle">{item.description}</p>
                <span
                  className={cn(
                    'mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                    tone.soft,
                  )}
                >
                  {item.link_label || 'Buka'} →
                </span>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
