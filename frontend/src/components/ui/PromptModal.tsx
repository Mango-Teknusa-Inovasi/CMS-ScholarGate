import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'

export type PromptOptions = {
  title?: string
  message?: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  /** empty string not allowed */
  required?: boolean
}

type PromptContextValue = {
  prompt: (options: PromptOptions | string) => Promise<string | null>
}

const PromptContext = createContext<PromptContextValue | null>(null)

type Pending = PromptOptions & {
  resolve: (value: string | null) => void
}

export function PromptProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const resolving = useRef(false)

  useEffect(() => {
    if (pending) {
      setValue(pending.defaultValue || '')
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [pending])

  const close = useCallback(
    (result: string | null) => {
      if (!pending || resolving.current) return
      resolving.current = true
      pending.resolve(result)
      setPending(null)
      window.setTimeout(() => {
        resolving.current = false
      }, 50)
    },
    [pending],
  )

  const prompt = useCallback((options: PromptOptions | string) => {
    const opts: PromptOptions =
      typeof options === 'string' ? { title: options } : options
    return new Promise<string | null>((resolve) => {
      setPending({
        title: opts.title || 'Masukkan nilai',
        message: opts.message,
        defaultValue: opts.defaultValue || '',
        placeholder: opts.placeholder,
        confirmLabel: opts.confirmLabel || 'Simpan',
        cancelLabel: opts.cancelLabel || 'Batal',
        required: opts.required !== false,
        resolve,
      })
    })
  }, [])

  const api = useMemo(() => ({ prompt }), [prompt])

  const submit = () => {
    if (!pending) return
    const v = value.trim()
    if (pending.required && !v) return
    close(v)
  }

  return (
    <PromptContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {pending && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Tutup"
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => close(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-md rounded-[20px] border border-line bg-white p-5 shadow-xl"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
            >
              <h2 className="text-lg font-bold text-ink">{pending.title}</h2>
              {pending.message && (
                <p className="mt-1.5 text-sm text-body">{pending.message}</p>
              )}
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                  if (e.key === 'Escape') close(null)
                }}
                placeholder={pending.placeholder}
                className="mt-4 w-full rounded-xl border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => close(null)}
                  className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-body hover:bg-muted"
                >
                  {pending.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
                >
                  {pending.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PromptContext.Provider>
  )
}

export function usePrompt() {
  const ctx = useContext(PromptContext)
  if (!ctx) {
    throw new Error('usePrompt must be used within PromptProvider')
  }
  return ctx
}
