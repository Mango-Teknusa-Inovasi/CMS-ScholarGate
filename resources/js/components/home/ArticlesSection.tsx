import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import type { Article } from '../../lib/api'
import { coverSrc, formatDate } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { SectionHeader } from '../ui/SectionHeader'

export function ArticlesSection({ articles }: { articles: Article[] }) {
  if (!articles.length) return null
  const [featured, ...rest] = articles
  const side = rest.slice(0, 4)

  return (
    <section className="container-page py-10 md:py-12">
      <SectionHeader
        title="Cerita baik dari sekolah, kegiatan, dan prestasi"
        description="Publikasi terbaru seputar program, kegiatan, dan praktik baik."
        actionLabel="Lihat semua"
        actionTo="/artikel"
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Link
          to={`/artikel/${featured.slug}`}
          className="group overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
        >
          <div className="media-cover aspect-[16/10]">
            <img
              src={coverSrc(featured.cover_path, featured.slug || featured.id, 1200, 750)}
              alt={featured.title}
              loading="lazy"
            />
          </div>
          <div className="p-5 md:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-subtle">
              {featured.category && (
                <Badge color={featured.category.color}>{featured.category.name}</Badge>
              )}
              <span>{formatDate(featured.published_at)}</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Eye className="h-3.5 w-3.5" />
                {featured.views}
              </span>
            </div>
            <h3 className="text-balance text-xl font-bold tracking-tight text-ink group-hover:text-brand">
              {featured.title}
            </h3>
            {featured.excerpt && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-subtle">
                {featured.excerpt}
              </p>
            )}
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {side.map((article) => (
            <Link
              key={article.id}
              to={`/artikel/${article.slug}`}
              className="group flex gap-3.5 rounded-[16px] border border-line bg-surface p-3 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="media-cover h-[88px] w-[112px] shrink-0 rounded-xl">
                <img
                  src={coverSrc(article.cover_path, article.slug || article.id, 320, 240)}
                  alt={article.title}
                  loading="lazy"
                  width={320}
                  height={240}
                />
              </div>
              <div className="min-w-0 py-0.5">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
                  {article.category && (
                    <Badge color={article.category.color}>{article.category.name}</Badge>
                  )}
                  <span>{formatDate(article.published_at)}</span>
                </div>
                <h4 className="line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-brand">
                  {article.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
