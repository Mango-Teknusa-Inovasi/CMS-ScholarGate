import { useState } from 'react'
import { Sparkles, X, Loader2, Landmark, Compass, Award, Building2, BookMarked } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'

export type ProfileAiResult = {
  tab_label: string
  content_html: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  currentLabel: string
  onGenerated: (data: ProfileAiResult) => void
}

const STYLES = [
  {
    id: 'history',
    label: 'Sejarah Kronologis',
    icon: Landmark,
    desc: 'Alur cerita berdirinya sekolah, fase perkembangan, hingga era modern.',
  },
  {
    id: 'vision_mission',
    label: 'Visi, Misi & Tujuan',
    icon: Compass,
    desc: 'Visi agung terukur, butir misi strategis, dan tujuan pendidikan.',
  },
  {
    id: 'culture',
    label: 'Budaya & Karakter',
    icon: Award,
    desc: 'Nilai luhur, Profil Pelajar Pancasila, kebiasaan baik, dan etos sekolah.',
  },
  {
    id: 'facilities',
    label: 'Fasilitas & Sarana',
    icon: Building2,
    desc: 'Deskripsi lingkungan belajar, lab teknologi, perpustakaan, dan sarana olahraga.',
  },
  {
    id: 'general',
    label: 'Profil Umum',
    icon: BookMarked,
    desc: 'Gambaran umum institusi sekolah yang formal, elegan, dan komprehensif.',
  },
]

export function ProfileAiModal({ isOpen, onClose, currentLabel, onGenerated }: Props) {
  const toast = useToast()
  const [tabLabel, setTabLabel] = useState(currentLabel || 'Sejarah Sekolah')
  const [hints, setHints] = useState('')
  const [style, setStyle] = useState('history')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tabLabel.trim()) {
      toast.error('Label tab atau nama bagian profil wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: ProfileAiResult }>(
        '/admin/ai/generate-profile',
        {
          tab_label: tabLabel.trim(),
          hints: hints.trim(),
          style,
        },
      )

      if (res.data?.success && res.data?.data) {
        onGenerated(res.data.data)
        toast.success('Konten profil berhasil disusun oleh AI!')
        onClose()
      } else {
        toast.error('Gagal menyusun konten profil.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyusun konten profil AI.')
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand/20 via-sky-500/20 to-indigo-500/20 text-brand shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Generate Konten Profil Sekolah AI</h2>
              <p className="text-xs text-subtle">
                Susun narasi sejarah, visi misi, atau budaya sekolah berformat HTML rapi dan elegan.
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
              Nama Bagian / Label Tab *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
              placeholder="Contoh: Sejarah Singkat SMAN 1 Gedeg"
              value={tabLabel}
              onChange={(e) => setTabLabel(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Gaya Penyajian</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLES.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStyle(s.id)
                      if (!tabLabel || tabLabel === 'Tab baru') {
                        setTabLabel(s.label)
                      }
                    }}
                    className={`rounded-xl border p-2.5 text-left transition flex items-start gap-2.5 ${
                      style === s.id
                        ? 'border-brand bg-brand/10 text-brand font-semibold shadow-2xs'
                        : 'border-line bg-page text-subtle hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p className="text-[10px] leading-tight line-clamp-2 mt-0.5 opacity-80">{s.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Catatan Fakta / Petunjuk Khusus Sekolah (Opsional)
            </label>
            <textarea
              rows={3}
              className="w-full rounded-[14px] border border-line bg-page p-3.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
              placeholder="Contoh: Didirikan tahun 1985. Awalnya beroperasi dengan 3 kelas pinjaman, kini berkembang menjadi 30 rombel dengan lab multimedia dan adiwiyata mandiri..."
              value={hints}
              onChange={(e) => setHints(e.target.value)}
            />
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
              disabled={loading || !tabLabel.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand via-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyusun Konten Profil…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Konten Profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
