import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { api, type Achievement } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton'
import { SafeHtml } from '../components/ui/SafeHtml'
import {
  BentoBoard,
  BentoTile,
  PageBentoShell,
} from '../components/ui/PageBento'

export function AchievementDetailPage() {
  const { slug } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['achievement', slug],
    queryFn: async () => (await api.get<Achievement>(`/achievements/${slug}`)).data,
    enabled: !!slug,
  })

  if (isLoading) {
    return <PageSkeleton />
  }
  if (isError || !data) {
    return (
      <PageBentoShell>
        <BentoTile tone="coral" span={12} spanMd={4} spanLg={6} spanXl={12} padding="lg">
          <p className="text-center font-medium text-ink">Prestasi tidak ditemukan.</p>
          <div className="mt-4 text-center">
            <Link
              to="/prestasi"
              className="inline-flex rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950"
            >
              Kembali
            </Link>
          </div>
        </BentoTile>
      </PageBentoShell>
    )
  }

  const body = (data as Achievement & { body?: string }).body

  return (
    <PageBentoShell>
      <BentoBoard>
        <BentoTile
          tone="amber"
          spanMd={4}
          spanLg={6}
          spanXl={12}
          padding="lg"
          className="!col-span-2 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
        >
          <nav className="mb-3 text-xs font-medium text-subtle md:text-sm">
            <Link to="/" className="hover:text-brand">
              Beranda
            </Link>
            <span className="mx-1.5">/</span>
            <Link to="/prestasi" className="hover:text-brand">
              Prestasi
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-body">Detail</span>
          </nav>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-amber-600 shadow-sm">
              <Trophy className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              {data.badge_label && (
                <Badge color="#B45309" className="mb-2">
                  {data.badge_label}
                </Badge>
              )}
              <h1 className="max-w-3xl text-balance text-2xl font-bold text-ink md:text-3xl">
                {data.title}
              </h1>
              <p className="mt-2 text-sm text-subtle">{formatDate(data.achieved_at)}</p>
            </div>
          </div>
        </BentoTile>

        <BentoTile
          tone="white"
          spanMd={4}
          spanLg={4}
          spanXl={8}
          padding="none"
          className="!p-0 hover:translate-y-0"
        >
          <div className="media-cover aspect-[16/9] w-full">
            <img
              src={coverSrc(data.cover_path, data.slug || data.id, 1400, 800)}
              alt={data.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="p-5 md:p-8">
            {data.excerpt && (
              <p className="text-lg leading-relaxed text-body">{data.excerpt}</p>
            )}
            <SafeHtml className="prose-article mt-6 max-w-none" html={body} />
          </div>
        </BentoTile>

        <BentoTile tone="mint" spanMd={4} spanLg={2} spanXl={4} padding="lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
            Lihat lainnya
          </p>
          <p className="mt-2 text-sm text-subtle">
            Jelajahi capaian unggulan lainnya di portal prestasi.
          </p>
          <Link
            to="/prestasi"
            className="mt-4 inline-flex rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600"
          >
            Semua prestasi
          </Link>
        </BentoTile>
      </BentoBoard>
    </PageBentoShell>
  )
}

export default AchievementDetailPage
