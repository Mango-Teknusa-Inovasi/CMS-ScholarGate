export interface FieldMeta {
  label: string
  hint?: string
  multiline?: boolean
  type?: 'text' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  group: string
}

export const fieldMeta: Record<string, FieldMeta> = {
  // Identitas
  site_name: { label: 'Nama situs', group: 'branding' },
  site_tagline: { label: 'Tagline', group: 'branding' },
  site_description: {
    label: 'Deskripsi situs (SEO default)',
    multiline: true,
    group: 'branding',
    hint: 'Dipakai sebagai meta description default & llms.txt',
  },
  footer_text: { label: 'Teks footer', multiline: true, group: 'branding' },
  copyright: { label: 'Copyright', group: 'branding' },

  // Kontak & GEO
  contact_email: { label: 'Email kontak', group: 'contact' },
  contact_phone: { label: 'Telepon', group: 'contact' },
  report_url: { label: 'URL tombol Lapor', hint: 'Link eksternal form laporan', group: 'contact' },
  contact_address: { label: 'Alamat lengkap (GEO/NAP)', multiline: true, group: 'contact' },
  geo_placename: { label: 'Nama tempat / kota', group: 'contact' },
  geo_region: { label: 'Kode negara/region', hint: 'Contoh: ID-JI atau ID', group: 'contact' },
  geo_lat: { label: 'Latitude', hint: 'Contoh: -7.2575', group: 'contact' },
  geo_lng: { label: 'Longitude', hint: 'Contoh: 112.7521', group: 'contact' },

  // Medsos
  social_instagram: {
    label: 'URL Instagram',
    hint: 'Contoh: https://instagram.com/namasekolah',
    group: 'social',
  },
  social_facebook: {
    label: 'URL Facebook',
    hint: 'Contoh: https://facebook.com/namasekolah',
    group: 'social',
  },
  social_tiktok: {
    label: 'URL TikTok',
    hint: 'Contoh: https://tiktok.com/@namasekolah',
    group: 'social',
  },
  social_youtube: {
    label: 'URL YouTube',
    hint: 'Contoh: https://youtube.com/@namasekolah',
    group: 'social',
  },

  // SEO & Schema
  organization_type: {
    label: 'Tipe organisasi schema',
    hint: 'EducationalOrganization / School / GovernmentOrganization',
    group: 'seo',
  },
  twitter_handle: { label: 'Twitter/X @handle', group: 'seo' },
  google_site_verification: {
    label: 'Google Search Console: kode verifikasi',
    group: 'seo',
    hint: 'Tempel kode content saja, atau full tag <meta name="google-site-verification" content="…">. Sistem memotong otomatis.',
  },
  bing_site_verification: {
    label: 'Bing Webmaster: kode verifikasi',
    group: 'seo',
    hint: 'Opsional. Sama: boleh tempel full meta tag msvalidate.01.',
  },
  allow_ai_crawlers: {
    label: 'Izinkan AI / LLM Crawlers (AEO)',
    type: 'select',
    options: [
      { value: '1', label: 'Ya, izinkan perayapan AI (GPTBot, ClaudeBot, dll)' },
      { value: '0', label: 'Tidak, blokir perayapan AI (Disallow)' },
    ],
    hint: 'Mengatur izin baca untuk ChatGPT-User, ClaudeBot, Perplexity, GPTBot, dll.',
    group: 'seo',
  },
  robots_extra: {
    label: 'Aturan robots.txt tambahan',
    multiline: true,
    hint: 'Masukkan aturan tambahan baris demi baris jika ada.',
    group: 'seo',
  },
  sitemap_frequency: {
    label: 'Frekuensi pembaruan sitemap',
    type: 'select',
    options: [
      { value: 'daily', label: 'Harian (daily)' },
      { value: 'weekly', label: 'Mingguan (weekly)' },
      { value: 'monthly', label: 'Bulanan (monthly)' },
    ],
    hint: 'Petunjuk seberapa sering konten diperbarui untuk perayap.',
    group: 'seo',
  },
  sitemap_include_achievements: {
    label: 'Halaman Prestasi di sitemap',
    type: 'select',
    options: [
      { value: '1', label: 'Sertakan' },
      { value: '0', label: 'Kecualikan' },
    ],
    group: 'seo',
  },
  sitemap_include_extracurriculars: {
    label: 'Halaman Ekskul di sitemap',
    type: 'select',
    options: [
      { value: '1', label: 'Sertakan' },
      { value: '0', label: 'Kecualikan' },
    ],
    group: 'seo',
  },

  // AI & Instagram
  openai_api_key: {
    label: 'OpenAI API Key',
    hint: 'Kunci rahasia dari platform.openai.com, openrouter.ai, atau penyedia AI kompatibel lainnya.',
    group: 'ai',
  },
  openai_base_url: {
    label: 'API Base URL / Endpoint (OpenAI Compatible)',
    hint: 'Default: https://api.openai.com/v1. Bisa diganti ke OpenRouter, DeepSeek, Groq, dll.',
    group: 'ai',
  },
  openai_model: {
    label: 'Model AI',
    hint: 'Bebas isi model kustom atau klik rekomendasi di bawah. Default: gpt-4o-mini.',
    group: 'ai',
  },
  openai_display_model_name: {
    label: 'Nama Tampilan Model AI (Brand Persona)',
    hint: 'Nama model/sistem AI publik yang akan selalu dijawab oleh asisten (misal: Portal AI Engine). Model dilarang membocorkan nama provider atau model aslinya.',
    group: 'ai',
  },
  openai_custom_prompt: {
    label: 'Instruksi Khusus AI (Custom System Prompt)',
    multiline: true,
    hint: 'Opsional: Berikan panduan gaya bahasa humas sekolah, nilai-nilai, atau penekanan khusus.',
    group: 'ai',
  },
  instagram_session_cookie: {
    label: 'Instagram Session Cookie (Opsional)',
    hint: 'Opsional: Nilai sessionid dari browser untuk scraping akun Instagram privat atau bypass pembatasan.',
    group: 'ai',
  },
  instagram_scraper_api_key: {
    label: 'Instagram Scraper API Key (RapidAPI - Cadangan Opsional)',
    hint: 'Opsional: Kunci RapidAPI hanya jika ingin menggunakan layanan eksternal sebagai cadangan.',
    group: 'ai',
  },
  instagram_scraper_api_host: {
    label: 'Instagram Scraper API Host',
    hint: 'Default: instagram-scraper-stable-api.p.rapidapi.com (sesuai API yang dipilih di RapidAPI)',
    group: 'ai',
  },
}
