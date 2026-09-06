import { useState } from 'react'
import { Sparkles, X, Loader2, BookOpen, Layers } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'

export type ArticlePromptResult = {
  title: string
  slug: string
  category: string
  excerpt: string
  body_html: string
  tags: string[]
  focus_keyword: string
  meta_title: string
  meta_description: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  categories: Array<{ id: string | number; name: string }>
  onGenerated: (data: ArticlePromptResult) => void
}

const TONES = [
  {
    id: 'formal_news',
    label: 'Berita Formal (PUEBI)',
    desc: 'Laras bahasa jurnalistik baku, objektif, dan berwibawa.',
  },
  {
    id: 'achievement',
    label: 'Prestasi & Apresiasi',
    desc: 'Penuh kebanggaan, apresiasi tinggi, dan inspiratif.',
  },
  {
    id: 'casual',
    label: 'Kegiatan Siswa / Ekskul',
    desc: 'Hangat, santai, ramah generasi muda, dan dinamis.',
  },
  {
    id: 'educational',
    label: 'Edukasi & Wawasan',
    desc: 'Bermanfaat, terstruktur, kaya panduan serta tips.',
  },
]

export function ArticlePromptModal({ isOpen, onClose, categories, onGenerated }: Props) {
  const toast = useToast()
  const [topic, setTopic] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [tone, setTone] = useState('formal_news')
  const [categoryHint, setCategoryHint] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error('Topik atau petunjuk artikel wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: ArticlePromptResult }>(
        '/admin/ai/generate-article-prompt',
        {
          topic: topic.trim(),
          key_points: keyPoints.trim(),
          tone,
          category_hint: categoryHint,
        },
      )

      if (res.data?.success && res.data?.data) {
        onGenerated(res.data.data)
        toast.success('Draf artikel berhasil disusun oleh AI!')
        onClose()
      } else {
        toast.error('Gagal menyusun draf artikel.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses draf artikel AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-line bg-white shadow-2xl transition-all dark:bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-page/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500/20 via-brand/20 to-purple-500/20 text-brand shadow-inner">
              <Sparkles className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Tulis Artikel Berita dengan AI</h2>
              <p className="text-xs text-subtle">
                Cukup masukkan ide pokok atau poin kegiatan, AI akan menyusun draf berita lengkap & SEO.
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
              Topik / Judul Gagasan Acara *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
              placeholder="Contoh: Peringatan Hari Pahlawan dan Pelantikan Pengurus OSIS Baru 2026/2027"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Poin-poin Kunci / Catatan Fakta 5W+1H (Opsional)
            </label>
            <textarea
              className="w-full rounded-[14px] border border-line bg-page p-3.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
              rows={3}
              placeholder="Contoh: Dilaksanakan Senin pagi di lapangan utama. Dihadiri kepala sekolah, 800 siswa, perwakilan komite. Ada teatrikal perjuangan dan serah terima jabatan ketua OSIS..."
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Kategori Berita (Opsional)
              </label>
              <select
                className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
                value={categoryHint}
                onChange={(e) => setCategoryHint(e.target.value)}
              >
                <option value="">-- Otomatis Ditentukan AI --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Laras Bahasa</label>
              <select
                className="w-full rounded-[14px] border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tone Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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

          {/* Footer Buttons */}
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
              disabled={loading || !topic.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyusun Berita…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Artikel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
