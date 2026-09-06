import { useState } from 'react'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'

export type WelcomeAiResult = {
  title: string
  badge_left: string
  badge_right: string
  chat_label: string
  body_html: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  targetKey: string
  targetLabel: string
  onGenerated: (data: WelcomeAiResult) => void
}

const TONES = [
  {
    id: 'warm_inspirational',
    label: 'Hangat & Mengayomi',
    desc: 'Menyambut siswa, guru, dan orang tua dengan ramah dan penuh harapan.',
  },
  {
    id: 'visionary',
    label: 'Visioner & Inovatif',
    desc: 'Fokus pada prestasi, transformasi digital, dan wawasan masa depan.',
  },
  {
    id: 'formal_national',
    label: 'Resmi & Karakter Bangsa',
    desc: 'Menekankan integritas, disiplin, dan nilai Profil Pelajar Pancasila.',
  },
  {
    id: 'religious',
    label: 'Religius & Santun',
    desc: 'Penuh rasa syukur, doa restu, dan keteladanan akhlak mulia.',
  },
]

export function WelcomeAiModal({
  isOpen,
  onClose,
  targetKey,
  targetLabel,
  onGenerated,
}: Props) {
  const toast = useToast()
  const [speaker, setSpeaker] = useState('Kepala Sekolah')
  const [theme, setTheme] = useState('Menyambut Tahun Ajaran Baru & Transformasi Pembelajaran Digital')
  const [tone, setTone] = useState('warm_inspirational')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme.trim()) {
      toast.error('Tema atau momen sambutan wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: WelcomeAiResult }>(
        '/admin/ai/generate-welcome',
        {
          speaker: speaker.trim() || 'Kepala Sekolah',
          theme: theme.trim(),
          tone,
          target: targetKey === 'profile' ? 'profile' : 'home',
        },
      )

      if (res.data?.success && res.data?.data) {
        onGenerated(res.data.data)
        toast.success('Naskah sambutan berhasil disusun oleh AI!')
        onClose()
      } else {
        toast.error('Gagal menyusun naskah sambutan.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyusun sambutan AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[24px] border border-line bg-white shadow-2xl transition-all dark:bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-page/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-brand/20 text-purple-600 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Generate Sambutan AI ({targetLabel})</h2>
              <p className="text-xs text-subtle">
                Susun naskah sambutan resmi Kepala Sekolah yang inspiratif, berwibawa, dan tertata rapi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-white p-2 text-subtle transition hover:bg-muted hover:text-ink"
            title="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Nama Pejabat / Kepala Sekolah & Gelar
            </label>
            <input
              type="text"
              className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
              placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd. - Kepala SMAN 1 Gedeg"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Tema / Momen Sambutan *
            </label>
            <textarea
              required
              rows={3}
              className="w-full rounded-[14px] border border-line bg-page p-3.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
              placeholder="Contoh: Menyambut Tahun Ajaran Baru 2026/2027, implementasi pembelajaran berbasis teknologi digital, dan ajakan bagi siswa untuk berakhlak mulia serta berprestasi."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Gaya Bahasa</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    tone === t.id
                      ? 'border-brand bg-brand/10 text-brand font-semibold shadow-2xs'
                      : 'border-line bg-page text-subtle hover:bg-muted'
                  }`}
                >
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="text-[10px] leading-tight line-clamp-2 mt-0.5 opacity-80">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-body hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !theme.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyusun Sambutan…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Sambutan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
