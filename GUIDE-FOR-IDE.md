# GUIDE-FOR-IDE.md — Developer guide

**Language:** English  
**Audience:** Humans and IDE agents  
**Last updated:** 2026-08-06  

---

## 1. Read first

| File | When |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | Before any AI-assisted change |
| [PRD.md](./PRD.md) | Product scope |
| [README.md](./README.md) | Quick start |
| [INSTALL.md](./INSTALL.md) | Install details |
| [docs/](./docs/) | Deploy, security, SEO, database, R2 |

After coding sessions that change behavior: run checks in `CLAUDE.md` §10 and update docs if conventions changed.

---

## 2. Repository layout

```
cms-scholargate/              # Laravel application root
├── app/Http/Controllers/     # Inertia + API + install/update/SEO
├── app/Services/             # Domain services
├── app/Support/              # Installer, MediaStorage, SafeUrl, …
├── resources/js/             # React + Inertia pages
├── public/                   # Document root (+ build/)
├── routes/web.php · api.php
├── tests/Unit · Feature
└── docs/
```

There is **no** separate `frontend/` or nested `backend/` package.

---

## 3. Local development

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve
npm install --legacy-peer-deps && npm run dev
```

Open http://127.0.0.1:8000

---

## 4. Architecture notes

- **Presentation:** Inertia pages (`resources/js/pages/*`) + Blade root meta  
- **HTTP:** Controllers + middleware (`auth`, `admin`, `super_admin`)  
- **Services:** SEO, backup, media, brand logo, HTML sanitize  
- **Infrastructure:** Eloquent, filesystems/R2, session/Sanctum  

Data loading is **hybrid**: page shells via Inertia props/SEO; CRUD via `/api/v1` + session CSRF.

---

## 5. Adding a page

1. Create `resources/js/pages/MyPage.tsx` with `export default`
2. Register route in `routes/web.php` → `Inertia::render('MyPage', …)`
3. Add to `PUBLIC_LAYOUT_PAGES` in `app.tsx` if it needs the public shell
4. Pass `seo` for indexable pages

---

## 6. Testing

```bash
php artisan test
```

Add unit tests for pure helpers (`SafeUrl`, settings whitelist, …) and feature tests for HTTP contracts.

---

## 7. Security / UI reminders

- CMS HTML: `SafeHtml` + server `HtmlSanitizer`
- Links: `safeHref`
- Admin destructive actions: modal + toast (no `window.confirm`)
- Public UI: bento alignment (see `CLAUDE.md` §6)
