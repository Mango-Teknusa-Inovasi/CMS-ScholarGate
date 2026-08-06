# Go-live checklist

**Language:** English  

Related: [DEPLOY.md](./DEPLOY.md) · [SECURITY.md](./SECURITY.md)

## 1. Production environment

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example

FILESYSTEM_DISK=r2
R2_ENDPOINT=...
R2_BUCKET_NAME=...
R2_FOLDER_PATH=scholargate
R2_PUBLIC_URL=https://your-cdn.example
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

SANCTUM_STATEFUL_DOMAINS=your-domain.example,www.your-domain.example
ALLOW_INSTALL=false
```

Build-time (optional):

```env
VITE_R2_PUBLIC_URL=https://your-cdn.example
VITE_R2_FOLDER_PATH=scholargate
```

## 2. Build assets

```bash
npm ci --legacy-peer-deps
npm run build
# → public/build
```

## 3. Deploy application

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan storage:link   # optional for local disk
```

Document root = `public/` (must include `build/`).

### After replacing files

```text
https://your-domain/update
```

Admin login → run update (migrate + cache), or CLI: `php artisan scholargate:update`

### Lock the installer

```env
ALLOW_INSTALL=false
APP_DEBUG=false
APP_ENV=production
```

`https://your-domain/install` must return **403**.

## 4. Passwords

Dev seed defaults (change in production):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@scholargate.test | `Scholargate!Admin2026` |
| Member | member@scholargate.test | `Scholargate!Member2026` |

## 5. Database backup

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
# → backups/scholargate_*.sql.gz
```

Schedule daily via cron. Also use Admin → Backup for portable JSON.

## 6. Smoke tests

1. Member `/login` → account menu  
2. `/daftar` registration  
3. `/admin/login` → dashboard  
4. Member token cannot call `/api/v1/admin/dashboard`  
5. Image upload (optimize → R2)  
6. PDF upload (presign path)  
7. `/sitemap.xml`, `/robots.txt`, `/llms.txt`  
8. View-source homepage/article: OG + JSON-LD present in server HTML  
9. Settings → upload logo → favicon/apple icons update  

## 7. Feature status

| Feature | Status |
|---------|--------|
| Draft preview (14-day token) | Yes — `/preview/artikel/{token}` |
| GitHub Actions CI | Yes — tests + build |
| Content revision history UI | Not yet |
| Full SSR framework | Not planned (Inertia + server meta is enough for GSC) |
