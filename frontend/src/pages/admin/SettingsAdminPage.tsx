import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

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
              <ImageUploadField
                label="Logo situs"
                value={form.site_logo || null}
                onChange={(path) => setForm({ ...form, site_logo: path || '' })}
                guide={{
                  key: 'logo',
                  label: 'Logo situs',
                  field: 'site_logo',
                  ratio: '3:1 — 4:1',
                  width: 400,
                  height: 120,
                  maxMb: 0.5,
                  format: 'PNG transparan / SVG / WebP',
                  where: 'Pengaturan',
                  tips: 'Logo horizontal lebih bagus di header. Tinggi efektif ~40–48px.',
                }}
                previewClassName="aspect-[4/1] max-h-24"
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
                  tips: 'Gambar fallback saat share di media sosial.',
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
