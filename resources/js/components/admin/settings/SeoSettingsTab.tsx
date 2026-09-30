import React from 'react'
import { Field } from './Field'

export function SeoSettingsTab({
  form,
  setForm,
  origin,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  origin: string
}) {
  return (
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
  )
}
