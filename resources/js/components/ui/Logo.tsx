import { Link } from 'react-router-dom'
import { cn, mediaUrl } from '../../lib/utils'

type Props = {
  name?: string
  logoPath?: string | null
  size?: 'sm' | 'md'
  to?: string
  className?: string
}

export function Logo({
  name = 'Scholargate',
  logoPath,
  size = 'md',
  to = '/',
  className,
}: Props) {
  const src = mediaUrl(logoPath)

  const mark = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'object-contain object-left',
            size === 'sm' ? 'h-8 max-w-[140px]' : 'h-9 max-w-[180px]',
          )}
        />
      ) : (
        <>
          <span
            className={cn(
              'relative flex shrink-0 items-center justify-center rounded-xl bg-brand font-bold text-white shadow-[0_2px_8px_rgb(14_165_233/0.28)]',
              size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm',
            )}
            aria-hidden
          >
            S
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-cyan-mid" />
          </span>
          <span
            className={cn(
              'font-bold tracking-tight text-ink',
              size === 'sm' ? 'text-lg' : 'text-xl',
            )}
          >
            {name}
          </span>
        </>
      )}
    </span>
  )

  if (to) {
    return (
      <Link to={to} className="rounded-lg focus-visible:outline-offset-4">
        {mark}
      </Link>
    )
  }

  return mark
}
