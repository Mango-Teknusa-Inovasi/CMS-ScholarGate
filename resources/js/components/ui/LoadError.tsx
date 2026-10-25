import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

export function LoadError({ onRetry }: { onRetry: () => unknown }) {
  return (
    <div role="alert" className="rounded-2xl border border-line bg-surface px-5 py-10 text-center">
      <AlertCircle aria-hidden className="mx-auto mb-3 h-6 w-6 text-amber-700 dark:text-amber-300" />
      <h2 className="text-base font-semibold text-ink">Data belum dapat dimuat</h2>
      <p className="mt-2 text-sm text-body">Periksa koneksi internet Anda, lalu coba lagi.</p>
      <Button type="button" variant="outline" className="mt-4" onClick={() => void onRetry()}>Coba lagi</Button>
    </div>
  )
}
