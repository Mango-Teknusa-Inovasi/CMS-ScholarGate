# Checklist CMS ala WordPress — Scholargate

## Sudah ada (core)

| Fitur WP | Status | Di Scholargate |
|----------|--------|----------------|
| Posts + rich editor | ✅ | Artikel + TipTap |
| Full page add/edit (bukan modal) | ✅ | `/admin/articles/new` |
| Draft / Publish / Archive | ✅ | Status artikel |
| Featured image | ✅ | Cover + upload |
| Categories | ✅ | Kategori |
| Tags | ✅ | Tag (koma / chip) |
| SEO title & description | ✅ | Meta di editor |
| Schedule publish | ✅ | Jadwal terbit (`published_at`) |
| Trash + restore | ✅ | Tab Sampah |
| Bulk delete | ✅ | Checkbox multi |
| Media Library | ✅ | `/admin/media` |
| Menus | ✅ | Menu header/footer |
| Site identity (nama, logo) | ✅ | Pengaturan + logo |
| Users & roles | ✅ | Admin / Editor |
| Settings | ✅ | Branding, logo, GEO, verifikasi |
| Dashboard | ✅ | Stats + aksi cepat |
| Custom content (sekolah) | ✅ | Prestasi, ekstrakurikuler, galeri, dll. |
| SEO / AEO / GEO | ✅ | Meta, schema, sitemap, robots, llms.txt, FAQ |
| Image optimize on upload | ✅ | WebP + resize + compress + strip EXIF |

## Sengaja tidak (belum perlu portal sekolah)

| Fitur WP | Alasan |
|----------|--------|
| Comments | Bisa spam; portal institusi jarang butuh |
| Plugins marketplace | Stack fixed Laravel+React |
| Themes store | Desain fixed referensi |
| Gutenberg blocks | TipTap + template section sudah cukup |
| Multisite | Satu sekolah / satu portal |
| REST app passwords | Sanctum token admin cukup |

## Opsional fase berikutnya

- Revisi artikel (revision history)
- Preview draf di tab publik (token)
- Bulk edit status
- Komentar internal antar editor
- SEO Open Graph image per pos
- Notifikasi email saat publish

## Mapping menu admin

```
Dashboard
Artikel (+ new/edit page, sampah)
Kategori
Media  ← baru
Tampilan: menu, banner, sambutan, profil, layanan, galeri, mitra
Konten sekolah: prestasi, ekstrakurikuler, kontak, layanan cepat, download
Sistem: pengguna ← baru, ukuran gambar, pengaturan (logo)
```
