import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { MEDIA_GUIDES } from '../../lib/mediaGuide'
import { RichTextEditor } from '../../components/admin/RichTextEditor'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

type WelcomeBlock = {
  id: number
  key: string
  title: string
  body?: string
  image_path?: string | null
  badge_left?: string
  badge_right?: string
  chat_label?: string
  is_active: boolean
}

const welcomeGuide = MEDIA_GUIDES.find((g) => g.key === 'welcome')

export function WelcomeAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'welcome-blocks'],
    queryFn: async () => (await api.get<WelcomeBlock[]>('/admin/welcome-blocks')).data,
  })

  const [forms, setForms] = useState<Record<number, WelcomeBlock>>({})

  useEffect(() => {
    const map: Record<number, WelcomeBlock> = {}
    data.forEach((b) => {
      map[b.id] = { ...b }
    })
    setForms(map)
  }, [data])

  const save = useMutation({
    mutationFn: async (block: WelcomeBlock) =>
      api.put(`/admin/welcome-blocks/${block.id}`, block),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'welcome-blocks'] })
      qc.invalidateQueries({ queryKey: ['home'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Sambutan disimpan.')
    },
    onError: () => toast.error('Gagal menyimpan sambutan.'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Memuat sambutan">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
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
        title="Sambutan"
        description="Sambutan beranda & profil: upload foto pejabat potret (rasio 4:5). Foto tampil di samping teks sambutan di portal."
      />

      <div className="space-y-6">
        {data.map((block) => {
          const form = forms[block.id] || block
          const label =
            block.key === 'home'
              ? 'Homepage'
              : block.key === 'profile'
                ? 'Halaman profil'
                : block.key

          return (
            <div
              key={block.id}
              className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-ink">{label}</h2>
                  <p className="text-xs text-subtle">Key: {block.key}</p>
                </div>
                <label className="flex items-center gap-2 rounded-[12px] border border-line bg-page px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForms((f) => ({
                        ...f,
                        [block.id]: { ...form, is_active: e.target.checked },
                      }))
                    }
                  />
                  Aktif
                </label>
              </div>

              <div className="mb-4">
                <ImageUploadField
                  label="Foto kepala / pejabat"
                  value={form.image_path}
                  onChange={(path) =>
                    setForms((f) => ({
                      ...f,
                      [block.id]: { ...form, image_path: path },
                    }))
                  }
                  guide={welcomeGuide}
                  previewClassName="aspect-[4/5] max-h-64 max-w-[200px]"
                />
              </div>

              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Judul</label>
                  <input
                    className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                    value={form.title}
                    onChange={(e) =>
                      setForms((f) => ({
                        ...f,
                        [block.id]: { ...form, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Badge kiri</label>
                  <input
                    className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                    value={form.badge_left || ''}
                    onChange={(e) =>
                      setForms((f) => ({
                        ...f,
                        [block.id]: { ...form, badge_left: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Badge kanan</label>
                  <input
                    className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                    value={form.badge_right || ''}
                    onChange={(e) =>
                      setForms((f) => ({
                        ...f,
                        [block.id]: { ...form, badge_right: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Label chat (opsional)
                  </label>
                  <input
                    className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
                    value={form.chat_label || ''}
                    onChange={(e) =>
                      setForms((f) => ({
                        ...f,
                        [block.id]: { ...form, chat_label: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <p className="mb-2 text-sm font-medium text-ink">Isi sambutan</p>
              <RichTextEditor
                value={form.body || ''}
                onChange={(html) =>
                  setForms((f) => ({
                    ...f,
                    [block.id]: { ...form, body: html },
                  }))
                }
                placeholder="Tulis sambutan…"
              />

              <button
                type="button"
                onClick={() => save.mutate(forms[block.id])}
                disabled={save.isPending}
                className="mt-4 rounded-[12px] bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
              >
                {save.isPending ? 'Menyimpan…' : `Simpan ${label}`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
