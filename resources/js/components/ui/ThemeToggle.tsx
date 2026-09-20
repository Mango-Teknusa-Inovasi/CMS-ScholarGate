import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeMode, type ThemeMode } from '@/hooks/useThemeMode'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { mode, resolvedTheme, cycleMode } = useThemeMode()

  const config: Record<ThemeMode, { label: string; icon: typeof Sun; badgeColor: string }> = {
    light: {
      label: 'Mode Terang',
      icon: Sun,
      badgeColor: 'text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-400/20',
    },
    dark: {
      label: 'Mode Gelap',
      icon: Moon,
      badgeColor: 'text-sky-400 hover:bg-sky-400/10 dark:hover:bg-sky-400/20',
    },
    system: {
      label: 'Otomatis (Sistem)',
      icon: Monitor,
      badgeColor: 'text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-400/20',
    },
  }

  const current = config[mode]
  const Icon = current.icon

  return (
    <button
      type="button"
      onClick={cycleMode}
      title={`Tema: ${current.label} (Klik untuk mengganti)`}
      aria-label={`Ganti tema — ${current.label}`}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl p-2 text-xs font-semibold shadow-xs ring-1 ring-black/5 dark:ring-white/10 transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand',
        'bg-white/80 dark:bg-slate-800/80 text-ink dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800',
        current.badgeColor,
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 ease-spring" strokeWidth={2} />
      
      {showLabel && (
        <span className="ml-2 font-medium truncate max-w-[120px]">
          {current.label}
        </span>
      )}
    </button>
  )
}

export default ThemeToggle
