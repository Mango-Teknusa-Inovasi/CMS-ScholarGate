import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Banner } from '../../lib/api'
import { cn, coverSrc } from '../../lib/utils'

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const items = banners.length
    ? banners
    : ([
        {
          id: 0,
          title: 'Selamat datang di Scholargate',
          subtitle: 'Portal informasi dan layanan pendidikan',
          cta_label: 'Jelajahi artikel',
          cta_url: '/artikel',
        },
      ] as Banner[])

  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6500)
    return () => clearInterval(t)
  }, [items.length])

  const current = items[index]
  const bg = coverSrc(current.image_path, `banner-${current.id || index}`, 1600, 720)

  return (
    <section className="container-page pt-5 md:pt-6">
      <div className="relative overflow-hidden rounded-[20px] border border-line shadow-[var(--shadow-card)]">
        <div
          className="relative flex min-h-[240px] items-end p-7 text-white md:min-h-[320px] md:p-12"
          role="img"
          aria-label={current.title}
          style={{
            backgroundImage: `linear-gradient(to top, rgb(17 24 39 / 0.62) 0%, rgb(17 24 39 / 0.2) 55%, rgb(17 24 39 / 0.08) 100%), url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight md:text-4xl">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
                {current.subtitle}
              </p>
            )}
            {current.cta_label && current.cta_url && (
              <Link
                to={current.cta_url}
                className="mt-6 inline-flex rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-peach-soft active:scale-[0.98]"
              >
                {current.cta_label}
              </Link>
            )}
          </div>
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-white' : 'w-2 bg-white/55 hover:bg-white/80',
                )}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        )}
      </div>
      {/* preload next image subtly via hidden img for smoother transition */}
      {items.map((b, i) =>
        i !== index ? (
          <img
            key={`preload-${b.id}`}
            src={coverSrc(b.image_path, `banner-${b.id || i}`, 1600, 720)}
            alt=""
            className="hidden"
            loading="lazy"
          />
        ) : null,
      )}
    </section>
  )
}
