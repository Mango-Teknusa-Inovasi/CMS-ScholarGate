import React from 'react'
import { fieldMeta } from './fieldMeta'

export function Field({
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
