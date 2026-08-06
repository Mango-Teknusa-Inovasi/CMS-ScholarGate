import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Cpu,
  Flag,
  HeartPulse,
  Music,
  Sparkles,
  Trophy,
  Users,
  Calendar,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { SeoHead } from '../components/seo/SeoHead'
import { Skeleton } from '../components/ui/Skeleton'
import { mediaUrl } from '../lib/utils'
import { safeHref } from '../lib/sanitize'
import {
  BentoBoard,
  BentoTile,
  PageBentoHero,
  PageBentoShell,
  type BentoTone,
} from '../components/ui/PageBento'

type Extracurricular = {
  id: number
  title: string
  description?: string
  icon?: string | null
  logo_path?: string | null
  schedule?: string | null
  coach?: string | null
  url?: string | null
  open_in_new_tab?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Flag,
  Trophy,
  Music,
  Cpu,
  BookOpen,
  HeartPulse,
  Sparkles,
}

const tones: BentoTone[] = ['sky', 'teal', 'mint', 'coral', 'amber', 'violet', 'rose', 'peach']

export function ExtracurricularPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['ekstrakurikuler'],
    queryFn: async () => (await api.get<Extracurricular[]>('/ekstrakurikuler')).data,
  })

  return (
    <>
      <SeoHead kind="page" page="ekstrakurikuler" fallbackTitle="Ekstrakurikuler | Scholargate" />
      <PageBentoShell>
        <BentoBoard>
          <PageBentoHero
            crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Ekstrakurikuler' }]}
            title="Ekstrakurikuler"
            description="Kembangkan bakat, minat, dan karakter lewat kegiatan di luar kelas."
            tone="mint"
            icon={<Users className="h-5 w-5 text-teal-600" strokeWidth={1.75} />}
          />
        </BentoBoard>

        {isLoading ? (
          <BentoBoard>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="col-span-1 min-h-[180px] rounded-[22px] md:col-span-2 xl:col-span-4"
              />
            ))}
          </BentoBoard>
        ) : data.length === 0 ? (
          <BentoTile tone="white" span={12} spanMd={4} spanLg={6} spanXl={12} padding="lg">
            <p className="text-center text-subtle">Belum ada data ekstrakurikuler.</p>
          </BentoTile>
        ) : (
          <BentoBoard>
            {data.map((item, i) => {
              const Icon = iconMap[item.icon || ''] || Sparkles
              const logo = mediaUrl(item.logo_path)
              const safeUrl = item.url ? safeHref(item.url) : undefined
              const tone = tones[i % tones.length]

              const inner = (
                <>
                  {logo ? (
                    <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white p-1.5 shadow-sm">
                      <img
                        src={logo}
                        alt={`Logo ${item.title}`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-brand shadow-sm ring-1 ring-black/5">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                  )}
                  <h2 className="text-base font-bold text-ink md:text-lg">{item.title}</h2>
                  {item.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-subtle">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-4 space-y-1.5 text-xs text-body">
                    {item.schedule && (
                      <p className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        {item.schedule}
                      </p>
                    )}
                    {item.coach && (
                      <p className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 opacity-70" />
                        Pembina: {item.coach}
                      </p>
                    )}
                  </div>
                  {safeUrl && (
                    <span className="mt-4 inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand shadow-sm">
                      Info & pendaftaran →
                    </span>
                  )}
                </>
              )

              return (
                <BentoTile
                  key={item.id}
                  tone={tone}
                  spanMd={2}
                  spanLg={2}
                  spanXl={4}
                  padding="lg"
                  className="flex flex-col"
                >
                  {safeUrl ? (
                    <a
                      href={safeUrl}
                      target={item.open_in_new_tab ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex h-full flex-col outline-none"
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </BentoTile>
              )
            })}
          </BentoBoard>
        )}
      </PageBentoShell>
    </>
  )
}

export default ExtracurricularPage
