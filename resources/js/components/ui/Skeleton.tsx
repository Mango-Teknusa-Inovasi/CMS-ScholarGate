import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

/** Full home portal loading — bento shape */
export function HomeSkeleton() {
  return (
    <div className="container-page space-y-4 py-5" aria-busy="true" aria-label="Memuat portal">
      <Skeleton className="h-[240px] w-full rounded-[22px] md:h-[300px]" />
      <div className="grid auto-rows-[minmax(100px,auto)] grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Skeleton className="col-span-2 row-span-2 min-h-[220px] rounded-[22px] md:col-span-2 lg:col-span-3" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="min-h-[110px] rounded-[22px]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Skeleton className="col-span-2 min-h-[260px] rounded-[22px] md:col-span-2 lg:col-span-3" />
        <Skeleton className="min-h-[120px] rounded-[22px]" />
        <Skeleton className="min-h-[120px] rounded-[22px]" />
        <Skeleton className="min-h-[120px] rounded-[22px]" />
        <Skeleton className="min-h-[120px] rounded-[22px]" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-[22px]" />
        ))}
      </div>
    </div>
  )
}

/** Public inner page with hero band */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat halaman">
      <div className="page-hero-band">
        <div className="container-page space-y-3 py-10">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="container-page space-y-4 py-8">
        <Skeleton className="h-14 w-full rounded-[16px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
      </div>
    </div>
  )
}

/** Card grid (prestasi, ekskul, dll.) */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Memuat konten"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[16px] border border-line bg-white">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2 p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** List rows (download, articles list) */
export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat daftar">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-[16px] border border-line bg-white p-4 sm:p-5"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3 max-w-sm" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden h-10 w-24 shrink-0 rounded-[12px] sm:block" />
        </div>
      ))}
    </div>
  )
}

/** Article detail */
export function ArticleDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat artikel">
      <div className="page-hero-band">
        <div className="container-page space-y-3 py-8">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full max-w-3xl" />
          <Skeleton className="h-10 w-2/3 max-w-xl" />
        </div>
      </div>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[16/9] w-full rounded-[16px]" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="mt-6 h-40 w-full rounded-[16px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[16px]" />
          <Skeleton className="h-56 w-full rounded-[16px]" />
        </div>
      </div>
    </div>
  )
}

/** Admin dashboard */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-[12px]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[16px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-72 rounded-[16px]" />
        <Skeleton className="h-72 rounded-[16px]" />
      </div>
    </div>
  )
}

/** Admin table / list pages */
export function AdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat data">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-[12px]" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24 rounded-[10px]" />
        <Skeleton className="h-9 w-24 rounded-[10px]" />
        <Skeleton className="h-9 w-48 rounded-[10px]" />
      </div>
      <div className="overflow-hidden rounded-[16px] border border-line bg-white p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Admin form / editor */
export function AdminFormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat form">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-[14px]" />
          <Skeleton className="h-[420px] w-full rounded-[16px]" />
          <Skeleton className="h-28 w-full rounded-[16px]" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-[16px]" />
          <Skeleton className="h-48 w-full rounded-[16px]" />
          <Skeleton className="h-32 w-full rounded-[16px]" />
        </div>
      </div>
    </div>
  )
}

/** Media library grid */
export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6"
      aria-busy="true"
      aria-label="Memuat media"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-[14px]" />
      ))}
    </div>
  )
}
