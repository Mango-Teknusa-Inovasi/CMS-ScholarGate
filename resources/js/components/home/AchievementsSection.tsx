import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import type { Achievement } from '../../lib/api'
import { coverSrc, formatDate } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { SectionHeader } from '../ui/SectionHeader'

export function AchievementsSection({ items }: { items: Achievement[] }) {
  if (!items.length) return null
  const [featured, ...rest] = items

  return (
    <section className="container-page py-10 md:py-12">
      <SectionHeader
        title="Prestasi unggulan"
        description="Capaian terbaik peserta didik dan satuan pendidikan."
        actionLabel="Lihat semua"
        actionTo="/prestasi"
        icon={<Trophy className="h-6 w-6 text-amber-600" strokeWidth={1.75} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Link
          to={`/prestasi/${featured.slug}`}
          className="group overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
        >
          <div className="media-cover aspect-[16/9]">
            <img
              src={coverSrc(featured.cover_path, featured.slug || featured.id, 1200, 675)}
              alt={featured.title}
              loading="lazy"
            />
          </div>
          <div className="p-5 md:p-6">
            {featured.badge_label && (
              <Badge color="#B45309" className="mb-2">
                {featured.badge_label}
              </Badge>
            )}
            <h3 className="text-balance text-xl font-bold tracking-tight text-ink group-hover:text-brand">
              {featured.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-subtle">{featured.excerpt}</p>
            <p className="mt-3 text-xs text-subtle">{formatDate(featured.achieved_at)}</p>
          </div>
        </Link>

        <div className="grid gap-3">
          {rest.map((item) => (
            <Link
              key={item.id}
              to={`/prestasi/${item.slug}`}
              className="group flex gap-4 rounded-[16px] border border-line bg-surface p-3.5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="media-cover h-20 w-28 shrink-0 rounded-xl">
                <img
                  src={coverSrc(item.cover_path, item.slug || item.id, 320, 240)}
                  alt={item.title}
                  loading="lazy"
                  width={320}
                  height={240}
                />
              </div>
              <div className="min-w-0">
                {item.badge_label && (
                  <Badge color="#047857" className="mb-1">
                    {item.badge_label}
                  </Badge>
                )}
                <h4 className="font-bold text-ink group-hover:text-brand">{item.title}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-subtle">{item.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
