# Media storage — Cloudflare R2

**Language:** English  

All CMS uploads (banners, covers, logos, media library, documents) use **S3-compatible object storage**. Production default: **Cloudflare R2**.

## Application `.env`

```env
FILESYSTEM_DISK=r2

R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket
R2_FOLDER_PATH=scholargate
R2_PUBLIC_URL=https://your-cdn.example
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_REGION=auto
R2_USE_PATH_STYLE_ENDPOINT=true
```

## Optional Vite build env

```env
VITE_R2_PUBLIC_URL=https://your-cdn.example
VITE_R2_FOLDER_PATH=scholargate
```

## Object key layout

```
{R2_FOLDER_PATH}/uploads/YYYY/MM/{slug}-{rand}.webp
```

Public URL: `{R2_PUBLIC_URL}/{R2_FOLDER_PATH}/uploads/...`

Brand assets (from logo upload):

```
{R2_FOLDER_PATH}/uploads/brand/{timestamp}/logo.webp
{R2_FOLDER_PATH}/uploads/brand/{timestamp}/favicon-32.png
…
```

## Related code

| File | Role |
|------|------|
| `config/filesystems.php` | Disks `r2` / `s3` |
| `app/Support/MediaStorage.php` | Default disk, URL, delete, folder prefix |
| `app/Services/ImageOptimizer.php` | Raster → WebP → R2 |
| `app/Services/BrandLogoService.php` | Logo → favicon / apple / OG variants |
| `app/Models/Media.php` | Media library + `url` |

## Upload paths

| File type | Flow | API |
|-----------|------|-----|
| **Raster images** | Server optimize (local temp) → R2 | `POST /api/v1/admin/media-library` multipart |
| **Non-raster** (PDF, etc.) | Presign PUT → client → R2 → confirm | `presign` + `PUT` + `confirm` |
| **Site logo** | Brand pipeline (logo + favicons) | `POST /api/v1/admin/settings/logo` |

```
[Raster]
  Browser ──multipart──▶ Laravel ──tmp──▶ ImageOptimizer ──▶ R2

[Non-raster]
  Browser ──presign──▶ Laravel
  Browser ──PUT──▶ R2
  Browser ──confirm──▶ Laravel (media library row)
```

## Notes

- Production: R2 must be configured (exception if missing).
- Local dev: if `R2_*` empty, fall back to `public` disk.
- Folder prefix isolates this app’s objects from other projects on the same bucket.
