# Installation & setup

**Language:** English  
**Product:** CMS Scholargate (Laravel + Inertia monolith)

---

## Shared hosting — do I need two processes?

**No.** Production is a single PHP application:

| Component | Production | Local development |
|-----------|------------|-------------------|
| Laravel + Inertia | PHP, document root = `public/` | `php artisan serve` |
| React UI | Built assets in `public/build/` — **no Node on the server** | `npm run dev` (Vite HMR) |
| Database | PostgreSQL (recommended) / MySQL / MariaDB | same |

Production flow:

1. Build assets on your laptop/CI: `npm run build` → `public/build`
2. Upload the project (or deploy image)
3. Point the domain document root to **`public/`**
4. Open `/install` or run `php artisan scholargate:install`

---

## Requirements

- PHP **8.2+** with: `pdo`, `mbstring`, `openssl`, `tokenizer`, `json`, `ctype`, `fileinfo`, `curl`, `gd`
- PostgreSQL: `pdo_pgsql` — or MySQL/MariaDB: `pdo_mysql`
- Composer 2.x
- Node.js 20+ **only for building assets** (not a production runtime)
- Empty database
- Production media: **Cloudflare R2** (S3-compatible) — see [docs/STORAGE-R2.md](./docs/STORAGE-R2.md)

### Cloudflare R2 (production)

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

Optional at build time:

```env
VITE_R2_PUBLIC_URL=https://your-public-cdn-url.com
VITE_R2_FOLDER_PATH=scholargate
```

---

## First-time install

### Option A — Web installer

1. Ensure Vite assets are built and deployed (`public/build`).
2. Create a database in your host panel.
3. In `.env` set **`ALLOW_INSTALL=true`**.
4. Open `https://your-domain/install`.
5. Choose **PostgreSQL** (default) or **MySQL / MariaDB**.
6. Enter DB credentials, site URL, and admin account.
7. Optionally seed demo content.
8. Click **Install**.

On success the installer locks:

- `storage/app/installed`
- `ALLOW_INSTALL=false` written to `.env`

`/install` then returns **403**. Even if the lock file is removed, install stays blocked when the database already looks installed (unless you deliberately set `ALLOW_INSTALL=true` again).

### Option B — CLI

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env   # if needed

# Interactive (default PostgreSQL)
php artisan scholargate:install

# Non-interactive MySQL example
php artisan scholargate:install \
  --driver=mysql \
  --host=127.0.0.1 \
  --port=3306 \
  --database=scholargate \
  --username=root \
  --password=secret \
  --url=https://school.example \
  --admin-email=admin@school.example \
  --admin-password='StrongPasswordHere'
```

Forced re-install (destructive): `php artisan scholargate:install --force`

### Option C — Docker

```bash
cp .env.example .env
# set APP_URL, DB_*, R2_* as needed
./deploy.sh install
# → http://localhost:8080
```

---

## Build assets (required before production upload)

```bash
npm ci --legacy-peer-deps
npm run build
# → public/build/
```

Or from CI: see `.github/workflows/ci.yml`.

---

## Shared hosting layout

```
public_html/          ← document root = project public/
  index.php
  .htaccess
  build/              ← Vite output
  storage → …
```

Keep `app/`, `vendor/`, `resources/`, `.env`, etc. **outside** the public web root (standard Laravel layout).

Ensure `storage/` and `bootstrap/cache/` are writable.

---

## Local development

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

php artisan serve          # terminal 1
npm install --legacy-peer-deps && npm run dev   # terminal 2
```

Open http://127.0.0.1:8000

---

## After file updates

Use **`/update`** (admin password) or:

```bash
php artisan scholargate:update
```

Never run `migrate:fresh` on a live site unless you intend to wipe data.

---

## Installer security

- Lock file after success
- `ALLOW_INSTALL` must be `false` in production
- Rate limited (GET/POST)
- CLI re-install requires explicit `--force`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page / missing assets | `npm run build`; confirm `public/build/manifest.json` |
| Installer cannot connect to DB | Host, port, credentials; DB must exist |
| Missing pdo_pgsql / pdo_mysql | Enable extension in hosting panel |
| 500 after install | Check `storage/logs/laravel.log`; ensure `APP_KEY` is set |
| Upload failures | Writable storage; R2 credentials in production |
| 419 CSRF | Same-origin cookies; call `/sanctum/csrf-cookie` before auth |

More: [docs/GO-LIVE.md](./docs/GO-LIVE.md) · [docs/SECURITY.md](./docs/SECURITY.md)
