import { usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { Scale, Shield } from 'lucide-react'
import { api } from '../lib/api'
import { SafeHtml } from '../components/ui/SafeHtml'
import { PageBentoHero, PageBentoShell, PageBentoSection, BentoBoard, BentoTile } from '../components/ui/PageBento'
import { SeoHead } from '../components/seo/SeoHead'
import { Skeleton } from '../components/ui/Skeleton'
import { Link } from 'react-router-dom'

type LegalPayload = {
  key: string
  title: string
  body: string
  path: string
  updated_at?: string | null
}

export function LegalPage() {
  const { legalKey, params } = usePage<{
    legalKey?: string
    params?: { key?: string }
  }>().props

  const key = legalKey || params?.key || 'privacy'
  const isPrivacy = key === 'privacy'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['legal', key],
    queryFn: async () => (await api.get<LegalPayload>(`/legal/${key}`)).data,
  })

  const path = isPrivacy ? '/kebijakan-privasi' : '/syarat-ketentuan'
  const Icon = isPrivacy ? Shield : Scale

  if (isLoading) {
    return (
      <PageBentoShell>
        <BentoBoard>
          <BentoTile spanXl={12} className="!col-span-2 md:!col-span-4 lg:!col-span-6 xl:!col-span-12">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="mt-4 h-40 w-full" />
          </BentoTile>
        </BentoBoard>
      </PageBentoShell>
    )
  }

  if (isError || !data) {
    return (
      <PageBentoShell>
        <div className="rounded-[16px] border border-line bg-white p-8 text-center shadow-[var(--shadow-card)]" data-layer>
          <p className="font-semibold text-ink">Halaman belum tersedia</p>
          <p className="mt-2 text-sm text-subtle">Admin dapat mengisi konten di CMS → Legal.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Coba lagi
          </button>
        </div>
      </PageBentoShell>
    )
  }

  const updated =
    data.updated_at &&
    new Date(data.updated_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  return (
    <>
      <SeoHead
        kind="page"
        page={isPrivacy ? 'kebijakan-privasi' : 'syarat-ketentuan'}
        fallbackTitle={`${data.title}`}
      />
      <PageBentoShell>
        <BentoBoard>
          <PageBentoHero
            crumbs={[
              { label: 'Beranda', to: '/' },
              { label: data.title },
            ]}
            title={data.title}
            description={
              updated
                ? `Diperbarui ${updated}. Dokumen resmi portal ini dapat diubah oleh administrator.`
                : 'Dokumen resmi portal. Dapat diubah oleh administrator CMS.'
            }
            icon={<Icon className="h-5 w-5 text-brand" />}
            tone={isPrivacy ? 'sky' : 'violet'}
          />
        </BentoBoard>

        <PageBentoSection>
          <BentoBoard>
            <BentoTile
              spanXl={12}
              className="!col-span-2 md:!col-span-4 lg:!col-span-6 xl:!col-span-12"
              tone="white"
              padding="lg"
            >
              <SafeHtml
                className="prose-article max-w-none text-sm leading-relaxed text-body md:text-[15px] [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
                html={data.body}
              />
            </BentoTile>
          </BentoBoard>
        </PageBentoSection>

        <div className="flex flex-wrap gap-3 px-0.5 text-sm" data-layer>
          <Link
            to={isPrivacy ? '/syarat-ketentuan' : '/kebijakan-privasi'}
            className="font-semibold text-brand hover:underline"
          >
            {isPrivacy ? 'Lihat Syarat & Ketentuan →' : 'Lihat Kebijakan Privasi →'}
          </Link>
          <Link to="/" className="text-subtle hover:text-ink">
            Kembali ke beranda
          </Link>
        </div>
      </PageBentoShell>
    </>
  )
}

export default LegalPage
