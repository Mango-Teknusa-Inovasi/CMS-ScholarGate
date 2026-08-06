import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Filter, Search } from 'lucide-react'
import { api, type Article, type Category } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Skeleton } from '../components/ui/Skeleton'
import { SeoHead } from '../components/seo/SeoHead'
import { Badge } from '../components/ui/Badge'
import {
  BentoBoard,
  BentoTile,
  PageBentoHero,
  PageBentoShell,
  type BentoTone,
} from '../components/ui/PageBento'

type ArticlesResponse = {
  featured: Article | null
  articles: {
    data: Article[]
    current_page: number
    last_page: number
    total: number
  }
  sidebar: {
    summary: { total_articles: number; total_categories: number }
    categories: Category[]
    popular: Article[]
  }
}

const listTones: BentoTone[] = ['white', 'sky', 'mint', 'violet', 'peach', 'amber']

export function ArticlesPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'latest'
  const page = Number(params.get('page') || 1)

  const { data, isLoading } = useQuery({
    queryKey: ['articles', q, category, sort, page],
    queryFn: async () =>
      (
        await api.get<ArticlesResponse>('/articles', {
          params: { q: q || undefined, category: category || undefined, sort, page },
        })
      ).data,
  })

  const applyFilter = (next: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) p.delete(k)
      else p.set(k, String(v))
    })
    if (!('page' in next)) p.delete('page')
    setParams(p)
  }

  return (
    <>
      <SeoHead kind="page" page="artikel" fallbackTitle="Artikel | Scholargate" />
      <PageBentoShell>
        <BentoBoard>
          <PageBentoHero
            crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Artikel' }]}
            title="Publikasi & Artikel"
            description="Informasi berita, kegiatan, dan cerita baik dari ekosistem Scholargate."
            tone="sky"
          />

          {/* Filter bar */}
          <BentoTile
            tone="white"
            spanMd={4}
            spanLg={6}
            spanXl={12}
            padding="md"
            className="!col-span-2 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilter({ q })}
                  placeholder="Cari judul atau ringkasan artikel..."
                  className="w-full rounded-full border border-line bg-muted/50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={category}
                  onChange={(e) => applyFilter({ category: e.target.value })}
                  className="rounded-full border border-line bg-muted/50 px-3 py-2.5 text-sm"
                >
                  <option value="">Semua kategori</option>
                  {data?.sidebar.categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => applyFilter({ sort: e.target.value })}
                  className="rounded-full border border-line bg-muted/50 px-3 py-2.5 text-sm"
                >
                  <option value="latest">Terbaru</option>
                  <option value="popular">Terpopuler</option>
                  <option value="oldest">Terlama</option>
                </select>
                <button
                  type="button"
                  onClick={() => applyFilter({ q })}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-600 active:scale-[0.98]"
                >
                  <Filter className="h-4 w-4" />
                  Terapkan
                </button>
              </div>
            </div>
          </BentoTile>
        </BentoBoard>

        {isLoading || !data ? (
          <BentoBoard aria-busy="true">
            <Skeleton className="col-span-2 min-h-[240px] rounded-[22px] md:col-span-4 lg:col-span-4 xl:col-span-8" />
            <Skeleton className="col-span-2 min-h-[120px] rounded-[22px] md:col-span-4 lg:col-span-2 xl:col-span-4" />
            <Skeleton className="col-span-2 min-h-[100px] rounded-[22px] md:col-span-2 xl:col-span-4" />
            <Skeleton className="col-span-2 min-h-[100px] rounded-[22px] md:col-span-2 xl:col-span-4" />
          </BentoBoard>
        ) : (
          <BentoBoard>
            {/* Featured */}
            {data.featured && (
              <BentoTile
                tone="white"
                spanMd={4}
                spanLg={4}
                spanXl={8}
                padding="none"
                className="!p-0"
              >
                <Link
                  to={`/artikel/${data.featured.slug}`}
                  className="flex h-full min-h-[260px] flex-col"
                >
                  <div className="media-cover relative min-h-[160px] flex-1">
                    <img
                      src={coverSrc(data.featured.cover_path, data.featured.slug, 1400, 700)}
                      alt={data.featured.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
                      <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-white/85">
                        {data.featured.category && (
                          <Badge color={data.featured.category.color}>
                            {data.featured.category.name}
                          </Badge>
                        )}
                        <span>Unggulan</span>
                        <span>{formatDate(data.featured.published_at)}</span>
                      </div>
                      <h2 className="text-balance text-xl font-bold md:text-2xl">
                        {data.featured.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-sm text-white/85">
                        {data.featured.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              </BentoTile>
            )}

            {/* Sidebar stats */}
            <BentoTile tone="sky" spanMd={2} spanLg={2} spanXl={4} padding="md">
              <h3 className="mb-3 text-sm font-bold text-ink">Ringkasan</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm">
                  <div className="text-2xl font-bold text-sky-700">
                    {data.sidebar.summary.total_articles}
                  </div>
                  <div className="text-[11px] text-sky-600/80">Artikel</div>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm">
                  <div className="text-2xl font-bold text-violet-700">
                    {data.sidebar.summary.total_categories}
                  </div>
                  <div className="text-[11px] text-violet-600/80">Kategori</div>
                </div>
              </div>
            </BentoTile>

            <BentoTile tone="violet" spanMd={2} spanLg={2} spanXl={4} padding="md">
              <h3 className="mb-3 text-sm font-bold text-ink">Kategori</h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {data.sidebar.categories.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => applyFilter({ category: c.slug })}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-sm hover:bg-white/60"
                    >
                      <span className="font-medium text-body">{c.name}</span>
                      <span className="text-xs text-subtle">{c.articles_count || 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </BentoTile>

            {/* List */}
            {data.articles.data.map((article, i) => (
              <BentoTile
                key={article.id}
                tone={listTones[i % listTones.length]}
                spanMd={2}
                spanLg={3}
                spanXl={4}
                padding="none"
                className="!p-0"
              >
                <Link to={`/artikel/${article.slug}`} className="flex h-full flex-col gap-0 sm:flex-row">
                  <div className="media-cover aspect-video w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-36 md:w-40">
                    <img
                      src={coverSrc(article.cover_path, article.slug || article.id, 400, 280)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-3.5 md:p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
                      {article.category && (
                        <Badge color={article.category.color}>{article.category.name}</Badge>
                      )}
                      <span>{formatDate(article.published_at)}</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Eye className="h-3 w-3" />
                        {article.views}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-brand md:text-base">
                      {article.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-subtle md:text-sm">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              </BentoTile>
            ))}

            {/* Popular */}
            <BentoTile tone="peach" spanMd={4} spanLg={3} spanXl={4} padding="md">
              <h3 className="mb-3 text-sm font-bold text-ink">Top populer</h3>
              <ul className="space-y-2.5">
                {data.sidebar.popular.map((a, i) => (
                  <li key={a.id}>
                    <Link
                      to={`/artikel/${a.slug}`}
                      className="flex gap-2.5 text-sm font-medium text-ink hover:text-brand"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-brand shadow-sm">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 leading-snug">{a.title}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-subtle">
                          {a.views} views
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </BentoTile>

            <BentoTile
              tone="brand"
              spanMd={4}
              spanLg={3}
              spanXl={4}
              padding="lg"
              className="bg-gradient-to-br from-teal-400 to-sky-500 !border-teal-300 text-white"
            >
              <h3 className="font-bold">Layanan publikasi</h3>
              <p className="mt-2 text-sm text-white/90">
                Butuh bantuan unggah berita atau dokumentasi? Hubungi admin portal.
              </p>
              <Link
                to="/admin/login"
                className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
              >
                Masuk Admin
              </Link>
            </BentoTile>

            {data.articles.last_page > 1 && (
              <BentoTile
                tone="white"
                spanMd={4}
                spanLg={6}
                spanXl={12}
                padding="sm"
                className="!col-span-2 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: data.articles.last_page }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyFilter({ page: p })}
                      className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition ${
                        p === data.articles.current_page
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-line bg-muted/40 text-body hover:bg-sky-50 hover:text-sky-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </BentoTile>
            )}
          </BentoBoard>
        )}
      </PageBentoShell>
    </>
  )
}

export default ArticlesPage
