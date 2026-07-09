import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'

const fieldMeta: Record<string, { label: string; hint?: string; multiline?: boolean; group?: string }> = {
  site_name: { label: 'Nama situs', group: 'Identitas' },
  site_tagline: { label: 'Tagline', group: 'Identitas' },
  site_description: {
    label: 'Deskripsi situs (SEO default)',
    multiline: true,
    group: 'Identitas',
    hint: 'Dipakai sebagai meta description default & llms.txt',
  },
  footer_text: { label: 'Teks footer', multiline: true, group: 'Identitas' },
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
    group: 'Schema',
  },
  twitter_handle: { label: 'Twitter/X @handle', group: 'SEO verifikasi' },
  google_site_verification: { label: 'Google site verification', group: 'SEO verifikasi' },
  bing_site_verification: { label: 'Bing site verification', group: 'SEO verifikasi' },
  copyright: { label: 'Copyright', group: 'Identitas' },
}

const fields = Object.keys(fieldMeta)

export function SettingsAdminPage() {
  const qc = useQueryClient()
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
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4" aria-busy="true" aria-label="Memuat pengaturan">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-14 w-full rounded-[14px]" />
        <Skeleton className="h-14 w-full rounded-[14px]" />
        <Skeleton className="h-28 w-full rounded-[14px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
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

      <div className="max-w-2xl space-y-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)] md:p-6">
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
            tips: 'Logo horizontal lebih bagus di header. Tinggi efektif ~40–48px. Dioptimasi WebP otomatis.',
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
            tips: 'Gambar fallback saat share di media sosial jika artikel belum punya cover.',
          }}
          previewClassName="aspect-[1.91/1] max-h-40"
        />

        {fields.map((key) => {
          const meta = fieldMeta[key]
          const prev = fields[fields.indexOf(key) - 1]
          const showGroup = !prev || fieldMeta[prev]?.group !== meta.group
          return (
            <div key={key}>
              {showGroup && meta.group && (
                <h3 className="mb-3 mt-2 border-t border-line pt-4 text-xs font-bold uppercase tracking-wide text-brand">
                  {meta.group}
                </h3>
              )}
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={key}>
                {meta.label}
              </label>
              {meta.multiline ? (
                <textarea
                  id={key}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  rows={3}
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ) : (
                <input
                  id={key}
                  className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              )}
              {meta.hint && <p className="mt-1 text-xs text-subtle">{meta.hint}</p>}
            </div>
          )
        })}

        <div className="rounded-[12px] border border-line bg-peach p-3 text-xs leading-relaxed text-body">
          <p className="font-semibold text-ink">Endpoint SEO otomatis</p>
          <ul className="mt-1 list-disc pl-4">
            <li>
              <code>/sitemap.xml</code> — peta situs
            </li>
            <li>
              <code>/robots.txt</code> — arahan crawler
            </li>
            <li>
              <code>/llms.txt</code> — peta konten untuk AI (AEO/GEO)
            </li>
          </ul>
        </div>

        {save.isSuccess && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            Pengaturan tersimpan.
          </p>
        )}
        {save.isError && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            Gagal menyimpan. Coba lagi.
          </p>
        )}
      </div>
    </div>
  )
}
