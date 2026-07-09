import { useQuery } from '@tanstack/react-query'
import { Download as DownloadIcon, FileText } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { SeoHead } from '../components/seo/SeoHead'
import { ListRowsSkeleton } from '../components/ui/Skeleton'

type DownloadItem = {
  id: number
  title: string
  description?: string
  file_name?: string
  category?: string
  download_count: number
  published_at?: string
}

export function DownloadsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: async () => (await api.get<DownloadItem[]>('/downloads')).data,
  })

  return (
    <div>
      <SeoHead kind="page" page="download" fallbackTitle="Download | Scholargate" />
      <section className="page-hero-band" data-layer data-parallax="3">
        <div className="container-page py-10">
          <p className="mb-2 text-sm text-subtle">Beranda / Download</p>
          <h1 className="text-3xl font-bold text-ink">Pusat Download</h1>
          <p className="mt-2 text-subtle">Dokumen resmi dan template yang dapat diunduh.</p>
        </div>
      </section>
      <div className="container-page py-10">
        {isLoading ? (
          <ListRowsSkeleton count={5} />
        ) : (
          <div className="space-y-3" data-layer data-parallax="3">
            {data.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-[16px] border border-line bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-ink">{item.title}</h2>
                    <p className="mt-1 text-sm text-subtle">{item.description}</p>
                    <p className="mt-2 text-xs text-subtle">
                      {item.category || 'Dokumen'} · {formatDate(item.published_at)} · {item.download_count} unduhan
                    </p>
                  </div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(16_185_129/0.25)] transition hover:bg-emerald-600 active:scale-[0.98]">
                  <DownloadIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
