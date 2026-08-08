# Changelog

All notable changes to **ScholarGate** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-08-08

### Added
- **Cloudflare R2 Dual Backup Sync**: Database backups created via `/admin/backups` automatically upload and mirror to Cloudflare R2 Object Storage (`static-cdn-r2`) in addition to local storage.
- **Enhanced User Management & RBAC**: Full support for editing user profiles, resetting passwords with a secure random generator, live search, role filtering (`Admin` / `Editor`), and deletion protection.
- **Inertia Client-Side Router Integration**: Replaced standard React Router links in admin layout with native `InertiaLink` components for instant, smooth client-side page visits without page reloads.
- **Responsive Social Media Footer**: Customizable brand icons for Instagram, Facebook, TikTok, and YouTube managed via Admin Settings.

### Fixed
- Fixed authentication header token attachment on backup download endpoints (`401 Unauthorized` resolved).
- Fixed middleware redirect loop on Inertia SPA web routes (`/admin/users`).
- Fixed Framer Motion bento card stagger animation timing (`0.35s` duration, `0.04s` stagger, `easeOutExpo` curve).

---

## [2.0.0] - 2026-07-29

### Added
- Enterprise School Portal redesign with modern Bento Grid layout.
- TipTap WYSIWYG rich text editor for article management.
- Dynamic Lucide icon system mapping 80+ dynamic icons to school services and extracurriculars.
- Automatic favicon & Apple touch icon generation from uploaded school emblems.
- Automated WebP image optimization pipeline for media uploads.
- SEO, AEO, and GEO optimization engine (auto-generated `sitemap.xml`, `robots.txt`, `llms.txt`, and JSON-LD structured data).

---

## [1.0.0] - 2026-07-09

### Added
- Initial release of ScholarGate CMS built on Laravel, Inertia.js, and React.
- Basic article publishing, gallery management, and contact info settings.
