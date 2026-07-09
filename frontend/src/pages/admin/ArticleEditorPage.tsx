import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, ExternalLink, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { MEDIA_GUIDES } from '../../lib/mediaGuide'
import { RichTextEditor } from '../../components/admin/RichTextEditor'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { AdminFormSkeleton } from '../../components/ui/Skeleton'

type Category = { id: number; name: string }
type Tag = { id: number; name: string; slug: string }

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  meta_title: '',
  meta_description: '',
  body: '',
  cover_path: '',
  status: 'draft',
  category_id: '',
  is_featured: false,
  published_at: '',
  tags_text: '',
  focus_keyword: '',
  canonical_url: '',
  og_image: '',
  noindex: false,
  faq_items: [] as Array<{ question: string; answer: string }>,
}

function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ArticleEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [savedMsg, setSavedMsg] = useState('')
  const [previewBusy, setPreviewBusy] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get<Category[]>('/admin/categories')).data,
  })

  const { data: allTags = [] } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => (await api.get<Tag[]>('/admin/tags')).data,
  })

  const { data: article, isLoading } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: async () => (await api.get(`/admin/articles/${id}`)).data,
    enabled: !isNew,
  })

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        body: article.body || '',
        cover_path: article.cover_path || '',
        status: article.status || 'draft',
        category_id: article.category_id ? String(article.category_id) : '',
        is_featured: !!article.is_featured,
        published_at: toLocalInput(article.published_at),
        tags_text: (article.tags || []).map((t: Tag) => t.name).join(', '),
        focus_keyword: article.focus_keyword || '',
        canonical_url: article.canonical_url || '',
        og_image: article.og_image || '',
        noindex: !!article.noindex,
        faq_items: article.faq_items || [],
      })
    }
  }, [article])

  const save = useMutation({
    mutationFn: async (publish?: boolean) => {
      const tags = form.tags_text
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        focus_keyword: form.focus_keyword || null,
        canonical_url: form.canonical_url || null,
        og_image: form.og_image || form.cover_path || null,
        noindex: form.noindex,
        faq_items: (form.faq_items || []).filter((f) => f.question && f.answer),
        body: form.body,
        cover_path: form.cover_path || null,
        status: publish ? 'published' : form.status,
        category_id: form.category_id ? Number(form.category_id) : null,
        is_featured: form.is_featured,
        published_at: form.published_at
          ? new Date(form.published_at).toISOString()
          : publish
            ? new Date().toISOString()
            : null,
        tags,
      }
      if (isNew) return api.post('/admin/articles', payload)
      return api.put(`/admin/articles/${id}`, payload)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      qc.invalidateQueries({ queryKey: ['admin-article', id] })
      qc.invalidateQueries({ queryKey: ['admin-tags'] })
      setSavedMsg('Disimpan.')
      setTimeout(() => setSavedMsg(''), 2500)
      if (isNew && res.data?.id) {
        navigate(`/admin/articles/${res.data.id}/edit`, { replace: true })
      }
    },
  })

  if (!isNew && isLoading) {
    return <AdminFormSkeleton />
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/articles"
            className="mt-0.5 rounded-xl border border-line bg-white p-2 hover:bg-muted"
            title="Semua artikel"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-medium text-subtle">
              Artikel / {isNew ? 'Tambah baru' : 'Edit pos'}
            </p>
            <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
              {isNew ? 'Tambah artikel' : 'Edit artikel'}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedMsg && <span className="text-sm font-medium text-emerald-700">{savedMsg}</span>}
          {!isNew && form.slug && form.status === 'published' && (
            <Link
              to={`/artikel/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Eye className="h-4 w-4" />
              Lihat
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Link>
          )}
          {!isNew && (
            <button
              type="button"
              disabled={previewBusy || save.isPending}
              onClick={async () => {
                setPreviewBusy(true)
                try {
                  // Simpan dulu agar pratinjau isi terbaru
                  await save.mutateAsync(false)
                  const { data } = await api.post<{ path: string; url: string }>(
                    `/admin/articles/${id}/preview-token`,
                  )
                  const path = data.path || `/preview/artikel/${(data as { token?: string }).token}`
                  window.open(path, '_blank', 'noopener,noreferrer')
                } catch {
                  setSavedMsg('Gagal buat link pratinjau.')
                  setTimeout(() => setSavedMsg(''), 3000)
                } finally {
                  setPreviewBusy(false)
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
              title="Buka pratinjau rahasia (berlaku 14 hari)"
            >
              <Eye className="h-4 w-4" />
              {previewBusy ? 'Menyiapkan…' : 'Pratinjau'}
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </button>
          )}
          <button
            type="button"
            onClick={() => save.mutate(false)}
            disabled={save.isPending || !form.title}
            className="rounded-[12px] border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            Simpan draf
          </button>
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({ ...f, status: 'published' }))
              save.mutate(true)
            }}
            disabled={save.isPending || !form.title}
            className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {form.status === 'published' ? 'Perbarui' : 'Terbitkan'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <input
            className="w-full rounded-[14px] border border-line bg-white px-4 py-3.5 text-xl font-bold tracking-tight text-ink shadow-[var(--shadow-card)] outline-none focus:border-brand md:text-2xl"
            placeholder="Tambahkan judul"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />

          <div className="rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-5">
            <label className="mb-2 block text-sm font-semibold text-ink">Konten</label>
            <RichTextEditor
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              placeholder="Mulai menulis… (seperti WordPress)"
            />
          </div>

          <div className="rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-5">
            <label className="mb-1.5 block text-sm font-semibold text-ink">Kutipan (excerpt)</label>
            <textarea
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>

          <div className="rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-5">
            <h2 className="mb-1 text-sm font-bold text-ink">SEO · AEO · GEO</h2>
            <p className="mb-3 text-xs text-subtle">
              Optimasi mesin pencari, answer engine (AI), dan entitas lokal.
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Focus keyword
                </label>
                <input
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  placeholder="contoh: pendaftaran smk 2026"
                  value={form.focus_keyword}
                  onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Meta title
                </label>
                <input
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  placeholder="Judul untuk Google & AI answer"
                  value={form.meta_title}
                  onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-subtle">{form.meta_title.length}/60 disarankan</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Meta description (jawaban singkat AEO)
                </label>
                <textarea
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  rows={3}
                  placeholder="1–2 kalimat yang menjawab intent pencarian secara langsung"
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-subtle">
                  {form.meta_description.length}/160 · tulis seperti jawaban untuk user & AI
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Canonical URL (opsional)
                </label>
                <input
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 font-mono text-xs outline-none focus:border-brand focus:bg-white"
                  placeholder="https://..."
                  value={form.canonical_url}
                  onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.noindex}
                  onChange={(e) => setForm({ ...form, noindex: e.target.checked })}
                />
                <span className="font-medium text-ink">Noindex (sembunyikan dari mesin pencari)</span>
              </label>
            </div>
          </div>

          <div className="rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">FAQ (AEO)</h2>
                <p className="text-xs text-subtle">Q&A untuk schema FAQPage — cocok AI answer engines</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    faq_items: [...(f.faq_items || []), { question: '', answer: '' }],
                  }))
                }
                className="rounded-[10px] border border-line px-2.5 py-1 text-xs font-semibold hover:bg-muted"
              >
                + FAQ
              </button>
            </div>
            <div className="space-y-3">
              {(form.faq_items || []).map((item, i) => (
                <div key={i} className="rounded-[12px] border border-line bg-page p-3">
                  <input
                    className="mb-2 w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm"
                    placeholder="Pertanyaan"
                    value={item.question}
                    onChange={(e) => {
                      const faq = [...form.faq_items]
                      faq[i] = { ...faq[i], question: e.target.value }
                      setForm({ ...form, faq_items: faq })
                    }}
                  />
                  <textarea
                    className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Jawaban jelas & langsung"
                    value={item.answer}
                    onChange={(e) => {
                      const faq = [...form.faq_items]
                      faq[i] = { ...faq[i], answer: e.target.value }
                      setForm({ ...form, faq_items: faq })
                    }}
                  />
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-rose-600"
                    onClick={() =>
                      setForm({
                        ...form,
                        faq_items: form.faq_items.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {(form.faq_items || []).length === 0 && (
                <p className="text-xs text-subtle">Belum ada FAQ. Tambahkan 2–5 Q&A penting.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold text-ink">Terbitkan</h2>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Status
                </label>
                <select
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draf</option>
                  <option value="published">Terbit</option>
                  <option value="archived">Arsip</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Jadwal terbit
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-subtle">Kosongkan = langsung saat terbitkan</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Kategori
                </label>
                <select
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">— Pilih —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Tag
                </label>
                <input
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  placeholder="sekolah, prestasi, smk"
                  value={form.tags_text}
                  onChange={(e) => setForm({ ...form, tags_text: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-subtle">Pisahkan dengan koma</p>
                {allTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {allTags.slice(0, 12).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const parts = form.tags_text
                            .split(',')
                            .map((x) => x.trim())
                            .filter(Boolean)
                          if (!parts.includes(t.name)) {
                            setForm({
                              ...form,
                              tags_text: [...parts, t.name].join(', '),
                            })
                          }
                        }}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-body hover:bg-brand-soft"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                <span className="font-medium text-ink">Tandai unggulan</span>
              </label>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Slug URL
                </label>
                <input
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 font-mono text-xs outline-none focus:border-brand focus:bg-white"
                  placeholder="otomatis-dari-judul"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => save.mutate(false)}
                  disabled={save.isPending || !form.title}
                  className="w-full rounded-[12px] border border-line py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, status: 'published' }))
                    save.mutate(true)
                  }}
                  disabled={save.isPending || !form.title}
                  className="w-full rounded-[12px] bg-violet-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-600 disabled:opacity-50"
                >
                  {form.status === 'published' ? 'Perbarui' : 'Terbitkan'}
                </button>
                <Link
                  to="/admin/articles"
                  className="text-center text-xs font-medium text-subtle hover:text-brand"
                >
                  Kembali ke semua artikel
                </Link>
              </div>
              {save.isError && (
                <p className="text-xs text-rose-600">Gagal menyimpan. Coba lagi.</p>
              )}
            </div>
          </div>

          <div className="rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-sm font-bold text-ink">Gambar unggulan</h2>
            <ImageUploadField
              label="Sampul artikel"
              value={form.cover_path || null}
              onChange={(path) => setForm((f) => ({ ...f, cover_path: path || '' }))}
              guide={MEDIA_GUIDES.find((g) => g.key === 'article_cover')}
              previewClassName="aspect-[16/10] max-h-44"
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
