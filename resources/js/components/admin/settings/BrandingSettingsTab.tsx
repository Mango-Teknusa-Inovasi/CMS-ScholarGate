import React from 'react'
import { BrandLogoUpload } from './BrandLogoUpload'
import { ImageUploadField } from '../ImageUploadField'
import { Field } from './Field'
import { useQueryClient } from '@tanstack/react-query'

export function BrandingSettingsTab({
  form,
  setForm,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  const qc = useQueryClient()

  return (
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
  )
}
