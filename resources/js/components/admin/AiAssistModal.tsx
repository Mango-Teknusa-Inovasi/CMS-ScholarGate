import { useState } from 'react'
import {
  Sparkles,
  X,
  Wand2,
  FileEdit,
  Maximize2,
  Minimize2,
  MessageSquare,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Eye,
  Code,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'

type ActionType = 'draft' | 'polish' | 'expand' | 'summarize' | 'change_tone'

type Props = {
  isOpen: boolean
  onClose: () => void
  initialText?: string
  onApply: (html: string, mode: 'replace' | 'insert') => void
}

const ACTIONS: Array<{
  id: ActionType
  label: string
  icon: typeof Wand2
  description: string
}> = [
  {
    id: 'draft',
    label: 'Tulis Baru',
    icon: FileEdit,
    description: 'Tulis draf konten baru dari topik atau catatan petunjuk ide.',
  },
  {
    id: 'polish',
    label: 'Perbaiki PUEBI',
    icon: Wand2,
    description: 'Sempurnakan ejaan, tanda baca, tata bahasa baku, dan kejelasan alur.',
  },
  {
    id: 'expand',
    label: 'Perluas & Detail',
    icon: Maximize2,
    description: 'Kembangkan poin-poin menjadi penjelasan mendalam dan berbobot.',
  },
  {
    id: 'summarize',
    label: 'Ringkas Teks',
    icon: Minimize2,
    description: 'Rangkum inti sari tulisan menjadi padat, tepat sasaran, dan ringkas.',
  },
  {
    id: 'change_tone',
    label: 'Sesuaikan Nada',
    icon: MessageSquare,
    description: 'Ubah gaya bahasa menjadi lebih formal, hangat, atau inspiratif.',
  },
]

const TONES = [
  { id: 'formal', label: 'Formal & Baku (PUEBI)' },
  { id: 'warm', label: 'Hangat & Mengayomi' },
  { id: 'inspirational', label: 'Inspiratif & Visioner' },
  { id: 'casual', label: 'Edukatif & Ramah Generasi Muda' },
]

export function AiAssistModal({ isOpen, onClose, initialText = '', onApply }: Props) {
  const toast = useToast()
  const [activeAction, setActiveAction] = useState<ActionType>(
    initialText.trim() ? 'polish' : 'draft',
  )
  const [prompt, setPrompt] = useState('')
  const [inputText, setInputText] = useState(initialText)
  const [selectedTone, setSelectedTone] = useState('formal')
  const [loading, setLoading] = useState(false)
  const [resultHtml, setResultHtml] = useState('')
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (activeAction === 'draft' && !prompt.trim() && !inputText.trim()) {
      toast.error('Masukkan topik atau petunjuk penulisan.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: { result_html: string } }>(
        '/admin/ai/assist-text',
        {
          action: activeAction,
          text: inputText,
          prompt,
          tone: selectedTone,
        },
      )
      if (res.data?.success && res.data?.data?.result_html) {
        setResultHtml(res.data.data.result_html)
        toast.success('Bantuan AI berhasil dihasilkan!')
      } else {
        toast.error('Respon AI kosong. Coba ulangi kembali.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses bantuan AI.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!resultHtml) return
    navigator.clipboard.writeText(resultHtml)
    setCopied(true)
    toast.success('Markup HTML disalin ke papan klip.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyToEditor = (mode: 'replace' | 'insert') => {
    if (!resultHtml) return
    onApply(resultHtml, mode)
    toast.success(
      mode === 'replace' ? 'Konten editor berhasil digantikan.' : 'Konten disisipkan ke editor.',
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-line bg-white shadow-2xl transition-all dark:bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-page/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500/20 via-brand/20 to-sky-500/20 text-brand shadow-inner">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Asisten AI Text Editor</h2>
              <p className="text-xs text-subtle">
                Kecerdasan buatan terintegrasi untuk menyusun, memperbaiki, dan memperkaya tulisan.
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

        {/* Action Tabs */}
        <div className="flex border-b border-line bg-page px-6 overflow-x-auto gap-1 py-2">
          {ACTIONS.map((act) => {
            const Icon = act.icon
            const active = activeAction === act.id
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  setActiveAction(act.id)
                  setResultHtml('')
                }}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-body hover:bg-muted hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {act.label}
              </button>
            )
          })}
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Action description banner */}
          <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-xs text-body flex items-center justify-between">
            <span>{ACTIONS.find((a) => a.id === activeAction)?.description}</span>
            <span className="font-semibold text-brand text-[11px] uppercase tracking-wider">
              AI Copilot
            </span>
          </div>

          {/* Form Inputs */}
          {activeAction === 'draft' ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Topik / Ide Tulisan / Poin yang ingin disampaikan *
              </label>
              <textarea
                className="w-full rounded-[14px] border border-line bg-page p-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                rows={3}
                placeholder="Contoh: Tulis artikel edukasi tentang pentingnya literasi digital dan etika bermedia sosial bagi pelajar SMA..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Teks yang Sedang Diedit
                </label>
                <textarea
                  className="w-full rounded-[14px] border border-line bg-page p-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                  rows={4}
                  placeholder="Ketik atau tempel teks di sini..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Instruksi Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-[14px] border border-line bg-page px-3 py-2 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Contoh: Buat pembukaan lebih menyentuh, gunakan bahasa formal..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Tone Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Gaya Bahasa / Nada</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTone(t.id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition text-left ${
                    selectedTone === t.id
                      ? 'border-brand bg-brand/10 text-brand font-semibold shadow-2xs'
                      : 'border-line bg-page text-body hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand via-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses dengan AI…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Proses Bantuan AI
                </>
              )}
            </button>
          </div>

          {/* Result Area */}
          {resultHtml && (
            <div className="mt-4 rounded-[16px] border border-line bg-page/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Hasil Generasi AI</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    Selesai
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'preview' ? 'html' : 'preview')}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-body hover:bg-muted"
                  >
                    {viewMode === 'preview' ? (
                      <>
                        <Code className="h-3.5 w-3.5" /> HTML
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Pratinjau
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-body hover:bg-muted"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-body hover:bg-muted"
                    title="Buat Ulang"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {viewMode === 'preview' ? (
                <div
                  className="prose-article max-h-60 overflow-y-auto rounded-xl border border-line bg-white p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: resultHtml }}
                />
              ) : (
                <textarea
                  readOnly
                  rows={6}
                  className="w-full rounded-xl border border-line bg-white p-3 font-mono text-xs text-ink outline-none"
                  value={resultHtml}
                />
              )}

              {/* Apply Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleApplyToEditor('insert')}
                  className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-muted"
                >
                  Sisipkan di Kursor
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyToEditor('replace')}
                  className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                >
                  Gantikan Seluruh Konten Editor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
