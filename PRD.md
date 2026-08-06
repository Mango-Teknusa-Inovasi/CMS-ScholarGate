# PRD.md — Product Requirements Document

**Product:** CMS Scholargate  
**Document language:** English  
**Status:** Living document — update when scope or rules change  
**Last updated:** 2026-08-06  

---

## 1. Vision

A **school / education portal** with a full **admin CMS**, easy to deploy on **shared hosting** (single PHP document root, **Laravel + Inertia + React**), with solid **SEO / AEO / GEO**, secure media on **Cloudflare R2**, and a cheerful **bento-grid** public UI.

---

## 2. Goals

| Goal | Success criteria |
|------|------------------|
| Shared-hosting friendly | One document root (`public/`); no Node runtime on server |
| Dual audience | Public visitors + CMS staff (admin/editor) + optional members |
| Content CMS | Articles, media, menus, banners, profile, achievements, extracurriculars, downloads, settings |
| Search readiness | Sitemap, robots, schema, GSC verification, llms.txt |
| Safe operations | Locked installer, easy `/update`, portable JSON backup |
| Multi-database | PostgreSQL (recommended), MySQL, MariaDB |
| Safe by default | XSS hardened, rate limits, role split, no SVG XSS surface |
| Tested core paths | Unit + feature tests for security helpers, public API, authz |

### Non-goals (current)

- Separate SPA + always-on API dual deploy  
- Instagram / social auto-post  
- Native mobile apps  
- Multi-tenant SaaS (one school per install)  
- Full Next.js-style SSR rewrite  

---

## 3. Personas

| Persona | Needs |
|---------|--------|
| **Visitor** | Fast public pages, readable articles, share, search-friendly HTML |
| **Member** | Register/login, simple account area |
| **Editor** | Manage content & media (not users/backup) |
| **Admin (super)** | Users, backup/restore, settings, system update |
| **Operator** | Install once, replace files, run `/update` without SSH if needed |

---

## 4. Functional requirements

### 4.1 Public portal

- Home with **bento grid** (hero, welcome, services, articles, achievements, gallery, partners)
- Pages: Profile, Articles (+ detail), Achievements (+ detail), Extracurricular, Downloads
- SEO head + server-injected meta for crawlers
- Share on articles
- Member login / register / account (session auth)

### 4.2 Admin CMS (`/admin`)

- Dashboard, articles (full-page TipTap editor + preview tokens), media library, tags, categories
- Resources: banners, welcome, menus, services, gallery, partners, contacts, quick services, extracurriculars, downloads
- Settings: identity, GEO, GSC/Bing, branding (**logo upload auto-generates favicon + apple-touch + optional OG**)
- Users (super admin)
- Backup / restore JSON|ZIP (super admin)
- Media size guide

### 4.3 Platform

| Feature | Requirement |
|---------|-------------|
| Install | `/install` or CLI; pgsql \| mysql \| mariadb |
| Update | `/update` or `scholargate:update` — migrate + cache, never fresh wipe |
| Auth | Session + CSRF for UI; optional Sanctum Bearer; password cast hashed once |
| Media | R2 in production; WebP optimize path; brand logo pipeline |
| Backup | Portable JSON v2; cross-engine; no password export |
| Security | HtmlSanitizer + DOMPurify; SafeUrl; rate limits; security headers |
| Tests | PHPUnit unit + feature suites in CI |

---

## 5. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | Static Vite assets; image compression; view count 1/IP/hour |
| Accessibility | Skip link; semantic headings; reduced-motion respected |
| Security | See `docs/SECURITY.md` and `CLAUDE.md` §3 |
| Portability | Migrations + backup on pgsql/mysql/mariadb |
| Maintainability | Single Laravel root + layered app structure; English docs |

---

## 6. Architecture layers

```
Presentation  →  Inertia/React, Blade meta, routes
Application   →  Controllers, middleware, form validation
Domain        →  Services (SEO, backup, brand, sanitize, image)
Infrastructure→  Eloquent, filesystems/R2, session/Sanctum, cache
```

This is **application layering**, not the network OSI model.

---

## 7. Tech stack (locked)

- **Backend:** Laravel 13, PHP 8.2+, Sanctum, Intervention Image, HTMLPurifier, AWS SDK (R2)
- **Frontend:** React 19, TypeScript, Vite, Tailwind 4, TanStack Query, TipTap, Motion/GSAP, DOMPurify, Inertia
- **DB:** PostgreSQL recommended; MySQL; MariaDB  
- **CI:** GitHub Actions — PHP lint, migrate, asset build, `php artisan test`

---

## 8. Information architecture

```
Public:  /  /profil  /artikel  /artikel/:slug  /prestasi  /prestasi/:slug
         /ekstrakurikuler  /download  /login  /daftar  /akun
System:  /install  /update  /robots.txt  /sitemap.xml  /llms.txt
Admin:   /admin/*  (Inertia)
API:     /api/v1/*
```

---

## 9. Design principles (public UI)

1. **Bento grid** — soft pastel tiles  
2. **Aligned edges** — hero and boards share container width  
3. Soft brand cyan + peach; Onest font  
4. Admin stays productivity-first  

---

## 10. Release / ops

1. `APP_ENV=production`, `APP_DEBUG=false`, HTTPS, strong admin password  
2. `ALLOW_INSTALL=false` after install  
3. GSC verification + submit `/sitemap.xml`  
4. After deploy: `/update` or CLI update  
5. R2 required for production media  

---

## 11. Success metrics

- Clean install on shared hosting in under 30 minutes  
- GSC verification + sitemap accepted  
- Cross-DB restore of content JSON  
- Editors cannot access users/backup  
- Core unit/feature tests green in CI  

---

## 12. Document maintenance

| Event | Update |
|-------|--------|
| New feature / persona | This PRD §4–§5 |
| Agent / security rule | `CLAUDE.md` + `GUIDE-FOR-IDE.md` |
| Deploy / DB / SEO ops | Matching `docs/*` |
| Breaking route change | PRD + GUIDE + commit note |

**Agents:** After product changes, bump **Last updated** so this PRD never drifts from reality.

---

## 13. Backlog (not committed)

- Social auto-post  
- Email verification productization  
- Full audit log UI  
- Multi-school tenancy  

Promote into §4 only when accepted by the product owner.
