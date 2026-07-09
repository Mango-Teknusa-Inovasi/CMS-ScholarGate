import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Share2 } from 'lucide-react'
import { api, type Article, type Category } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/seo/SeoHead'
import { ArticleDetailSkeleton } from '../components/ui/Skeleton'

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
  const { data, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => (await api.get<DetailResponse>(`/articles/${slug}`)).data,
    enabled: !!slug,
  })

  if (isLoading) {
    return <ArticleDetailSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-red-500">Artikel tidak ditemukan.</p>
        <Link to="/artikel" className="mt-4 inline-block text-brand">
          Kembali ke daftar artikel
        </Link>
      </div>
    )
  }

  const { article } = data

  return (
    <div>
      <SeoHead kind="article" articleSlug={slug} fallbackTitle={article.title} />
      <section className="page-hero-band" data-layer data-parallax="3">
        <div className="container-page py-8">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-subtle">
            <Link to="/" className="hover:text-brand">Beranda</Link>
            {' / '}
            <Link to="/artikel" className="hover:text-brand">Artikel</Link>
            {' / '}
            <span className="text-body line-clamp-1">{article.title}</span>
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
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-ink md:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-white px-3 py-2 text-sm font-medium text-body"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
            >
              <Share2 className="h-4 w-4" />
              Bagikan
            </button>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_320px]" data-layer data-parallax="2">
        <article>
          <div className="media-cover mb-8 aspect-[16/9] overflow-hidden rounded-[16px] border border-line">
            <img
              src={coverSrc(article.cover_path, article.slug || article.id, 1600, 900)}
              alt={article.title}
              className="h-full w-full object-cover"
              width={1600}
              height={900}
              fetchPriority="high"
            />
          </div>
          {article.excerpt && (
            <p className="mb-6 text-lg leading-relaxed text-body">{article.excerpt}</p>
          )}
          <div
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: article.body || '' }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/artikel?q=${encodeURIComponent(tag.name)}`}
                  className="rounded-full border border-line bg-page px-3 py-1 text-xs font-semibold text-body hover:border-brand hover:text-brand"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* AEO: visible FAQ content (matches FAQPage schema) */}
          {article.faq_items && article.faq_items.filter((f) => f.question && f.answer).length > 0 && (
            <section className="mt-12 rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-xl font-bold text-ink">Pertanyaan yang sering diajukan</h2>
              <div className="space-y-3">
                {article.faq_items
                  .filter((f) => f.question && f.answer)
                  .map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-[12px] border border-line bg-page px-4 py-3 open:bg-white"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start justify-between gap-3">
                          {faq.question}
                          <span className="text-subtle transition group-open:rotate-45">+</span>
                        </span>
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-body">{faq.answer}</p>
                    </details>
                  ))}
              </div>
            </section>
          )}

          {data.related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold text-ink">Artikel terkait</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/artikel/${item.slug}`}
                    className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]"
                  >
                    <div className="media-cover aspect-[16/9]">
                      <img
                        src={coverSrc(item.cover_path, item.slug || item.id, 800, 450)}
                        alt={item.title}
                        loading="lazy"
                        width={800}
                        height={450}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-ink">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-subtle">{item.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-4">
          <div className="rounded-[16px] border border-line bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-ink">Kategori</h3>
            <ul className="space-y-2">
              {data.sidebar.categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/artikel?category=${c.slug}`}
                    className="flex items-center justify-between rounded-xl px-2 py-2 text-sm hover:bg-muted"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-subtle">{c.articles_count || 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-line bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-ink">Populer</h3>
            <ul className="space-y-3">
              {data.sidebar.popular.map((a) => (
                <li key={a.id}>
                  <Link to={`/artikel/${a.slug}`} className="text-sm font-medium text-ink hover:text-brand">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
