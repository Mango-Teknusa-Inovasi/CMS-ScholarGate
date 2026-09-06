import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  KeyRound,
  LayoutGrid,
  Loader2,
  MapPin,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { api, ensureCsrf } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { mediaUrl } from '../../lib/utils'

type TabKey = 'branding' | 'contact' | 'social' | 'widgets' | 'seo' | 'ai' | 'auth'

const TABS: { id: TabKey; label: string; icon: any }[] = [
  { id: 'branding', label: 'Identitas & Logo', icon: Building2 },
  { id: 'contact', label: 'Kontak & Alamat', icon: MapPin },
  { id: 'social', label: 'Media Sosial', icon: Share2 },
  { id: 'widgets', label: 'Widget & Sidebar', icon: LayoutGrid },
  { id: 'seo', label: 'SEO & Webmaster', icon: Globe },
  { id: 'ai', label: 'AI & Scraper', icon: Sparkles },
  { id: 'auth', label: 'Social Login & SSO', icon: KeyRound },
]

const fieldMeta: Record<
  string,
  {
    label: string
    hint?: string
    multiline?: boolean
    type?: 'text' | 'textarea' | 'select'
    options?: { value: string; label: string }[]
    group: string
  }
> = {
  // Identitas
  site_name: { label: 'Nama situs', group: 'branding' },
  site_tagline: { label: 'Tagline', group: 'branding' },
  site_description: {
    label: 'Deskripsi situs (SEO default)',
    multiline: true,
    group: 'branding',
    hint: 'Dipakai sebagai meta description default & llms.txt',
  },
  footer_text: { label: 'Teks footer', multiline: true, group: 'branding' },
  copyright: { label: 'Copyright', group: 'branding' },

  // Kontak & GEO
  contact_email: { label: 'Email kontak', group: 'contact' },
  contact_phone: { label: 'Telepon', group: 'contact' },
  report_url: { label: 'URL tombol Lapor', hint: 'Link eksternal form laporan', group: 'contact' },
  contact_address: { label: 'Alamat lengkap (GEO/NAP)', multiline: true, group: 'contact' },
  geo_placename: { label: 'Nama tempat / kota', group: 'contact' },
  geo_region: { label: 'Kode negara/region', hint: 'Contoh: ID-JI atau ID', group: 'contact' },
  geo_lat: { label: 'Latitude', hint: 'Contoh: -7.2575', group: 'contact' },
  geo_lng: { label: 'Longitude', hint: 'Contoh: 112.7521', group: 'contact' },

  // Medsos
  social_instagram: {
    label: 'URL Instagram',
    hint: 'Contoh: https://instagram.com/sman1gedeg',
    group: 'social',
  },
  social_facebook: {
    label: 'URL Facebook',
    hint: 'Contoh: https://facebook.com/sman1gedeg',
    group: 'social',
  },
  social_tiktok: {
    label: 'URL TikTok',
    hint: 'Contoh: https://tiktok.com/@sman1gedeg',
    group: 'social',
  },
  social_youtube: {
    label: 'URL YouTube',
    hint: 'Contoh: https://youtube.com/@sman1gedeg',
    group: 'social',
  },

  // SEO & Schema
  organization_type: {
    label: 'Tipe organisasi schema',
    hint: 'EducationalOrganization / School / GovernmentOrganization',
    group: 'seo',
  },
  twitter_handle: { label: 'Twitter/X @handle', group: 'seo' },
  google_site_verification: {
    label: 'Google Search Console — kode verifikasi',
    group: 'seo',
    hint: 'Tempel kode content saja, atau full tag <meta name="google-site-verification" content="…">. Sistem memotong otomatis.',
  },
  bing_site_verification: {
    label: 'Bing Webmaster — kode verifikasi',
    group: 'seo',
    hint: 'Opsional. Sama: boleh tempel full meta tag msvalidate.01.',
  },
  allow_ai_crawlers: {
    label: 'Izinkan AI / LLM Crawlers (AEO)',
    type: 'select',
    options: [
      { value: '1', label: 'Ya, izinkan perayapan AI (GPTBot, ClaudeBot, dll)' },
      { value: '0', label: 'Tidak, blokir perayapan AI (Disallow)' },
    ],
    hint: 'Mengatur izin baca untuk ChatGPT-User, ClaudeBot, Perplexity, GPTBot, dll.',
    group: 'seo',
  },
  robots_extra: {
    label: 'Aturan robots.txt tambahan',
    multiline: true,
    hint: 'Masukkan aturan tambahan baris demi baris jika ada.',
    group: 'seo',
  },
  sitemap_frequency: {
    label: 'Frekuensi pembaruan sitemap',
    type: 'select',
    options: [
      { value: 'daily', label: 'Harian (daily)' },
      { value: 'weekly', label: 'Mingguan (weekly)' },
      { value: 'monthly', label: 'Bulanan (monthly)' },
    ],
    hint: 'Petunjuk seberapa sering konten diperbarui untuk perayap.',
    group: 'seo',
  },
  sitemap_include_achievements: {
    label: 'Halaman Prestasi di sitemap',
    type: 'select',
    options: [
      { value: '1', label: 'Sertakan' },
      { value: '0', label: 'Kecualikan' },
    ],
    group: 'seo',
  },
  sitemap_include_extracurriculars: {
    label: 'Halaman Ekskul di sitemap',
    type: 'select',
    options: [
      { value: '1', label: 'Sertakan' },
      { value: '0', label: 'Kecualikan' },
    ],
    group: 'seo',
  },

  // AI & Instagram
  openai_api_key: {
    label: 'OpenAI API Key',
    hint: 'Kunci rahasia dari platform.openai.com, openrouter.ai, atau penyedia AI kompatibel lainnya.',
    group: 'ai',
  },
  openai_base_url: {
    label: 'API Base URL / Endpoint (OpenAI Compatible)',
    hint: 'Default: https://api.openai.com/v1. Bisa diganti ke OpenRouter, DeepSeek, Groq, dll.',
    group: 'ai',
  },
  openai_model: {
    label: 'Model AI',
    hint: 'Bebas isi model kustom atau klik rekomendasi di bawah. Default: gpt-4o-mini.',
    group: 'ai',
  },
  openai_custom_prompt: {
    label: 'Instruksi Khusus AI (Custom System Prompt)',
    multiline: true,
    hint: 'Opsional: Berikan panduan gaya bahasa humas sekolah, nilai-nilai, atau penekanan khusus.',
    group: 'ai',
  },
  instagram_scraper_api_key: {
    label: 'Instagram Scraper API Key (RapidAPI)',
    hint: 'Kunci x-rapidapi-key dari RapidAPI.com untuk mengambil data postingan & carousel Instagram.',
    group: 'ai',
  },
  instagram_scraper_api_host: {
    label: 'Instagram Scraper API Host',
    hint: 'Default: instagram-scraper-stable-api.p.rapidapi.com (sesuai API yang dipilih di RapidAPI)',
    group: 'ai',
  },
}

export function SettingsAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('branding')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get<Record<string, string>>('/admin/settings')).data,
  })
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const [testingAi, setTestingAi] = useState(false)

  const handleTestAi = async () => {
    if (!form.openai_api_key) {
      toast.error('Masukkan API Key terlebih dahulu.')
      return
    }
    setTestingAi(true)
    try {
      const res = await api.post<{ ok: boolean; message: string }>('/admin/ai/test-connection', {
        openai_api_key: form.openai_api_key,
        openai_base_url: form.openai_base_url,
        openai_model: form.openai_model,
      })
      if (res.data.ok) {
        toast.success(res.data.message)
      } else {
        toast.error(res.data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal terhubung ke API AI.')
    } finally {
      setTestingAi(false)
    }
  }

  const save = useMutation({
    mutationFn: async () => api.put('/admin/settings', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Pengaturan disimpan.')
    },
    onError: () => toast.error('Gagal menyimpan pengaturan.'),
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://domain-anda.sch.id'

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-[16px]" />
          <Skeleton className="h-64 w-full rounded-[16px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pengaturan"
        description="Identitas, branding, kontak, sidebar artikel, SEO, integrasi AI, serta Social Login."
        actions={
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-[12px] bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan Semua Perubahan'}
          </button>
        }
      />

      {/* Modern Tabs Navigation */}
      <div className="flex overflow-x-auto rounded-[16px] border border-line bg-white p-1.5 shadow-sm scrollbar-none">
        <div className="flex space-x-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-[12px] px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? 'bg-sky-500 text-white shadow-[0_2px_8px_rgb(14_165_233/0.25)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab 1: Identitas & Branding */}
      {activeTab === 'branding' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-bold text-ink">Branding & Logo</h2>
            <div className="space-y-4">
              <BrandLogoUpload
                form={form}
                onUpdated={(settings) => {
                  setForm((prev) => ({ ...prev, ...settings }))
                  qc.invalidateQueries({ queryKey: ['admin-settings'] })
                  qc.invalidateQueries({ queryKey: ['settings'] })
                }}
              />
              <ImageUploadField
                label="Default OG / Social Share Image"
                value={form.default_og_image || null}
                onChange={(path) => setForm({ ...form, default_og_image: path || '' })}
                guide={{
                  key: 'og',
                  label: 'OG image default',
                  field: 'default_og_image',
                  ratio: '1.91:1',
                  width: 1200,
                  height: 630,
                  maxMb: 1,
                  format: 'JPG / WebP',
                  where: 'Pengaturan',
                  tips: 'Gambar thumbnail fallback saat dibagikan ke WhatsApp, Facebook, dsb.',
                }}
                previewClassName="aspect-[1.91/1] max-h-40"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-bold text-ink">Informasi Situs</h2>
            {['site_name', 'site_tagline', 'site_description', 'footer_text', 'copyright'].map((key) => (
              <Field
                key={key}
                fieldKey={key}
                value={form[key] || ''}
                onChange={(v) => setForm({ ...form, [key]: v })}
              />
            ))}
          </section>
        </div>
      )}

      {/* Tab 2: Kontak & Alamat */}
      {activeTab === 'contact' && (
        <div className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-sm font-bold text-ink">Kontak & Lokasi GEO Sekolah</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {['contact_email', 'contact_phone', 'report_url', 'geo_placename', 'geo_region', 'geo_lat', 'geo_lng'].map((key) => (
              <Field
                key={key}
                fieldKey={key}
                value={form[key] || ''}
                onChange={(v) => setForm({ ...form, [key]: v })}
              />
            ))}
            <div className="sm:col-span-2">
              <Field
                fieldKey="contact_address"
                value={form.contact_address || ''}
                onChange={(v) => setForm({ ...form, contact_address: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Media Sosial */}
      {activeTab === 'social' && (
        <div className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-2 text-sm font-bold text-ink">Akun Media Sosial Resmi</h2>
          <p className="mb-5 text-xs text-subtle">
            Tautan ini otomatis ditampilkan di header, footer, dan widget sidebar artikel.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {['social_instagram', 'social_facebook', 'social_tiktok', 'social_youtube'].map((key) => (
              <Field
                key={key}
                fieldKey={key}
                value={form[key] || ''}
                onChange={(v) => setForm({ ...form, [key]: v })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Widget & Sidebar */}
      {activeTab === 'widgets' && (
        <div className="space-y-6">
          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-sm font-bold text-ink">Kontrol Widget Sidebar Artikel</h2>
            <p className="mb-5 text-xs text-subtle">
              Pilih widget mana saja yang ingin dimunculkan di sisi kanan halaman detail artikel agar halaman tidak kosong.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: 'widget_search_enabled', label: 'Widget Pencarian Cepat', desc: 'Kotak cari artikel instan' },
                { key: 'widget_announcement_enabled', label: 'Widget Banner / Info Khusus', desc: 'Pengumuman humas atau info pendaftaran' },
                { key: 'widget_categories_enabled', label: 'Widget Kategori Artikel', desc: 'Daftar topik dengan badge jumlah' },
                { key: 'widget_popular_enabled', label: 'Widget Artikel Populer', desc: 'Daftar artikel terpopuler & view count' },
                { key: 'widget_social_enabled', label: 'Widget Media Sosial & Ikuti Kami', desc: 'Card ajakan follow Instagram, YouTube, dll.' },
              ].map((w) => (
                <div key={w.key} className="flex items-start justify-between rounded-xl border border-line bg-page p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{w.label}</h3>
                    <p className="text-xs text-subtle">{w.desc}</p>
                  </div>
                  <select
                    value={form[w.key] ?? '1'}
                    onChange={(e) => setForm({ ...form, [w.key]: e.target.value })}
                    className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-sm font-bold text-ink">Konten Banner / Pengumuman Kustom Sidebar</h2>
            <p className="mb-5 text-xs text-subtle">
              Kustomisasi isi card pengumuman / banner informatif di sebelah kanan artikel.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Judul Banner</label>
                <input
                  type="text"
                  placeholder="Contoh: Info Sekolah & SPMB"
                  value={form.widget_announcement_title ?? 'Pusat Informasi & SPMB'}
                  onChange={(e) => setForm({ ...form, widget_announcement_title: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Teks Tombol Tautan</label>
                <input
                  type="text"
                  placeholder="Contoh: Hubungi Kami / Selengkapnya"
                  value={form.widget_announcement_btn_text ?? 'Hubungi Humas'}
                  onChange={(e) => setForm({ ...form, widget_announcement_btn_text: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink">URL Tautan Tombol</label>
                <input
                  type="text"
                  placeholder="Contoh: https://wa.me/628123456789 atau /kontak"
                  value={form.widget_announcement_url ?? ''}
                  onChange={(e) => setForm({ ...form, widget_announcement_url: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink">Isi Pesan / Keterangan Banner</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keterangan singkat, jadwal pendaftaran, atau pengumuman penting..."
                  value={
                    form.widget_announcement_content ??
                    'Dapatkan berita terbaru, kalender akademik, dan layanan informasi terpadu SMA Negeri 1 Gedeg langsung melalui kanal resmi.'
                  }
                  onChange={(e) => setForm({ ...form, widget_announcement_content: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab 5: SEO & Mesin Pencari */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-bold text-ink">Verifikasi Mesin Pencari & Schema</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'google_site_verification',
                'bing_site_verification',
                'organization_type',
                'twitter_handle',
                'allow_ai_crawlers',
                'sitemap_frequency',
                'sitemap_include_achievements',
                'sitemap_include_extracurriculars',
              ].map((key) => (
                <Field
                  key={key}
                  fieldKey={key}
                  value={form[key] || ''}
                  onChange={(v) => setForm({ ...form, [key]: v })}
                />
              ))}
              <div className="sm:col-span-2">
                <Field
                  fieldKey="robots_extra"
                  value={form.robots_extra || ''}
                  onChange={(v) => setForm({ ...form, robots_extra: v })}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-sky-100 bg-sky-50/80 p-5 text-xs leading-relaxed text-body">
            <p className="font-semibold text-sky-900">Google Search Console (3 langkah mudah):</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sky-950/90">
              <li>
                Buka{' '}
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-700 underline"
                >
                  search.google.com/search-console
                </a>{' '}
                → tambah properti URL domain.
              </li>
              <li>Pilih verifikasi <strong>tag HTML</strong> → salin kode → tempel di field verifikasi di atas → <strong>Simpan</strong>.</li>
              <li>Kembali ke GSC → Verifikasi. Lalu <strong>Sitemaps</strong> → submit: <code className="rounded bg-white px-1.5 py-0.5 text-[11px] font-mono">{origin}/sitemap.xml</code></li>
            </ol>
          </section>
        </div>
      )}

      {/* Tab 6: AI & Scraper */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Integrasi AI (OpenAI / OpenRouter / Groq)</h2>
                <p className="text-xs text-subtle">Digunakan untuk asisten tulis artikel, perapih caption Instagram, dan SEO.</p>
              </div>
              <button
                type="button"
                disabled={testingAi || !form.openai_api_key}
                onClick={handleTestAi}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Uji Koneksi AI
              </button>
            </div>

            <div className="space-y-4">
              <Field
                fieldKey="openai_api_key"
                value={form.openai_api_key || ''}
                onChange={(v) => setForm({ ...form, openai_api_key: v })}
              />
              <Field
                fieldKey="openai_base_url"
                value={form.openai_base_url || ''}
                onChange={(v) => setForm({ ...form, openai_base_url: v })}
              />
              <Field
                fieldKey="openai_model"
                value={form.openai_model || ''}
                onChange={(v) => setForm({ ...form, openai_model: v })}
              />
              <Field
                fieldKey="openai_custom_prompt"
                value={form.openai_custom_prompt || ''}
                onChange={(v) => setForm({ ...form, openai_custom_prompt: v })}
              />
            </div>
          </section>

          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-sm font-bold text-ink">Instagram Scraper API (RapidAPI)</h2>
            <p className="mb-4 text-xs text-subtle">
              Mengambil caption, cover, dan multi-foto otomatis dari link postingan Instagram.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                fieldKey="instagram_scraper_api_key"
                value={form.instagram_scraper_api_key || ''}
                onChange={(v) => setForm({ ...form, instagram_scraper_api_key: v })}
              />
              <Field
                fieldKey="instagram_scraper_api_host"
                value={form.instagram_scraper_api_host || ''}
                onChange={(v) => setForm({ ...form, instagram_scraper_api_host: v })}
              />
            </div>
          </section>
        </div>
      )}

      {/* Tab 7: Social Login & SSO */}
      {activeTab === 'auth' && (
        <div className="space-y-6">
          <div className="rounded-[16px] border border-sky-100 bg-sky-50/80 p-5 text-xs text-slate-800">
            <p className="font-semibold text-sky-950">Panduan Konfigurasi Social Login & SSO:</p>
            <p className="mt-1 leading-relaxed">
              Daftarkan URL Callback (Redirect URI) berikut ke konsol pengembang masing-masing penyedia (Google Cloud, GitHub, Facebook, atau OIDC/Keycloak).
              Pastikan Anda mengaktifkan opsi &amp; mengisi Client ID dan Secret, lalu klik tombol <strong>Simpan</strong> di atas.
            </p>
          </div>

          {/* 1. Google OAuth */}
          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">1. Google Login (Workspace / Akun Google)</h3>
                <p className="text-xs text-subtle">Autentikasi menggunakan akun Google / Google Workspace sekolah.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">Status:</span>
                <select
                  value={form.auth_social_google_enabled ?? '0'}
                  onChange={(e) => setForm({ ...form, auth_social_google_enabled: e.target.value })}
                  className="rounded-lg border border-line bg-page px-3 py-1 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="0">Nonaktif</option>
                  <option value="1">Aktif</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Redirect URI (Callback URL)</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${origin}/auth/google/callback`}
                    className="w-full rounded-[10px] border border-line bg-page px-3 py-2 text-xs font-mono text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${origin}/auth/google/callback`, 'Google Callback URL')}
                    className="rounded-[10px] border border-line bg-white p-2 text-slate-600 hover:bg-page"
                    title="Salin URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Google Client ID</label>
                <input
                  type="text"
                  placeholder="xxxxx-xxxx.apps.googleusercontent.com"
                  value={form.auth_social_google_client_id || ''}
                  onChange={(e) => setForm({ ...form, auth_social_google_client_id: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Google Client Secret</label>
                <div className="relative">
                  <input
                    type={showSecrets.google ? 'text' : 'password'}
                    placeholder="GOCSPX-xxxxxx"
                    value={form.auth_social_google_client_secret || ''}
                    onChange={(e) => setForm({ ...form, auth_social_google_client_secret: e.target.value })}
                    className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets((s) => ({ ...s, google: !s.google }))}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-ink">Teks Kustom Tombol Login</label>
                <input
                  type="text"
                  placeholder="Default: Masuk dengan Google"
                  value={form.auth_social_google_button_text || ''}
                  onChange={(e) => setForm({ ...form, auth_social_google_button_text: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
                <p className="mt-1 text-[11px] text-subtle">
                  Contoh: "Masuk dengan Google Workspace" atau "Login dengan Akun Google Sekolah".
                </p>
              </div>
            </div>
          </section>

          {/* 2. Generic OIDC (Belajar.id / Keycloak / Kemdikbud) */}
          <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">2. OpenID Connect (OIDC / SSO Belajar.id / Keycloak)</h3>
                <p className="text-xs text-subtle">Integrasi Single Sign-On (SSO) sekolah, pemerintah, atau penyedia OIDC custom.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">Status:</span>
                <select
                  value={form.auth_social_oidc_enabled ?? '0'}
                  onChange={(e) => setForm({ ...form, auth_social_oidc_enabled: e.target.value })}
                  className="rounded-lg border border-line bg-page px-3 py-1 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="0">Nonaktif</option>
                  <option value="1">Aktif</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Redirect URI (Callback URL)</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${origin}/auth/oidc/callback`}
                    className="w-full rounded-[10px] border border-line bg-page px-3 py-2 text-xs font-mono text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${origin}/auth/oidc/callback`, 'OIDC Callback URL')}
                    className="rounded-[10px] border border-line bg-white p-2 text-slate-600 hover:bg-page"
                    title="Salin URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Nama Label SSO</label>
                <input
                  type="text"
                  placeholder="Contoh: SSO Belajar.id / SSO Sekolah"
                  value={form.auth_social_oidc_name || ''}
                  onChange={(e) => setForm({ ...form, auth_social_oidc_name: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Base / Issuer URL OIDC</label>
                <input
                  type="text"
                  placeholder="Contoh: https://sso.belajar.id atau https://auth.sekolah.sch.id"
                  value={form.auth_social_oidc_base_url || ''}
                  onChange={(e) => setForm({ ...form, auth_social_oidc_base_url: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">OIDC Client ID</label>
                <input
                  type="text"
                  placeholder="client-id-dari-sso"
                  value={form.auth_social_oidc_client_id || ''}
                  onChange={(e) => setForm({ ...form, auth_social_oidc_client_id: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">OIDC Client Secret</label>
                <div className="relative">
                  <input
                    type={showSecrets.oidc ? 'text' : 'password'}
                    placeholder="client-secret-sso"
                    value={form.auth_social_oidc_client_secret || ''}
                    onChange={(e) => setForm({ ...form, auth_social_oidc_client_secret: e.target.value })}
                    className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets((s) => ({ ...s, oidc: !s.oidc }))}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets.oidc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-ink">Teks Kustom Tombol Login SSO</label>
                <input
                  type="text"
                  placeholder="Default: Masuk dengan Akun Belajar.id / SSO"
                  value={form.auth_social_oidc_button_text || ''}
                  onChange={(e) => setForm({ ...form, auth_social_oidc_button_text: e.target.value })}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <details className="rounded-xl border border-line bg-page p-3 text-xs">
                  <summary className="cursor-pointer font-semibold text-slate-700">
                    Endpoint Lanjutan (Opsional jika issuer tidak memakai standar Keycloak/OIDC)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">Custom Auth URL</label>
                      <input
                        type="text"
                        placeholder="Default otomatis: {base_url}/protocol/openid-connect/auth"
                        value={form.auth_social_oidc_auth_url || ''}
                        onChange={(e) => setForm({ ...form, auth_social_oidc_auth_url: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">Custom Token URL</label>
                      <input
                        type="text"
                        placeholder="Default otomatis: {base_url}/protocol/openid-connect/token"
                        value={form.auth_social_oidc_token_url || ''}
                        onChange={(e) => setForm({ ...form, auth_social_oidc_token_url: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">Custom UserInfo URL</label>
                      <input
                        type="text"
                        placeholder="Default otomatis: {base_url}/protocol/openid-connect/userinfo"
                        value={form.auth_social_oidc_userinfo_url || ''}
                        onChange={(e) => setForm({ ...form, auth_social_oidc_userinfo_url: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </section>

          {/* 3. GitHub & Facebook */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* GitHub */}
            <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <h3 className="text-sm font-bold text-ink">3. GitHub Login</h3>
                <select
                  value={form.auth_social_github_enabled ?? '0'}
                  onChange={(e) => setForm({ ...form, auth_social_github_enabled: e.target.value })}
                  className="rounded-lg border border-line bg-page px-2.5 py-1 text-xs font-semibold outline-none"
                >
                  <option value="0">Nonaktif</option>
                  <option value="1">Aktif</option>
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">Callback URL</label>
                  <input
                    readOnly
                    value={`${origin}/auth/github/callback`}
                    className="w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-[11px] font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Client ID</label>
                  <input
                    type="text"
                    value={form.auth_social_github_client_id || ''}
                    onChange={(e) => setForm({ ...form, auth_social_github_client_id: e.target.value })}
                    className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Client Secret</label>
                  <input
                    type="password"
                    value={form.auth_social_github_client_secret || ''}
                    onChange={(e) => setForm({ ...form, auth_social_github_client_secret: e.target.value })}
                    className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Teks Tombol Kustom</label>
                  <input
                    type="text"
                    placeholder="Default: Masuk dengan GitHub"
                    value={form.auth_social_github_button_text || ''}
                    onChange={(e) => setForm({ ...form, auth_social_github_button_text: e.target.value })}
                    className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Facebook */}
            <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <h3 className="text-sm font-bold text-ink">4. Facebook Login</h3>
                <select
                  value={form.auth_social_facebook_enabled ?? '0'}
                  onChange={(e) => setForm({ ...form, auth_social_facebook_enabled: e.target.value })}
                  className="rounded-lg border border-line bg-page px-2.5 py-1 text-xs font-semibold outline-none"
                >
                  <option value="0">Nonaktif</option>
                  <option value="1">Aktif</option>
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">Callback URL</label>
                  <input
                    readOnly
                    value={`${origin}/auth/facebook/callback`}
                    className="w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-[11px] font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">App ID (Client ID)</label>
                  <input
                    type="text"
                    value={form.auth_social_facebook_client_id || ''}
                    onChange={(e) => setForm({ ...form, auth_social_facebook_client_id: e.target.value })}
                    className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">App Secret</label>
                  <input
                    type="password"
                    value={form.auth_social_facebook_client_secret || ''}
                    onChange={(e) => setForm({ ...form, auth_social_facebook_client_secret: e.target.value })}
                    className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Teks Tombol Kustom</label>
                  <input
                    type="text"
                    placeholder="Default: Masuk dengan Facebook"
                    value={form.auth_social_facebook_button_text || ''}
                    onChange={(e) => setForm({ ...form, auth_social_facebook_button_text: e.target.value })}
                    className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string
  value: string
  onChange: (v: string) => void
}) {
  const meta = fieldMeta[fieldKey]
  if (!meta) return null

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={fieldKey}>
        {meta.label}
      </label>
      {fieldKey === 'openai_base_url' ? (
        <div className="space-y-2">
          <input
            id={fieldKey}
            list="openai-endpoints-list"
            className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            placeholder="Default: https://api.openai.com/v1"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <datalist id="openai-endpoints-list">
            <option value="https://api.openai.com/v1" />
            <option value="https://openrouter.ai/api/v1" />
            <option value="https://api.deepseek.com/v1" />
            <option value="https://api.groq.com/openai/v1" />
          </datalist>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-subtle">
            <span className="font-medium text-slate-500">Preset endpoint:</span>
            {[
              { id: 'https://api.openai.com/v1', label: 'OpenAI Resmi' },
              { id: 'https://openrouter.ai/api/v1', label: 'OpenRouter' },
              { id: 'https://api.deepseek.com/v1', label: 'DeepSeek' },
              { id: 'https://api.groq.com/openai/v1', label: 'Groq' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.id)}
                className={`rounded-md border px-2 py-0.5 text-xs transition ${
                  (value || 'https://api.openai.com/v1') === p.id
                    ? 'border-brand bg-brand/10 font-semibold text-brand shadow-2xs'
                    : 'border-line bg-white hover:border-slate-300 hover:bg-page'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : fieldKey === 'openai_model' ? (
        <div className="space-y-2">
          <input
            id={fieldKey}
            list="openai-models-list"
            className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            placeholder="Contoh: gpt-4o-mini, gpt-4o, atau model custom"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <datalist id="openai-models-list">
            <option value="gpt-4o-mini" />
            <option value="gpt-4o" />
            <option value="gpt-4-turbo" />
            <option value="o3-mini" />
            <option value="chatgpt-4o-latest" />
          </datalist>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-subtle">
            <span className="font-medium text-slate-500">Pilihan cepat:</span>
            {[
              { id: 'gpt-4o-mini', label: 'gpt-4o-mini (Hemat)' },
              { id: 'gpt-4o', label: 'gpt-4o (Pintar)' },
              { id: 'gpt-4-turbo', label: 'gpt-4-turbo' },
              { id: 'o3-mini', label: 'o3-mini' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange(m.id)}
                className={`rounded-md border px-2 py-0.5 text-xs transition ${
                  (value || 'gpt-4o-mini') === m.id
                    ? 'border-brand bg-brand/10 font-semibold text-brand shadow-2xs'
                    : 'border-line bg-white hover:border-slate-300 hover:bg-page'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ) : meta.type === 'select' ? (
        <select
          id={fieldKey}
          className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {meta.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : meta.multiline ? (
        <textarea
          id={fieldKey}
          className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={fieldKey}
          className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {meta.hint && <p className="mt-1 text-xs text-subtle">{meta.hint}</p>}
    </div>
  )
}

function BrandLogoUpload({
  form,
  onUpdated,
}: {
  form: Record<string, string>
  onUpdated: (settings: Record<string, string>) => void
}) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const logoSrc = mediaUrl(form.site_logo || form.logo_path)
  const favSrc = mediaUrl(form.favicon_path)
  const appleSrc = mediaUrl(form.apple_touch_icon_path)

  const upload = async (file: File) => {
    setError('')
    setNote('')
    if (file.size > 2 * 1024 * 1024) {
      setError('File terlalu besar. Maksimal ~2 MB.')
      return
    }
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      setError('Gunakan JPG, PNG, WebP, atau GIF (bukan SVG).')
      return
    }

    setUploading(true)
    try {
      await ensureCsrf()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', form.site_name ? `Logo ${form.site_name}` : 'Logo situs')
      const { data } = await api.post<{
        message: string
        settings: Record<string, string>
      }>('/admin/settings/logo', fd)
      onUpdated(data.settings || {})
      setNote(
        'Otomatis: logo WebP, favicon 16 & 32, apple-touch 180×180' +
          (data.settings?.default_og_image ? ', OG default' : '') +
          '.',
      )
      toast.success(data.message || 'Logo & favicon disimpan.')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: { file?: string[] } } } }
      setError(
        ax.response?.data?.errors?.file?.[0] ||
          ax.response?.data?.message ||
          'Gagal memproses logo.',
      )
      toast.error('Gagal unggah logo.')
    } finally {
      setUploading(false)
    }
  }

  const clear = async () => {
    setError('')
    setUploading(true)
    try {
      await ensureCsrf()
      const { data } = await api.delete<{ settings: Record<string, string> }>('/admin/settings/logo')
      onUpdated(data.settings || {})
      setNote('')
      toast.success('Logo & favicon dihapus.')
    } catch {
      toast.error('Gagal menghapus logo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-[14px] border border-dashed border-line bg-page p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">Logo situs</p>
          <p className="mt-0.5 text-xs leading-relaxed text-subtle">
            Ideal ~400×120px (3:1–4:1) · max ~2 MB · PNG / JPG / WebP
          </p>
        </div>
        {(form.site_logo || form.favicon_path) && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => void clear()}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus brand
          </button>
        )}
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="overflow-hidden rounded-xl border border-line bg-white aspect-[4/1] max-h-24">
          {logoSrc ? (
            <img src={logoSrc} alt="Logo situs" className="h-full w-full object-contain p-2" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-subtle">
              Belum ada logo
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="text-center">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
              {favSrc ? (
                <img src={favSrc} alt="Favicon" className="h-8 w-8 object-contain" />
              ) : (
                <span className="text-[9px] text-subtle">ico</span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-subtle">Favicon</p>
          </div>
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
              {appleSrc ? (
                <img src={appleSrc} alt="Apple touch" className="h-11 w-11 object-contain" />
              ) : (
                <span className="text-[9px] text-subtle">180</span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-subtle">Apple</p>
          </div>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-line bg-white px-3.5 py-2 text-sm font-semibold text-body shadow-sm hover:bg-muted">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
        ) : (
          <ImagePlus className="h-4 w-4 text-brand" />
        )}
        {uploading ? 'Memproses logo…' : logoSrc ? 'Ganti logo' : 'Unggah logo'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void upload(f)
            e.target.value = ''
          }}
        />
      </label>

      <p className="mt-2 text-[11px] leading-relaxed text-subtle">
        <span className="font-semibold text-body">Otomatis:</span> logo WebP header, favicon 16×16
        &amp; 32×32, apple-touch 180×180. Jika OG image masih kosong, digenerate 1200×630 dari
        logo. Disimpan langsung ke pengaturan (tanpa tombol Simpan).
      </p>

      {note && (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {note}
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default SettingsAdminPage
