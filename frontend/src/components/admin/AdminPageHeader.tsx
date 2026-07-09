import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-subtle">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
