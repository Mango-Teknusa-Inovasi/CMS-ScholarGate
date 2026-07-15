import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { BentoBoard, BentoEyebrow, BentoTile, type BentoTone } from './Bento'

type Crumb = { label: string; to?: string }

type HeroProps = {
  crumbs?: Crumb[]
  title: string
  description?: string
  icon?: ReactNode
  tone?: BentoTone
  action?: ReactNode
  children?: ReactNode
}

/**
 * Hero tile full-width di dalam container bento — tepi sejajar konten.
 */
export function PageBentoHero({
  crumbs,
  title,
  description,
  icon,
  tone = 'brand',
  action,
  children,
}: HeroProps) {
  return (
    <BentoTile
      tone={tone}
      span={12}
      spanMd={4}
      spanLg={6}
      spanXl={12}
      padding="lg"
      className="!col-span-2 hover:translate-y-0 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
    >
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 text-xs font-medium text-subtle md:text-sm">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {i > 0 && <span className="mx-1.5 text-line">/</span>}
              {c.to ? (
                <Link to={c.to} className="hover:text-brand">
                  {c.label}
                </Link>
              ) : (
                <span className="text-body">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-ink md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-subtle md:text-[15px]">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </BentoTile>
  )
}

type ShellProps = {
  children: ReactNode
  className?: string
  /** gap antar board section */
  tight?: boolean
}

/** Wrapper container + spacing halaman bento */
export function PageBentoShell({ children, className, tight }: ShellProps) {
  return (
    <div
      className={cn(
        'bento-page pb-12 md:pb-16',
        className,
      )}
    >
      <div
        className={cn(
          'container-page pt-4 md:pt-5',
          tight ? 'space-y-3 md:space-y-3.5' : 'space-y-4 md:space-y-5',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function PageBentoSection({
  eyebrow,
  title,
  action,
  children,
  className,
}: {
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      {(eyebrow || title || action) && (
        <div className="mb-3 flex items-end justify-between gap-3 px-0.5 md:mb-4">
          <div>
            {eyebrow && <BentoEyebrow>{eyebrow}</BentoEyebrow>}
            {title && (
              <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">{title}</h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export { BentoBoard, BentoTile, BentoEyebrow }
export type { BentoTone }
