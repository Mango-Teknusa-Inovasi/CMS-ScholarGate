import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { api, type Achievement } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/seo/SeoHead'
import { Skeleton } from '../components/ui/Skeleton'
import {
  BentoBoard,
  BentoTile,
  PageBentoHero,
  PageBentoShell,
  type BentoTone,
} from '../components/ui/PageBento'

const tones: BentoTone[] = ['amber', 'coral', 'mint', 'violet', 'sky', 'peach']

export function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () =>
      (await api.get<{ data: Achievement[] }>('/achievements')).data,
  })

  const items = data?.data || []

  return (
    <>
      <SeoHead kind="page" page="prestasi" fallbackTitle="Prestasi | Scholargate" />
      <PageBentoShell>
        <BentoBoard>
          <PageBentoHero
            crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Prestasi' }]}
            title="Prestasi"
            description="Capaian unggulan peserta didik dan ekosistem Scholargate."
            tone="amber"
            icon={<Trophy className="h-5 w-5 text-amber-600" strokeWidth={1.75} />}
          />
        </BentoBoard>

        {isLoading ? (
          <BentoBoard>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="col-span-1 min-h-[200px] rounded-[22px] md:col-span-2 lg:col-span-2 xl:col-span-4"
              />
            ))}
          </BentoBoard>
        ) : items.length === 0 ? (
          <BentoTile tone="white" span={12} spanMd={4} spanLg={6} spanXl={12} padding="lg">
            <p className="text-center text-subtle">Belum ada data prestasi.</p>
          </BentoTile>
        ) : (
          <BentoBoard>
            {items.map((item, i) => {
              const big = i === 0
              return (
                <BentoTile
                  key={item.id}
                  tone={tones[i % tones.length]}
                  spanMd={big ? 4 : 2}
                  spanLg={big ? 3 : 2}
                  spanXl={big ? 6 : 3}
                  padding="none"
                  className="!p-0"
                >
                  <Link
                    to={`/prestasi/${item.slug}`}
                    className="flex h-full min-h-[220px] flex-col"
                  >
                    <div
                      className={
                        big
                          ? 'media-cover aspect-[16/9] w-full md:aspect-[21/9]'
                          : 'media-cover aspect-[16/10] w-full'
                      }
                    >
                      <img
                        src={coverSrc(item.cover_path, item.slug || item.id, 900, 560)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      {item.badge_label && (
                        <Badge color="#B45309" className="mb-2 w-fit">
                          {item.badge_label}
                        </Badge>
                      )}
                      <h2
                        className={
                          big
                            ? 'text-lg font-bold text-ink md:text-xl'
                            : 'line-clamp-2 text-sm font-bold text-ink md:text-base'
                        }
                      >
                        {item.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-xs text-subtle md:text-sm">
                        {item.excerpt}
                      </p>
                      <p className="mt-auto pt-3 text-[11px] font-medium text-subtle">
                        {formatDate(item.achieved_at)}
                      </p>
                    </div>
                  </Link>
                </BentoTile>
              )
            })}
          </BentoBoard>
        )}
      </PageBentoShell>
    </>
  )
}
