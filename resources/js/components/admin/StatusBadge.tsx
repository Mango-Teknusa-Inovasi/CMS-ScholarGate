import { cn } from '../../lib/utils'

const styles: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  draft: 'bg-amber-50 text-amber-800 ring-amber-600/15',
  archived: 'bg-muted text-subtle ring-line',
  active: 'bg-brand-soft text-brand-dark ring-brand/15',
  inactive: 'bg-muted text-subtle ring-line',
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset',
        styles[key] || styles.draft,
      )}
    >
      {status}
    </span>
  )
}
