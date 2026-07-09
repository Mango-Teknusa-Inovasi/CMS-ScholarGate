import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { api, type Achievement } from '../lib/api'
import { cn, formatDate, softMediaClass } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/seo/SeoHead'

export function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () =>
      (await api.get<{ data: Achievement[] }>('/achievements')).data,
  })

  return (
    <div>
      <SeoHead kind="page" page="prestasi" fallbackTitle="Prestasi | Scholargate" />
      <section className="page-hero-band">
        <div className="container-page py-10">
          <p className="mb-2 text-sm text-subtle">Beranda / Prestasi</p>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold text-ink">Prestasi</h1>
              <p className="text-subtle">Capaian unggulan ekosistem Scholargate</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        {isLoading ? (
          <p className="text-center text-subtle">Memuat...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.data || []).map((item, i) => (
              <Link
                key={item.id}
                to={`/prestasi/${item.slug}`}
                className="overflow-hidden rounded-[16px] border border-line bg-white shadow-sm transition hover:shadow-md"
              >
                <div className={cn('aspect-[16/10]', softMediaClass(i))} />
                <div className="p-5">
                  {item.badge_label && (
                    <Badge color="#F59E0B" className="mb-2">
                      {item.badge_label}
                    </Badge>
                  )}
                  <h2 className="text-lg font-bold text-ink">{item.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-subtle">{item.excerpt}</p>
                  <p className="mt-3 text-xs text-subtle">{formatDate(item.achieved_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
