# PRD.md — Product Requirements Document

**Product:** CMS Scholargate  
**Document language:** English  
**Status:** Living document — agents and humans **must update** this when scope or rules change  
**Last updated:** 2026-07-15  

---

## 1. Vision

A **school/education portal** with a **WordPress-like admin CMS**, easy to deploy on **shared hosting** (single PHP document root), with solid **SEO / AEO / GEO**, secure media on **Cloudflare R2**, and a **cheerful bento-grid** public UI.

---

## 2. Goals

| Goal | Success criteria |
|------|------------------|
| Shared-hosting friendly | One document root (`backend/public`); no Node runtime on server |
| Dual audience | Public visitors + CMS staff (admin/editor) + optional members |
| Content CMS | Articles, media, menus, banners, profile, achievements, ekskul, downloads, settings |
| Search readiness | Sitemap, robots, schema, GSC verification, llms.txt |
| Safe operations | Locked installer, easy `/update`, portable JSON backup |
| Multi-database | PostgreSQL (recommended), MySQL, MariaDB |
| Safe by default | XSS hardened, rate limits, role split, no SVG XSS surface |

### Non-goals (current)

- Full SSR framework rewrite  
- Instagram / social auto-post (deferred)  
- Native mobile apps  
- Multi-tenant SaaS (one school per install)  

---

## 3. Personas

| Persona | Needs |
|---------|--------|
| **Visitor** | Fast public pages, readable articles, share, search-friendly pages |
| **Member** | Register/login, simple account area |
| **Editor** | Manage content, media, most CMS resources (not users/backup) |
| **Admin (super)** | Users, backup/restore, settings, system update |
| **Operator** | Install once, replace files, run `/update` without SSH if needed |

---

## 4. Functional requirements

### 4.1 Public portal

- Home with **bento grid** (hero, welcome, services, articles, achievements, gallery, partners)
- Pages: Profile, Articles (+ detail), Achievements (+ detail), Extracurricular, Downloads
- SEO head + server-injected meta for crawlers
- Share button on articles
- Member login/register/account routes

### 4.2 Admin CMS (`/admin`)

- Dashboard, articles (WP-like editor + preview tokens), media library, tags, categories
- Resources: banners, welcome, menus, services, gallery, partners, contacts, quick services, ekskul, downloads
- Settings (identity, GEO, GSC/Bing verification, branding images)
- Users (super admin only)
- Backup / restore JSON|ZIP (super admin only)
- Media guide for image sizes

### 4.3 Platform

| Feature | Requirement |
|---------|-------------|
| Install | `/install` or CLI; choose pgsql \| mysql \| mariadb |
| Update | `/update` with admin credentials runs migrations + cache; CLI `scholargate:update` |
| Auth | Sanctum Bearer; member vs admin tokens; password hashed once |
| Media | R2 production; local public disk for dev; WebP optimization path |
| Backup | Portable JSON v2; cross-engine restore; no password export |
| Security | HtmlSanitizer + DOMPurify; SafeUrl; rate limits; security headers |

---

## 5. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | SPA static assets; image compression; view count not inflated per refresh (1/IP/hour) |
| Accessibility | Skip link; semantic headings; reduced-motion respected |
| Security | See `docs/SECURITY.md` and `CLAUDE.md` §3 |
| Portability | Migrations + backup work on pgsql/mysql/mariadb |
| Maintainability | Monorepo `backend/` + `frontend/`; docs living with code |

---

## 6. Tech stack (locked)

- **Backend:** Laravel 13, PHP 8.2+, Sanctum, Intervention Image, HTMLPurifier, AWS SDK (R2)
- **Frontend:** React 19, TS, Vite 8, Tailwind 4, TanStack Query, TipTap, Motion/GSAP, DOMPurify
- **DB:** PostgreSQL recommended; MySQL; MariaDB  
- **CI:** GitHub Actions — PHP syntax + migrate smoke; frontend build

---

## 7. Information architecture

```
Public:  /  /profil  /artikel  /artikel/:slug  /prestasi  /prestasi/:slug
         /ekstrakurikuler  /download  /login  /daftar  /akun
System:  /install  /update  /robots.txt  /sitemap.xml  /llms.txt
Admin:   /admin/*  (SPA)
API:     /api/v1/*
```

---

## 8. Design principles (public UI)

1. **Bento grid** — asymmetric soft pastel tiles; fun school energy  
2. **Aligned edges** — hero and boards share the same container width  
3. Soft brand cyan + peach accents; Onest font  
4. Admin remains productivity-first (not forced bento)

---

## 9. Release / ops requirements

1. Production: `APP_ENV=production`, `APP_DEBUG=false`, HTTPS, strong admin password  
2. `ALLOW_INSTALL=false` after install  
3. GSC: paste verification in settings → submit `/sitemap.xml`  
4. After deploy file replace: open `/update` or CLI update  
5. R2 credentials required for production media  

---

## 10. Success metrics (practical)

- Clean install on shared hosting in &lt; 30 minutes  
- GSC verification + sitemap accepted  
- Cross-DB restore (e.g. MySQL → Postgres) of content JSON  
- Editors cannot access users/backup  
- Public Lighthouse / Core Web Vitals acceptable on mobile with optimized images  

---

## 11. Document maintenance (required)

| Event | Update |
|-------|--------|
| New feature or persona need | This PRD §4–§5 |
| New agent rule / security rule | `CLAUDE.md` + `GUIDE-FOR-IDE.md` |
| Deploy / DB / SEO ops change | Matching `docs/*` file |
| Breaking API or route change | PRD + GUIDE-FOR-IDE + release note in commit |

**Agents:** After implementing product changes, bump **Last updated** and adjust sections so this PRD never drifts from reality.

---

## 12. Out of scope backlog (not committed)

- Social auto-post (Instagram, etc.)  
- Email verification / transactional mail productization  
- Full audit log UI  
- Full SSR/Next-style rewrite  
- Multi-school tenancy  

Promote items here into §4 only when accepted by the product owner.
