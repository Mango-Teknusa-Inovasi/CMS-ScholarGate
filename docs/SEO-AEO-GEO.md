# SEO · AEO · GEO — panduan singkat

Fokus: **mudah diindeks Google** + setup **Search Console** tanpa ribet.

## Endpoint otomatis

| URL | Fungsi |
|-----|--------|
| `/sitemap.xml` | Peta URL (beranda, halaman, artikel terbit, prestasi) |
| `/robots.txt` | Izinkan crawl publik; blok admin/login/api/preview |
| `/llms.txt` | Peta teks untuk AI / answer engines (AEO) |

Meta title, description, canonical, OG, GEO, JSON-LD, dan **kode verifikasi GSC** di-inject:
- **Server** (HTML awal SPA) → bot & GSC
- **Client** (`SeoHead`) → navigasi SPA

## Google Search Console (3 langkah)

1. Buka [Google Search Console](https://search.google.com/search-console) → **Tambahkan properti** (URL prefix: `https://domain-anda.sch.id`).
2. Verifikasi **tag HTML** → salin meta → tempel di **Admin → Pengaturan → Google Search Console** → **Simpan**.  
   Boleh tempel full tag; CMS memotong ke `content="..."`.
3. Menu **Sitemaps** → submit: `https://domain-anda.sch.id/sitemap.xml`

Cek HTML: buka source homepage → cari `google-site-verification`.

## Yang diisi admin (wajib untuk GEO/lokal)

**Pengaturan**

| Field | Kenapa |
|-------|--------|
| Nama + deskripsi situs | Title/description default |
| Logo + default OG image | Share & schema |
| Alamat, kota, lat/lng | GEO lokal + schema Organization |
| Telepon / email | NAP + ContactPoint |
| Google site verification | GSC |

**Artikel**

- Meta title / description (atau pakai excerpt)
- Cover (jadi `og:image`)
- FAQ 2–5 item → schema FAQPage (**AEO**)
- Jangan centang noindex kecuali draf rahasia

## Aturan indeks (otomatis)

| Aturan | Detail |
|--------|--------|
| Artikel `noindex` | Tidak masuk sitemap |
| Admin / login / preview | `noindex` + `Disallow` di robots |
| robots | `index,follow,max-image-preview:large,...` |
| Canonical | Per halaman + artikel |
| Schema | Organization + WebSite + NewsArticle + FAQ + Breadcrumb |
| hreflang | `id` + `x-default` |

## Checklist go-live SEO

- [ ] `APP_URL=https://domain-produksi` (tanpa slash akhir)
- [ ] Verifikasi GSC sukses
- [ ] Sitemap submitted
- [ ] Lat/lng + alamat terisi
- [ ] 3–5 artikel publish dengan excerpt + cover
- [ ] Cek [Rich Results Test](https://search.google.com/test/rich-results) pada 1 artikel

## Catatan

Tidak perlu plugin WordPress. Tidak perlu SSR penuh untuk GSC—meta verifikasi sudah di HTML server.  
SSR penuh hanya opsional untuk social preview edge-case.
