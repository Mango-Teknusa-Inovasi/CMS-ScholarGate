import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'

function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export type InstagramImportResult = {
  title: string
  slug: string
  excerpt: string
  body: string
  cover_path: string
  cover_url: string
  tags_text: string
  focus_keyword: string
  meta_title: string
  meta_description: string
  images_count: number
  source_url: string
  author?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: InstagramImportResult) => void
}

export function InstagramImportModal({ isOpen, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [tone, setTone] = useState<'formal_news' | 'achievement' | 'casual'>('formal_news')
  const [showManualCaption, setShowManualCaption] = useState(false)
  const [manualCaption, setManualCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'scraping' | 'optimizing' | 'writing'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = url.trim()
    if (!cleanUrl) {
      setErrorMsg('Masukkan tautan postingan Instagram terlebih dahulu.')
      return
    }

    if (!cleanUrl.includes('instagram.com')) {
      setErrorMsg('Tautan harus berasal dari instagram.com (contoh: https://www.instagram.com/p/...).')
      return
    }

    setErrorMsg('')
    setLoading(true)
    setStep('scraping')

    // Simulasi visual tahapan proses agar user memahami alur kerja
    const timer1 = setTimeout(() => setStep('optimizing'), 2200)
    const timer2 = setTimeout(() => setStep('writing'), 4500)

    try {
      const res = await api.post<{ success: boolean; data: InstagramImportResult }>(
        '/admin/articles/generate-from-instagram',
        {
          url: cleanUrl,
          tone,
          manual_caption: manualCaption.trim() || undefined,
        }
      )

      if (res.data?.success && res.data?.data) {
        toast.success(
          `Artikel berhasil digenerate! ${res.data.data.images_count} foto otomatis ditata ke galeri.`
        )
        onSuccess(res.data.data)
        onClose()
      } else {
        throw new Error('Respon tidak valid dari server.')
      }
    } catch (err: any) {
      clearTimeout(timer1)
      clearTimeout(timer2)
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memproses link Instagram.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setLoading(false)
      setStep('idle')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400" />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white shadow-md">
              <InstagramIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Import dari Instagram
                <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                  <Sparkles className="h-3 w-3" /> AI Powered
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah postingan atau reels IG menjadi artikel berita resmi secara otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-5 pt-2 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Tautan Postingan / Reels Instagram
            </label>
            <input
              type="url"
              placeholder="https://www.instagram.com/p/DF..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-pink-500"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Bisa berupa foto tunggal, carousel multi-foto, atau reels video.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Gaya Penulisan Artikel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'formal_news', label: 'Berita Formal', desc: 'Resmi & Edukatif' },
                { id: 'achievement', label: 'Rilis Prestasi', desc: 'Apresiasi Siswa' },
                { id: 'casual', label: 'Liputan Ekskul', desc: 'Hangat & Aktif' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={loading}
                  onClick={() => setTone(opt.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                    tone === opt.id
                      ? 'border-pink-500 bg-pink-50/50 text-pink-700 font-semibold dark:bg-pink-950/30 dark:border-pink-500 dark:text-pink-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs">{opt.label}</span>
                  <span className="text-[10px] opacity-75">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Manual Caption (Sebagai alternatif jika link diproteksi) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850/50">
            <button
              type="button"
              onClick={() => setShowManualCaption(!showManualCaption)}
              className="flex w-full items-center justify-between p-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <span>Opsi Tambahan: Tempel Caption Manual</span>
              {showManualCaption ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showManualCaption && (
              <div className="p-3 pt-0 border-t border-slate-200/60 dark:border-slate-800/60">
                <textarea
                  rows={3}
                  placeholder="Tempelkan caption asli dari Instagram di sini jika akun diprivate atau scraper terkendala..."
                  value={manualCaption}
                  onChange={(e) => setManualCaption(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-pink-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Loading Animation Status */}
          {loading && (
            <div className="rounded-xl border border-pink-100 bg-pink-50/60 p-3.5 dark:border-pink-900/30 dark:bg-pink-950/20">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-pink-600 dark:text-pink-400 shrink-0" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {step === 'scraping' && 'Langkah 1/3: Mengambil data & foto dari Instagram...'}
                    {step === 'optimizing' && 'Langkah 2/3: Mengunduh dan menata galeri gambar WebP...'}
                    {step === 'writing' && 'Langkah 3/3: AI menyusun naskah berita jurnalisme...'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mohon tunggu beberapa detik, sistem sedang memproses media...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Artikel Sekarang
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
