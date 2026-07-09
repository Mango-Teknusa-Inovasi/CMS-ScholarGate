import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function HomeSkeleton() {
  return (
    <div className="container-page space-y-8 py-6" aria-busy="true" aria-label="Memuat portal">
      <Skeleton className="h-[280px] w-full rounded-[20px] md:h-[320px]" />
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <Skeleton className="aspect-[4/5] w-full max-w-[260px] rounded-[20px]" />
        <Skeleton className="min-h-[220px] rounded-[16px]" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[16px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[16px]" />
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-[16px]" />
          <Skeleton className="h-24 rounded-[16px]" />
          <Skeleton className="h-24 rounded-[16px]" />
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat halaman">
      <div className="page-hero-band">
        <div className="container-page py-10 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="container-page space-y-4 py-8">
        <Skeleton className="h-14 w-full rounded-[16px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
      </div>
    </div>
  )
}
