# CMS Scholargate

**School portal + admin CMS** built as a single **Laravel + Inertia + React** application.

Designed for **shared hosting and VPS**: one PHP document root, no Node.js process at runtime, optional Cloudflare R2 for media.

[![CI](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/actions/workflows/ci.yml/badge.svg)](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/actions/workflows/ci.yml)

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick start (local)](#quick-start-local)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Production build & deploy](#production-build--deploy)
- [Demo accounts](#demo-accounts)
- [Project layout](#project-layout)
- [Documentation](#documentation)
- [Security](#security)
- [License](#license)

---

## Features

| Area | Capabilities |
|------|----------------|
| **Public portal** | Home (bento UI), profile, articles, achievements, extracurriculars, downloads |
| **Admin CMS** | Articles (TipTap editor), media library, menus, banners, settings, users, backup/restore |
| **SEO / AEO / GEO** | Sitemap, robots, llms.txt, Open Graph, JSON-LD, GSC/Bing verification |
| **Auth** | Session + CSRF for the UI; optional Sanctum tokens for API clients |
| **Roles** | `admin` (super), `editor`, `member` |
| **Media** | Image optimize (WebP) → R2; brand logo auto-generates favicon & apple-touch icons |
| **Ops** | Web `/install`, easy `/update`, multi-DB (PostgreSQL / MySQL / MariaDB) |

---

## Architecture

Application layers (not the network OSI model — **software architecture layers**):

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation                                               │
│  • Inertia + React (resources/js)                           │
│  • Blade root (resources/views/app.blade.php) + SEO meta    │
│  • routes/web.php  ·  routes/api.php                        │
├─────────────────────────────────────────────────────────────┤
│  Application / HTTP                                         │
│  • Controllers (Inertia pages, API v1, Install, Update, SEO)│
│  • Middleware (auth, admin, super_admin, SecurityHeaders)   │
├─────────────────────────────────────────────────────────────┤
│  Domain services                                            │
│  • SeoService, BackupService, BrandLogoService              │
│  • HtmlSanitizer, ImageOptimizer, PresignUploadService      │
├─────────────────────────────────────────────────────────────┤
│  Support / infrastructure                                   │
│  • Eloquent models · MediaStorage · PublicSettings · SafeUrl│
│  • Installer / Updater · DB · filesystem / R2 · session     │
└─────────────────────────────────────────────────────────────┘
```

| Concern | Choice |
|---------|--------|
| Runtime | PHP only (Laravel 13) |
| UI delivery | Inertia.js (server-driven page visits) |
| Mutations / CRUD | Hybrid: JSON API `/api/v1/*` with session + CSRF |
| Assets | Vite build → `public/build` (Node is **build-time only**) |
| Document root | `public/` |

---

## Requirements

| Component | Version / notes |
|-----------|-----------------|
| PHP | **8.2+** with `pdo`, `mbstring`, `openssl`, `tokenizer`, `json`, `ctype`, `fileinfo`, `curl`, `gd` |
| Database | PostgreSQL (**recommended**), MySQL, or MariaDB |
| Composer | 2.x |
| Node.js | **20+** for asset build only (not required on production host) |
| Object storage | Cloudflare R2 (S3-compatible) for production media |

---

## Quick start (local)

```bash
# 1. Dependencies
composer install
cp .env.example .env
php artisan key:generate

# 2. Database (example: SQLite for local)
#    Or set DB_* for PostgreSQL/MySQL in .env
touch database/database.sqlite   # if using sqlite
php artisan migrate --seed

# 3. Frontend deps + HMR
npm install --legacy-peer-deps

# 4. Run (two terminals — or: npm run dev:all)
php artisan serve
npm run dev
```

Open **http://127.0.0.1:8000**.

---

## Installation

### A) Web installer (shared hosting friendly)

1. Build assets: `npm ci --legacy-peer-deps && npm run build`
2. Deploy the project; set document root to **`public/`**
3. Create an empty database
4. Set `ALLOW_INSTALL=true` in `.env`
5. Open `https://your-domain/install`
6. Choose PostgreSQL / MySQL / MariaDB, enter credentials and admin account
7. After success, installer locks (`storage/app/installed`, `ALLOW_INSTALL=false`)

### B) CLI

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan scholargate:install
# optional flags:
#   --driver=mysql --database=scholargate --username=root --password=secret
#   --url=https://school.example
```

### C) Docker

```bash
cp .env.example .env   # set DB_PASSWORD, APP_URL, R2_*, etc.
./deploy.sh install
# App: http://localhost:8080
```

Full steps: **[INSTALL.md](./INSTALL.md)** · **[docs/DEPLOY.md](./docs/DEPLOY.md)** · **[docs/GO-LIVE.md](./docs/GO-LIVE.md)**

---

## Configuration

Key `.env` values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_DATABASE=scholargate
DB_USERNAME=...
DB_PASSWORD=...

FILESYSTEM_DISK=r2
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=...
R2_FOLDER_PATH=scholargate
R2_PUBLIC_URL=https://your-cdn.example
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

SANCTUM_STATEFUL_DOMAINS=your-domain.example,www.your-domain.example
ALLOW_INSTALL=false
```

Optional Vite env (at build time) for public media URLs: `VITE_R2_PUBLIC_URL`, `VITE_R2_FOLDER_PATH`.

See **[docs/STORAGE-R2.md](./docs/STORAGE-R2.md)** and **[docs/DATABASE.md](./docs/DATABASE.md)**.

---

## Development

```bash
php artisan serve          # Laravel + Inertia
npm run dev                # Vite HMR
npm run build              # production assets → public/build
npm run typecheck          # TypeScript
php artisan route:list     # routes
```

| Path | Purpose |
|------|---------|
| `/` | Public portal |
| `/admin/login` | CMS login |
| `/login` · `/daftar` | Member auth |
| `/install` · `/update` | Ops (locked after install / admin-gated) |
| `/api/v1/*` | JSON API |
| `/sitemap.xml` · `/robots.txt` · `/llms.txt` | SEO / AEO |

---

## Testing

PHPUnit is configured with **unit** and **feature** suites (`phpunit.xml`, in-memory SQLite).

```bash
php artisan test
# or: ./vendor/bin/phpunit
```

Coverage includes:

| Suite | Focus |
|-------|--------|
| **Unit** | `SafeUrl`, `PublicSettings` whitelist, SEO verification normalize, user roles / password cast |
| **Feature** | Home Inertia response, SEO endpoints, public API shape, auth login + admin authorization |

CI runs syntax checks, migrations, asset build, and tests (see `.github/workflows/ci.yml`).

---

## Production build & deploy

```bash
composer install --no-dev --optimize-autoloader
npm ci --legacy-peer-deps
npm run build

php artisan migrate --force
# or open https://your-domain/update (admin password)
# or: php artisan scholargate:update

php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Document root must be `public/`** and must include `public/build/`.

After replacing files on the server: prefer **`/update`** or `scholargate:update` — never `migrate:fresh` unless you intentionally reinstall.

---

## Demo accounts

Created by the database seeder (**development only** — change in production):

| Role | Email | Password |
|------|-------|----------|
| Admin CMS | `admin@scholargate.test` | `Scholargate!Admin2026` |
| Member | `member@scholargate.test` | `Scholargate!Member2026` |

---

## Project layout

```
cms-scholargate/
├── app/
│   ├── Http/Controllers/     # Inertia pages, API, install/update/SEO
│   ├── Services/             # SEO, backup, media, brand logo, sanitizer
│   ├── Support/              # Installer, MediaStorage, PublicSettings, SafeUrl
│   └── Models/
├── resources/
│   ├── js/                   # React + Inertia UI
│   └── views/app.blade.php   # Root document + server SEO / favicon
├── routes/web.php · api.php
├── public/                   # ← WEB DOCUMENT ROOT
│   └── build/                # Vite production assets
├── database/migrations/
├── tests/Unit · Feature
├── docs/                     # Deploy, security, SEO, database, R2
├── CLAUDE.md                 # Agent / contributor rules
├── PRD.md                    # Product requirements
└── INSTALL.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [INSTALL.md](./INSTALL.md) | Full install (web, CLI, Docker) |
| [PRD.md](./PRD.md) | Product requirements (living) |
| [GUIDE-FOR-IDE.md](./GUIDE-FOR-IDE.md) | Day-to-day developer guide |
| [CLAUDE.md](./CLAUDE.md) | Architecture & security rules for contributors/agents |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | What to upload / shared hosting |
| [docs/GO-LIVE.md](./docs/GO-LIVE.md) | Production checklist |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security inventory |
| [docs/SEO-AEO-GEO.md](./docs/SEO-AEO-GEO.md) | Search & GSC |
| [docs/DATABASE.md](./docs/DATABASE.md) | Multi-DB + portable backup |
| [docs/STORAGE-R2.md](./docs/STORAGE-R2.md) | Cloudflare R2 media |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Application layers & testing strategy |

All product and ops documentation is maintained in **English**.

---

## Security

Security controls are documented to **international practice** (OWASP Top 10 mapping, secure headers, auth/session, uploads, residual risks):

→ **[docs/SECURITY.md](./docs/SECURITY.md)** (English)

Highlights: HTML sanitization (server + client), URL allowlisting, upload path hardening, role split (`admin` / `editor` / `member`), CSRF + session guidance, installer lock, rate limits, PHPUnit security tests.

---

## License

See [LICENSE](./LICENSE).
