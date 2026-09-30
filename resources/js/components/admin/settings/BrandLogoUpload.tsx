import React, { useState } from 'react'
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { api, ensureCsrf } from '../../../lib/api'
import { useToast } from '../../../components/ui/Toast'
import { mediaUrl } from '../../../lib/utils'

export function BrandLogoUpload({
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
