import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Eye,
  Megaphone,
  Search,
  Sparkles,
  TrendingUp,
  FolderOpen,
} from 'lucide-react'
import { api, type Article, type Category, type Settings } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/seo/SeoHead'
import { ArticleDetailSkeleton } from '../components/ui/Skeleton'
import { ShareButton } from '../components/ShareButton'
import { SafeHtml } from '../components/ui/SafeHtml'
import {
  BentoBoard,
  BentoTile,
  PageBentoShell,
} from '../components/ui/PageBento'

type DetailResponse = {
  article: Article
  related: Article[]
  sidebar: {
    categories: Category[]
    popular: Article[]
  }
}

export function ArticleDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => (await api.get<DetailResponse>(`/articles/${slug}`)).data,
    enabled: !!slug,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
  })

  if (isLoading) {
    return <ArticleDetailSkeleton />
  }

  if (isError || !data) {
    return (
      <PageBentoShell>
        <BentoTile tone="coral" span={12} spanMd={4} spanLg={6} spanXl={12} padding="lg">
          <p className="text-center font-medium text-ink">Artikel tidak ditemukan.</p>
          <div className="mt-4 text-center">
            <Link
              to="/artikel"
              className="inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Kembali ke daftar artikel
            </Link>
          </div>
        </BentoTile>
      </PageBentoShell>
    )
  }

  const { article, related, sidebar } = data

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/artikel?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const showSearch = (settings?.widget_search_enabled ?? '1') !== '0'
  const showAnnouncement = (settings?.widget_announcement_enabled ?? '1') !== '0'
  const showCategories = (settings?.widget_categories_enabled ?? '1') !== '0'
  const showPopular = (settings?.widget_popular_enabled ?? '1') !== '0'
  const showSocial = (settings?.widget_social_enabled ?? '1') !== '0'

  return (
    <>
      <SeoHead kind="article" articleSlug={slug} fallbackTitle={article.title} />
      <PageBentoShell>
        {/* Header Breadcrumb & Title */}
        <BentoBoard>
          <BentoTile
            tone="sky"
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
              <Link to="/artikel" className="hover:text-brand">
                Artikel
              </Link>
              <span className="mx-1.5">/</span>
              <span className="line-clamp-1 text-body">{article.title}</span>
            </nav>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-subtle">
              {article.category && (
                <Badge color={article.category.color}>{article.category.name}</Badge>
              )}
              <span>{formatDate(article.published_at)}</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views} views
              </span>
            </div>
            <h1 className="max-w-4xl text-balance text-2xl font-bold leading-tight text-ink md:text-4xl">
              {article.title}
            </h1>
            <div className="mt-4">
              <ShareButton title={article.title} text={article.excerpt || article.title} />
            </div>
          </BentoTile>
        </BentoBoard>

        {/* 2-Column Responsive Layout: Left Article Content, Right Informative Sticky Sidebar */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Article Content (8 Cols on Desktop) */}
          <article className="space-y-6 lg:col-span-8">
            <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[var(--shadow-card)]">
              <div className="media-cover aspect-[16/9] w-full">
                <img
                  src={coverSrc(article.cover_path, article.slug || article.id, 1600, 900)}
                  alt={article.title}
                  className="h-full w-full object-cover"
                  width={1600}
                  height={900}
                  fetchPriority="high"
                />
              </div>
              <div className="p-5 md:p-8">
                {article.excerpt && (
                  <p className="mb-6 text-lg font-medium leading-relaxed text-slate-700">
                    {article.excerpt}
                  </p>
                )}
                <SafeHtml className="prose-article max-w-none" html={article.body} />

                {article.tags && article.tags.length > 0 && (
                  <div className="mt-8 border-t border-line pt-6">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-subtle">
                      Topik Terkait:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/artikel?q=${encodeURIComponent(tag.name)}`}
                          className="rounded-full border border-line bg-muted/50 px-3 py-1 text-xs font-semibold text-body transition hover:border-brand hover:bg-white hover:text-brand"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Sticky Informative Right Sidebar (4 Cols on Desktop) */}
          <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            {/* Widget 1: Pencarian Cepat */}
            {showSearch && (
              <div className="rounded-[18px] border border-line bg-white p-4 shadow-[var(--shadow-card)]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berita & artikel..."
                    className="w-full rounded-xl border border-line bg-page py-2.5 pl-3.5 pr-10 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 rounded-lg bg-sky-500 p-1.5 text-white transition hover:bg-sky-600"
                    title="Cari"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Widget 2: Banner / Pengumuman Kustom Admin */}
            {showAnnouncement && (
              <div className="relative overflow-hidden rounded-[18px] border border-sky-100 bg-gradient-to-br from-sky-50/90 via-blue-50/70 to-indigo-50/50 p-5 shadow-[var(--shadow-card)]">
                <div className="mb-2.5 flex items-center gap-2 text-sky-700">
                  <div className="rounded-lg bg-sky-500/10 p-1.5">
                    <Megaphone className="h-4 w-4 text-sky-600" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">
                    {settings?.widget_announcement_title || 'Pusat Informasi Sekolah'}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  {settings?.widget_announcement_content ||
                    'Dapatkan kabar terkini mengenai agenda akademik, prestasi siswa, dan layanan humas SMA Negeri 1 Gedeg.'}
                </p>
                {settings?.widget_announcement_url ? (
                  <a
                    href={settings.widget_announcement_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600"
                  >
                    <span>{settings.widget_announcement_btn_text || 'Selengkapnya'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    to="/kontak"
                    className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600"
                  >
                    <span>Hubungi Humas</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* Widget 3: Kategori Artikel */}
            {showCategories && sidebar.categories.length > 0 && (
              <div className="rounded-[18px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-3.5 flex items-center gap-2 border-b border-line pb-2.5">
                  <FolderOpen className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-ink">Kategori Artikel</h3>
                </div>
                <ul className="space-y-1">
                  {sidebar.categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/artikel?category=${c.slug}`}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-body transition hover:bg-sky-50 hover:text-brand"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-subtle">
                          {c.articles_count || 0}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Widget 4: Artikel Populer */}
            {showPopular && sidebar.popular.length > 0 && (
              <div className="rounded-[18px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-3.5 flex items-center gap-2 border-b border-line pb-2.5">
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-ink">Artikel Populer</h3>
                </div>
                <div className="space-y-3">
                  {sidebar.popular.map((pop, idx) => (
                    <Link
                      key={pop.id}
                      to={`/artikel/${pop.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-1.5 transition hover:bg-slate-50"
                    >
                      <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <img
                          src={coverSrc(pop.cover_path, pop.slug || pop.id, 200, 140)}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.2 text-[9px] font-bold text-white">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-ink transition group-hover:text-brand">
                          {pop.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-subtle">
                          <span>{formatDate(pop.published_at)}</span>
                          <span>•</span>
                          <span>{pop.views} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Widget 5: Media Sosial & Ikuti Kami */}
            {showSocial && (
              <div className="rounded-[18px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center gap-2 border-b border-line pb-2.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-ink">Ikuti Kanal Resmi</h3>
                </div>
                <p className="mb-3.5 text-xs text-subtle">
                  Dapatkan foto, cuplikan kegiatan, dan info instan di media sosial resmi kami.
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
                  {settings?.social_tiktok && (
                    <a
                      href={settings.social_tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
                    >
                      <span className="font-bold">TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Artikel Terkait di Bagian Bawah */}
        {related && related.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h3 className="mb-6 text-xl font-bold tracking-tight text-ink">Artikel Terkait Lainnya</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/artikel/${rel.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="media-cover aspect-[16/10]">
                    <img
                      src={coverSrc(rel.cover_path, rel.slug || rel.id, 600, 360)}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] font-medium text-subtle">{formatDate(rel.published_at)}</p>
                    <h4 className="mt-1.5 line-clamp-2 text-sm font-bold text-ink transition group-hover:text-brand">
                      {rel.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </PageBentoShell>
    </>
  )
}

export default ArticleDetailPage
