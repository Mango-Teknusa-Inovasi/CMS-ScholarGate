import { Link } from 'react-router-dom'
import type { ServiceItem } from '../../lib/api'
import { safeHref } from '../../lib/sanitize'
import { getLucideIcon } from '../ui/DynamicIcon'

function isInternal(url: string) {
  return url.startsWith('/') && !url.startsWith('//')
}

export function ServicesGrid({ services }: { services: ServiceItem[] }) {
  if (!services.length) return null

  return (
    <section className="container-page pb-4 md:pb-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {services.map((item) => {
          const Icon = getLucideIcon(item.icon)
          const rawUrl = item.link_url && item.link_url !== '#' ? item.link_url : null
          const url = rawUrl ? safeHref(rawUrl) ?? null : null
          const body = (
            <>
              <div
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-105"
                style={{ backgroundColor: `${item.color}18`, color: item.color }}
              >
                <Icon className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-bold text-ink">{item.title}</h3>
              {item.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-subtle">{item.description}</p>
              )}
            </>
          )
          const className =
            'group flex h-full flex-col items-center rounded-[16px] border border-line bg-white p-5 text-center shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99]'

          if (url && isInternal(url)) {
            return (
              <Link key={item.id} to={url} className={className}>
                {body}
              </Link>
            )
          }
          if (url) {
            return (
              <a key={item.id} href={url} className={className} target="_blank" rel="noopener noreferrer">
                {body}
              </a>
            )
          }
          return (
            <div key={item.id} className={className}>
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
