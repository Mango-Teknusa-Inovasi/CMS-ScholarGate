# Deploy — apa yang di-upload

## Ringkas

| Path | Perlu di server? | Keterangan |
|------|------------------|------------|
| `backend/` | **Ya** | Aplikasi production |
| `backend/public/` | Document root | Point domain ke sini |
| `backend/public/spa/` | **Ya** | Hasil `npm run build` |
| `frontend/` | **Tidak** | Hanya untuk build di laptop/CI |
| `docs/`, `scripts/` | Opsional | Ops / backup |
| `node_modules/`, `vendor/` | Jangan commit | Install di server: `composer install --no-dev` |

## Alur recommended

```bash
# 1. Build SPA (laptop atau CI)
cd frontend
cp .env.example .env   # set VITE_R2_*
npm ci
npm run build          # → backend/public/spa/

# 2. Siapkan backend
cd ../backend
composer install --no-dev --optimize-autoloader
# pastikan .env production (lihat docs/GO-LIVE.md)

# 3. Upload folder backend/ ke hosting
# Document root = public/

# 4. Di server
php artisan migrate --force
php artisan config:cache
php artisan route:cache
# install pertama: /install atau php artisan scholargate:install
```

## Shared hosting (satu document root)

```
public_html/          ← isi = isi backend/public/
  index.php
  spa/                ← build React
  .htaccess
  ...
  ../                 ← sisa Laravel di luar webroot jika memungkinkan
```

Ideal: upload seluruh `backend/`, set document root ke `backend/public`.  
Jika host hanya `public_html`, ikuti pola Laravel shared hosting (public di webroot, app di atasnya).

## Jangan di-upload

- `frontend/node_modules`, `backend/vendor` (boleh di-generate di server)
- `frontend/src` (kecuali Anda build di server)
- `.env` lokal / credential dev
- `backups/`, `screenshot-*.png`, `storage/logs/*`
- folder AI tooling (`.agents`, `.grok`)

## Checklist lengkap

Lihat [GO-LIVE.md](./GO-LIVE.md) · storage R2: [STORAGE-R2.md](./STORAGE-R2.md) · install: [../INSTALL.md](../INSTALL.md)
