import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, AlertTriangle } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { api, type Article } from '../lib/api'
import { coverSrc, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { ArticleDetailSkeleton } from '../components/ui/Skeleton'
import { SafeHtml } from '../components/ui/SafeHtml'

type PreviewResponse = {
  article: Article
  preview: boolean
}

export function ArticlePreviewPage() {
  const { token } = useParams()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['article-preview', token],
    queryFn: async () =>
      (await api.get<PreviewResponse>(`/articles/preview/${token}`)).data,
    enabled: !!token,
    retry: false,
  })

  if (isLoading) return <ArticleDetailSkeleton />

  if (isError || !data) {
    const status = (error as { response?: { status?: number } })?.response?.status
    return (
      <div className="container-page py-16 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <p className="font-semibold text-ink">
          {status === 410 ? 'Link pratinjau kedaluwarsa' : 'Pratinjau tidak ditemukan'}
        </p>
        <p className="mt-2 text-sm text-subtle">
          Minta admin membuat link pratinjau baru dari editor artikel.
        </p>
        <Link to="/" className="mt-4 inline-block text-brand">
          Ke beranda
        </Link>
      </div>
    )
  }

  const { article } = data

  return (
    <div>
      <Helmet>
        <title>Pratinjau: {article.title} | Scholargate</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="border-b border-amber-200 bg-amber-50">
        <div className="container-page flex flex-wrap items-center gap-2 py-2.5 text-sm text-amber-900">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Mode pratinjau draf</span>
          <span className="text-amber-800/80">
            · Status: {article.status} · tidak terindeks mesin pencari
          </span>
        </div>
      </div>

      <section className="page-hero-band">
        <div className="container-page py-8">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-subtle">
            {article.category && (
              <Badge color={article.category.color}>{article.category.name}</Badge>
            )}
            <span>{formatDate(article.published_at)}</span>
          </div>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-ink md:text-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-4 max-w-3xl text-lg text-body">{article.excerpt}</p>
          )}
        </div>
      </section>

      <div className="container-page py-8">
        <article className="max-w-3xl">
          <div className="media-cover mb-8 aspect-[16/9] overflow-hidden rounded-[16px] border border-line">
            <img
              src={coverSrc(article.cover_path, article.slug || article.id, 1600, 900)}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
          <SafeHtml className="prose-article" html={article.body} />
        </article>
      </div>
    </div>
  )
}
