import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Field } from './Field'

export function AiSettingsTab({
  form,
  setForm,
  testingAi,
  handleTestAi,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  testingAi: boolean
  handleTestAi: () => void
}) {
  return (
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
            fieldKey="openai_display_model_name"
            value={form.openai_display_model_name || ''}
            onChange={(v) => setForm({ ...form, openai_display_model_name: v })}
          />
          <Field
            fieldKey="openai_custom_prompt"
            value={form.openai_custom_prompt || ''}
            onChange={(v) => setForm({ ...form, openai_custom_prompt: v })}
          />
        </div>
      </section>

      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <span>Instagram Scraper (Native &amp; Integrasi)</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              ● Native Active (Bebas Kuota)
            </span>
          </h2>
        </div>
        <p className="mb-4 text-xs text-subtle leading-relaxed">
          CMS kini dilengkapi <strong>Internal Native Scraper</strong> langsung di dalam server. Anda dapat langsung mengimpor postingan &amp; carousel Instagram <strong>tanpa memerlukan RapidAPI</strong> dan tanpa batasan kuota.
        </p>
        <div className="space-y-4">
          <Field
            fieldKey="instagram_session_cookie"
            value={form.instagram_session_cookie || ''}
            onChange={(v) => setForm({ ...form, instagram_session_cookie: v })}
          />
          <div className="pt-3 border-t border-line/60">
            <p className="text-[11px] font-semibold text-subtle mb-2">Cadangan Tambahan (RapidAPI - Opsional):</p>
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
          </div>
        </div>
      </section>
    </div>
  )
}
