# CMS ScholarGate

<div align="center">

### Enterprise-Grade School Information Portal & Advanced AI CMS Engine

*A state-of-the-art, high-performance web platform for educational institutions built with Laravel 13, Inertia.js, React 19, TypeScript, Cloudflare R2 Storage, and Built-In Enterprise AI Intelligence.*

[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white)](https://inertiajs.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![AI Engine](https://img.shields.io/badge/AI_Intelligence-OpenAI_·_DeepSeek_·_Groq-8A2BE2?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![CI Tests](https://img.shields.io/badge/Tests-80%20Passed%20(100%25)-success?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/actions)
[![Wiki Docs](https://img.shields.io/badge/Wiki-Dokumentasi%20Bahasa%20Indonesia-007ACC?style=for-the-badge&logo=gitbook&logoColor=white)](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/wiki)

</div>

> [!TIP]
> 🇮🇩 **Documentation in Bahasa Indonesia**:  
> For comprehensive guides, AI Suite configuration, system architecture, plugin development, and deployment tutorials written in **Bahasa Indonesia**, please visit the official **[CMS ScholarGate GitHub Wiki](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/wiki)**.

---

## 📋 Table of Contents

- [About ScholarGate](#-about-scholargate)
- [🤖 ScholarGate Intelligence Suite (Flagship Feature)](#-scholargate-intelligence-suite-flagship-feature)
- [✨ Other Key Features](#-other-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Architecture & Security Design](#️-architecture--security-design)
- [💻 System Requirements](#-system-requirements)
- [⚡ Getting Started](#-getting-started)
- [☁️ Cloud Storage & Dual Backups](#️-cloud-storage--dual-backups)
- [🔐 Authentication, Socialite OIDC & RBAC](#-authentication-socialite-oidc--rbac)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🚀 Deployment & Production](#-deployment--production)
- [📦 Releases & Distribution](#-releases--distribution)
- [📚 Documentation Index](#-documentation-index)
- [📄 License](#-license)

---

## 📌 About ScholarGate

**ScholarGate** is an all-in-one digital experience platform built specifically for high schools, vocational institutions (SMK), and modern educational campuses. It unifies an engaging, responsive **Public Portal** for students, parents, and alumni with an **AI-powered Admin CMS** for educators and journalists.

Unlike traditional educational CMS solutions, ScholarGate operates as an **Inertia-driven Single-Page Application (SPA)** that combines Laravel backend reliability with React 19 micro-interactions. With **zero client layout shifts**, **sub-second page transitions**, and **embedded AI assistants**, ScholarGate streamlines school content creation from hours to minutes.

---

## 🤖 ScholarGate Intelligence Suite (Flagship Feature)

ScholarGate features an end-to-end, enterprise-grade AI engine deeply woven into every content creation surface of the CMS. It empowers administrators and teachers to write compelling, grammatically perfect, and SEO-optimized institutional content effortlessly.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SCHOLARGATE AI INTELLIGENCE                        │
│                                                                         │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │ Universal AI Copilot  │  │ Specialized Gen AI   │  │ Public RAG   │  │
│  │ (Every HTML Editor)   │  │ (Articles, Speeches) │  │ Chatbot      │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  └──────┬───────┘  │
│             │                          │                     │          │
│             ▼                          ▼                     ▼          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Security Shield: Prompt Injection Filter & Brand Persona Masking  │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Providers: OpenAI (GPT-4o) · OpenRouter · DeepSeek · Groq · Custom│  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Universal RichText AI Copilot (Available in Every Editor)
Every HTML text editor across the CMS is equipped with a **✨ Bantuan AI** copilot toolbar button:
- **Tulis Baru / Buat Draf**: Generates structured paragraphs from rough concepts or bullet points.
- **Perbaiki PUEBI & Tata Bahasa**: Corrects typos, punctuation, formal Indonesian vocabulary, and capitalization without altering meaning.
- **Perluas & Detail**: Enriches short paragraphs into detailed, high-context institutional narratives.
- **Ringkas Teks**: Distills lengthy reports or articles into punchy summaries and bullet points.
- **Sesuaikan Nada (Tone Shift)**: Instantly transforms text into *Resmi & Formal*, *Inspiratif & Bangga*, *Hangat & Mengayomi*, or *Visioner*.

### 2. Specialized Content Generators
- **✨ Generator Berita dari Petunjuk Singkat**: In the article editor, input just a event topic and key points; the AI crafts the entire journalistic article: Title, URL Slug, Excerpt, Body (clean HTML with headings, lists, quotes), Category matching, Tags, Focus Keyword, and Meta Descriptions.
- **✨ Generator Sambutan Kepala Sekolah**: Crafts heartfelt and authoritative speeches for the Homepage and Profile page with configurable tone (*Hangat & Mengayomi*, *Visioner*, *Karakter Bangsa*, *Religius*).
- **✨ Generator Keterangan Profil Sekolah**: Generates comprehensive profile tabs (Sejarah, Visi Misi, Budaya Sekolah, Fasilitas Unggulan) formatted with clean semantic HTML.
- **✨ Generator Liputan Prestasi AI**: Generates complete championship news articles, medalist badges, and celebratory quotes from tournament metadata.

### 3. Wide Two-Column Achievement Editor
- The **Prestasi (Achievements)** module features an expansive, article-like two-column layout:
  - **Main Canvas**: Generous workspace for the rich text editor with full AI copilot integration, titles, and excerpts.
  - **Sidebar Metadata**: 16:9 Cover image uploader, championship badge label, publication status, ranking order, and featured toggle.

### 4. Automated Instagram Journalism
- Paste an Instagram post or carousel URL to automatically extract high-res images, convert them to WebP, register them in the Media Library, and construct a full journalistic web article with responsive visual layouts and SEO tags.

### 5. RAG School Assistant Chatbot & Hardened AI Security
- **Public AI Chatbot**: Visitors can ask questions about admissions, school culture, curriculum, and extracurriculars, answered via Retrieval-Augmented Generation (RAG) referencing published school content.
- **Prompt Injection Defense**: Sanitizes all input using `filterPromptInjection` and encapsulates untrusted user input within boundary isolation tags (`<untrusted_material>`).
- **Brand Persona & Model Masking**: Protects proprietary setup by masking backend models behind a configurable institutional name (`custom_ai_model_name`).
- **Flexible Multi-Provider**: Compatible with standard OpenAI API endpoints, OpenRouter, 9Router, DeepSeek, and Groq.

---

## ✨ Other Key Features

### 🌐 Modern Public Portal
- **Bento Board Grid UI**: Responsive homepage grid with smooth 60fps micro-animations powered by Framer Motion.
- **Dynamic Lucide Icon Engine**: 80+ dynamic icons mapped to school programs, facilities, and extracurriculars.
- **Customizable Article Sidebar Widgets**: Dynamic widgets (Search, Categories, Popular Posts, Download Shortcuts, School Info) configurable by the administrator.
- **Member Area**: Dedicated student & alumnus portal with Gravatar avatars and profile management.
- **Institutional Branding**: Dynamic favicon generator, school emblem co-branding, and custom color accents.

### 🛡️ Enterprise Admin CMS & Settings Hub
- **Tabbed Settings Dashboard**: Clean, organized configuration tabs for *Umum*, *AI & RAG Intelligence*, *Social Login (OIDC)*, *Branding*, *SEO/AEO*, *Backup & Cloud*, and *Maintenance*.
- **WordPress-Style Plugin Architecture**: Extend functionality (e.g. PPDB Online, Digital Library) via modular `.ZIP` packages with action & filter hooks (`Hook::addFilter()`, `Hook::doAction()`).
- **Universal Socialite & OIDC Login**: Support for Google, GitHub, Authentik, Keycloak, and custom OpenID Connect providers with automatic RBAC synchronization.
- **Granular RBAC**: Role-based access control with live user search, status management, and upgrade/downgrade between `Admin`, `Editor`, and `Member`.

### 🔍 Advanced SEO, AEO & GEO Optimization
- **Dynamic Structured Data**: Automatic Open Graph tags, Twitter Cards, canonical links, and Schema.org JSON-LD.
- **Search & AI Engine Feeds**: Auto-generated `sitemap.xml`, `robots.txt`, `site.webmanifest`, and AI crawler index `llms.txt`.
- **Search Verification**: Built-in verification tokens for Google Search Console and Bing Webmaster Tools.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | ![Laravel](https://img.shields.io/badge/Laravel_13-FF2D20?style=flat-square&logo=laravel&logoColor=white) | PHP 8.2+ core with Sanctum API auth, Eloquent ORM, and queue pipelines |
| **Monolith Bridge** | ![Inertia](https://img.shields.io/badge/Inertia.js_2.0-9553E9?style=flat-square&logo=inertia&logoColor=white) | Direct backend-to-React component state binding without REST boilerplate |
| **Frontend UI** | ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white) | Type-safe React components with TanStack Query v5 data synchronization |
| **Styling & Motion** | ![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white) | Modern glassmorphic interface with hardware-accelerated animations |
| **AI Intelligence** | ![OpenAI](https://img.shields.io/badge/AI_Engine-OpenAI_Compatible-8A2BE2?style=flat-square&logo=openai&logoColor=white) | Universal RichText copilot, prompt article generator, and RAG chatbot |
| **Cloud Object Storage** | ![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white) | S3-compatible cloud storage for WebP media and off-site cloud backups |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white) | PostgreSQL 14+ (Recommended), MySQL 8.0+, MariaDB 10.5+, or SQLite |
| **Asset Compiler** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Ultra-fast asset bundler producing zero-node production builds |

---

## 🏗️ Architecture & Security Design

ScholarGate follows a modular monolith architecture separating presentation, domain, and infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer                                         │
│  • React 19 + Inertia.js Single-Page Components             │
│  • Blade root template with dynamic SEO & JSON-LD metadata   │
│  • Universal RichTextEditor with AI Copilot toolbar         │
├─────────────────────────────────────────────────────────────┤
│  Application / HTTP Layer                                   │
│  • Web Controllers (Inertia PageController, Install, Update)│
│  • JSON API Controllers (/api/v1/* Admin, Public & AI)      │
│  • Auth Guards (Sanctum, Socialite OIDC, Admin & SuperAdmin)│
├─────────────────────────────────────────────────────────────┤
│  Domain & AI Service Layer                                  │
│  • OpenAiArticleService (Universal Copilot, Prompt Gen, RAG)│
│  • InstagramArticleImportService & InstagramScraperService  │
│  • BackupService (Dual Cloudflare R2 Sync & Portable JSON)  │
│  • SeoService & HtmlSanitizer (HTMLPurifier)                │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  • Eloquent Models (Article, User, Achievement, Setting)    │
│  • Cloudflare R2 / S3 Storage Driver & Local Storage Fallback│
│  • PostgreSQL / MySQL / SQLite Database Drivers             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 System Requirements

| Requirement | Specification |
| :--- | :--- |
| **PHP Version** | **PHP 8.2** or higher (Required extensions: `pdo`, `mbstring`, `openssl`, `tokenizer`, `json`, `fileinfo`, `gd`, `zip`, `curl`) |
| **Database Engine** | **PostgreSQL 14+** (Recommended) or **MySQL 8.0+** / **MariaDB 10.5+** / SQLite |
| **Package Manager** | Composer 2.x |
| **Node.js** | Node.js 20+ (Build-time only; not needed on production hosting) |
| **Object Storage (Optional)** | Cloudflare R2 (or AWS S3) for cloud media CDN and automatic off-site backups |
| **AI Provider (Optional)** | OpenAI API Key, OpenRouter, DeepSeek, or any OpenAI-compatible API endpoint |

---

## ⚡ Getting Started

### 1. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate.git
cd CMS-ScholarGate

# Install backend dependencies
composer install

# Configure environment file
cp .env.example .env
php artisan key:generate

# Set up local database & seed sample data
touch database/database.sqlite
php artisan migrate --seed

# Install frontend dependencies & run build watcher
npm install --legacy-peer-deps
npm run dev

# In another terminal, start the Laravel backend server
php artisan serve
```

Access the portal at `http://127.0.0.1:8000`.

### 2. Default Development Credentials

| Role | Access URL | Default Email | Default Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/admin/login` | `admin@scholargate.test` | `Scholargate!Admin2026` |
| **Member** | `/login` | `member@scholargate.test` | `Scholargate!Member2026` |

---

## ☁️ Cloud Storage & Dual Backups

ScholarGate features a resilient **Dual Backup Engine**:

1. **Automatic Cloud Sync**: Every database backup created via `/admin/backups` produces a portable JSON snapshot and immediately uploads a replica to **Cloudflare R2 Object Storage** (`static-cdn-r2`).
2. **Redundancy & Failover**: Backups display status indicators (`☁️ Cloud + Server`, `☁️ Cloud R2`, `🖥️ Server Lokal`). In case of local disk loss, backups are seamlessly retrieved from Cloudflare R2.
3. **Flexible Restore Modes**:
   - **Merge (Content Only)**: Updates articles, achievements, downloads, and galleries without overwriting site contact settings or administrator accounts.
   - **Replace (Full Restore)**: Completely resets the database to the snapshot state.

---

## 🔐 Authentication, Socialite OIDC & RBAC

- **Multi-Provider Social Login**: Native support for **Google**, **GitHub**, **Authentik**, **Keycloak**, and custom OpenID Connect (OIDC) endpoints.
- **Granular Roles**:
  - `admin`: Full system access, settings, backups, user management, and AI configuration.
  - `editor`: Content publishing (Articles, Prestasi, Gallery, Downloads, Ekstrakurikuler).
  - `member`: Registered students, alumni, and parents accessing portal features.
- **Automatic Token Synchronization**: Unified token management bridging session-based Inertia navigation and API Sanctum tokens.

---

## 🧪 Testing & Quality Assurance

ScholarGate is verified through an extensive automated PHPUnit test suite:

```bash
# Run all automated tests (80/80 passing)
php artisan test

# Run AI Generators test suite specifically
php artisan test --filter=AiGeneratorsTest
```

Test coverage includes:
- **AI Generators & Security**: Universal copilot, prompt generator, welcome address, profile generator, achievement news, prompt injection defense, and model name masking.
- **Authentication & RBAC**: Socialite OIDC, Sanctum API tokens, member role assignment, and privilege escalation defense.
- **Content & Backups**: Portable JSON dual backup engine, Instagram scraper, and SEO structured data.

---

## 🚀 Deployment & Production

ScholarGate is optimized for deployment on standard Linux VPS (Ubuntu/Debian) or shared hosting (Hostinger, cPanel, DirectAdmin). **No Node.js daemon is required on the production server.**

```bash
# 1. Install production PHP packages
composer install --no-dev --optimize-autoloader

# 2. Compile frontend assets
npm ci --legacy-peer-deps
npm run build

# 3. Cache configuration and routing
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Execute database migrations
php artisan migrate --force
```

> [!NOTE]
> Point your web server document root directly to the **`public/`** directory.

---

## 📦 Releases & Distribution

Official release archives are published under [Releases](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/releases).

Each release includes:
- **`scholargate-v2.2.0.zip`**: Pre-built, production-ready distribution package with compiled production assets (`public/build`), optimized composer autoloaders, and web installer ready to run.

---

## 📚 Documentation Index

> 🇮🇩 **Documentation in Bahasa Indonesia**:  
> To read complete tutorials, architectures, and system references written in Bahasa Indonesia, please explore the official **[CMS ScholarGate GitHub Wiki](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/wiki)**.

- 🌐 **[Official GitHub Wiki (Bahasa Indonesia)](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/wiki)** — Complete end-to-end documentation from Introduction to Contact & Support
- 📖 **[INSTALL.md](./INSTALL.md)** — Installation guide (Web Installer, CLI, VPS, Docker)
- 📝 **[CHANGELOG.md](./CHANGELOG.md)** — Release history and detailed changelog
- 🔌 **[docs/PLUGINS.md](./docs/PLUGINS.md)** — Plugin development guide, hooks system & distribution
- 🏗️ **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System architecture & AI pipeline
- 🔒 **[docs/SECURITY.md](./docs/SECURITY.md)** — Security policies, prompt injection shielding & RBAC
- 🔍 **[docs/SEO-AEO-GEO.md](./docs/SEO-AEO-GEO.md)** — Search engine, AEO, and AI crawler optimization
- 🗄️ **[docs/DATABASE.md](./docs/DATABASE.md)** — Database schema and portable backup documentation
- ☁️ **[docs/STORAGE-R2.md](./docs/STORAGE-R2.md)** — Cloudflare R2 CDN integration guide
- 🚢 **[docs/DEPLOY.md](./docs/DEPLOY.md)** — Production deployment checklist

---

## 📄 License

This software is open-source licensed under the [MIT License](./LICENSE).

<div align="center">
  <sub>Developed with ❤️ by the <strong>MangoTek Inovasi Developer Team</strong>.</sub>
</div>