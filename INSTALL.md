# Instalasi & Deploy Scholargate CMS

## Jawaban singkat: shared hosting?

**Bisa**, asalkan hosting mendukung **PHP 8.2+** dan database **PostgreSQL** (disarankan) atau **MySQL/MariaDB**.

| Komponen | Production / shared hosting | Development lokal |
|----------|----------------------------|-------------------|
| Backend Laravel | ✅ Jalan di PHP (document root = `backend/public`) | `php artisan serve` |
| Frontend React | ✅ **Sudah di-build** ke `backend/public/spa` — **tidak perlu Node di server** | `npm run dev` (Vite) |
| Database | PostgreSQL (default) atau MySQL/MariaDB | sama |

Anda **tidak** menjalankan dua proses terpisah di production.  
Alur production:

1. Build SPA di komputer lokal / CI: `npm run build` → hasil ke `backend/public/spa`
2. Upload folder `backend/` (termasuk `public/spa`) ke hosting
3. Point domain ke `public/`
4. Buka `/install` atau jalankan `php artisan scholargate:install`

---

## Persyaratan

- PHP **8.2+** dengan ekstensi: `pdo`, `mbstring`, `openssl`, `tokenizer`, `json`, `ctype`, `fileinfo`, `curl`
- Untuk PostgreSQL: `pdo_pgsql`
- Untuk MySQL/MariaDB: `pdo_mysql`
- Composer
- Node.js 20+ **hanya untuk build frontend** (bukan runtime production)
- Database kosong: PostgreSQL **atau** MySQL/MariaDB
- **Object storage wajib (production): Cloudflare R2** (S3-compatible) — lihat env di bawah

### Cloudflare R2 (wajib production)

Pola env sama proyek **twibbon-moklet**:

```env
FILESYSTEM_DISK=r2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
R2_FOLDER_PATH=scholargate
R2_PUBLIC_URL=https://your-public-cdn-url.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_REGION=auto
R2_USE_PATH_STYLE_ENDPOINT=true
```

Frontend (saat `npm run build`) agar URL media benar:

```env
VITE_R2_PUBLIC_URL=https://your-public-cdn-url.com
VITE_R2_FOLDER_PATH=scholargate
```

Semua upload CMS (banner, cover, media library, logo) disimpan ke R2 di folder `R2_FOLDER_PATH`.

---

## Instalasi pertama (pilih DB)

### Opsi A — Web installer (paling mudah di shared hosting)

1. Pastikan SPA sudah di-build dan di-upload (`public/spa`).
2. Buat database di panel hosting.
3. Buka: `https://domain-anda/install`
4. Pilih:
   - **PostgreSQL (default)**, atau
   - **MySQL / MariaDB**
5. Isi host, port, nama DB, user, password, URL situs, akun admin.
6. Centang seed demo jika ingin data contoh.
7. Klik **Install sekarang**.

Installer menulis `.env`, migrate, seed, membuat admin, dan mengunci instalasi (`storage/app/installed`).

### Opsi B — CLI (VPS / lokal)

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env   # jika belum ada

# Interaktif — default PostgreSQL
php artisan scholargate:install

# Atau non-interaktif MySQL/MariaDB:
php artisan scholargate:install \
  --driver=mysql \
  --host=127.0.0.1 \
  --port=3306 \
  --database=scholargate \
  --username=root \
  --password=secret \
  --url=https://sekolahmu.sch.id \
  --admin-email=admin@sekolahmu.sch.id \
  --admin-password='GantiPasswordKuat'

# PostgreSQL non-interaktif:
php artisan scholargate:install \
  --driver=pgsql \
  --host=127.0.0.1 \
  --port=5432 \
  --database=scholargate \
  --username=postgres \
  --password=secret \
  --url=https://sekolahmu.sch.id
```

---

## Build frontend (wajib sebelum production)

Dari root project atau folder `frontend`:

```bash
cd frontend
npm install
npm run build
# → output: backend/public/spa/
```

Atau dari root:

```bash
npm run build
```

Setelah build, **satu** document root sudah cukup: `backend/public`.

---

## Deploy shared hosting (contoh)

1. Di lokal: `composer install` + `npm run build` (+ install/migrate jika perlu).
2. Upload isi `backend/` ke hosting (bisa via Git + composer di server, atau zip).
3. Set document root domain ke folder **`public`**.
4. Pastikan `storage/` dan `bootstrap/cache/` **writable** (chmod 775).
5. Buka `/install` jika belum terpasang.
6. (Opsional) `php artisan storage:link` via SSH / cron one-shot.

### Struktur di hosting

```
public_html/          ← document root = backend/public
  index.php
  .htaccess
  spa/                ← hasil npm run build
  storage -> ...
  ...
(app code di luar public, sesuaikan path hosting)
```

Jika shared hosting memaksa semua file di `public_html`, gunakan layout Laravel standar:  
`app/`, `bootstrap/`, `config/`, … di luar web root; hanya `public/*` yang di-expose.

---

## Development (dua proses — hanya lokal)

```bash
# Terminal 1 — API
cd backend && php artisan serve

# Terminal 2 — Vite HMR
cd frontend && npm run dev
```

Buka http://localhost:5173 (proxy ke API :8000).

---

## Keamanan installer

- Setelah sukses, file lock: `storage/app/installed`
- Route `/install` redirect jika sudah terpasang
- Jangan biarkan `APP_DEBUG=true` di production
- Ganti password admin default segera

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Halaman putih / 503 SPA | Jalankan `npm run build`, pastikan `public/spa/index.html` ada |
| Installer gagal koneksi DB | Cek host/port/user/password; pastikan DB sudah dibuat |
| Ekstensi pgsql/mysql hilang | Aktifkan di panel hosting / `php.ini` |
| 500 setelah install | Cek `storage/logs/laravel.log`; pastikan `APP_KEY` terisi |
| Upload file gagal | `storage/app/public` writable + `storage:link` |
