import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { api, ensureCsrf } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { mediaUrl } from '../../lib/utils'

const fieldMeta: Record<
  string,
  { label: string; hint?: string; multiline?: boolean; group: string }
> = {
  site_name: { label: 'Nama situs', group: 'Identitas' },
  site_tagline: { label: 'Tagline', group: 'Identitas' },
  site_description: {
    label: 'Deskripsi situs (SEO default)',
    multiline: true,
    group: 'Identitas',
    hint: 'Dipakai sebagai meta description default & llms.txt',
  },
  footer_text: { label: 'Teks footer', multiline: true, group: 'Identitas' },
  copyright: { label: 'Copyright', group: 'Identitas' },
  report_url: { label: 'URL tombol Lapor', hint: 'Link eksternal form laporan', group: 'Kontak' },
  contact_email: { label: 'Email kontak', group: 'Kontak' },
  contact_phone: { label: 'Telepon', group: 'Kontak' },
  contact_address: { label: 'Alamat lengkap (GEO/NAP)', multiline: true, group: 'GEO lokal' },
  geo_placename: { label: 'Nama tempat / kota', group: 'GEO lokal' },
  geo_region: { label: 'Kode negara/region', hint: 'Contoh: ID-JI atau ID', group: 'GEO lokal' },
  geo_lat: { label: 'Latitude', hint: 'Contoh: -7.2575', group: 'GEO lokal' },
  geo_lng: { label: 'Longitude', hint: 'Contoh: 112.7521', group: 'GEO lokal' },
  organization_type: {
    label: 'Tipe organisasi schema',
    hint: 'EducationalOrganization / School / GovernmentOrganization',
    group: 'Schema & SEO',
  },
  twitter_handle: { label: 'Twitter/X @handle', group: 'Schema & SEO' },
  google_site_verification: {
    label: 'Google Search Console — kode verifikasi',
    group: 'Schema & SEO',
    hint: 'Tempel kode content saja, atau full tag <meta name="google-site-verification" content="…">. Sistem memotong otomatis.',
  },
  bing_site_verification: {
    label: 'Bing Webmaster — kode verifikasi',
    group: 'Schema & SEO',
    hint: 'Opsional. Sama: boleh tempel full meta tag msvalidate.01.',
  },
}

export function SettingsAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get<Record<string, string>>('/admin/settings')).data,
  })
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const save = useMutation({
    mutationFn: async () => api.put('/admin/settings', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Pengaturan disimpan.')
    },
    onError: () => toast.error('Gagal menyimpan pengaturan.'),
  })

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const key of Object.keys(fieldMeta)) {
      const g = fieldMeta[key].group
      if (!map[g]) map[g] = []
      map[g].push(key)
    }
    return map
  }, [])

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
    <div>
      <AdminPageHeader
        title="Pengaturan"
        description="Identitas, logo, SEO default, GEO (lokasi), dan verifikasi mesin pencari."
        actions={
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan'}
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_1fr]">
        {/* Kiri: brand media + identitas */}
        <div className="space-y-5">
          <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-bold text-ink">Branding & media</h2>
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
                label="Default OG / social image"
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
                  tips: 'Gambar fallback saat share di media sosial. Otomatis dari logo jika masih kosong.',
                }}
                previewClassName="aspect-[1.91/1] max-h-40"
              />
            </div>
          </section>

          <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-bold text-ink">Identitas</h2>
            <div className="space-y-3">
              {(grouped['Identitas'] || []).map((key) => (
                <Field
                  key={key}
                  fieldKey={key}
                  value={form[key] || ''}
                  onChange={(v) => setForm({ ...form, [key]: v })}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[16px] border border-sky-100 bg-sky-50/80 p-4 text-xs leading-relaxed text-body">
            <p className="font-semibold text-sky-900">Google Search Console (3 langkah)</p>
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
                → tambah properti URL domain Anda.
              </li>
              <li>
                Pilih verifikasi <strong>tag HTML</strong> → salin kode → tempel di field
                “Google Search Console” di kanan → <strong>Simpan</strong>.
              </li>
              <li>
                Kembali ke GSC → Verifikasi. Lalu <strong>Sitemaps</strong> → submit:{' '}
                <code className="rounded bg-white px-1 py-0.5 text-[11px]">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/sitemap.xml`
                    : '/sitemap.xml'}
                </code>
              </li>
            </ol>
            <p className="mt-3 font-semibold text-sky-900">URL otomatis (siap di-crawl)</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-sky-700 underline">
                  /sitemap.xml
                </a>{' '}
                — peta URL publik
              </li>
              <li>
                <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-sky-700 underline">
                  /robots.txt
                </a>{' '}
                — aturan bot
              </li>
              <li>
                <a href="/llms.txt" target="_blank" rel="noreferrer" className="text-sky-700 underline">
                  /llms.txt
                </a>{' '}
                — AEO / AI crawler
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-sky-800/80">
              Pastikan <code>APP_URL</code> di server = domain publik (https). Meta verifikasi
              ikut di HTML server-side agar Google langsung membaca.
            </p>
          </section>
        </div>

        {/* Kanan: kontak + GEO + SEO */}
        <div className="space-y-5">
          {(['Kontak', 'GEO lokal', 'Schema & SEO'] as const).map((group) => (
            <section
              key={group}
              className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <h2 className="mb-4 text-sm font-bold text-ink">{group}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(grouped[group] || []).map((key) => (
                  <div
                    key={key}
                    className={fieldMeta[key].multiline || key === 'contact_address' ? 'sm:col-span-2' : ''}
                  >
                    <Field
                      fieldKey={key}
                      value={form[key] || ''}
                      onChange={(v) => setForm({ ...form, [key]: v })}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

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
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={fieldKey}>
        {meta.label}
      </label>
      {meta.multiline ? (
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

/**
 * Upload logo → server auto-generate favicon 16/32, apple-touch, logo WebP, OG fallback.
 * Settings disimpan langsung (tidak perlu klik Simpan untuk brand assets).
 */
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
