import { useQuery } from '@tanstack/react-query'
import { api, type HomePayload } from '../lib/api'
import { HomeBento } from '../components/home/HomeBento'
import { HomeSkeleton } from '../components/ui/Skeleton'
import { SeoHead } from '../components/seo/SeoHead'

/** Portal homepage — bento grid fun & ceria */
export function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: async () => (await api.get<HomePayload>('/home')).data,
  })

  if (isLoading) return <HomeSkeleton />

  if (isError || !data) {
    return (
      <div className="container-page py-20 text-center" data-layer>
        <div className="mx-auto max-w-md rounded-[22px] border border-line bg-white p-8 shadow-[var(--shadow-card)]">
          <p className="font-semibold text-ink">Tidak dapat memuat portal</p>
          <p className="mt-2 text-sm text-subtle">
            Periksa koneksi API Laravel (port 8000), lalu coba lagi.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Muat ulang
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <SeoHead kind="home" fallbackTitle="Scholargate — Portal Pendidikan" />
      <HomeBento
        banners={data.banners}
        welcome={data.welcome}
        services={data.services}
        articles={data.articles}
        achievements={data.achievements}
        gallery={data.gallery}
        partners={data.partners}
      />
    </>
  )
}

export default HomePage
