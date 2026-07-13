# Go-live checklist — prioritas tinggi

Struktur folder & apa yang di-upload: [DEPLOY.md](./DEPLOY.md) · Keamanan: [SECURITY.md](./SECURITY.md)

## 1. Environment production

Di `backend/.env` server:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-anda.sch.id

FILESYSTEM_DISK=r2
R2_ENDPOINT=...
R2_BUCKET_NAME=...
R2_FOLDER_PATH=scholargate
R2_PUBLIC_URL=https://static-r2-apac.ppti.me
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

SANCTUM_STATEFUL_DOMAINS=domain-anda.sch.id,www.domain-anda.sch.id

SEED_ADMIN_PASSWORD=GantiPasswordAdminKuat!
SEED_MEMBER_PASSWORD=GantiPasswordMemberKuat!
```

Frontend build:

```env
VITE_R2_PUBLIC_URL=https://static-r2-apac.ppti.me
VITE_R2_FOLDER_PATH=scholargate
```

## 2. Build SPA

```bash
cd frontend
# pastikan .env berisi VITE_R2_*
npm ci
npm run build
# hasil → backend/public/spa
```

## 3. Deploy backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan storage:link   # opsional (legacy lokal)
```

Document root = `backend/public`.

## 3b. Kunci installer

Pastikan setelah setup:

```env
ALLOW_INSTALL=false
APP_DEBUG=false
APP_ENV=production
```

Cek: `https://domain-anda/install` → harus **403** (Installer terkunci).  
Jangan biarkan `ALLOW_INSTALL=true` di production.

## 4. Password

Default seed (dev):

| Role | Email | Password |
|------|-------|----------|
| Admin CMS | admin@scholargate.test | `Scholargate!Admin2026` |
| Member | member@scholargate.test | `Scholargate!Member2026` |

**Production:** ganti lewat env seed + re-seed user, atau ubah di admin Users.

## 5. Backup DB

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
# output: backups/scholargate_*.sql.gz
```

Jadwalkan cron harian di server.

## 6. Keamanan yang sudah diaktifkan

- Middleware `admin` pada semua `/api/v1/admin/*` (token member → 403)
- Rate limit login: 10/menit
- Trust proxies (HTTPS di belakang Cloudflare/nginx)
- R2 object storage (bukan disk publik shared hosting)

## 7. Smoke test

1. `/login` member → navbar Gravatar + logout  
2. `/daftar` registrasi member baru  
3. `/admin/login` admin → dashboard  
4. Member token tidak bisa akses `/api/v1/admin/dashboard`  
5. Upload gambar (kompres → R2 CDN URL)  
6. Upload PDF (presign → R2)  
7. `/sitemap.xml`, `/robots.txt`, `/llms.txt`  
8. View-source beranda/artikel: meta OG + JSON-LD sudah di HTML server (bot)

## 8. Fitur lanjutan

| Fitur | Status |
|-------|--------|
| Preview draft (token 14 hari) | ✅ Editor → **Pratinjau** → `/preview/artikel/{token}` |
| CI GitHub Actions | ✅ `.github/workflows/ci.yml` |
| Revisi konten (history) | Belum |
| Migrasi `/storage` → R2 | Manual / script belakangan |

### Pratinjau draf
1. Simpan artikel (boleh status draft)
2. Klik **Pratinjau** di editor
3. Tab baru: `/preview/artikel/{token}` (noindex, 14 hari)
