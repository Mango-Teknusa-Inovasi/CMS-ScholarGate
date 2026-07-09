import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Banner } from '../../lib/api'
import { cn, coverSrc } from '../../lib/utils'
import { easeOutExpo } from '../../lib/motion'

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
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
    if (items.length <= 1 || reduce) return
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6500)
    return () => clearInterval(t)
  }, [items.length, reduce])

  const current = items[index]
  const bg = coverSrc(current.image_path, `banner-${current.id || index}`, 1600, 720)

  return (
    <section className="container-page pt-5 md:pt-6">
      <motion.div
        className="relative overflow-hidden rounded-[20px] border border-line shadow-[var(--shadow-card)]"
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: easeOutExpo }}
      >
        <div className="relative min-h-[240px] md:min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id ?? index}
              className="absolute inset-0 flex items-end p-7 text-white md:p-12"
              role="img"
              aria-label={current.title}
              style={{
                backgroundImage: `linear-gradient(to top, rgb(17 24 39 / 0.62) 0%, rgb(17 24 39 / 0.2) 55%, rgb(17 24 39 / 0.08) 100%), url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.55, ease: easeOutExpo }}
            >
              <div className="relative z-10 max-w-2xl">
                <motion.h1
                  className="text-balance text-3xl font-bold leading-[1.15] tracking-tight md:text-4xl"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08, ease: easeOutExpo }}
                >
                  {current.title}
                </motion.h1>
                {current.subtitle && (
                  <motion.p
                    className="mt-3 max-w-xl text-base leading-relaxed text-white/90 md:text-lg"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.14, ease: easeOutExpo }}
                  >
                    {current.subtitle}
                  </motion.p>
                )}
                {(current.cta_label || current.cta_url) && (
                  <motion.div
                    className="mt-6"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: easeOutExpo }}
                  >
                    {/* Solid soft teal — jangan putih: global a{color:inherit} + parent text-white = label hilang */}
                    {current.cta_url?.startsWith('/') ? (
                      <Link
                        to={current.cta_url || '/artikel'}
                        className="inline-flex items-center rounded-[12px] bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgb(20_184_166/0.4)] transition hover:bg-teal-600 active:scale-[0.98]"
                        style={{ color: '#ffffff' }}
                      >
                        {current.cta_label || 'Selengkapnya'}
                      </Link>
                    ) : (
                      <a
                        href={current.cta_url || '/artikel'}
                        className="inline-flex items-center rounded-[12px] bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgb(20_184_166/0.4)] transition hover:bg-teal-600 active:scale-[0.98]"
                        style={{ color: '#ffffff' }}
                      >
                        {current.cta_label || 'Selengkapnya'}
                      </a>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {items.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === index ? 'w-6 bg-white' : 'w-2 bg-white/55 hover:bg-white/80',
                )}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        )}
      </motion.div>

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
