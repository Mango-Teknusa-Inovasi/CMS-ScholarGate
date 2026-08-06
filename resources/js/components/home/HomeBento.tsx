import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Download,
  Eye,
  FileText,
  HandCoins,
  MessageCircle,
  Newspaper,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type {
  Achievement,
  Article,
  Banner,
  GalleryItem,
  Partner,
  ServiceItem,
  WelcomeBlock,
} from '../../lib/api'
import { coverSrc, formatDate, mediaUrl, cn } from '../../lib/utils'
import { safeHref } from '../../lib/sanitize'
import { BentoBoard, BentoEyebrow, BentoTile, type BentoTone } from '../ui/Bento'
import { Badge } from '../ui/Badge'
import { SafeHtml } from '../ui/SafeHtml'
import { HeroCarousel } from './HeroCarousel'

const iconMap: Record<string, LucideIcon> = {
  'file-text': FileText,
  'badge-check': BadgeCheck,
  calendar: Calendar,
  'hand-coins': HandCoins,
  newspaper: Newspaper,
  download: Download,
  sparkles: Sparkles,
}

const serviceTones: BentoTone[] = ['sky', 'teal', 'mint', 'coral', 'amber', 'violet']

type Props = {
  banners: Banner[]
  welcome: WelcomeBlock | null
  services: ServiceItem[]
  articles: Article[]
  achievements: Achievement[]
  gallery: GalleryItem[]
  partners: Partner[]
}

/**
 * Homepage bento — cheerful asymmetric tiles (fun school portal).
 */
export function HomeBento({
  banners,
  welcome,
  services,
  articles,
  achievements,
  gallery,
  partners,
}: Props) {
  const featuredArticle = articles[0]
  const sideArticles = articles.slice(1, 5)
  const featuredAchievement = achievements[0]
  const sideAchievements = achievements.slice(1, 4)
  const gallerySlice = gallery.slice(0, 6)

  return (
    <div className="bento-page pb-12 md:pb-16">
      {/* Satu container: banner sejajar tepi kiri/kanan dengan tile bento di bawah */}
      {/* No outer data-layer — each BentoBoard is its own reveal unit */}
      <div className="container-page space-y-3 pt-4 sm:space-y-3.5 md:space-y-4 md:pt-5">
        {/* —— Board 0+1: hero full-width + welcome + services (satu grid) —— */}
        <BentoBoard parallax={4}>
          <BentoTile
            tone="white"
            span={12}
            spanMd={4}
            spanLg={6}
            spanXl={12}
            padding="none"
            className="!col-span-2 !p-0 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
          >
            <HeroCarousel banners={banners} embedded />
          </BentoTile>

          {/* Sambutan singkat — foto pejabat (4:5) + teks, pola sama halaman Profil */}
          {welcome && (
            <>
              <BentoTile
                tone="white"
                spanMd={2}
                spanLg={2}
                spanXl={4}
                rowSpan={2}
                padding="none"
                className="!p-0"
              >
                <div className="relative h-full min-h-[260px] w-full md:min-h-[320px]">
                  <img
                    src={coverSrc(welcome.image_path, welcome.key || 'home-welcome', 640, 800)}
                    alt={welcome.title || 'Foto pejabat'}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                    width={640}
                    height={800}
                  />
                  {welcome.badge_left && (
                    <span className="absolute left-3 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-teal-700 shadow ring-1 ring-teal-100">
                      {welcome.badge_left}
                    </span>
                  )}
                  {welcome.badge_right && (
                    <span className="absolute bottom-4 right-3 z-10 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-bold text-white shadow">
                      {welcome.badge_right}
                    </span>
                  )}
                </div>
              </BentoTile>

              <BentoTile
                tone="peach"
                spanMd={2}
                spanLg={2}
                spanXl={4}
                rowSpan={2}
                padding="lg"
                className="flex flex-col justify-between"
              >
                <div>
                  <BentoEyebrow>Sambutan</BentoEyebrow>
                  <h2 className="text-balance text-xl font-bold leading-snug tracking-tight text-ink md:text-2xl">
                    {welcome.title}
                  </h2>
                  <SafeHtml
                    className="prose-article mt-3 line-clamp-8 max-w-none text-sm leading-relaxed text-body md:mt-4 md:text-[15px]"
                    html={welcome.body}
                    plainFallback
                  />
                </div>
                {welcome.chat_label && (
                  <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-body shadow-sm">
                    <MessageCircle className="h-3.5 w-3.5 text-brand" />
                    {welcome.chat_label}
                  </div>
                )}
              </BentoTile>
            </>
          )}

          {/* Services as colorful mini tiles */}
          {services.slice(0, 6).map((item, i) => {
            const Icon = iconMap[item.icon] || Sparkles
            const raw = item.link_url && item.link_url !== '#' ? item.link_url : null
            const href = raw ? safeHref(raw) : null
            const tone = serviceTones[i % serviceTones.length]
            const inner = (
              <>
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 transition group-hover:scale-110"
                  style={{ color: item.color || '#0ea5e9' }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold leading-snug text-ink">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-subtle">
                    {item.description}
                  </p>
                )}
              </>
            )
            const tileClass = 'flex h-full flex-col'

            if (href?.startsWith('/')) {
              return (
                <BentoTile
                  key={item.id}
                  tone={tone}
                  spanMd={2}
                  spanLg={2}
                  spanXl={2}
                  padding="md"
                  className={tileClass}
                  as="div"
                >
                  <Link to={href} className="flex h-full flex-col outline-none">
                    {inner}
                  </Link>
                </BentoTile>
              )
            }
            if (href) {
              return (
                <BentoTile
                  key={item.id}
                  tone={tone}
                  spanMd={2}
                  spanLg={2}
                  spanXl={2}
                  padding="md"
                  className={tileClass}
                >
                  <a href={href} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col">
                    {inner}
                  </a>
                </BentoTile>
              )
            }
            return (
              <BentoTile
                key={item.id}
                tone={tone}
                spanMd={2}
                spanLg={2}
                spanXl={2}
                padding="md"
                className={tileClass}
              >
                {inner}
              </BentoTile>
            )
          })}
        </BentoBoard>

        {/* —— Board 2: articles —— */}
        {articles.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3 px-0.5 md:mb-4">
              <div>
                <BentoEyebrow>Berita & cerita</BentoEyebrow>
                <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                  Yang sedang hangat
                </h2>
              </div>
              <Link
                to="/artikel"
                className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600"
              >
                Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <BentoBoard>
              {featuredArticle && (
                <BentoTile
                  tone="white"
                  spanMd={4}
                  spanLg={4}
                  spanXl={7}
                  rowSpan={2}
                  padding="none"
                  className="!p-0"
                >
                  <Link
                    to={`/artikel/${featuredArticle.slug}`}
                    className="flex h-full min-h-[280px] flex-col md:min-h-[320px]"
                  >
                    <div className="media-cover relative min-h-[160px] flex-1 md:min-h-[200px]">
                      <img
                        src={coverSrc(
                          featuredArticle.cover_path,
                          featuredArticle.slug || featuredArticle.id,
                          1200,
                          700,
                        )}
                        alt={featuredArticle.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/85">
                          {featuredArticle.category && (
                            <Badge color={featuredArticle.category.color}>
                              {featuredArticle.category.name}
                            </Badge>
                          )}
                          <span>{formatDate(featuredArticle.published_at)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {featuredArticle.views}
                          </span>
                        </div>
                        <h3 className="text-balance text-lg font-bold leading-snug md:text-2xl">
                          {featuredArticle.title}
                        </h3>
                        {featuredArticle.excerpt && (
                          <p className="mt-1.5 line-clamp-2 text-sm text-white/85">
                            {featuredArticle.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </BentoTile>
              )}

              {sideArticles.map((article, i) => {
                const tones: BentoTone[] = ['sky', 'mint', 'violet', 'amber']
                return (
                  <BentoTile
                    key={article.id}
                    tone={tones[i % tones.length]}
                    spanMd={2}
                    spanLg={2}
                    spanXl={5}
                    padding="sm"
                    className="!p-0"
                  >
                    <Link
                      to={`/artikel/${article.slug}`}
                      className="flex h-full gap-3 p-3 md:p-3.5"
                    >
                      <div className="media-cover h-[88px] w-[100px] shrink-0 rounded-2xl ring-1 ring-black/5">
                        <img
                          src={coverSrc(
                            article.cover_path,
                            article.slug || article.id,
                            320,
                            240,
                          )}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-1 flex flex-wrap gap-1.5 text-[10px] font-medium text-subtle">
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
                  </BentoTile>
                )
              })}
            </BentoBoard>
          </section>
        )}

        {/* —— Board 3: prestasi + CTA —— */}
        {achievements.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3 px-0.5 md:mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Trophy className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div>
                  <BentoEyebrow className="!mb-0 text-amber-700">Prestasi</BentoEyebrow>
                  <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                    Bangga bersama
                  </h2>
                </div>
              </div>
              <Link
                to="/prestasi"
                className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-amber-950 shadow-sm transition hover:bg-amber-300"
              >
                Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <BentoBoard>
              {featuredAchievement && (
                <BentoTile
                  tone="amber"
                  spanMd={4}
                  spanLg={3}
                  spanXl={5}
                  padding="none"
                  className="!p-0"
                >
                  <Link
                    to={`/prestasi/${featuredAchievement.slug}`}
                    className="flex h-full min-h-[240px] flex-col"
                  >
                    <div className="media-cover relative aspect-[16/10] w-full">
                      <img
                        src={coverSrc(
                          featuredAchievement.cover_path,
                          featuredAchievement.slug || featuredAchievement.id,
                          900,
                          560,
                        )}
                        alt={featuredAchievement.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      {featuredAchievement.badge_label && (
                        <Badge color="#B45309" className="mb-2 w-fit">
                          {featuredAchievement.badge_label}
                        </Badge>
                      )}
                      <h3 className="text-balance text-lg font-bold text-ink">
                        {featuredAchievement.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-subtle">
                        {featuredAchievement.excerpt}
                      </p>
                      <p className="mt-auto pt-3 text-xs font-medium text-amber-800/80">
                        {formatDate(featuredAchievement.achieved_at)}
                      </p>
                    </div>
                  </Link>
                </BentoTile>
              )}

              {sideAchievements.map((item, i) => {
                const tones: BentoTone[] = ['coral', 'mint', 'violet']
                return (
                  <BentoTile
                    key={item.id}
                    tone={tones[i % tones.length]}
                    spanMd={2}
                    spanLg={i === 0 ? 3 : 2}
                    spanXl={i === 0 ? 4 : 3}
                    padding="sm"
                  >
                    <Link to={`/prestasi/${item.slug}`} className="flex h-full flex-col gap-2">
                      <div className="media-cover aspect-[16/9] w-full rounded-xl">
                        <img
                          src={coverSrc(item.cover_path, item.slug || item.id, 480, 270)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {item.badge_label && (
                        <Badge color="#047857" className="w-fit">
                          {item.badge_label}
                        </Badge>
                      )}
                      <h4 className="line-clamp-2 text-sm font-bold text-ink group-hover:text-brand">
                        {item.title}
                      </h4>
                    </Link>
                  </BentoTile>
                )
              })}

              {/* Fun CTA tile */}
              <BentoTile
                tone="brand"
                spanMd={2}
                spanLg={2}
                spanXl={3}
                padding="lg"
                className="flex flex-col justify-between bg-gradient-to-br from-sky-400 to-cyan-500 !border-sky-300 text-white"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                    Jelajahi
                  </p>
                  <h3 className="mt-1 text-lg font-bold leading-snug">
                    Ekstrakurikuler & unduhan
                  </h3>
                  <p className="mt-2 text-sm text-white/90">
                    Temukan klub, lomba, dan berkas penting sekolah.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/ekstrakurikuler"
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm transition hover:bg-sky-50"
                  >
                    Ekskul
                  </Link>
                  <Link
                    to="/download"
                    className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/40 transition hover:bg-white/30"
                  >
                    Download
                  </Link>
                </div>
              </BentoTile>
            </BentoBoard>
          </section>
        )}

        {/* —— Board 4: gallery mosaic —— */}
        {gallerySlice.length > 0 && (
          <section>
            <div className="mb-3 px-0.5 md:mb-4">
              <BentoEyebrow>Galeri</BentoEyebrow>
              <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                Momen ceria
              </h2>
            </div>
            <BentoBoard>
              {gallerySlice.map((item, i) => {
                // Vary sizes for mosaic feel
                const big = i === 0 || i === 3
                return (
                  <BentoTile
                    key={item.id}
                    tone="white"
                    spanMd={big ? 2 : 1}
                    spanLg={big ? 3 : 2}
                    spanXl={big ? 4 : 2}
                    padding="none"
                    className={cn('!p-0', big && 'md:row-span-2')}
                  >
                    <figure className="relative h-full min-h-[140px] w-full md:min-h-full">
                      <img
                        src={coverSrc(item.image_path, `gallery-${item.id || i}`, 800, 600)}
                        alt={item.title || item.caption || `Galeri ${i + 1}`}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {(item.title || item.caption) && (
                        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 pt-8 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 md:text-sm">
                          {item.title || item.caption}
                        </figcaption>
                      )}
                    </figure>
                  </BentoTile>
                )
              })}
            </BentoBoard>
          </section>
        )}

        {/* —— Partners strip —— */}
        {partners.length > 0 && (
          <BentoTile tone="white" span={12} spanMd={4} spanLg={6} spanXl={12} padding="md">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
              Mitra & kolaborator
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
              {partners.map((p) => {
                const href = p.url && p.url !== '#' ? safeHref(p.url) : undefined
                const logo = mediaUrl(p.logo_path)
                const chip = (
                  <span className="flex h-14 min-w-[96px] items-center justify-center rounded-2xl border border-line bg-muted/60 px-3 transition hover:border-brand/30 hover:bg-white">
                    {logo ? (
                      <img
                        src={logo}
                        alt={p.name}
                        className="max-h-9 max-w-[80px] object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold text-subtle">{p.name}</span>
                    )}
                  </span>
                )
                return href ? (
                  <a key={p.id} href={href} target="_blank" rel="noopener noreferrer" title={p.name}>
                    {chip}
                  </a>
                ) : (
                  <span key={p.id} title={p.name}>
                    {chip}
                  </span>
                )
              })}
            </div>
          </BentoTile>
        )}
      </div>
    </div>
  )
}
