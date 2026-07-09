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

/**
 * Each block uses data-layer so GSAP page enter staggers them
 * one-by-one with parallax depth (see useGsapParallaxPage).
 */
export function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: async () => (await api.get<HomePayload>('/home')).data,
  })

  if (isLoading) return <HomeSkeleton />

  if (isError || !data) {
    return (
      <div className="container-page py-20 text-center" data-layer>
        <div className="mx-auto max-w-md rounded-[16px] border border-line bg-white p-8 shadow-[var(--shadow-card)]">
          <p className="font-semibold text-ink">Tidak dapat memuat portal</p>
          <p className="mt-2 text-sm text-subtle">
            Periksa koneksi API Laravel (port 8000), lalu coba lagi.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-[12px] bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
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
      <div data-layer data-parallax="6">
        <HeroCarousel banners={data.banners} />
      </div>
      <div data-layer data-parallax="4">
        <WelcomeSection welcome={data.welcome} />
      </div>
      <div data-layer data-parallax="3">
        <ServicesGrid services={data.services} />
      </div>
      <div data-layer data-parallax="5">
        <ArticlesSection articles={data.articles} />
      </div>
      <div data-layer data-parallax="3">
        <AchievementsSection items={data.achievements} />
      </div>
      <div data-layer data-parallax="7">
        <GallerySection items={data.gallery} />
      </div>
      <div data-layer data-parallax="2">
        <PartnersSection partners={data.partners} />
      </div>
    </>
  )
}
