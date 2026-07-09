# Plan: CMS Scholargate (Portal Publik + Admin SPA)

## Ringkasan

Membangun **CMS Scholargate**: portal publik mirip struktur referensi (homepage, profil, artikel list/detail) + **admin panel SPA** untuk kelola konten. Branding **Scholargate**; color palette, tipografi, radius, dan susunan layout mengikuti referensi (bukan clone brand Aksibisa).

Stack: **Laravel terbaru (API)** + **React SPA** (Vite, React Router, Tailwind) — ringan, penuh SPA, auth via Sanctum cookie.

---

## 1. Referensi yang Dipakai

| Sumber | Peran |
|--------|--------|
| `screenshot-01` | Homepage: hero, sambutan, layanan, artikel, prestasi, galeri, mitra, footer |
| `screenshot-02` | Profil: breadcrumb, sambutan, kontak, tab konten, layanan cepat |
| `screenshot-03` | List artikel: filter/search, unggulan, sidebar, pagination |
| `screenshot-04` | Detail artikel: body, share, related, sidebar |
| Spec MD | Geometry, warna, font Onest, radius 12–16px |

**Catatan legal/desain:** struktur & design system ditiru; logo, copy, foto, dan nama sumber diganti Scholargate / konten original.

---

## 2. Design System (sesuai referensi)

### Color palette

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `--bg-page` | `#F9FAFB` | Background halaman |
| `--bg-surface` | `#FFFFFF` | Card, header, panel |
| `--bg-muted` | `#F3F4F6` | Chip, input soft |
| `--bg-warm` | `#F4E8D9` / `#F5F0E8` | Card sambutan (beige) |
| `--text-primary` | `#111827` | Judul |
| `--text-body` | `#374151` | Body |
| `--text-muted` | `#6B7280` | Meta, caption |
| `--primary` | `#0EA5E9` → `#0284C7` | CTA, nav active, link |
| `--primary-soft` | `#ECFEFF` / `#E0F2FE` | Chip active, badge soft |
| `--accent-cyan` | `#0891B2` | Nav highlight |
| `--success` | `#047857` / green-soft | Badge kategori hijau |
| `--danger-soft` | pink/rose soft | Badge status (opsional) |
| `--border` | `#E5E7EB` | Border card/input |
| `--footer-bg` | `#F3F4F6` | Footer |

Icon layanan: **warna berbeda per item** (cyan, green, orange, purple, blue, teal) pada lingkaran soft — seperti referensi.

### Typography

- Font: **Onest** (Google Fonts) — heading + body
- H1 page: ~36px / 700
- Section title: ~20–24px / 700
- Body: 16px / 400, line-height 24–28px
- Meta/caption: 12–14px, `#6B7280`

### Shape & elevation

- Radius card: **16px**
- Radius button/chip: **12px**
- Border tipis `#E5E7EB`
- Shadow: sangat subtle (hampir flat; elevation ringan di card hover)
- Container max-width: ~1280–1320px, padding horizontal ~24–56px

### Layout patterns (wajib diikuti)

1. **Sticky header** putih: logo kiri · nav tengah · `Lapor` outline + `Login` filled kanan  
2. **Hero full-bleed** carousel, rounded besar, dots navigasi  
3. **Section spacing** ~48–64px vertikal  
4. **Content + sidebar** (~70/30) di list & detail artikel  
5. **Footer** 4 kolom + copyright bar  
6. **Kartu putih** di atas bg gray-50, icon dalam soft circle  

---

## 3. Tech Stack

### Backend

| Layer | Pilihan |
|-------|---------|
| Framework | **Laravel 13** (terbaru) |
| Auth API | **Laravel Sanctum** (SPA cookie + CSRF) |
| DB | MySQL / MariaDB (dev: SQLite OK) |
| Media | Laravel Storage + Spatie Media Library (opsional; MVP: storage lokal) |
| API style | REST JSON `/api/v1/...` |
| Role | Spatie Permission **atau** enum `role` sederhana di `users` (MVP: admin + editor) |

### Frontend

| Layer | Pilihan |
|-------|---------|
| Build | **Vite** + **React 19** + **TypeScript** |
| Routing | React Router v7 |
| Styling | **Tailwind CSS v4** + token design system |
| Data | TanStack Query |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Editor admin | TipTap / React-Quill (artikel rich text) |
| Structure | Monorepo: `backend/` + `frontend/` **atau** Laravel serve API + `frontend` terpisah di root |

**Rekomendasi struktur repo:**

```
cms-scholargate/
├── backend/          # Laravel API
├── frontend/         # React SPA (public + admin routes)
├── docs/
└── README.md
```

Public site & admin **satu SPA** dengan route prefix:

- Publik: `/`, `/profil`, `/artikel`, `/artikel/:slug`, `/prestasi`, `/aplikasi`, `/download`
- Admin: `/admin/*` (guarded)

---

## 4. Arsitektur

```
[Browser SPA React]
        │  JSON + cookie session
        ▼
[Laravel API + Sanctum]
        │
   ┌────┴────┐
   ▼         ▼
[MySQL]  [Storage media]
```

- CORS + `SANCTUM_STATEFUL_DOMAINS` untuk localhost (Vite :5173 + API :8000)
- Public endpoints: read-only, no auth
- Admin endpoints: `auth:sanctum` + role check
- SEO: SPA murni dulu; opsional SSR/prerender belakangan (bukan blocker MVP)

---

## 5. Domain Model (MVP sesuai screenshot)

### Entities

| Model | Fungsi (mapping UI) |
|-------|---------------------|
| `User` | Admin/editor login |
| `Setting` | Nama portal, tagline, kontak, logo, sosial, footer text |
| `Banner` | Hero carousel (image, title, subtitle, CTA, order, active) |
| `WelcomeBlock` | Foto + judul + body sambutan homepage/profil |
| `ServiceItem` | 6 ikon layanan homepage (title, desc, icon/color, link, order) |
| `Category` | Kategori artikel (slug, name, color badge) |
| `Article` | Judul, slug, excerpt, body HTML, cover, published_at, is_featured, views, category_id, author |
| `Achievement` | Prestasi (title, excerpt, cover, date, is_featured) |
| `GalleryItem` | Karya digital (image, caption, order) |
| `Partner` | Logo mitra (image, name, url, order) |
| `Page` / `PageSection` | Konten profil (tabs: tugas pokok, struktur, program) — flexible JSON atau blocks |
| `ContactInfo` | Alamat, email, telepon, fax, maps URL |
| `QuickService` | Kartu layanan cepat (icon, title, desc, link) |
| `AppLink` | Menu Aplikasi dropdown + halaman aplikasi |
| `Download` | File download (title, file path, category, downloads count) |
| `MenuItem` | Nav dinamis (opsional MVP; bisa hardcode dulu + Setting) |
| `ReportLink` | URL tombol "Lapor" |

### Relasi utama

```
Category 1──* Article
Article   *──* Tag (opsional fase 2)
User 1──* Article (author)
```

### Status konten

- `draft` | `published` | `archived`
- Soft deletes untuk artikel/media penting

---

## 6. Halaman Publik (susunan = referensi)

### 6.1 Homepage `/`

Urutan section (top → bottom):

1. **Header** sticky  
2. **Hero carousel** (`Banner`)  
3. **Sambutan** — foto kiri + card beige kanan + bubble chat opsional  
4. **Grid layanan** — 6 card icon berwarna (`ServiceItem`)  
5. **Artikel** — header section + "Lihat Semua"; featured besar kiri + 4 card kanan  
6. **Prestasi** — featured + 3 card  
7. **Karya Digital** — grid 3×3 / 4×2 thumbnail  
8. **Mitra** — logo strip horizontal  
9. **Footer**

### 6.2 Profil `/profil` (+ sub-route opsional)

1. Breadcrumb + page title + subtitle  
2. Card sambutan (foto + teks)  
3. Baris kontak (alamat, email, telp, fax, lokasi/maps)  
4. Tab: Tugas Pokok & Fungsi | Struktur | Program Unggulan  
5. Layanan Cepat (6 card)  
6. Footer  

### 6.3 Artikel `/artikel`

1. Header halaman  
2. Toolbar: search, filter kategori, sort  
3. Featured article strip  
4. Layout 2 kolom: list + sidebar  
   - Sidebar: ringkasan (total artikel/kategori), daftar kategori, top populer, CTA layanan  
5. Pagination  

### 6.4 Detail `/artikel/:slug`

1. Breadcrumb  
2. Judul, meta (kategori badge, tanggal, views), share buttons  
3. Cover image  
4. Body rich text + gambar inline  
5. Related articles  
6. Sidebar (kategori, populer, CTA)  

### 6.5 Lainnya (MVP light)

- `/prestasi`, `/prestasi/:slug`  
- `/aplikasi`  
- `/download`  
- `/login` → redirect admin login  
- Tombol **Lapor** → external URL dari Setting  

---

## 7. Admin CMS (`/admin`)

### Layout admin

- Sidebar kiri (primary soft) + topbar  
- Desain **selaras palette** referensi (bukan Material gelap) agar satu family visual  
- Dashboard: count artikel, draft, views, banner aktif  

### Modul admin MVP

| Modul | Fitur |
|-------|--------|
| Auth | Login, logout, ganti password |
| Dashboard | Stats + aktivitas terbaru |
| Banner | CRUD + reorder + toggle |
| Sambutan | Edit single/dual block |
| Layanan | CRUD ServiceItem + QuickService |
| Kategori | CRUD |
| Artikel | CRUD, rich editor, cover upload, featured, publish |
| Prestasi | CRUD + featured |
| Galeri | Upload multi + reorder |
| Mitra | CRUD logo |
| Halaman Profil | Edit tab content + kontak |
| Download | Upload file + meta |
| Aplikasi | CRUD links |
| Pengaturan | Branding Scholargate, sosial, Lapor URL, footer |

Media: upload ke `storage/app/public`, serve via `/storage`.

---

## 8. API Outline (ringkas)

### Public

```
GET  /api/v1/home                 # aggregate homepage payload
GET  /api/v1/articles             # ?q=&category=&sort=&page=
GET  /api/v1/articles/{slug}
GET  /api/v1/categories
GET  /api/v1/achievements
GET  /api/v1/gallery
GET  /api/v1/partners
GET  /api/v1/profile
GET  /api/v1/downloads
GET  /api/v1/apps
GET  /api/v1/settings/public
```

### Admin (auth)

```
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
CRUD /api/v1/admin/{resource}
POST /api/v1/admin/media
```

Homepage **aggregate endpoint** mengurangi waterfall request (ringan & cepat).

---

## 9. Keputusan Arsitektur & Trade-off

| Opsi | Pro | Kontra | Keputusan |
|------|-----|--------|-----------|
| React SPA + Sanctum API | SPA penuh, ringan, decoupled | SEO perlu effort ekstra | **Dipilih** (sesuai request) |
| Inertia React | SEO & routing Laravel sederhana | Bukan SPA murni | Ditolak untuk MVP ini |
| Next.js + Laravel | SSR bagus | Lebih berat, 2 runtime rumit | Fase 2 jika SEO kritis |
| Spatie Media vs raw Storage | Fitur lengkap | Dependency | **Storage dulu**, Spatie jika perlu |
| Menu DB vs hardcode | Fleksibel | Over-engineer | **Hardcode nav** + Setting links di MVP |

---

## 10. Fase Implementasi

### Fase 0 — Bootstrap (1 unit kerja)

- Scaffold Laravel di `backend/`
- Scaffold Vite React TS di `frontend/`
- Tailwind + Onest + design tokens
- Sanctum SPA config, CORS, env sample
- README runbook (`composer`, `npm`, migrate, seed)

### Fase 1 — Design system + shell UI

- Komponen: `Header`, `Footer`, `Button`, `Card`, `Badge`, `Breadcrumb`, `SectionHeader`, `Pagination`, `SidebarWidgets`
- Layout publik + layout admin
- Dummy static homepage matching section order referensi

### Fase 2 — Backend domain + seed

- Migrations + models + factories
- Seed data Scholargate (bukan copy teks sumber)
- Public API + HomeController aggregate
- Auth admin + seeder user

### Fase 3 — Portal publik live data

- Wire homepage, profil, artikel list/detail
- Prestasi, galeri, download, aplikasi
- Loading/empty/error states

### Fase 4 — Admin CRUD

- Login + dashboard
- Artikel + kategori + media upload
- Banner, sambutan, layanan, galeri, mitra, settings
- Prestasi, download, apps, profile content

### Fase 5 — Polish

- Responsive (mobile collapse nav, stack sidebar)
- Image optimization (sizes, lazy)
- Validasi & policy
- Seed demo production-like
- Checklist QA visual vs screenshot

---

## 11. PR / Unit Kerja (DAG)

```text
PR1 Bootstrap monorepo Laravel + React + Sanctum + tokens
  └─► PR2 UI shell publik (Header/Footer/Home static layout)
        └─► PR3 Migrations + models + seed + public API
              ├─► PR4 Wire homepage + profil ke API
              ├─► PR5 Artikel list/detail + sidebar
              └─► PR6 Admin auth + layout + dashboard
                    └─► PR7 Admin CRUD konten (artikel, banner, media, settings)
                          └─► PR8 Modul sisa admin + polish responsive
```

---

## 12. Mapping Konten Homepage (Scholargate)

Salin **struktur**, ganti **isi** contoh:

| Blok referensi | Scholargate |
|----------------|-------------|
| Logo aksibisa | Logo wordmark **Scholargate** (primary blue) |
| "Portal Bidang SMK ..." | "Portal Scholargate" / tagline pendidikan yang disepakati |
| 6 layanan (e-KSP, dll.) | Layanan Scholargate (konfigurabel di admin) |
| Artikel/prestasi Jatim | Artikel & prestasi seed fiktif/original |
| Karya Digital | Galeri placeholder |
| Mitra logo | Placeholder / logo generik |

Copy seed akan original; admin bisa ganti semua.

---

## 13. Out of Scope MVP (fase berikutnya)

- Multi-tenant / multi-sekolah  
- Chatbot "Tanya Aksi" real (UI bubble boleh static/link)  
- Full SSR/SEO meta social image pipeline  
- Mobile app  
- Workflow approval multi-level  
- i18n multi-bahasa  

---

## 14. Kriteria Selesai (Definition of Done)

- [ ] Homepage visual mendekati referensi (urutan section, warna, radius, spacing)  
- [ ] Profil, list artikel, detail artikel berfungsi + sidebar  
- [ ] Admin login & CRUD minimal: artikel, banner, settings, media  
- [ ] Branding Scholargate konsisten  
- [ ] `composer install` + `npm i` + migrate/seed → jalan di local  
- [ ] SPA navigation tanpa full reload  

---

## 15. Langkah Eksekusi Setelah Approval

1. PR1: bootstrap project  
2. PR2: design system + homepage shell  
3. PR3–5: API + halaman publik  
4. PR6–8: admin + polish  

**Tidak ada kode yang diubah sampai plan disetujui.**
