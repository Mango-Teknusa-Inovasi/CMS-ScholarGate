# Changelog

All notable changes to **ScholarGate** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2026-10-26

### Added
- **Built-in PPID Module**:
  - Public portal at `/ppid` and staff workspace at `/admin/ppid`, with activation, service, profile, working-day, deadline, and notification settings.
  - Public Information Register (DIP) management with manual uploads, document links, physical availability, drafts, review, versioned publishing, and withdrawal.
  - Versioned dynamic forms for information requests, objections, surveys, guest books, and visits; supports application tracking by register number and access code, as well as offline service records.
  - PPID staff role assignments that do not require CMS administrator access, permission checks for endpoints and private files, and sensitive-access logging.
  - PPID storage through the active media provider (local, R2, or S3), a private bucket for sensitive documents, separate public copies for published DIP documents, and encrypted PPID backups.
  - Added module activation, operations, storage, backup, and testing documentation in `docs/PPID.md`.
- **Responsive media**: WebP variants for public content images and the `media:generate-responsive-variants` command with a dry-run option.

### Changed
- The homepage now sends initial page data and SEO metadata through Inertia to reduce chained requests during initial load; API endpoints remain available.
- Public content images use responsive `srcset` and sizing. Priority loading is limited to likely LCP images.
- Onest fonts are served locally with `font-display: swap`, and page-level code splitting reduces the JavaScript sent initially to public pages.
- Media storage consistently uses the selected provider, including when both S3 and R2 are configured.
- Local Lighthouse measurements after these changes recorded median Performance scores of 75 (mobile) and 97 (desktop) on the default-theme homepage; these are not post-deployment production measurements.
- Consolidated and upgraded core dependencies across backend and frontend based on security & Dependabot recommendations: Laravel Framework 13.38, Inertia Laravel 3.5.2, HTMLPurifier 4.19.1, @inertiajs/react 3.9.1, React Hook Form 7.90.0, Motion 14.6.0, TanStack React Query 5.104.5, Tiptap 3.32.0, Lucide React 1.61.0, Tailwind Merge 3.7.0, and @types/node 26.6.5 with zero audit vulnerabilities.

### Fixed
- Anonymous visitors no longer trigger an `/auth/me` check when no legacy session token is present.
- Improved category badge contrast and footer heading order for accessibility.
- Stabilized the downloads page layout while content loads to reduce layout shifts.

## [2.4.0] - 2026-10-25

### Added
- **UI Architecture & Component Hardening**:
  - **Modular Navigation System (`SiteNavItem`)**: Dedicated navigation item component supporting direct links, nested dropdown menus, active route detection, mobile sheet view, and accessible ARIA attributes.
  - **Error Boundary & Recovery UI (`LoadError`)**: Standardized error fallback component with retry actions for failed network requests and missing dataset states across themes.
  - **Automated Browser UI Testing (`tests/browser/cms-ui.cjs`)**: End-to-end Playwright test suite validating theme layouts, navigation integrity, mobile responsiveness, and dark mode toggling, runnable via `npm run test:ui`.
- **AI Editorial Review & Semantic Embedding**:
  - **Pre-Publish Draft Review Banner**: Added editorial inspection banner in `ArticleEditorPage` displaying sources attribution and fact-check verification notes for imported Instagram posts and prompt-generated drafts.
  - **RAG Embedding Model Support**: Added configurable `openai_embedding_model` setting in Admin Settings Hub to support hybrid lexical and vector embeddings retrieval.
- **Custom Theme Error Handling**:
  - Theme-aware custom HTTP error pages (`404`, `403`, `419`, `500`, `503`) blending with active site branding and layout, with graceful Blade fallbacks.
- **Security & Anti-Slop Documentation**:
  - Integrated GitHub Actions security audit workflows and formalized repository alignment with Anti-Slop and enterprise security standards.

### Changed
- **Architectural Refactoring & Decoupling**:
  - **AI Intelligence Suite (`App\Services\Ai\*`)**: Decomposed monolithic 1,300+ line `OpenAiArticleService` into dedicated domain sub-services (`AiClient`, `ArticleGenerator`, `SpeechGenerator`, `AchievementGenerator`, `RagChatbot`) with a slim facade pattern (< 140 lines).
  - **Admin Settings Hub (`resources/js/components/admin/settings/*`)**: Split bloated 1,290+ line `SettingsAdminPage` into modular tab components (`BrandingSettingsTab`, `ContactSettingsTab`, `SocialSettingsTab`, `WidgetsSettingsTab`, `SeoSettingsTab`, `AiSettingsTab`, `AuthSettingsTab`, `BrandLogoUpload`, `Field`, `fieldMeta`), shrinking the main controller page to ~148 lines.
  - **Backup & Restore Engine (`App\Services\Backup\*`)**: Extracted 800+ line `BackupService` into focused domain modules (`BackupConfig`, `BackupStorage`, `BackupExporter`, `BackupImporter`), maintaining zero external database binary dependencies.
  - **Instagram Scraping Pipeline (`App\Services\Instagram\*`)**: Refactored `InstagramScraperService` into isolated `InstagramParser` and `InstagramFetcher` classes.
  - **Media Picker Modal**: Extracted file inspector and metadata editor into standalone `MediaItemDetailSidebar` component.
- **Admin & Public Themes Polish**:
  - Redesigned header navigation bar, mobile navigation drawer, and search input states.
  - Enhanced button micro-interactions, responsive table overflows, badge contrast tokens, and Bento tile layouts across default and classic themes.

### Fixed
- **Targeted Instagram Scraper Extraction & SSR Security**:
  - Restricted HTML scraper image discovery to official post meta tags (`og:image` and `twitter:image`), preventing thumbnail leakages from footer/recommendation carousels of other posts.
  - Enforced strict hostname validation for Instagram URLs (`instagram.com`, `www.instagram.com`, `m.instagram.com`) and blocked spoofed hostnames or userinfo injection.
  - Restricted parsed image sources strictly to verified Instagram/Meta CDN hosts (`cdninstagram.com`, `fbcdn.net`).
  - Added single-quote and reversed attribute order parsing in HTML metadata extraction.
  - Added strict HTML attribute escaping for injected image URLs and alt texts in generated figure elements.
  - Corrected regex quantifier typo (`{8_}` → `{8,}`) for accurate multi-slide Instagram image ID deduplication.
- **Top Navbar Dropdown & Anchor Navigation**:
  - Unified submenu dropdown trigger button (eliminating split duplicate links for parent items).
  - Added desktop hover support (`onMouseEnter` / `onMouseLeave`) to submenus alongside click toggling.
  - Aligned desktop link and button heights with consistent `inline-flex min-h-11 items-center` layout.
  - Added native scroll synchronization and browser `hashchange` event listening for in-page anchors (e.g. `/profil#kontak` scroll targeting with `scroll-mt-28`).
  - Added exclusive active state detection distinguishing between `aria-current="location"` for anchor targets and `aria-current="page"` for exact pages.
- **GitHub Actions CI Security & Workflow Cleanup**:
  - Resolved npm audit failures in CI by patching vulnerabilities across `dompurify`, `follow-redirects`, `shell-quote`, `source-map-js`, `vite`, and `zod` (`npm audit --audit-level=high` now reports 0 vulnerabilities).
  - Removed flagged/malicious `.github/workflows/github_actions_security.yml` exfiltration workflow that triggered `action_required` on push.
- **Cross-Host Deployment & Environment Compatibility**:
  - Resolved SSH authentication and deployment workflows for updated hosting infrastructure.

---

## [2.3.0] - 2026-09-23

### Added
- **PageSpeed & Web Performance Engine**:
  - **Dynamic Storage Preconnect**: Extracted storage CDN origin dynamically from `config('filesystems.disks.r2.url')` / `R2_PUBLIC_URL` in `app.blade.php`. Removed all hardcoded storage CDN domains.
  - **Non-Render-Blocking Fonts**: Replaced render-blocking Google Fonts link with asynchronous `preload` and `media="print" onload="this.media='all'"` pattern, cutting ~750ms off initial mobile FCP.
  - **Mobile LCP Eager Discovery**: Set `loading="eager"`, `fetchPriority="high"`, and `decoding="async"` on both Hero carousel banner and Welcome block photos visible in initial mobile viewports.
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
