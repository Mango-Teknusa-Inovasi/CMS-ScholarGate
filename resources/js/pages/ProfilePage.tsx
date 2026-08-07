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
import { cn, coverSrc } from '../lib/utils'
import { SeoHead } from '../components/seo/SeoHead'
import { PageSkeleton } from '../components/ui/Skeleton'
import { SafeHtml } from '../components/ui/SafeHtml'
import { safeHref } from '../lib/sanitize'
import {
  BentoBoard,
  BentoEyebrow,
  BentoTile,
  PageBentoHero,
  PageBentoSection,
  PageBentoShell,
  type BentoTone,
} from '../components/ui/PageBento'

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

const contactTones: BentoTone[] = ['sky', 'mint', 'coral', 'amber', 'violet']
const serviceTones: BentoTone[] = ['sky', 'teal', 'mint', 'coral', 'amber', 'violet']

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
    <>
      <SeoHead kind="page" page="profil" fallbackTitle="Profil | Scholargate" />
      <PageBentoShell>
        <BentoBoard>
          <PageBentoHero
            crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Profil' }]}
            title={data.page?.title || 'Profil'}
            description={data.page?.subtitle}
            tone="peach"
            icon={<Building2 className="h-5 w-5 text-brand" strokeWidth={1.75} />}
          />

          {data.welcome && (
            <>
              {/* Foto pejabat — potret 4:5, selalu tampil (upload admin / fallback) */}
              <BentoTile
                tone="white"
                spanMd={2}
                spanLg={2}
                spanXl={4}
                rowSpan={2}
                padding="none"
                className="!p-0"
              >
                <div className="relative aspect-[4/5] w-full min-h-[280px] md:min-h-full">
                  <img
                    src={coverSrc(
                      data.welcome.image_url || data.welcome.image_path,
                      data.welcome.key || 'profile-welcome',
                      640,
                      800,
                    )}
                    alt={data.welcome.title || 'Foto pejabat'}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                    width={640}
                    height={800}
                  />
                  {data.welcome.badge_left && (
                    <span className="absolute left-3 top-4 z-10 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-brand shadow">
                      {data.welcome.badge_left}
                    </span>
                  )}
                  {data.welcome.badge_right && (
                    <span className="absolute bottom-4 right-3 z-10 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow">
                      {data.welcome.badge_right}
                    </span>
                  )}
                </div>
              </BentoTile>
              <BentoTile
                tone="peach"
                spanMd={2}
                spanLg={4}
                spanXl={8}
                rowSpan={2}
                padding="lg"
                className="flex flex-col justify-center"
              >
                <BentoEyebrow>Sambutan</BentoEyebrow>
                <h2 className="text-balance text-xl font-bold tracking-tight text-ink md:text-2xl">
                  {data.welcome.title}
                </h2>
                <SafeHtml
                  className="prose-article mt-4 max-w-none leading-relaxed text-body"
                  html={data.welcome.body}
                  plainFallback
                />
              </BentoTile>
            </>
          )}
        </BentoBoard>

        {data.contacts.length > 0 && (
          <PageBentoSection eyebrow="Kontak" title="Hubungi kami">
            <BentoBoard>
              {data.contacts.map((c, i) => {
                const Icon = iconMap[c.icon || ''] || MapPin
                const href = safeHref(c.link_url)
                return (
                  <BentoTile
                    key={c.id}
                    tone={contactTones[i % contactTones.length]}
                    spanMd={2}
                    spanLg={2}
                    spanXl={i === 0 ? 4 : 2}
                    padding="md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5">
                      <Icon className="h-5 w-5 text-brand" strokeWidth={1.75} />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">
                      {c.label}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm font-medium text-ink">
                      {c.value}
                    </p>
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100 transition hover:bg-white"
                      >
                        Buka tautan
                      </a>
                    )}
                  </BentoTile>
                )
              })}
            </BentoBoard>
          </PageBentoSection>
        )}

        {tabs.length > 0 && (
          <BentoBoard>
            <BentoTile
              tone="white"
              spanMd={4}
              spanLg={6}
              spanXl={12}
              padding="none"
              className="!col-span-2 !p-0 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
            >
              <div className="flex flex-wrap gap-1 border-b border-line bg-muted/40 p-2 md:p-2.5">
                {tabs.map((t, i) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(i)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      i === tab
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-subtle hover:bg-white hover:text-ink',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <SafeHtml className="prose-article p-5 md:p-8" html={active?.content_html} />
            </BentoTile>
          </BentoBoard>
        )}

        {data.quick_services.length > 0 && (
          <PageBentoSection
            eyebrow="Akses cepat"
            title="Layanan penting"
          >
            <BentoBoard>
              {data.quick_services.map((item, i) => {
                const Icon = iconMap[item.icon] || Sparkles
                const href = safeHref(item.link_url) || '#'
                return (
                  <BentoTile
                    key={item.id}
                    tone={serviceTones[i % serviceTones.length]}
                    spanMd={2}
                    spanLg={2}
                    spanXl={2}
                    padding="md"
                  >
                    <a
                      href={href}
                      {...(href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="flex h-full flex-col outline-none"
                    >
                      <div
                        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5"
                        style={
                          item.color
                            ? { color: item.color }
                            : undefined
                        }
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                      <h3 className="font-bold text-ink">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-subtle">{item.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                        {item.link_label || 'Buka'} →
                      </span>
                    </a>
                  </BentoTile>
                )
              })}
            </BentoBoard>
          </PageBentoSection>
        )}
      </PageBentoShell>
    </>
  )
}

export default ProfilePage
