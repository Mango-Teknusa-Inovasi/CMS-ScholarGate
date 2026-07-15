import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export type ToastInput = {
  title?: string
  message: string
  tone?: ToastTone
  duration?: number
}

type ToastItem = ToastInput & { id: string; tone: ToastTone }

type ToastContextValue = {
  toast: (input: ToastInput | string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
}

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput | string) => {
      const payload: ToastInput = typeof input === 'string' ? { message: input } : input
      const item: ToastItem = {
        id: uid(),
        message: payload.message,
        title: payload.title,
        tone: payload.tone || 'info',
        duration: payload.duration ?? 4200,
      }
      setItems((prev) => [...prev.slice(-4), item])
      if (item.duration && item.duration > 0) {
        window.setTimeout(() => dismiss(item.id), item.duration)
      }
    },
    [dismiss],
  )

  const api = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, title = 'Berhasil') => toast({ message, title, tone: 'success' }),
      error: (message, title = 'Gagal') => toast({ message, title, tone: 'error' }),
      info: (message, title) => toast({ message, title, tone: 'info' }),
      warning: (message, title = 'Perhatian') => toast({ message, title, tone: 'warning' }),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:w-full sm:max-w-sm"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const Icon = toneIcon[item.tone]
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  'pointer-events-auto w-full rounded-2xl border px-3.5 py-3 shadow-lg backdrop-blur-sm',
                  toneStyles[item.tone],
                )}
                role="status"
              >
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    {item.title && (
                      <p className="text-sm font-bold leading-snug">{item.title}</p>
                    )}
                    <p className={cn('text-sm leading-snug', item.title && 'mt-0.5 opacity-90')}>
                      {item.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    className="rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                    aria-label="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
