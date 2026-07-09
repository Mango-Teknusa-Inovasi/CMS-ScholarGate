import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Filter, Search } from 'lucide-react'
import { api, type Article, type Category } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Skeleton } from '../components/ui/Skeleton'
import { SeoHead } from '../components/seo/SeoHead'
import { Badge } from '../components/ui/Badge'

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
    <div>
      <SeoHead kind="page" page="artikel" fallbackTitle="Artikel | Scholargate" />
      <section className="page-hero-band" data-layer data-parallax="3">
        <div className="container-page py-10">
          <p className="mb-2 text-sm text-subtle">Beranda / Artikel</p>
          <h1 className="text-3xl font-bold text-ink">Publikasi & Artikel</h1>
          <p className="mt-2 max-w-2xl text-subtle">
            Informasi berita, kegiatan, dan ceritabaik dari ekosistem Scholargate.
          </p>
        </div>
      </section>

      <div className="container-page py-8">
        <div
          className="mb-6 flex flex-col gap-3 rounded-[16px] border border-line bg-white p-4 shadow-sm md:flex-row md:items-center"
          data-layer
          data-parallax="2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter({ q })}
              placeholder="Cari judul atau ringkasan artikel..."
              className="w-full rounded-[12px] border border-line bg-page py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => applyFilter({ category: e.target.value })}
              className="rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm"
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
              className="rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm"
            >
              <option value="latest">Terbaru</option>
              <option value="popular">Terpopuler</option>
              <option value="oldest">Terlama</option>
            </select>
            <button
              onClick={() => applyFilter({ q })}
              className="inline-flex items-center gap-2 rounded-[12px] bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(139_92_246/0.25)] transition hover:bg-violet-600 active:scale-[0.98]"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]" aria-busy="true" aria-label="Memuat artikel">
            <div className="space-y-4">
              <Skeleton className="aspect-[21/9] w-full rounded-[16px]" />
              <Skeleton className="h-28 w-full rounded-[16px]" />
              <Skeleton className="h-28 w-full rounded-[16px]" />
              <Skeleton className="h-28 w-full rounded-[16px]" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-[16px]" />
              <Skeleton className="h-56 w-full rounded-[16px]" />
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]" data-layer data-parallax="3">
            <div className="space-y-6">
              {data.featured && (
                <Link
                  to={`/artikel/${data.featured.slug}`}
                  className="group block overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="media-cover aspect-[21/9]">
                    <img
                      src={coverSrc(data.featured.cover_path, data.featured.slug, 1400, 600)}
                      alt={data.featured.title}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs text-subtle">
                      {data.featured.category && (
                        <Badge color={data.featured.category.color}>
                          {data.featured.category.name}
                        </Badge>
                      )}
                      <span>Unggulan</span>
                      <span>{formatDate(data.featured.published_at)}</span>
                    </div>
                    <h2 className="text-balance text-2xl font-bold tracking-tight text-ink group-hover:text-brand">
                      {data.featured.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-subtle">{data.featured.excerpt}</p>
                  </div>
                </Link>
              )}

              <div className="space-y-4">
                {data.articles.data.map((article) => (
                  <Link
                    key={article.id}
                    to={`/artikel/${article.slug}`}
                    className="group flex flex-col gap-4 rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)] sm:flex-row"
                  >
                    <div className="media-cover aspect-video w-full shrink-0 rounded-xl sm:aspect-auto sm:h-28 sm:w-40">
                      <img
                        src={coverSrc(article.cover_path, article.slug || article.id, 400, 280)}
                        alt={article.title}
                        loading="lazy"
                        width={400}
                        height={280}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                        {article.category && (
                          <Badge color={article.category.color}>{article.category.name}</Badge>
                        )}
                        <span>{formatDate(article.published_at)}</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Eye className="h-3.5 w-3.5" />
                          {article.views}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-ink group-hover:text-brand">
                        {article.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-subtle">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {data.articles.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                  {Array.from({ length: data.articles.last_page }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => applyFilter({ page: p })}
                      className={`h-9 min-w-9 rounded-[12px] px-3 text-sm font-semibold transition ${
                        p === data.articles.current_page
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-line bg-white text-body hover:bg-sky-50 hover:text-sky-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[16px] border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-ink">Ringkasan</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-sky-50 p-3 text-center ring-1 ring-inset ring-sky-100">
                    <div className="text-2xl font-bold text-sky-700">
                      {data.sidebar.summary.total_articles}
                    </div>
                    <div className="text-xs text-sky-600/80">Artikel</div>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-3 text-center ring-1 ring-inset ring-violet-100">
                    <div className="text-2xl font-bold text-violet-700">
                      {data.sidebar.summary.total_categories}
                    </div>
                    <div className="text-xs text-violet-600/80">Kategori</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-ink">Kategori</h3>
                <ul className="space-y-2">
                  {data.sidebar.categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => applyFilter({ category: c.slug })}
                        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium text-body">{c.name}</span>
                        <span className="text-xs text-subtle">{c.articles_count || 0}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[16px] border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-ink">Top Populer</h3>
                <ul className="space-y-3">
                  {data.sidebar.popular.map((a) => (
                    <li key={a.id}>
                      <Link to={`/artikel/${a.slug}`} className="block text-sm font-medium text-ink hover:text-brand">
                        {a.title}
                      </Link>
                      <p className="text-xs text-subtle">{a.views} views</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[16px] border border-line bg-peach p-5 shadow-sm">
                <h3 className="font-bold text-ink">Layanan Publikasi</h3>
                <p className="mt-2 text-sm text-body">
                  Butuh bantuan unggah berita atau dokumentasi kegiatan? Hubungi admin portal.
                </p>
                <Link
                  to="/admin/login"
                  className="mt-4 inline-flex rounded-[12px] bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(20_184_166/0.25)] transition hover:bg-teal-600"
                >
                  Masuk Admin
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
