/**
 * Panduan ukuran gambar portal Scholargate.
 * Rasio & resolusi disesuaikan layout referensi agar tampil tajam di desktop + mobile.
 */
export type MediaGuide = {
  key: string
  label: string
  field: string
  /** Contoh: 16:9 */
  ratio: string
  /** Lebar ideal (px) */
  width: number
  /** Tinggi ideal (px) */
  height: number
  /** Max file size (MB) */
  maxMb: number
  format: string
  where: string
  tips: string
}

export const MEDIA_GUIDES: MediaGuide[] = [
  {
    key: 'banner',
    label: 'Banner / Hero beranda',
    field: 'image_path',
    ratio: '21:9 — 16:9',
    width: 1920,
    height: 720,
    maxMb: 2,
    format: 'JPG / WebP',
    where: 'Admin → Banner',
    tips: 'Fokus subjek di tengah-bawah. Hindari teks penting di tepi (bisa tertutup gradient).',
  },
  {
    key: 'welcome',
    label: 'Foto kepala / pejabat (sambutan)',
    field: 'image_path',
    ratio: '4:5 potret',
    width: 800,
    height: 1000,
    maxMb: 1.5,
    format: 'JPG / WebP',
    where: 'Admin → Sambutan',
    tips: 'Crop wajah & bahu di tengah frame. Background polos/blur lebih rapi.',
  },
  {
    key: 'article_cover',
    label: 'Sampul artikel',
    field: 'cover_path',
    ratio: '16:10 — 16:9',
    width: 1600,
    height: 1000,
    maxMb: 2,
    format: 'JPG / WebP',
    where: 'Admin → Artikel',
    tips: 'Orientasi landscape. Untuk list, sistem akan crop tengah otomatis.',
  },
  {
    key: 'achievement',
    label: 'Cover prestasi',
    field: 'cover_path',
    ratio: '16:9',
    width: 1600,
    height: 900,
    maxMb: 2,
    format: 'JPG / WebP',
    where: 'Admin → Prestasi',
    tips: 'Foto kegiatan / piala landscape agar seimbang di kartu featured.',
  },
  {
    key: 'gallery',
    label: 'Galeri (karya digital)',
    field: 'image_path',
    ratio: '4:3',
    width: 1200,
    height: 900,
    maxMb: 1.5,
    format: 'JPG / WebP',
    where: 'Admin → Galeri',
    tips: 'Semua foto sebaiknya rasio mirip agar grid rapi.',
  },
  {
    key: 'partner',
    label: 'Logo mitra',
    field: 'logo_path',
    ratio: '3:2 atau 1:1',
    width: 400,
    height: 240,
    maxMb: 0.5,
    format: 'PNG transparan / SVG / WebP',
    where: 'Admin → Mitra',
    tips: 'PNG transparan lebih bagus. Logo gelap agar terbaca di background cream.',
  },
  {
    key: 'ekskul',
    label: 'Logo ekstrakurikuler',
    field: 'logo_path',
    ratio: '1:1',
    width: 512,
    height: 512,
    maxMb: 0.8,
    format: 'PNG transparan / WebP / JPG',
    where: 'Admin → Ekstrakurikuler',
    tips: 'Logo persegi, subject di tengah. Jika kosong, sistem memakai icon Lucide.',
  },
  {
    key: 'inline',
    label: 'Gambar dalam isi artikel',
    field: 'body',
    ratio: 'bebas (disarankan 16:9)',
    width: 1200,
    height: 675,
    maxMb: 1.5,
    format: 'JPG / WebP',
    where: 'Editor artikel (ikon gambar)',
    tips: 'Lebar efektif ~1200px cukup. File lebih besar akan di-load lambat.',
  },
]

export function guideForField(
  resource: string,
  fieldKey: string,
): MediaGuide | undefined {
  if (resource === 'banners' && fieldKey === 'image_path') return MEDIA_GUIDES.find((g) => g.key === 'banner')
  if (resource === 'welcome-blocks' && fieldKey === 'image_path') return MEDIA_GUIDES.find((g) => g.key === 'welcome')
  if (resource === 'gallery' && fieldKey === 'image_path') return MEDIA_GUIDES.find((g) => g.key === 'gallery')
  if (resource === 'partners' && fieldKey === 'logo_path') return MEDIA_GUIDES.find((g) => g.key === 'partner')
  if (resource === 'ekstrakurikuler' && fieldKey === 'logo_path')
    return MEDIA_GUIDES.find((g) => g.key === 'ekskul')
  if (resource === 'achievements' && (fieldKey === 'cover_path' || fieldKey === 'image_path'))
    return MEDIA_GUIDES.find((g) => g.key === 'achievement')
  if (fieldKey === 'cover_path') return MEDIA_GUIDES.find((g) => g.key === 'article_cover')
  return undefined
}

export function sizeHintText(g: MediaGuide): string {
  return `Ideal ${g.width}×${g.height}px (${g.ratio}) · max ~${g.maxMb} MB · ${g.format}`
}
