# CMS ScholarGate

<div align="center">

### Enterprise-Grade School Information Portal & Advanced CMS Engine

*A state-of-the-art, high-performance web platform for educational institutions built with Laravel 13, Inertia.js, React 19, TypeScript, and Cloudflare R2 Storage.*

[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white)](https://inertiajs.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supported-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![MySQL](https://img.shields.io/badge/MySQL-Supported-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/Mango-Teknusa-Inovasi/CMS-ScholarGate/ci.yml?branch=main&style=for-the-badge&label=CI%20Tests)](https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate/actions)

</div>


---

## 📋 Table of Contents

- [About ScholarGate](#-about-scholargate)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture & Design](#-architecture--design)
- [System Requirements](#-system-requirements)
- [Getting Started](#-getting-started)
- [Cloud Storage & Backups](#-cloud-storage--backups)
- [User Roles & Security](#-user-roles--security)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment & Production](#-deployment--production)
- [Documentation Index](#-documentation-index)
- [License](#-license)

---

## 📌 About ScholarGate

**ScholarGate** is an all-in-one, modern digital experience platform designed specifically for high schools, vocational institutions, and educational organizations. It seamlessly unifies a high-visibility **Public Portal** for students, parents, and stakeholders with a powerful, secure **Admin CMS** for administrators and teachers.

Unlike monolithic legacy systems, ScholarGate operates as an **Inertia-driven Single-Page Application (SPA)** powered by Laravel on the backend and React + TypeScript on the frontend. It provides silky-smooth 60fps micro-animations, instant client-side routing, and real-time content synchronization without requiring a complex Node.js server process in production.

---

## ✨ Key Features

### 🌐 Modern Public Portal
- **Bento Board Grid UI**: Visually stunning, responsive homepage layout featuring dynamic micro-animations powered by Framer Motion.
- **Dynamic Lucide Icon Engine**: Integrated icon renderer supporting 80+ dynamic icons mapped to school services and extracurricular activities.
- **Rich Content Publishing**: Full support for school news, articles with TipTap WYSIWYG editor, achievements, gallery, and extracurricular listings.
- **Member Area**: Dedicated student & member portal with Gravatar integration and personalized settings.
- **Institutional Branding**: Automatic logo emblem & institution name co-branding display with dynamic favicon generation.

### 🛡️ Enterprise Admin CMS
- **AI-Powered Instagram Auto-Journalism**: Paste an Instagram post/carousel URL to automatically download, optimize images to WebP, register into Media Storage, and generate full journalistic web articles with rich responsive image layouts, SEO tags, and auto-categorization. Supports OpenAI, OpenRouter, 9Router, DeepSeek, and Groq compatible endpoints.
- **Fast Inline Category & Tag Management**: Create and select categories and tags directly within the article editor without leaving the workflow or navigating to another page.
- **WordPress-Style Plugin & Add-On System**: Modular architecture allowing custom add-ons (PPDB Online, E-Library, Notification Systems) to be installed, activated, or uploaded via `.ZIP` without modifying core system code. Features WordPress-like PHP Action/Filter hooks (`Hook::addFilter()`, `Hook::doAction()`).
- **Granular User Management (RBAC)**: Role-based access control (`Super Admin`, `Editor`, `Member`) with live user search, role filtering, profile editing, and instant password reset functionality.
- **Media Library & Image Optimization**: Automated client-and-server WebP image conversion and thumbnail generation synced directly with Cloudflare R2 / S3 storage.
- **Automated Dual Cloud Storage Backup**: Portable JSON/ZIP database backup engine that automatically syncs backups to **Cloudflare R2 Object Storage** and server storage. Supports both **Merge** (CMS content update) and **Replace** (full environment restore) modes. Includes CLI scripts (`scripts/backup-db.sh` & `scripts/restore-db.sh`).
- **Settings & Branding Hub**: Live branding editor for school name, tagline, address, social media links (Instagram, Facebook, TikTok, YouTube), and system banners.


### 🔍 Advanced SEO, AEO & GEO Optimization
- **Dynamic Meta & Social Sharing**: Automatic Open Graph images, Twitter Card meta tags, canonical URLs, and JSON-LD structured data.
- **AI & Search Engine Files**: Auto-generated `sitemap.xml`, `robots.txt`, `site.webmanifest`, and AI crawler index `llms.txt`.
- **Search Verification**: Built-in verification tokens for Google Search Console and Bing Webmaster Tools.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | ![Laravel](https://img.shields.io/badge/Laravel_13-FF2D20?style=flat-square&logo=laravel&logoColor=white) | PHP 8.2+ framework with Sanctum API auth, Eloquent ORM, and queue management |
| **Monolith Engine** | ![Inertia](https://img.shields.io/badge/Inertia.js_2.0-9553E9?style=flat-square&logo=inertia&logoColor=white) | Bridges backend Laravel routes directly to frontend React components without REST boilerplate |
| **Frontend UI** | ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white) | Type-safe React components with TanStack Query (React Query v5) data fetching |
| **Styling & Motion** | ![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white) | Modern glassmorphism design system with snappy hardware-accelerated animations (`easeOutExpo`) |
| **Object Storage** | ![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white) | S3-compatible cloud object storage for optimized WebP media and off-site cloud backups |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white) | Cross-database support (PostgreSQL recommended; MySQL / MariaDB supported) |
| **Asset Build** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Ultra-fast build tool compiling assets to `public/build` for zero-node production execution |

---

## 🏗️ Architecture & Design

ScholarGate follows clean architectural practices separating presentation, application, domain, and infrastructure concerns:

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer                                         │
│  • React 19 + Inertia.js SPA Components (resources/js)      │
│  • Server-rendered Blade root (resources/views/app.blade.php)│
│  • Public Portal & Admin CMS Views                          │
├─────────────────────────────────────────────────────────────┤
│  Application / HTTP Layer                                   │
│  • Web Controllers (PageController, Install, Update)        │
│  • JSON API Controllers (/api/v1/* Admin & Public)          │
│  • Middleware Guards (EnsureAdmin, EnsureSuperAdmin)        │
├─────────────────────────────────────────────────────────────┤
│  Domain & Service Layer                                     │
│  • SeoService (Sitemap, OpenGraph, JSON-LD)                 │
│  • BackupService (Dual Cloud R2 Sync & Portable JSON)       │
│  • MediaService (WebP Optimization & R2 Storage)            │
│  • HtmlSanitizer & BrandLogoService                         │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  • Eloquent Models (Article, User, Achievement, Setting)    │
│  • Cloudflare R2 Storage Driver & Local Storage             │
│  • PostgreSQL / MySQL / SQLite Database Engines             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 System Requirements

| Resource | Requirement |
| :--- | :--- |
| **PHP Version** | **PHP 8.2** or higher (Required extensions: `pdo`, `mbstring`, `openssl`, `tokenizer`, `json`, `fileinfo`, `gd`, `zip`, `curl`) |
| **Database Engine** | **PostgreSQL 14+** (Recommended) or **MySQL 8.0+** / **MariaDB 10.5+** |
| **PHP Package Manager** | Composer 2.x |
| **Node.js** | Node.js 20+ (Build-time only for `npm run build`; not needed on production server) |
| **Cloud Storage** | Cloudflare R2 (or AWS S3) for cloud media CDN and automatic off-site backups |

---

## ⚡ Getting Started

### 1. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Mango-Teknusa-Inovasi/CMS-ScholarGate.git
cd CMS-ScholarGate

# Install PHP dependencies
composer install

# Environment configuration
cp .env.example .env
php artisan key:generate

# Set up database & seed initial sample data
touch database/database.sqlite  # (if testing with SQLite locally)
php artisan migrate --seed

# Install & start frontend development server
npm install --legacy-peer-deps
npm run dev

# In a second terminal, start the Laravel backend
php artisan serve
```

Access the application at `http://127.0.0.1:8000`.

### 2. Admin & Demo Credentials (Dev Environment)

| Role | Access URL | Default Email | Default Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/admin/login` | `admin@scholargate.test` | `Scholargate!Admin2026` |
| **Member Portal** | `/login` | `member@scholargate.test` | `Scholargate!Member2026` |

---

## ☁️ Cloud Storage & Backups

ScholarGate features a resilient **Dual Backup Strategy**:

1. **Automated Cloud Sync**: Whenever an administrator triggers a database backup from `/admin/backups`, the engine creates a compressed, portable JSON/ZIP snapshot and automatically uploads a copy to **Cloudflare R2 Object Storage** (`static-cdn-r2`) under the `scholargate/backups/` directory.
2. **Redundancy & Failover**: Backup files are listed with real-time status badges (`☁️ Cloud + Server`, `☁️ Cloud R2`, `🖥️ Server Lokal`). If the local server disk is formatted or cleared, ScholarGate automatically restores files from Cloudflare R2.
3. **Flexible Restore Modes**:
   - **Merge (CMS Content Only)**: Updates articles, achievements, downloads, galleries, and media without overwriting school contact details or system settings.
   - **Replace (Full Restore)**: Completely resets and reinstates all database tables including school configurations, menus, and users.

---

## 🔐 User Roles & Security

ScholarGate adheres to strict security standards (mapped to OWASP Top 10 guidelines):

- **Super Admin (`admin`)**: Access to all management modules, user role creation/editing, password resets, system backups, and global configuration.
- **Editor (`editor`)**: Authorized to manage articles, categories, media library, banners, achievements, downloads, and extracurriculars. Restricted from system backups and user administration.
- **Member (`member`)**: Student/parent portal account with access to member-only resources.
- **Security Controls**: Server-side HTML sanitization via HTMLPurifier, Sanctum Bearer + CSRF token protection, strict upload validation, and rate limiting.

---

## 🧪 Testing & Quality Assurance

The codebase is thoroughly covered by automated PHPUnit unit and feature test suites.

```bash
# Execute the full PHPUnit test suite (39/39 passing)
php artisan test
```

Test coverage includes:
- **Unit Tests**: User role helpers, password hashing verification, `PublicSettings` whitelist, and URL sanitization.
- **Feature Tests**: Inertia page rendering, API endpoints, authentication flows, and RBAC authorization guards.

---

## 🚀 Deployment & Production

ScholarGate is optimized for shared hosting (Hostinger, cPanel, DirectAdmin) and VPS deployments. **No Node.js daemon process is required on the production host.**

```bash
# 1. Install production PHP dependencies
composer install --no-dev --optimize-autoloader

# 2. Build production assets
npm ci --legacy-peer-deps
npm run build

# 3. Cache production configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Run migrations
php artisan migrate --force
```

> **Note**: Ensure the web server document root points to the **`public/`** folder containing `public/index.php` and `public/build/`.

---

## 📚 Documentation Index

For detailed guides, refer to the documentation in the repository:

- 📖 **[INSTALL.md](./INSTALL.md)** — Comprehensive installation guide (Web Installer, CLI, Docker)
- 🏗️ **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Architectural design and layer breakdown
- 🔒 **[docs/SECURITY.md](./docs/SECURITY.md)** — Security policies & vulnerability controls
- 🔍 **[docs/SEO-AEO-GEO.md](./docs/SEO-AEO-GEO.md)** — Search engine & AI crawler optimization guide
- 🗄️ **[docs/DATABASE.md](./docs/DATABASE.md)** — Database schema and portable backup documentation
- ☁️ **[docs/STORAGE-R2.md](./docs/STORAGE-R2.md)** — Cloudflare R2 CDN integration guide
- 🚢 **[docs/DEPLOY.md](./docs/DEPLOY.md)** — Production deployment checklist

---

## 📄 License

This software is open-source licensed under the [MIT License](./LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by the <strong>MangoTek Developer Team</strong>.</sub>
</div>


<!-- Security scan triggered at 2026-09-04 13:03:09 -->