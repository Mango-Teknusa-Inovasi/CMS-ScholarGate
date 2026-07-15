import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** destructive = tombol merah (hapus) */
  tone?: 'danger' | 'primary' | 'warning'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

type Pending = ConfirmOptions & {
  resolve: (value: boolean) => void
}

const toneBtn: Record<NonNullable<ConfirmOptions['tone']>, string> = {
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 shadow-[0_2px_10px_rgb(244_63_94/0.3)]',
  primary:
    'bg-sky-500 text-white hover:bg-sky-600 shadow-[0_2px_10px_rgb(14_165_233/0.3)]',
  warning:
    'bg-amber-500 text-white hover:bg-amber-600 shadow-[0_2px_10px_rgb(245_158_11/0.3)]',
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const resolving = useRef(false)

  const close = useCallback((value: boolean) => {
    if (!pending || resolving.current) return
    resolving.current = true
    pending.resolve(value)
    setPending(null)
    window.setTimeout(() => {
      resolving.current = false
    }, 50)
  }, [pending])

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts: ConfirmOptions =
      typeof options === 'string' ? { message: options } : options
    return new Promise<boolean>((resolve) => {
      setPending({
        title: opts.title || 'Konfirmasi',
        message: opts.message,
        confirmLabel: opts.confirmLabel || 'Ya, lanjutkan',
        cancelLabel: opts.cancelLabel || 'Batal',
        tone: opts.tone || 'danger',
        resolve,
      })
    })
  }, [])

  const api = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {pending && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Tutup dialog"
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => close(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
              className="relative w-full max-w-md rounded-[20px] border border-line bg-white p-5 shadow-xl"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                    pending.tone === 'danger' && 'bg-rose-50 text-rose-600',
                    pending.tone === 'warning' && 'bg-amber-50 text-amber-600',
                    pending.tone === 'primary' && 'bg-sky-50 text-sky-600',
                  )}
                >
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="confirm-title" className="text-lg font-bold text-ink">
                    {pending.title}
                  </h2>
                  <p id="confirm-desc" className="mt-1.5 text-sm leading-relaxed text-body">
                    {pending.message}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-body transition hover:bg-muted"
                >
                  {pending.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={cn(
                    'rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]',
                    toneBtn[pending.tone || 'danger'],
                  )}
                  autoFocus
                >
                  {pending.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return ctx
}
