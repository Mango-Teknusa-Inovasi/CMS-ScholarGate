import { MessageCircle } from 'lucide-react'
import type { WelcomeBlock } from '../../lib/api'
import { coverSrc, mediaUrl } from '../../lib/utils'
import { SafeHtml } from '../ui/SafeHtml'

export function WelcomeSection({ welcome }: { welcome: WelcomeBlock | null }) {
  if (!welcome) return null

  const hasPhoto = Boolean(mediaUrl(welcome.image_path))
  const photo = coverSrc(welcome.image_path, `welcome-${welcome.key}`, 640, 800)

  return (
    <section className="container-page py-10 md:py-12">
      <div className="grid items-center gap-8 rounded-[20px] border border-line bg-surface p-6 shadow-[var(--shadow-card)] md:grid-cols-[260px_1fr] md:gap-10 md:p-8">
        <div className="relative mx-auto w-full max-w-[260px]">
          <div className="aspect-[4/5] overflow-hidden rounded-[20px] border border-line shadow-sm">
            <img
              src={photo}
              alt={hasPhoto ? welcome.title : 'Foto pejabat / kepala instansi'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {welcome.badge_left && (
            <span className="absolute left-3 top-4 z-20 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold tracking-wide text-teal-700 shadow-sm ring-1 ring-teal-200/80">
              {welcome.badge_left}
            </span>
          )}
          {welcome.badge_right && (
            <span className="absolute bottom-4 right-3 z-20 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-[0_2px_8px_rgb(14_165_233/0.35)]">
              {welcome.badge_right}
            </span>
          )}
          {welcome.chat_label && (
            <div className="absolute -bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-body shadow-[var(--shadow-card)]">
              <MessageCircle className="h-3.5 w-3.5 text-brand" />
              {welcome.chat_label}
            </div>
          )}
        </div>

        <div className="rounded-[16px] bg-peach p-6 md:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            Sambutan
          </p>
          <h2 className="text-balance text-2xl font-bold leading-snug tracking-tight text-ink md:text-[28px]">
            {welcome.title}
          </h2>
          <SafeHtml
            className="prose-article mt-4 max-w-none text-[15px] leading-relaxed text-body"
            html={welcome.body}
            plainFallback
          />
        </div>
      </div>
    </section>
  )
}
