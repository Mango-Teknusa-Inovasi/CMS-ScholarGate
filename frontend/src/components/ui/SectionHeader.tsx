import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  icon?: ReactNode
  align?: 'left' | 'center'
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  icon,
  align = 'left',
}: Props) {
  const centered = align === 'center'

  return (
    <div
      className={`mb-7 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between ${
        centered ? 'text-center md:flex-col md:items-center' : ''
      }`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-balance text-2xl font-bold tracking-tight text-ink md:text-[28px] ${
            centered ? 'justify-center' : ''
          } flex items-center gap-2.5`}
        >
          {icon}
          <span>{title}</span>
        </h2>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-subtle md:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-1.5 self-start rounded-[12px] bg-brand-soft px-3.5 py-2 text-sm font-semibold text-brand-dark hover:bg-cyan-soft md:self-auto"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
