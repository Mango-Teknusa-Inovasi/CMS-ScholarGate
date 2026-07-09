# Penyimpanan media — Cloudflare R2 (wajib)

Semua unggahan CMS (banner, cover artikel, logo, media library, dokumen) **wajib** lewat object storage **S3-compatible**, production default **Cloudflare R2**.

Pola env mengikuti proyek **twibbon-moklet**.

## Env backend (`backend/.env`)

```env
FILESYSTEM_DISK=r2

R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=static-cdn-r2
R2_FOLDER_PATH=scholargate
R2_PUBLIC_URL=https://static-r2-apac.ppti.me
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_REGION=auto
R2_USE_PATH_STYLE_ENDPOINT=true
```

## Env frontend (build)

```env
VITE_R2_PUBLIC_URL=https://static-r2-apac.ppti.me
VITE_R2_FOLDER_PATH=scholargate
```

## Path di bucket

```
{R2_FOLDER_PATH}/uploads/YYYY/MM/{slug}-{rand}.webp
```

Contoh: `scholargate/uploads/2026/07/banner-abc123.webp`  
URL publik: `{R2_PUBLIC_URL}/scholargate/uploads/2026/07/banner-abc123.webp`

## Kode terkait

| File | Peran |
|------|--------|
| `config/filesystems.php` | Disk `r2` + `s3` |
| `app/Support/MediaStorage.php` | Disk default, URL, delete, folder prefix |
| `app/Services/ImageOptimizer.php` | Upload WebP ke disk R2 |
| `app/Models/Media.php` | `url` dari R2 public |

## Dua alur upload

| Jenis file | Alur | API |
|------------|------|-----|
| **Gambar raster** (JPG/PNG/GIF/WebP) | Kompres di server (tmp lokal) → upload R2 | `POST /admin/media-library` multipart |
| **Tanpa kompres** (PDF/DOC/SVG, dll.) | Presign PUT → client ke R2 → confirm | `POST …/presign` + `PUT R2` + `POST …/confirm` |

```
[Gambar perlu kompres]
  Browser ──multipart──▶ Laravel ──tmp lokal──▶ ImageOptimizer ──▶ R2

[File tanpa kompres]
  Browser ──presign──▶ Laravel (token)
  Browser ──PUT──▶ R2 (langsung)
  Browser ──confirm──▶ Laravel (catat media library)
```

## Catatan

- Production: R2 **wajib** terisi (kalau tidak, exception).
- Dev: jika `R2_*` belum diisi, fallback disk `public` lokal; presign jadi server upload.
- Folder `scholargate` memisahkan file dari twibbon-moklet (`twbsmansage`).
