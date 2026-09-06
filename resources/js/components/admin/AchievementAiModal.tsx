import { useState } from 'react'
import { Sparkles, X, Loader2, Trophy, Award, User, MapPin } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'

export type AchievementAiResult = {
  title: string
  slug: string
  badge_label: string
  excerpt: string
  body_html: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onGenerated: (data: AchievementAiResult) => void
}

const LEVELS = [
  'Sekolah',
  'Kecamatan',
  'Kabupaten / Kota',
  'Karesidenan / Wilayah',
  'Provinsi',
  'Nasional',
  'Internasional',
]

const QUICK_RANKS = [
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Medali Emas',
  'Medali Perak',
  'Medali Perunggu',
  'Juara Harapan 1',
  'Finalis Terbaik',
]

export function AchievementAiModal({ isOpen, onClose, onGenerated }: Props) {
  const toast = useToast()
  const [competition, setCompetition] = useState('')
  const [level, setLevel] = useState('Nasional')
  const [participant, setParticipant] = useState('')
  const [rank, setRank] = useState('Juara 1')
  const [organizer, setOrganizer] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!competition.trim()) {
      toast.error('Nama lomba atau kejuaraan wajib diisi.')
      return
    }
    if (!participant.trim()) {
      toast.error('Nama siswa atau tim peraih prestasi wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: AchievementAiResult }>(
        '/admin/ai/generate-achievement',
        {
          competition: competition.trim(),
          level,
          participant: participant.trim(),
          rank: rank.trim() || 'Juara 1',
          organizer: organizer.trim(),
          notes: notes.trim(),
        },
      )

      if (res.data?.success && res.data?.data) {
        onGenerated(res.data.data)
        toast.success('Liputan prestasi berhasil disusun oleh AI!')
        onClose()
      } else {
        toast.error('Gagal menyusun liputan prestasi.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyusun liputan prestasi AI.')
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
        {/* Header with decorative gradient */}
        <div className="relative overflow-hidden border-b border-line/60 bg-gradient-to-br from-amber-500/10 via-brand/10 to-sky-500/10 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                  Liputan Prestasi AI
                </h3>
                <p className="text-xs text-subtle">
                  Generate rilis berita prestasi, badge medali, & kutipan inspiratif otomatis.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-subtle transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-subtle">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Nama Lomba / Kejuaraan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              placeholder="Contoh: Olimpiade Sains Nasional (OSN) Bidang Fisika 2026"
              className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-subtle">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                Peringkat / Capaian <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="Contoh: Juara 1 Medali Emas"
                className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {QUICK_RANKS.slice(0, 4).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRank(r)}
                    className="rounded-[8px] border border-line/60 bg-page px-2 py-0.5 text-[10px] font-medium text-subtle hover:border-brand hover:text-brand transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-subtle">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                Tingkat Kejuaraan
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-subtle">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                Nama Siswa / Tim <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={participant}
                onChange={(e) => setParticipant(e.target.value)}
                placeholder="Contoh: Ananda Muhammad Rizky (Kelas XI IPA 1)"
                className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-subtle">
                Penyelenggara (Opsional)
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Contoh: Kemendikbudristek RI / Puspresnas"
                className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-subtle">
              Catatan / Poin Menarik / Pembimbing (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Dibimbing oleh Bpk. Budi Santoso, M.Pd. Menyingkirkan 500 peserta dari 34 provinsi. Lolos ke babak internasional di Tokyo."
              className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-[12px] border border-line px-4 py-2.5 text-sm font-medium text-subtle hover:bg-muted transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-amber-500 via-brand to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menulis Liputan…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Buat Liputan AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
