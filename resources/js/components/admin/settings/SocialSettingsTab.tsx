import React from 'react'
import { Field } from './Field'

export function SocialSettingsTab({
  form,
  setForm,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
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
  )
}
