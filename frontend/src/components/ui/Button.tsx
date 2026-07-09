import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'soft'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[12px] font-medium disabled:opacity-50 active:scale-[0.98]',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-5 py-2.5 text-base',
        variant === 'primary' &&
          'bg-brand text-white shadow-[0_2px_10px_rgb(14_165_233/0.28)] hover:bg-brand-dark',
        variant === 'outline' && 'border border-brand bg-white text-brand hover:bg-brand-soft',
        variant === 'ghost' && 'text-body hover:bg-muted',
        variant === 'soft' && 'bg-brand-soft text-brand-dark hover:bg-cyan-soft',
        className,
      )}
      {...props}
    />
  )
}
