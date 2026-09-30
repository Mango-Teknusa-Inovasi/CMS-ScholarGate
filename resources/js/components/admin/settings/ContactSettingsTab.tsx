import React from 'react'
import { Field } from './Field'

export function ContactSettingsTab({
  form,
  setForm,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
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
  )
}
