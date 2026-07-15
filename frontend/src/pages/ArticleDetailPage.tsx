import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { api, type Article, type Category } from '../lib/api'
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

  const { article } = data

  return (
    <>
      <SeoHead kind="article" articleSlug={slug} fallbackTitle={article.title} />
      <PageBentoShell>
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
                <p className="mb-6 text-lg leading-relaxed text-body">{article.excerpt}</p>
              )}
              <SafeHtml className="prose-article max-w-none" html={article.body} />

              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/artikel?q=${encodeURIComponent(tag.name)}`}
                      className="rounded-full border border-line bg-muted/50 px-3 py-1 text-xs font-semibold text-body hover:border-brand hover:text-brand"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </BentoTile>

          <BentoTile tone="violet" spanMd={4} spanLg={2} spanXl={4} padding="md">
            <h3 className="mb-3 text-sm font-bold text-ink">Kategori</h3>
            <ul className="space-y-1.5">
              {data.sidebar.categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/artikel?category=${c.slug}`}
                    className="flex justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-white/50"
                  >
                    <span className="font-medium text-body">{c.name}</span>
                    <span className="text-xs text-subtle">{c.articles_count || 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </BentoTile>

          <BentoTile tone="peach" spanMd={4} spanLg={2} spanXl={4} padding="md">
            <h3 className="mb-3 text-sm font-bold text-ink">Populer</h3>
            <ul className="space-y-2.5">
              {data.sidebar.popular.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/artikel/${a.slug}`}
                    className="block text-sm font-medium text-ink hover:text-brand"
                  >
                    {a.title}
                  </Link>
                  <p className="text-[11px] text-subtle">{a.views} views</p>
                </li>
              ))}
            </ul>
          </BentoTile>

          {data.related?.length > 0 &&
            data.related.map((rel, i) => (
              <BentoTile
                key={rel.id}
                tone={i % 2 === 0 ? 'sky' : 'mint'}
                spanMd={2}
                spanLg={2}
                spanXl={4}
                padding="none"
                className="!p-0"
              >
                <Link to={`/artikel/${rel.slug}`} className="flex h-full flex-col">
                  <div className="media-cover aspect-[16/10]">
                    <img
                      src={coverSrc(rel.cover_path, rel.slug || rel.id, 600, 360)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-[11px] text-subtle">{formatDate(rel.published_at)}</p>
                    <h4 className="mt-1 line-clamp-2 text-sm font-bold text-ink group-hover:text-brand">
                      {rel.title}
                    </h4>
                  </div>
                </Link>
              </BentoTile>
            ))}
        </BentoBoard>
      </PageBentoShell>
    </>
  )
}
