import { useQuery } from '@tanstack/react-query'
import { api, type HomePayload } from '../lib/api'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { WelcomeSection } from '../components/home/WelcomeSection'
import { ServicesGrid } from '../components/home/ServicesGrid'
import { ArticlesSection } from '../components/home/ArticlesSection'
import { AchievementsSection } from '../components/home/AchievementsSection'
import { GallerySection } from '../components/home/GallerySection'
import { PartnersSection } from '../components/home/PartnersSection'
import { HomeSkeleton } from '../components/ui/Skeleton'
import { SeoHead } from '../components/seo/SeoHead'

export function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: async () => (await api.get<HomePayload>('/home')).data,
  })

  if (isLoading) return <HomeSkeleton />

  if (isError || !data) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto max-w-md rounded-[16px] border border-line bg-white p-8 shadow-[var(--shadow-card)]">
          <p className="font-semibold text-ink">Tidak dapat memuat portal</p>
          <p className="mt-2 text-sm text-subtle">
            Periksa koneksi API Laravel (port 8000), lalu coba lagi.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-[12px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
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
      <HeroCarousel banners={data.banners} />
      <WelcomeSection welcome={data.welcome} />
      <ServicesGrid services={data.services} />
      <ArticlesSection articles={data.articles} />
      <AchievementsSection items={data.achievements} />
      <GallerySection items={data.gallery} />
      <PartnersSection partners={data.partners} />
    </>
  )
}
