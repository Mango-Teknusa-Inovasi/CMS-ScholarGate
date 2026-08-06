# Deploy

**Language:** English

## What to upload

| Path | On server? | Notes |
|------|------------|--------|
| Application root (Laravel) | **Yes** | `app/`, `bootstrap/`, `config/`, `routes/`, `resources/`, etc. |
| `public/` | **Document root** | Point the domain here |
| `public/build/` | **Yes** | Output of `npm run build` |
| `vendor/` | Install on server | `composer install --no-dev` |
| `node_modules/` | **No** | Build-time only |
| `docs/`, `scripts/` | Optional | Ops helpers |

## Recommended flow

```bash
composer install --no-dev --optimize-autoloader
npm ci --legacy-peer-deps
npm run build

# Point web server document root to public/
# On server:
php artisan migrate --force
# or open /update (admin) / php artisan scholargate:update

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link   # if using local public disk
```

## Shared hosting

```
public_html/     ← contents of public/
  index.php
  build/
  .htaccess
```

Parent directory holds `app/`, `vendor/`, `.env`, etc.

**Node.js is not required on the server.**

## Docker

```bash
cp .env.example .env
./deploy.sh install
# App: http://localhost:8080
```

Single **app** service (Laravel + built assets) + **db** (PostgreSQL).

## Auth & session (production)

- `APP_URL` = public HTTPS origin (cookies, sitemap, canonical)
- `SANCTUM_STATEFUL_DOMAINS` includes the public host
- Browser UI uses session + CSRF; API mutations use credentials + `X-XSRF-TOKEN`

## Database

PostgreSQL recommended; MySQL and MariaDB supported. See [DATABASE.md](./DATABASE.md).

Portable JSON backup/restore via Admin → Backup (cross-engine).
