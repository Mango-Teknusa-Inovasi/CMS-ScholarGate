# SEO · AEO · GEO — Scholargate CMS

## Definisi

| Istilah | Fokus |
|---------|--------|
| **SEO** | Google/Bing klasik: title, description, canonical, sitemap, robots, structured data, image alt |
| **AEO** | Answer Engine Optimization: jawaban langsung, FAQ schema + UI, excerpt yang menjawab intent |
| **GEO** | Generative Engine Optimization **dan** Geo lokal: `llms.txt`, entity schema, koordinat/NAP sekolah |

## Otomatis di sistem

### Saat upload gambar (penting)
Semua unggahan lewat **Media Library** dan **ImageUploadField** (banner, cover artikel, logo, galeri, dll.) lewat `ImageOptimizer`:

1. Orientasi EXIF diperbaiki lalu metadata dibuang  
2. Resize jika lebar > 1920px  
3. Konversi ke **WebP** (kualitas ~82)  
4. Disimpan ke media library  
5. **Alt text** — default dari nama file; bisa diisi di form upload & diedit di Media Library  

Badge **WebP** di media library menandai file yang sudah dioptimasi.

### Endpoint publik
- `/sitemap.xml` — semua URL penting + artikel terbit  
- `/robots.txt` — Allow publik, Disallow admin/api; allow bot AI (GPTBot, ClaudeBot, PerplexityBot, …)  
- `/llms.txt` — peta situs + ringkasan artikel untuk AI crawler  
- `/api/v1/seo/*` — meta dinamis (title/desc/OG/geo/JSON-LD) untuk Helmet  

### Schema.org (JSON-LD)
- Organization / EducationalOrganization + geo coordinates + NAP  
- WebSite + SearchAction  
- NewsArticle + BreadcrumbList  
- FAQPage (jika FAQ diisi di artikel; juga ditampilkan di halaman artikel)  

### Meta per halaman publik
Title & description unik untuk: beranda, profil, artikel, prestasi, ekstrakurikuler, download.  
Artikel: meta title/description, og:image (cover), noindex opsional, tags, published/modified time.

## Yang diisi admin

### Pengaturan (`/admin/settings`)
- Deskripsi situs, logo, default OG image  
- Alamat, lat/lng, kota, region (**GEO lokal**)  
- Verifikasi Google/Bing, Twitter handle  

### Per artikel
- Meta title / description  
- Focus keyword  
- Canonical, noindex  
- FAQ Q&A (**AEO** — schema + accordion di frontend)  
- Cover (jadi og:image, dioptimasi saat upload)  
- Jadwal terbit  

### Media
- Alt text per file  
- Optimasi WebP otomatis  

## Praktik konten (AEO/GEO)

1. **Excerpt & meta description** = jawaban 1–2 kalimat untuk query utama  
2. **H1 = intent jelas**, bukan basabasi  
3. **FAQ 2–5 item** di artikel penting (pendaftaran, biaya, jadwal)  
4. **Alt text** bermakna (bukan “IMG_001”)  
5. **NAP konsisten** (nama, alamat, telepon) di profil & settings  
6. Isi **lat/lng** sekolah di pengaturan  

## Catatan SPA

Meta diisi client-side via `react-helmet-async`. Untuk crawler modern (Google) biasanya cukup.  
Sitemap + llms.txt + structured data memperkuat SEO/AEO/GEO.  
SSR penuh bisa ditambahkan nanti jika butuh preview social yang 100% server-rendered.
