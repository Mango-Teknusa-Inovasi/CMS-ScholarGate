import type { GalleryItem } from '../../lib/api'
import { coverSrc } from '../../lib/utils'
import { SectionHeader } from '../ui/SectionHeader'

export function GallerySection({ items }: { items: GalleryItem[] }) {
  if (!items.length) return null

  return (
    <section className="container-page py-10 md:py-12">
      <SectionHeader
        title="Karya digital dan jejak sosial"
        description="Galeri dokumentasi kegiatan dan karya kreatif."
        align="center"
      />
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
        {items.map((item, i) => {
          const src = coverSrc(item.image_path, `gallery-${item.id || i}`, 800, 600)
          return (
            <figure
              key={item.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-[16px] border border-line bg-peach shadow-[var(--shadow-card)]"
            >
              <img
                src={src}
                alt={item.title || item.caption || `Galeri ${i + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              {(item.title || item.caption) && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 pt-10 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {item.title || item.caption}
                </figcaption>
              )}
            </figure>
          )
        })}
      </div>
    </section>
  )
}
