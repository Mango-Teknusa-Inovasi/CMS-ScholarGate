import type { Partner } from '../../lib/api'
import { mediaUrl } from '../../lib/utils'
import { safeHref } from '../../lib/sanitize'

export function PartnersSection({ partners }: { partners: Partner[] }) {
  if (!partners.length) return null

  return (
    <section className="border-y border-line bg-white py-10 md:py-12">
      <div className="container-page">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-subtle">
          Mitra & kolaborator
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {partners.map((p) => {
            const href = p.url && p.url !== '#' ? safeHref(p.url) : undefined
            return (
            <a
              key={p.id}
              href={href}
              target={href ? '_blank' : undefined}
              rel={href ? 'noopener noreferrer' : undefined}
              className="flex h-[68px] min-w-[112px] items-center justify-center rounded-2xl border border-line bg-page px-4 text-center shadow-sm transition hover:border-brand/30 hover:bg-white"
              title={p.name}
            >
              {mediaUrl(p.logo_path) ? (
                <img
                  src={mediaUrl(p.logo_path)!}
                  alt={p.name}
                  className="max-h-10 max-w-[88px] object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-semibold leading-snug text-subtle">{p.name}</span>
              )}
            </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
