import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Head } from '@inertiajs/react'
import {
  Trophy,
  Newspaper,
  ArrowRight,
  Eye,
  Calendar,
  Sparkles,
  Share2,
} from 'lucide-react'
import { api, type Achievement, type Article, type Settings } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton'
import { SafeHtml } from '../components/ui/SafeHtml'
import { ShareButton } from '../components/ShareButton'
import {
  BentoBoard,
  BentoTile,
  PageBentoShell,
} from '../components/ui/PageBento'

type AchievementDetailData = Achievement & {
  body?: string
  other_achievements?: Achievement[]
  recent_articles?: Article[]
}

export function AchievementDetailPage() {
  const { slug } = useParams()

  // 1. Fetch main achievement detail
  const { data, isLoading, isError } = useQuery({
    queryKey: ['achievement', slug],
    queryFn: async () => (await api.get<AchievementDetailData>(`/achievements/${slug}`)).data,
    enabled: !!slug,
  })

  // 2. Fetch public settings (social media links, etc.)
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
  })

  // 3. Fallback queries for other achievements & articles in case of cached response
  const { data: fallbackAchievements } = useQuery({
    queryKey: ['achievements-fallback'],
    queryFn: async () => (await api.get<{ data: Achievement[] }>('/achievements?per_page=6')).data,
    enabled: !data?.other_achievements || data.other_achievements.length === 0,
  })

  const { data: fallbackArticles } = useQuery({
    queryKey: ['articles-fallback'],
    queryFn: async () => (await api.get<{ data: Article[] }>('/articles?per_page=6')).data,
    enabled: !data?.recent_articles || data.recent_articles.length === 0,
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
              Kembali ke Daftar Prestasi
            </Link>
          </div>
        </BentoTile>
      </PageBentoShell>
    )
  }

  const body = data.body || ''

  // Filter out the current achievement from recommendations
  const otherAchievements = (
    data.other_achievements && data.other_achievements.length > 0
      ? data.other_achievements
      : fallbackAchievements?.data || []
  )
    .filter((item) => item.slug !== slug && item.id !== data.id)
    .slice(0, 5)

  const recentArticles = (
    data.recent_articles && data.recent_articles.length > 0
      ? data.recent_articles
      : fallbackArticles?.data || []
  ).slice(0, 5)

  return (
    <>
      <Head title={`${data.title} - Prestasi`} />
      <PageBentoShell>
        {/* Header Breadcrumb & Title Banner */}
        <BentoBoard>
          <BentoTile
            tone="amber"
            spanMd={4}
            spanLg={6}
            spanXl={12}
            padding="lg"
            className="!col-span-2 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
          >
            <nav aria-label="Breadcrumb" className="mb-3 text-xs font-medium text-subtle md:text-sm">
              <Link to="/" className="hover:text-brand">
                Beranda
              </Link>
              <span className="mx-1.5">/</span>
              <Link to="/prestasi" className="hover:text-brand">
                Prestasi
              </Link>
              <span className="mx-1.5">/</span>
              <span className="line-clamp-1 text-body">Detail</span>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-amber-600 shadow-sm border border-amber-200/60">
                  <Trophy className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  {data.badge_label && (
                    <Badge color="#B45309" className="mb-2">
                      {data.badge_label}
                    </Badge>
                  )}
                  <h1 className="max-w-4xl text-balance text-2xl font-bold leading-tight text-ink md:text-3xl lg:text-4xl">
                    {data.title}
                  </h1>
                  <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-subtle">
                    <Calendar className="h-3.5 w-3.5 text-amber-600/80" />
                    <span>{formatDate(data.achieved_at)}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 sm:pt-1">
                <ShareButton title={data.title} text={data.excerpt || data.title} />
              </div>
            </div>
          </BentoTile>
        </BentoBoard>

        {/* 2-Column Responsive Layout: Left Main Content, Right Rich Recommendation Sidebar */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Content Column (8 Cols on Desktop) */}
          <article className="space-y-6 lg:col-span-8">
            <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[var(--shadow-card)]">
              <div className="media-cover aspect-[16/9] w-full bg-slate-100">
                <img
                  src={coverSrc(data.cover_path, data.slug || data.id, 1600, 900)}
                  alt={data.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>

              <div className="p-5 md:p-8">
                {data.excerpt && (
                  <p className="mb-6 text-lg font-medium leading-relaxed text-slate-700 border-l-4 border-amber-400 pl-4 bg-amber-50/40 py-2 rounded-r-xl">
                    {data.excerpt}
                  </p>
                )}

                <SafeHtml className="prose-article max-w-none" html={body} />

                {/* Share & Support Card at the bottom of content */}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-subtle">
                        Bagikan Kabar Bangga Ini
                      </p>
                      <p className="text-xs text-subtle">
                        Apresiasi dan sebarkan pencapaian siswa-siswi terbaik kita.
                      </p>
                    </div>
                  </div>
                  <ShareButton title={data.title} text={data.excerpt || data.title} />
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar Column (4 Cols on Desktop) */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Widget 1: Prestasi Unggulan Lainnya */}
            <div className="rounded-[20px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Prestasi Lainnya</h3>
                </div>
                <Link
                  to="/prestasi"
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Lihat semua
                </Link>
              </div>

              {otherAchievements.length > 0 ? (
                <div className="space-y-3">
                  {otherAchievements.map((item) => (
                    <Link
                      key={item.id}
                      to={`/prestasi/${item.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-amber-50/60"
                    >
                      <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl bg-amber-100/50 border border-line/60">
                        <img
                          src={coverSrc(item.cover_path, item.slug || item.id, 240, 180)}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {item.badge_label && (
                          <span className="mb-1 inline-block rounded-md bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                            {item.badge_label}
                          </span>
                        )}
                        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-ink transition group-hover:text-amber-700">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-subtle">
                          {formatDate(item.achieved_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-xs text-subtle">Belum ada prestasi lain yang dicatat.</p>
              )}

              <div className="mt-4 pt-3 border-t border-line">
                <Link
                  to="/prestasi"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 active:scale-[0.99]"
                >
                  <span>Jelajahi Semua Prestasi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Widget 2: Rekomendasi Postingan & Berita Terkini */}
            <div className="rounded-[20px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Newspaper className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Kabar & Berita Terkini</h3>
                </div>
                <Link
                  to="/artikel"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Semua berita
                </Link>
              </div>

              {recentArticles.length > 0 ? (
                <div className="space-y-3">
                  {recentArticles.map((art) => (
                    <Link
                      key={art.id}
                      to={`/artikel/${art.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-sky-50/60"
                    >
                      <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl bg-sky-100/50 border border-line/60">
                        <img
                          src={coverSrc(art.cover_path, art.slug || art.id, 240, 180)}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {art.category && (
                          <span
                            className="mb-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: `${art.category.color}20`,
                              color: art.category.color,
                            }}
                          >
                            {art.category.name}
                          </span>
                        )}
                        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-ink transition group-hover:text-brand">
                          {art.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-subtle">
                          <span>{formatDate(art.published_at)}</span>
                          {art.views != null && art.views > 0 && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Eye className="h-3 w-3" />
                                {art.views}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-xs text-subtle">Belum ada postingan terbaru.</p>
              )}

              <div className="mt-4 pt-3 border-t border-line">
                <Link
                  to="/artikel"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/50 py-2.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 active:scale-[0.99]"
                >
                  <span>Buka Portal Artikel & Berita</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Widget 3: Ikuti Kanal Media Sosial Sekolah */}
            {(settings?.social_instagram || settings?.social_youtube || settings?.social_facebook) && (
              <div className="rounded-[20px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center gap-2 border-b border-line pb-2.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-ink">Kanal Resmi Sekolah</h3>
                </div>
                <p className="mb-3.5 text-xs text-subtle">
                  Dapatkan foto, cuplikan kegiatan, dan info instan di media sosial resmi sekolah.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {settings?.social_instagram && (
                    <a
                      href={settings.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50/60 px-3 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                    >
                      <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      <span>Instagram</span>
                    </a>
                  )}
                  {settings?.social_youtube && (
                    <a
                      href={settings.social_youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      <span>YouTube</span>
                    </a>
                  )}
                  {settings?.social_facebook && (
                    <a
                      href={settings.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </PageBentoShell>
    </>
  )
}

export default AchievementDetailPage
