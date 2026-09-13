import { Link } from 'react-router-dom'
import { cn, mediaUrl } from '../../lib/utils'

type Props = {
  name?: string
  logoPath?: string | null
  size?: 'sm' | 'md'
  to?: string
  className?: string
  showText?: boolean
}

export function Logo({
  name = 'Portal Resmi',
  logoPath,
  size = 'md',
  to = '/',
  className,
  showText = true,
}: Props) {
  const src = mediaUrl(logoPath)

  const mark = (
    <span className={cn('inline-flex items-center gap-2.5 min-w-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'object-contain object-left shrink-0',
            size === 'sm' ? 'h-8 w-auto max-w-[140px]' : 'h-9 w-auto max-w-[180px]',
          )}
        />
      ) : (
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
      )}
      {showText && name && (
        <span
          className={cn(
            'font-bold tracking-tight text-ink truncate',
            size === 'sm' ? 'text-base md:text-lg' : 'text-lg md:text-xl',
          )}
        >
          {name}
        </span>
      )}
    </span>
  )

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center rounded-lg focus-visible:outline-offset-4 max-w-full min-w-0">
        {mark}
      </Link>
    )
  }

  return mark
}

export default Logo
