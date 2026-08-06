import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLSpanElement> & {
  color?: string
}

export function Badge({ className, color = '#0EA5E9', style, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className,
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        ...style,
      }}
      {...props}
    />
  )
}
