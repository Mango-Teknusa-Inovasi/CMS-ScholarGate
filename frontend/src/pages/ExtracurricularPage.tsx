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
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { softTones, toneAt } from '../lib/buttonTones'
import { cn } from '../lib/utils'

type Extracurricular = {
  id: number
  title: string
  description?: string
  icon?: string | null
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

export function ExtracurricularPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['ekstrakurikuler'],
    queryFn: async () => (await api.get<Extracurricular[]>('/ekstrakurikuler')).data,
  })

  return (
    <div>
      <SeoHead kind="page" page="ekstrakurikuler" fallbackTitle="Ekstrakurikuler | Scholargate" />
      <section className="page-hero-band" data-layer data-parallax="3">
        <div className="container-page py-10">
          <p className="mb-2 text-sm text-subtle">Beranda / Ekstrakurikuler</p>
          <h1 className="text-3xl font-bold text-ink">Ekstrakurikuler</h1>
          <p className="mt-2 max-w-2xl text-subtle">
            Daftar kegiatan ekstrakurikuler sekolah untuk mengembangkan bakat, minat, dan karakter siswa.
          </p>
        </div>
      </section>

      <div className="container-page py-10">
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : data.length === 0 ? (
          <p className="rounded-[16px] border border-line bg-surface p-8 text-center text-subtle">
            Belum ada data ekstrakurikuler.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-layer data-parallax="4">
            {data.map((item, i) => {
              const Icon = iconMap[item.icon || ''] || Sparkles
              const tone = softTones[toneAt(i)]
              const CardInner = (
                <>
                  <div
                    className={cn(
                      'mb-3 flex h-12 w-12 items-center justify-center rounded-2xl',
                      tone.chip,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-bold text-ink">{item.title}</h2>
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-subtle">{item.description}</p>
                  )}
                  <div className="mt-4 space-y-1.5 text-xs text-body">
                    {item.schedule && (
                      <p className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-70" style={{ color: tone.hex }} />
                        {item.schedule}
                      </p>
                    )}
                    {item.coach && (
                      <p className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 opacity-70" style={{ color: tone.hex }} />
                        Pembina: {item.coach}
                      </p>
                    )}
                  </div>
                  {item.url && (
                    <span
                      className={cn(
                        'mt-4 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                        tone.soft,
                      )}
                    >
                      Info & pendaftaran →
                    </span>
                  )}
                </>
              )

              const className =
                'rounded-[16px] border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'

              if (item.url) {
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target={item.open_in_new_tab ? '_blank' : undefined}
                    rel="noreferrer"
                    className={className}
                  >
                    {CardInner}
                  </a>
                )
              }

              return (
                <div key={item.id} className={className}>
                  {CardInner}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
