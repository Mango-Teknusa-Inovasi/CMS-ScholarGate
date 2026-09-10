import { useQuery } from '@tanstack/react-query'
import { Download as DownloadIcon, FileText } from 'lucide-react'
import { api } from '../lib/api'
import { mediaUrl, formatDate } from '../lib/utils'
import { SeoHead } from '../components/seo/SeoHead'
import { Skeleton } from '../components/ui/Skeleton'
import {
  BentoBoard,
  BentoTile,
  PageBentoHero,
  PageBentoShell,
  type BentoTone,
} from '../components/ui/PageBento'

type DownloadItem = {
  id: string | number
  title: string
  description?: string
  file_name?: string
  file_path?: string
  file_url?: string
  category?: string
  download_count: number
  published_at?: string
}

const tones: BentoTone[] = ['mint', 'sky', 'teal', 'peach', 'violet', 'amber']

export function DownloadsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: async () => (await api.get<DownloadItem[]>('/downloads')).data,
  })

  return (
    <>
      <SeoHead kind="page" page="download" fallbackTitle="Download | Scholargate" />
      <PageBentoShell>
        <BentoBoard>
          <PageBentoHero
            crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Download' }]}
            title="Pusat Download"
            description="Dokumen resmi dan template yang dapat diunduh."
            tone="teal"
            icon={<DownloadIcon className="h-5 w-5 text-teal-600" strokeWidth={1.75} />}
          />
        </BentoBoard>

        {isLoading ? (
          <BentoBoard>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="col-span-2 min-h-[100px] rounded-[22px] md:col-span-4 xl:col-span-6"
              />
            ))}
          </BentoBoard>
        ) : data.length === 0 ? (
          <BentoTile tone="white" span={12} spanMd={4} spanLg={6} spanXl={12} padding="lg">
            <p className="text-center text-subtle">Belum ada berkas unduhan.</p>
          </BentoTile>
        ) : (
          <BentoBoard>
            {data.map((item, i) => (
              <BentoTile
                key={item.id}
                tone={tones[i % tones.length]}
                spanMd={4}
                spanLg={3}
                spanXl={6}
                padding="md"
                className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-emerald-600 shadow-sm ring-1 ring-black/5">
                    <FileText className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-ink">{item.title}</h2>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-subtle">{item.description}</p>
                    )}
                    <p className="mt-2 text-[11px] font-medium text-subtle">
                      {item.category || 'Dokumen'} · {formatDate(item.published_at)} ·{' '}
                      {item.download_count} unduhan
                    </p>
                  </div>
                </div>
                {item.file_url || item.file_path ? (
                  <a
                    href={mediaUrl(item.file_url || item.file_path) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={item.file_name || undefined}
                    onClick={() => {
                      api.post(`/downloads/${item.id}/hit`).catch(() => {})
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(16_185_129/0.25)] transition hover:bg-emerald-600 active:scale-[0.98] sm:self-center"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download
                  </a>
                ) : (
                  <span className="inline-flex shrink-0 items-center justify-center self-start rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-subtle sm:self-center">
                    Belum ada berkas
                  </span>
                )}
              </BentoTile>
            ))}
          </BentoBoard>
        )}
      </PageBentoShell>
    </>
  )
}

export default DownloadsPage
