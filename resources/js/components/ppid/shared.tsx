import { useState, Children, cloneElement, isValidElement, Fragment, type ReactNode, type ReactElement } from 'react'
import { Link } from '@inertiajs/react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { api, ensureCsrf } from '../../lib/api'

export type Field = { key: string; label: string; type: string; required: boolean; options: string[]; core?: boolean; step: number; hint?: string; condition?: { field: string; operator: string; value: string } | null }
export type FormSchema = { kind: string; version: number; active: boolean; fields: Field[] }
export type StoredFile = { id: string; name: string; mime: string; size: number; version: number; url?: string }
export type Submission = { id: string; register: string; kind: string; status: string; channel: string; answers: Record<string, string | boolean>; received_at: string; due_at?: string; outcome?: string; form_snapshot: FormSchema }
export const kinds: Record<string, string> = { request: 'Permohonan informasi', objection: 'Keberatan', survey: 'Survei kepuasan', guest: 'Buku tamu', visit: 'Kunjungan' }
export const statuses: Record<string, string> = { received: 'Diterima', needs_information: 'Menunggu kelengkapan', processing: 'Diproses', responded: 'Sudah ditanggapi', completed: 'Selesai', draft: 'Draf', review: 'Menunggu tinjauan', published: 'Terbit', archived: 'Arsip' }
export const roles: Record<string, string> = { manager: 'Pengelola modul', information: 'Petugas informasi', publisher: 'Penerbit informasi', service: 'Petugas layanan', supervisor: 'Atasan PPID', frontdesk: 'Front desk' }
export const inputClass = 'w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
export const actionClass = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 py-2 font-semibold text-white hover:opacity-90'
export const panelClass = 'min-w-0 rounded-[22px] border border-line bg-surface p-5 sm:p-6'
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={cn(panelClass, className)}>{children}</section> }
export function ErrorMessage({ error }: { error: unknown }) { if (!error) return null; const e = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }; return <div role="alert" className="my-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">{e.response?.data?.message || (typeof error === 'string' ? error : 'Tidak dapat memproses permintaan. Silakan coba lagi.')} {e.response?.data?.errors && <ul className="mt-2 list-disc pl-5">{Object.entries(e.response.data.errors).map(([key, msgs]) => <li key={key}>{msgs.join(' ')}</li>)}</ul>}</div> }
function labelControls(children: ReactNode, label: string): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement(child)) return child
    const element = child as ReactElement<any>
    if (element.type === Fragment) return cloneElement(element, {}, labelControls(element.props.children, label))
    return ['input', 'select', 'textarea'].includes(String(element.type)) ? cloneElement(element, { 'aria-label': label }) : element
  })
}
export function FieldInput({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5 text-sm font-medium text-ink"><span>{label}</span>{labelControls(children, label)}</label> }
export function Empty({ children }: { children: ReactNode }) { return <p className="py-8 text-body">{children}</p> }
export function Loading() { return <p role="status" className="p-6 text-body">Memuat layanan…</p> }
export function Status({ value }: { value: string }) { return <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-ink">{statuses[value] || value}</span> }
export function visible(field: Field, answers: Record<string, unknown>) { const c = field.condition; return !c || (c.operator === 'not' ? String(answers[c.field] || '') !== c.value : String(answers[c.field] || '') === c.value) }
export function DateLabel({ value }: { value?: string }) { return <>{value ? new Date(value).toLocaleDateString('id-ID') : '—'}</> }

export function DynamicForm({ schema, offline = false, onSuccess }: { schema: FormSchema; offline?: boolean; onSuccess?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [files, setFiles] = useState<Record<string, File>>({})
  const [step, setStep] = useState(0)
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ register: string; access_code: string }>()
  const [channel, setChannel] = useState('langsung')
  const [received, setReceived] = useState(new Date().toISOString().slice(0, 10))
  const [key] = useState(() => crypto.randomUUID())
  const last = schema.kind === 'request' ? 3 : 0
  const fields = schema.fields.filter(f => visible(f, answers))
  const send = async () => {
    setBusy(true); setError(null)
    const data = new FormData(); data.set('submission_key', key)
    if (offline) { data.set('channel', channel); data.set('received_at', received) }
    fields.forEach(f => { if (f.type === 'file') { if (files[f.key]) data.set(`files[${f.key}]`, files[f.key]) } else if (answers[f.key] !== undefined) data.set(`answers[${f.key}]`, typeof answers[f.key] === 'boolean' ? (answers[f.key] ? '1' : '0') : String(answers[f.key])) })
    try { await ensureCsrf(); const res = await api.post(offline ? `/admin/ppid/offline/${schema.kind}` : `/ppid/submit/${schema.kind}`, data, { onUploadProgress: e => setProgress(e.total ? Math.round(e.loaded / e.total * 100) : 0) }); setResult(res.data); onSuccess?.() }
    catch (e) { setError(e) } finally { setBusy(false) }
  }
  if (result) return <Panel><h2 className="text-xl font-bold">Pengajuan berhasil dicatat</h2><p className="mt-4">Nomor register: <strong>{result.register}</strong></p><p className="mt-2 break-all">Kode akses: <strong>{result.access_code}</strong></p><p className="my-4 text-body">Simpan kode akses secara pribadi untuk melacak dan melengkapi pengajuan.</p><div className="flex flex-wrap gap-3 print:hidden"><Button onClick={() => window.print()}>Cetak tanda terima</Button><Link href="/ppid/lacak" className={actionClass}>Lacak permohonan</Link></div></Panel>
  return <form onSubmit={e => { e.preventDefault(); if (step < last) setStep(step + 1); else void send() }} className="space-y-5">
    {last > 0 && <ol className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" aria-label="Langkah pengajuan">{['Identitas', 'Rincian informasi', 'Cara pelayanan', 'Periksa dan kirim'].map((name, i) => <li key={name} aria-current={step === i ? 'step' : undefined} className={`rounded-lg p-3 ${step === i ? 'bg-brand-soft font-semibold text-ink' : 'bg-muted text-body'}`}>{i + 1}. {name}</li>)}</ol>}
    {offline && <div className="grid gap-4 sm:grid-cols-2"><FieldInput label="Kanal penerimaan"><select className={inputClass} value={channel} onChange={e => setChannel(e.target.value)}>{['langsung', 'surat', 'telepon'].map(c => <option key={c}>{c}</option>)}</select></FieldInput><FieldInput label="Tanggal diterima"><input type="date" required className={inputClass} value={received} onChange={e => setReceived(e.target.value)} /></FieldInput></div>}
    {step === 3 && <dl className="space-y-3 rounded-xl bg-muted p-4">{fields.filter(f => f.type !== 'checkbox').map(f => <div key={f.key}><dt className="text-sm text-body">{f.label}</dt><dd className="break-words font-medium">{f.type === 'file' ? files[f.key]?.name || '—' : String(answers[f.key] || '—')}</dd></div>)}</dl>}
    <div className="grid gap-5 sm:grid-cols-2">{fields.filter(f => last === 0 || f.step === step).map(f => {
      const required = f.required && !(offline && ['email', 'identity'].includes(f.key));
      return <div key={f.key} className={f.type === 'textarea' || f.type === 'checkbox' ? 'sm:col-span-2' : ''}><FieldInput label={`${f.label}${required ? ' *' : ''}`}>
        {f.type === 'textarea' ? <textarea className={inputClass} rows={4} required={required} value={String(answers[f.key] || '')} onChange={e => setAnswers({ ...answers, [f.key]: e.target.value })} />
          : f.type === 'select' ? <select className={inputClass} required={required} value={String(answers[f.key] || '')} onChange={e => setAnswers({ ...answers, [f.key]: e.target.value })}><option value="">Pilih…</option>{f.options.map(o => <option key={o}>{o}</option>)}</select>
            : f.type === 'file' ? <><input className={`${inputClass} text-sm`} type="file" required={required && !files[f.key]} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" onChange={e => { if (e.target.files?.[0]) setFiles({ ...files, [f.key]: e.target.files[0] }) }} /><small className="text-body">Maksimal 20 MB. {files[f.key]?.name}</small></>
              : f.type === 'checkbox' ? <input className="h-5 w-5 accent-[var(--color-brand)]" type="checkbox" required={required} checked={!!answers[f.key]} onChange={e => setAnswers({ ...answers, [f.key]: e.target.checked })} />
                : <input className={inputClass} type={f.type} required={required} min={f.type === 'number' ? 1 : undefined} value={String(answers[f.key] || '')} onChange={e => setAnswers({ ...answers, [f.key]: e.target.value })} />}
      </FieldInput>{f.hint && <p className="mt-1 text-sm text-body">{f.hint}</p>}</div>
    })}</div>
    <ErrorMessage error={error} />{busy && <p role="status">Mengirim… {progress}%</p>}
    <div className="flex gap-3">{step > 0 && <Button type="button" variant="outline" disabled={busy} onClick={() => setStep(step - 1)}>Kembali</Button>}<Button type="submit" disabled={busy}>{step < last ? 'Lanjutkan' : busy ? 'Mengirim…' : 'Kirim formulir'}</Button></div>
  </form>
}
