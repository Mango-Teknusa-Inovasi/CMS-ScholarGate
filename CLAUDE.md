# CLAUDE.md — AI Agent Rules for CMS Scholargate

**Language of this file:** English  
**Audience:** Claude, Cursor, Grok, Copilot, and any coding agent  
**Last updated:** 2026-08-06 (root monolith; English docs; PHPUnit unit/feature suite)  

---

## 0. Mandatory workflow (do not skip)

### After every code-writing turn

Before finishing, the agent **must**:

1. **Self-check** against §1–§8 (architecture, security, SEO, DB, UI, deploy).
2. **Run** relevant verification (at least one that applies):
   - Backend: `php -l` on touched PHP files; `php artisan route:list` if routes changed; `php artisan test` when behavior changes.
   - Frontend: `npm run build` if TS/UI changed.
3. **Update docs when rules or product behavior changed**:
   - `CLAUDE.md` (this file) — agent rules
   - `PRD.md` — product requirements / scope
   - `GUIDE-FOR-IDE.md` — IDE / human developer guide
   - Relevant files under `docs/` (SECURITY, SEO-AEO-GEO, DATABASE, DEPLOY, GO-LIVE)
4. In the final reply to the user, briefly note: checks run + whether docs were updated.

### When introducing a new convention

- Write the rule here **and** in `GUIDE-FOR-IDE.md` / `PRD.md` if product-facing.
- Prefer one source of truth; link instead of duplicating long prose.

---

## 1. Project identity

| Item | Value |
|------|--------|
| Name | **CMS Scholargate** (school portal + admin CMS) |
| Backend | Laravel 13 + Inertia.js + Sanctum (session + optional Bearer) |
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 **inside** `resources/js` |
| Production shape | **True monolith**: document root `public` serves Inertia + API + assets |
| Asset build | `npm run build` → `public/build/` (laravel-vite-plugin) |
| Recommended DB | **PostgreSQL**; also MySQL + MariaDB |
| Media (production) | Cloudflare R2 (S3-compatible); compress images then upload |

---

## 2. Architecture rules

1. **Do not** require Node.js at runtime on production. Node is **build-time only** (`npm run build` on laptop/CI).
2. **Do not** split production into two always-on processes (API + Node). Dev: `php artisan serve` + `npm run dev` (Vite) in repo root.
3. **Inertia** for page navigation (`Inertia::render` in `PageController`). Hybrid: page shells + `/api/v1/*` JSON for CRUD/uploads.
4. API under `/api/v1/*`. SEO meta for bots in `resources/views/app.blade.php` via shared `seo` props.
5. Auth (session-first for UI):
   - Web session (`Auth::login`) + CSRF (`/sanctum/csrf-cookie`, axios `withCredentials`).
   - Optional Sanctum tokens still issued for non-browser clients.
   - Admin Inertia routes: middleware `auth` + `admin` (roles `admin` \| `editor`).
   - API admin: `auth:sanctum` + `admin` (session works via `statefulApi()`).
   - Super-admin only: middleware `super_admin` (role `admin` only) — users, backup/restore.
6. Password cast is `hashed` on User model — **never** double-hash with `Hash::make` on create.
7. Install: `/install` (web) or `php artisan scholargate:install`. Locked after install.
8. Easy update: **`/update`** or `php artisan scholargate:update` — never `migrate:fresh` unless user demands reinstall.
9. UI source is **`resources/js` only** (Inertia). No separate SPA package; do not reintroduce `frontend/` or `public/spa/`.

### Critical paths

```
app/Http/Controllers/Inertia/  # PageController (Inertia pages)
app/Http/Controllers/Api/      # JSON API v1
app/Http/Middleware/           # HandleInertiaRequests, admin, SecurityHeaders
resources/js/                  # React pages, components, lib (Inertia entry: app.tsx)
resources/views/app.blade.php  # Inertia root + server SEO meta
public/build/                  # Vite production assets
app/Services/                  # Seo, Backup, HtmlSanitizer, ImageOptimizer, Presign
app/Support/                   # Installer, Updater, MediaStorage, PublicSettings, SafeUrl
docs/                                  # Deploy, security, SEO, database
```

---

## 3. Security rules (non-negotiable)

| Area | Rule |
|------|------|
| XSS | All CMS HTML rendered via **`SafeHtml` + DOMPurify**. Server: **`HtmlSanitizer` (HTMLPurifier)** on model save. |
| URLs | Use **`safeHref` / `SafeUrl`** — block `javascript:`, `data:`, `vbscript:`. |
| Uploads | **No SVG**. Media confirm path must match `uploads/...` without `..`. |
| Settings | Public + admin update: **whitelist** `PublicSettings::KEYS` only. |
| Backup | No password hashes in export. Restore skips `users` unless `include_users` + super admin. |
| CSRF | Session UI + stateful API: CSRF required (`X-XSRF-TOKEN`). Web forms (`/install`, `/update`) use `@csrf`. |
| Tokens | Session preferred for browser; optional Bearer still issued. Prefer Sanctum expiration (`SANCTUM_TOKEN_EXPIRATION`). |
| Headers | `SecurityHeaders` middleware stays on. |
| Rate limits | Named limiters in `AppServiceProvider` — keep on public auth/search/read. |
| GSC verification | Inject in **server HTML** (`SpaController`) and Helmet. Normalize pasted meta tags. |

If adding an admin endpoint that is destructive or sensitive → **`super_admin`**, not only `admin`.

---

## 4. Database & migrations

1. Support **pgsql**, **mysql**, **mariadb** with Laravel Schema builder only.
2. **No** engine-specific raw SQL in migrations (no raw `jsonb`, no MySQL-only ENUMs).
3. `->after()` is OK (MySQL-only cosmetic; ignored on PostgreSQL).
4. Backup JSON is **portable v2** (bool/json/dates normalized; PG sequences reset after restore).
5. Prefer documenting cross-DB restore in `docs/DATABASE.md`.

---

## 5. SEO / AEO / GEO

| Endpoint | Purpose |
|----------|---------|
| `/sitemap.xml` | Indexable URLs (no `noindex` articles; include achievements) |
| `/robots.txt` | Allow public; disallow admin, api, install, update, login, preview |
| `/llms.txt` | AI / answer-engine site map |

- Meta + JSON-LD via `SeoService`; server inject for crawlers.
- Keep `APP_URL` = public HTTPS origin for correct sitemap/canonical.

---

## 6. Frontend / UI rules

1. **Public portal**: bento grid (`BentoBoard` / `BentoTile` / `PageBento*`) — fun, soft pastels, aligned container edges.
2. Hero/banner must share the **same horizontal edge** as bento rows (no nested double `container-page`).
3. Admin CMS: practical dense UI (not necessarily bento); keep peach/soft accents where already used.
4. Tailwind v4 + design tokens in `resources/js/index.css`.
5. Motion: prefer existing `motion` / GSAP hooks; respect `prefers-reduced-motion`.

---

## 7. Storage / media

1. Production: `FILESYSTEM_DISK=r2` with env pattern documented in `docs/STORAGE-R2.md`.
2. Raster images: optimize (WebP) via app path; optional presign for non-raster.
3. Always set meaningful **alt** text defaults.

---

## 8. Deploy & ops

| Action | How |
|--------|-----|
| First install | `/install` or `scholargate:install` |
| After replacing files | `/update` (admin login) or `scholargate:update` |
| Build assets | `npm ci && npm run build` → `public/build` |
| Document root | `public` |

Do not commit secrets, `vendor/`, `node_modules/`, local sqlite dumps, or screenshots.

---

## 9. Coding style

- Match existing file style; minimal unrelated refactors.
- No drive-by renames of public API routes without migration notes.
- TypeScript: keep builds green (`tsc -b`).
- PHP: type hints and validation on request boundaries.
- Comments only when non-obvious (security, portable DB, install locks).

---

## 10. End-of-task checklist (copy mentally every time)

```
[ ] Architecture (Inertia in resources/js, public/build, API v1) respected
[ ] Authz: session + admin vs super_admin correct
[ ] XSS/URL/upload/settings rules not weakened
[ ] Migrations portable (pgsql/mysql/mariadb)
[ ] SEO endpoints + app.blade meta still coherent
[ ] Public UI still bento-aligned if home/pages touched
[ ] Build/lint smoke: `npm run build`; `php artisan route:list`
[ ] CLAUDE.md / PRD.md / GUIDE-FOR-IDE.md / docs/* updated if rules changed
```

---

## 11. Related docs

| File | Role |
|------|------|
| [PRD.md](./PRD.md) | Product requirements & scope |
| [GUIDE-FOR-IDE.md](./GUIDE-FOR-IDE.md) | Human + IDE day-to-day guide |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security inventory |
| [docs/SEO-AEO-GEO.md](./docs/SEO-AEO-GEO.md) | Search / GSC |
| [docs/DATABASE.md](./docs/DATABASE.md) | Multi-DB + portable backup |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Deploy + `/update` |
| [docs/GO-LIVE.md](./docs/GO-LIVE.md) | Production checklist |
| [docs/STORAGE-R2.md](./docs/STORAGE-R2.md) | R2 media |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Layers & tests |

---

*If this file conflicts with runtime code, fix the code or update this file in the same change set — never leave silent drift.*
