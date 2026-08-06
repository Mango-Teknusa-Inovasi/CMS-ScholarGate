import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'
import { softTones, type ButtonTone } from '../../lib/buttonTones'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual weight */
  variant?: 'solid' | 'soft' | 'outline' | 'ghost'
  /** Soft colorful tone (referensi portal) */
  tone?: ButtonTone
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'solid',
  tone = 'sky',
  size = 'md',
  ...props
}: Props) {
  const toneSet = softTones[tone]

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition',
        'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-5 py-2.5 text-base',
        variant === 'solid' && toneSet.solid,
        variant === 'soft' && toneSet.soft,
        variant === 'outline' && toneSet.outline,
        variant === 'ghost' && 'text-body hover:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

/** Convenience aliases matching common CTAs */
export const buttonTonePresets = {
  primary: { tone: 'sky' as ButtonTone, variant: 'solid' as const },
  login: { tone: 'teal' as ButtonTone, variant: 'solid' as const },
  report: { tone: 'coral' as ButtonTone, variant: 'outline' as const },
  success: { tone: 'mint' as ButtonTone, variant: 'solid' as const },
  warning: { tone: 'amber' as ButtonTone, variant: 'soft' as const },
  danger: { tone: 'coral' as ButtonTone, variant: 'soft' as const },
  viewAll: { tone: 'sky' as ButtonTone, variant: 'soft' as const },
}
