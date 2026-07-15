# GUIDE-FOR-IDE.md — Developer & IDE Guide

**Language:** English  
**For:** Humans in VS Code / PhpStorm / Cursor / Windsurf, and AI agents using this repo  
**Last updated:** 2026-07-15  

---

## 1. Read first

| File | When |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | **Always** before AI-assisted coding |
| [PRD.md](./PRD.md) | Product scope & non-goals |
| [README.md](./README.md) | Quick start |
| [INSTALL.md](./INSTALL.md) | Install details |
| [docs/](./docs/) | Deploy, security, SEO, database, R2 |

### AI / agent obligation

At the **end of every coding session** that changes behavior or conventions:

1. Run the checklist in `CLAUDE.md` §10  
2. Update `CLAUDE.md`, `PRD.md`, and/or this file if rules changed  
3. Update the relevant `docs/*` file for ops topics  

---

## 2. Repository layout

```
cms-scholargate/
├── CLAUDE.md              # AI rules (source of truth for agents)
├── PRD.md                 # Product requirements
├── GUIDE-FOR-IDE.md       # This file
├── README.md / INSTALL.md / LICENSE
├── package.json           # monorepo helpers: dev:api, dev:web, build
├── backend/               # Laravel — deploy this
│   ├── app/
│   ├── database/migrations/
│   ├── public/            # DOCUMENT ROOT
│   │   └── spa/           # built React (from frontend npm run build)
│   ├── routes/
│   └── resources/views/   # install, update, spa-missing
├── frontend/              # React source (build only)
├── docs/
├── scripts/backup-db.sh
└── .github/workflows/ci.yml
```

---

## 3. Local development

```bash
# Terminal 1 — API
cd backend
composer install
cp .env.example .env   # configure DB; local may use sqlite or pgsql
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2 — SPA (proxies /api to :8000)
cd frontend
npm install
cp .env.example .env   # VITE_R2_* if testing media URLs
npm run dev -- --host 127.0.0.1 --port 5173
```

Or from root: `npm run dev:api` / `npm run dev:web` / `npm run build`.

**Demo seed accounts** (dev only — change in production): see README.

---

## 4. Production / shared hosting

1. `cd frontend && npm run build` → writes `backend/public/spa`  
2. Deploy **`backend/`**  
3. Document root = **`backend/public`**  
4. First time: `/install` or `php artisan scholargate:install`  
5. After replacing code: **`/update`** (admin login) or `php artisan scholargate:update`  

Details: `docs/DEPLOY.md`, `docs/GO-LIVE.md`.

---

## 5. IDE setup suggestions

### VS Code / Cursor

Recommended extensions: PHP Intelephense, Laravel-related, ESLint/oxlint if used, Tailwind CSS IntelliSense, TypeScript.

Workspace tips:

- Open **repo root** so both `backend` and `frontend` resolve.
- PHP path: `backend/` as Laravel root for artisan tasks.
- Exclude from search/index: `backend/vendor`, `frontend/node_modules`, `backend/public/spa/assets`.

### PhpStorm

- Mark `backend` as content root for Laravel plugin.
- Mark `frontend` as JavaScript module; enable Vite.

### Env files

- Never commit `backend/.env` or `frontend/.env`.  
- Use `.env.example` as template.

---

## 6. Conventions cheat sheet

### Backend

| Topic | Convention |
|-------|------------|
| API prefix | `/api/v1` |
| Admin middleware | `admin` then `super_admin` for users/backup |
| Settings keys | Only `PublicSettings::KEYS` |
| HTML fields | Saved through `HtmlSanitizer` on models |
| Migrations | Portable Schema only; engines: pgsql, mysql, mariadb |
| Backup | JSON portable v2; no password export |

### Frontend

| Topic | Convention |
|-------|------------|
| Auth storage | `scholargate_member_token` / `scholargate_admin_token` |
| HTML render | `SafeHtml` only (not raw `dangerouslySetInnerHTML`) |
| Links | `safeHref()` for external/CMS URLs |
| Public UI | Bento components (`PageBento`, `BentoBoard`, `BentoTile`) |
| Build | `vite` `outDir: ../backend/public/spa`, `base: /spa/` on build |

### Security red lines

- Do not re-enable SVG uploads without sanitization.  
- Do not expose all settings keys publicly.  
- Do not open `/install` after production lock without operator intent.  
- Do not use `migrate:fresh` on `/update`.  

---

## 7. Useful artisan commands

```bash
cd backend
php artisan scholargate:install      # first install
php artisan scholargate:update       # migrate + caches
php artisan scholargate:sanitize-html # re-clean stored HTML
php artisan migrate --force
php artisan route:list
```

---

## 8. Testing smoke (minimum before PR)

```bash
# Backend
cd backend && find app routes -name '*.php' -print0 | xargs -0 -n1 php -l
php artisan route:list --json > /dev/null

# Frontend
cd frontend && npm run build
```

CI mirrors this in `.github/workflows/ci.yml`.

---

## 9. Where to put new work

| If you are adding… | Put it in… |
|--------------------|------------|
| Public page | `frontend/src/pages/*` + route in `App.tsx` + SEO via `SeoHead` |
| Admin page | `frontend/src/pages/admin/*` + admin nav if needed |
| API endpoint | `backend/routes/api.php` + controller under `Http/Controllers/Api` |
| Portable content field | Model fillable + migration (portable) + HtmlSanitizer if HTML |
| Setting key | `PublicSettings::KEYS` + SettingsAdminPage fieldMeta |
| Ops docs | `docs/` |

---

## 10. Definition of done (IDE / agent)

- [ ] Feature matches PRD or explicit user request  
- [ ] No security regression vs `CLAUDE.md` §3  
- [ ] Types/build green for touched surface  
- [ ] Migrations portable if schema changed  
- [ ] `/update` still valid if deploy story changed  
- [ ] **Docs updated** (`CLAUDE.md` / `PRD.md` / this file / `docs/*`) when rules or UX contracts changed  

---

## 11. Contact points in code

| Concern | Start here |
|---------|------------|
| Install lock | `app/Support/Installer.php` |
| Easy update | `app/Support/Updater.php`, `UpdateController` |
| SEO | `app/Services/SeoService.php`, `SeoController`, `SpaController` |
| Backup portable | `app/Services/BackupService.php` |
| HTML sanitize | `app/Services/HtmlSanitizer.php`, `frontend/src/lib/sanitize.ts` |
| Bento UI | `frontend/src/components/ui/Bento.tsx`, `PageBento.tsx`, `HomeBento.tsx` |
| Auth tokens | `frontend/src/lib/auth.ts`, `AuthController` |

---

*Keep this guide short and accurate. Prefer linking to `docs/*` for deep topics rather than copying long procedures twice.*
