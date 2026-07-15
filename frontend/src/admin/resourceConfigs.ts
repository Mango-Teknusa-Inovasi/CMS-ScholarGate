import type { FieldDef } from '../pages/admin/SimpleResourcePage'

export type ResourceConfig = {
  slug: string
  title: string
  singular: string
  description?: string
  fields: FieldDef[]
  listPath: string
}

export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  categories: {
    slug: 'categories',
    title: 'Kategori',
    singular: 'kategori',
    listPath: '/admin/categories',
    fields: [
      { key: 'name', label: 'Nama' },
      { key: 'slug', label: 'Slug' },
      { key: 'color', label: 'Warna (#hex)' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },
  menus: {
    slug: 'menus',
    title: 'Menu navigasi',
    singular: 'menu',
    listPath: '/admin/menus',
    fields: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'Tautan (contoh /artikel atau https://…)' },
      { key: 'location', label: 'Posisi menu (header / footer)' },
      { key: 'parent_id', label: 'ID menu induk (kosong = menu utama)', type: 'number' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
      { key: 'open_in_new_tab', label: 'Buka tab baru', type: 'checkbox' },
    ],
  },
  banners: {
    slug: 'banners',
    title: 'Banner',
    singular: 'banner',
    description: 'Hero carousel beranda. Upload gambar landscape 1920×720 (16:9 / 21:9).',
    listPath: '/admin/banners',
    fields: [
      {
        key: 'image_path',
        label: 'Gambar banner',
        type: 'image',
        previewClassName: 'aspect-[21/9] max-h-56',
      },
      { key: 'title', label: 'Judul' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'cta_label', label: 'Teks tombol' },
      { key: 'cta_url', label: 'Tautan tombol' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  services: {
    slug: 'services',
    title: 'Layanan homepage',
    singular: 'layanan',
    listPath: '/admin/services',
    fields: [
      { key: 'title', label: 'Judul' },
      { key: 'description', label: 'Deskripsi' },
      { key: 'icon', label: 'Ikon (file-text, calendar, download, …)' },
      { key: 'color', label: 'Warna aksen (#hex)' },
      { key: 'link_url', label: 'Tautan layanan' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  contacts: {
    slug: 'contacts',
    title: 'Kontak',
    singular: 'kontak',
    listPath: '/admin/contacts',
    fields: [
      { key: 'type', label: 'Tipe (address, email, phone, fax, location)' },
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Nilai', type: 'textarea' },
      { key: 'link_url', label: 'URL (opsional)' },
      { key: 'icon', label: 'Icon' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },
  'quick-services': {
    slug: 'quick-services',
    title: 'Layanan cepat',
    singular: 'layanan cepat',
    listPath: '/admin/quick-services',
    fields: [
      { key: 'title', label: 'Judul' },
      { key: 'description', label: 'Deskripsi' },
      { key: 'icon', label: 'Icon' },
      { key: 'color', label: 'Warna #hex' },
      { key: 'link_url', label: 'URL' },
      { key: 'link_label', label: 'Label tombol' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  achievements: {
    slug: 'achievements',
    title: 'Prestasi',
    singular: 'prestasi',
    description: 'Cover ideal 1600×900 (16:9).',
    listPath: '/admin/achievements',
    fields: [
      {
        key: 'cover_path',
        label: 'Gambar cover',
        type: 'image',
        previewClassName: 'aspect-video max-h-56',
      },
      { key: 'title', label: 'Judul' },
      { key: 'slug', label: 'Slug (opsional)' },
      { key: 'excerpt', label: 'Ringkasan', type: 'textarea' },
      { key: 'body', label: 'Isi (HTML)', type: 'textarea' },
      { key: 'badge_label', label: 'Badge' },
      { key: 'status', label: 'Status (published/draft)' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },
  gallery: {
    slug: 'gallery',
    title: 'Galeri',
    singular: 'foto galeri',
    description: 'Foto grid beranda. Ideal 1200×900 (4:3).',
    listPath: '/admin/gallery',
    fields: [
      {
        key: 'image_path',
        label: 'Foto galeri',
        type: 'image',
        previewClassName: 'aspect-[4/3] max-h-56',
      },
      { key: 'title', label: 'Judul' },
      { key: 'caption', label: 'Caption' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  partners: {
    slug: 'partners',
    title: 'Mitra',
    singular: 'mitra',
    description: 'Logo mitra di beranda. Ideal ~400×240, PNG transparan.',
    listPath: '/admin/partners',
    fields: [
      {
        key: 'logo_path',
        label: 'Logo mitra',
        type: 'image',
        previewClassName: 'aspect-[3/2] max-h-36',
      },
      { key: 'name', label: 'Nama mitra' },
      { key: 'url', label: 'URL (opsional)' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  ekstrakurikuler: {
    slug: 'ekstrakurikuler',
    title: 'Ekstrakurikuler',
    singular: 'ekstrakurikuler',
    description: 'Logo opsional (persegi 512×512). Jika kosong, dipakai icon Lucide.',
    listPath: '/admin/ekstrakurikuler',
    fields: [
      {
        key: 'logo_path',
        label: 'Logo ekskul (opsional)',
        type: 'image',
        previewClassName: 'aspect-square max-h-40',
      },
      { key: 'title', label: 'Nama kegiatan' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'schedule', label: 'Jadwal' },
      { key: 'coach', label: 'Pembina' },
      {
        key: 'icon',
        label: 'Icon fallback (Users, Flag, Trophy, Music, Cpu, BookOpen, HeartPulse, Sparkles)',
      },
      { key: 'url', label: 'Link info/pendaftaran (opsional)' },
      { key: 'open_in_new_tab', label: 'Buka link di tab baru', type: 'checkbox' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  downloads: {
    slug: 'downloads',
    title: 'Download',
    singular: 'file download',
    listPath: '/admin/downloads',
    fields: [
      { key: 'title', label: 'Judul' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'file_name', label: 'Nama file' },
      { key: 'category', label: 'Kategori' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
}
