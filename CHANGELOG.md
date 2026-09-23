# Changelog

All notable changes to **ScholarGate** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-09-23

### Added
- **PageSpeed & Web Performance Engine**:
  - **Dynamic Storage Preconnect**: Extracted storage CDN origin dynamically from `config('filesystems.disks.r2.url')` / `R2_PUBLIC_URL` in `app.blade.php`. Removed all hardcoded storage CDN domains.
  - **LCP Preloader Optimization**: Rendered hero carousel banner using an explicit HTML `<img>` tag with `fetchpriority="high"`, `loading="eager"`, and `decoding="async"`, enabling instant preloader scanner discovery.
  - **Responsive Image Payload Scaling**: Optimized image resolution dimensions across `HomeBento`, `ArticlesSection`, and `HeroCarousel` to prevent downloading unscaled 1080p images on mobile devices, saving ~721 KiB on mobile and ~1.38 MB on desktop.
  - **Forced Reflow Elimination**: Replaced JS Framer Motion hover calculations on static Bento tiles with hardware-accelerated CSS `hover:-translate-y-0.5` transitions.
- **Accessibility & UX Polish**:
  - **Color Contrast**: Upgraded `BentoEyebrow` text contrast (`text-sky-700 dark:text-sky-400`) to exceed WCAG AA standards (> 4.5:1 ratio).
  - **Heading Hierarchy**: Enforced strict semantic heading order (`h1 -> h2 -> h3`) across Bento sections.
  - **Touch Target Expansion**: Expanded hero slider pagination dot touch targets from `8x8px` to `36x36px` (`p-1 flex h-9 w-9 items-center justify-center`).
  - **Distinct Link Labels**: Added distinct `aria-label` attributes to duplicate section links ("Semua") for screen reader clarity.
- **Bento Grid Theme & Dark Mode Support**:
  - Full support for `light`, `dark`, and `auto-system` themes with single dynamic icon switcher.
  - Complete dark mode coverage across all tables, forms, inputs, badges, and button states.
- **Instagram Multi-Photo Scraper & Backup Suite**:
  - Scraper support for multi-photo Instagram carousel posts with inline paragraph placement and local fallback storage handling.
  - Comprehensive backup/restore coverage for all new theme assets, settings, and media records.
- **Dual Theme & Hook Engine Architecture**:
  - Built-in `ThemeManager` service (`app/Services/Theme/ThemeManager.php`), `ThemeAdminController`, and `ThemesAdminPage` for ZIP theme uploading, live activation, and metadata inspection.
  - Dynamic client-side Inertia page resolver in `resources/js/app.tsx` with automatic fallback to `themes/default/pages/` for uncustomized views.
  - Extensible `<HookSlot />` component system for plugin widget injections across active themes.
- **Classic News Portal Theme ("Plain White News Website")**:
  - Introduced traditional white newspaper-style layout (`resources/js/themes/classic/`) featuring `ClassicLayout`, `HomePage`, `ArticlesPage`, `ArticleDetailPage`, `AchievementsPage`, `ExtracurricularPage`, `DownloadsPage`, and `ProfilePage`.
  - Classic news portal aesthetics: Top warta bar, official announcements ticker, multi-column story feed, and newspaper brand header.
  - 100% connected to live backend REST APIs (`/api/v1/*`) via `@tanstack/react-query`.

### Fixed
- Fixed hardcoded CDN URL in Blade head preconnect tag.
- Fixed `SafeHtml` prop name binding (`html` vs `content`) on article detail and school profile pages.
- Fixed theme dataset parsing in `resources/js/app.tsx` during initial page load and SPA navigation.

---

## [2.2.0] - 2026-09-06

### Added
- **Universal RichText AI Copilot**:
  - Integrated `AiAssistModal` into all `RichTextEditor` toolbars across the CMS (`Tulis Baru`, `Perbaiki PUEBI & Tata Bahasa`, `Perluas & Detail`, `Ringkas Teks`, `Sesuaikan Nada`).
- **Specialized AI Content Generators**:
  - **Article Prompt Generator (`ArticlePromptModal`)**: Generates complete news articles from brief hints/topics with automatic title, slug, excerpt, body HTML, category matching, tags, focus keyword, and SEO meta tags.
  - **Principal Welcome Speech Generator (`WelcomeAiModal`)**: Generates official speeches for Homepage and Profile pages with tone presets (*Hangat & Mengayomi*, *Visioner*, *Karakter Bangsa*, *Religius*).
  - **School Profile Tab Generator (`ProfileAiModal`)**: Generates clean semantic HTML content for profile tabs (*Sejarah*, *Visi Misi*, *Budaya Sekolah*, *Fasilitas Unggulan*).
  - **Championship Achievement Generator (`AchievementAiModal`)**: Generates inspirational sports/academic championship reports, medalist badges, and celebratory quotes from competition metadata.
- **Wide Two-Column Achievement Editor**:
  - Redesigned the Prestasi editor in `ResourceEditorPage` with a wide two-column layout (wide canvas for TipTap HTML editor with AI copilot + dedicated sidebar for 16:9 cover image, status, badge, and sort order).
  - Upgraded `ekstrakurikuler` module description field to use `RichTextEditor` with AI assistant support.
- **AI Security Hardening & Persona Isolation**:
  - Strict prompt injection shielding using `filterPromptInjection` and `<untrusted_material>` boundary tags.
  - Model name masking through configurable `custom_ai_model_name` setting to protect proprietary backend models.
  - Support for multi-provider endpoints (OpenAI, OpenRouter, DeepSeek, Groq, 9Router).
- **Tabbed Admin Settings Hub**:
  - Redesigned `/admin/settings` into dedicated tabs: *Umum*, *AI & RAG Intelligence*, *Social Login (OIDC)*, *Branding*, *SEO/AEO/GEO*, *Cloud Backup*, and *Maintenance*.
- **Socialite & OpenID Connect (OIDC) Multi-Provider**:
  - Support for Google, GitHub, Authentik, Keycloak, and custom OIDC providers with customizable login button labels.
  - Automatic RBAC synchronization and Sanctum API token exchange for social login sessions.
- **Customizable Article Sidebar Widgets**:
  - Configurable dynamic sidebar widgets (Pencarian, Kategori, Artikel Populer, Unduhan Cepat, Info Sekolah).
- **Automated AI Feature Test Suite**:
  - Added `tests/Feature/AiGeneratorsTest.php` with 100% passing tests for all AI generation and copilot endpoints.

### Fixed
- Fixed partner (`partners`) deletion failure on UUID primary keys.
- Fixed member role display and upgrade/downgrade permission mapping in user management.
- Fixed Sanctum stateful domain resolution for OIDC social login redirects.

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
