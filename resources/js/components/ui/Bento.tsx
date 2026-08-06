import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/** Soft pastel fills for cheerful bento tiles */
export const bentoTones = {
  white: 'bg-white border-line',
  sky: 'bg-soft-sky/80 border-sky-100',
  teal: 'bg-soft-teal/90 border-teal-100',
  mint: 'bg-soft-mint/90 border-emerald-100',
  coral: 'bg-soft-coral/90 border-rose-100',
  amber: 'bg-soft-amber/90 border-amber-100',
  violet: 'bg-soft-violet/90 border-violet-100',
  rose: 'bg-soft-rose/90 border-pink-100',
  peach: 'bg-peach-soft border-peach-mid/40',
  brand: 'bg-brand-soft border-sky-100',
} as const

export type BentoTone = keyof typeof bentoTones

type BoardProps = {
  children: ReactNode
  className?: string
  /** Mark as GSAP reveal unit (default true — each board enters in sequence) */
  layer?: boolean
  /** Soft scroll parallax intensity (px); 0 disables */
  parallax?: number
}

/** CSS grid board — 2 col mobile, 4 / 6 / 12 desktop */
export function BentoBoard({ children, className, layer = true, parallax = 8 }: BoardProps) {
  return (
    <div
      className={cn(
        'bento-board grid auto-rows-[minmax(120px,auto)] grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-4 md:gap-4 lg:grid-cols-6 xl:grid-cols-12',
        className,
      )}
      {...(layer ? { 'data-layer': '' } : {})}
      {...(layer && parallax > 0 ? { 'data-parallax': String(parallax) } : {})}
    >
      {children}
    </div>
  )
}

type TileProps = {
  children: ReactNode
  className?: string
  tone?: BentoTone
  /** col span at md+ (default 1). Mobile always full of 2-col unless spanMobile set */
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12
  spanMd?: 1 | 2 | 3 | 4
  spanLg?: 1 | 2 | 3 | 4 | 6
  spanXl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 12
  rowSpan?: 1 | 2 | 3
  as?: 'div' | 'article' | 'section' | 'aside'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const spanXlMap: Record<number, string> = {
  1: 'xl:col-span-1',
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  12: 'xl:col-span-12',
}
const spanLgMap: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
}
const spanMdMap: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
}
const spanMobileMap: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
}

const padMap = {
  none: 'p-0',
  sm: 'p-3.5 md:p-4',
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6 lg:p-7',
}

export function BentoTile({
  children,
  className,
  tone = 'white',
  span = 2,
  spanMd,
  spanLg,
  spanXl,
  rowSpan = 1,
  as: Tag = 'div',
  padding = 'md',
}: TileProps) {
  const mobileSpan = span >= 2 ? 2 : 1

  return (
    <Tag
      className={cn(
        'bento-tile group relative overflow-hidden rounded-[22px] border shadow-[var(--shadow-card)] transition duration-300',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]',
        bentoTones[tone],
        spanMobileMap[mobileSpan],
        spanMd != null && spanMdMap[spanMd],
        spanLg != null && spanLgMap[spanLg],
        spanXl != null && spanXlMap[spanXl],
        // defaults when only span given
        spanMd == null && spanLg == null && spanXl == null && [
          span === 1 && 'md:col-span-1',
          span === 2 && 'md:col-span-2 lg:col-span-2 xl:col-span-4',
          span === 3 && 'md:col-span-2 lg:col-span-3 xl:col-span-6',
          span === 4 && 'md:col-span-4 lg:col-span-4 xl:col-span-8',
          span === 6 && 'md:col-span-4 lg:col-span-6 xl:col-span-6',
          span === 8 && 'md:col-span-4 lg:col-span-6 xl:col-span-8',
          span === 12 && 'col-span-2 md:col-span-4 lg:col-span-6 xl:col-span-12',
        ],
        rowSpan === 2 && 'md:row-span-2',
        rowSpan === 3 && 'md:row-span-3',
        padMap[padding],
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function BentoEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand',
        className,
      )}
    >
      {children}
    </p>
  )
}
