# Architecture

**Language:** English  

## Overview

CMS Scholargate is an enterprise-grade **modular monolith**:

- One deployable Laravel 13 application  
- Inertia.js 2.0 + React 19 for UI and micro-interactions  
- JSON API under `/api/v1` for asynchronous mutations, client fetching, and AI endpoints  
- Zero separate Node.js server requirement in production  

## Application Layers

| Layer | Location | Responsibility |
|---|---|---|
| **Presentation** | `resources/js`, `resources/views` | UI components, pages, Blade root HTML/meta, TipTap RichTextEditor with embedded AI Copilot |
| **HTTP / Application** | `app/Http`, `routes/` | Controllers (Web, API, AI), middleware, request validation, Socialite/OIDC auth |
| **Domain & AI Services** | `app/Services` | `OpenAiArticleService`, `InstagramArticleImportService`, `SeoService`, `BackupService`, `BrandLogoService`, `MediaService`, `HtmlSanitizer` |
| **Support / Infrastructure** | `app/Support`, `app/Models`, config | Cloudflare R2 / S3 storage, settings whitelist (`PublicSettings`), Eloquent models, plugin hook system |

## Traffic & AI Pipeline Flow

```
Browser ──▶ public/index.php ──▶ Middleware Stack (Sanctum / Session / Web)
                │
                ├─ Web / Inertia routes ──▶ PageController ──▶ React 19 SPA Page
                │
                ├─ /api/v1/admin/ai/* ────▶ ArticleAiController
                │                              │
                │                              ▼
                │                    OpenAiArticleService
                │                              │
                │                    [Prompt Injection Sanitizer]
                │                    [Brand Persona Masking]
                │                              │
                │                              ▼
                │                    OpenAI / OpenRouter / DeepSeek API
                │
                └─ /api/v1/* (CRUD) ──────▶ API Resource Controllers ──▶ Database / R2
```

## Security Boundaries

- Public vs `auth:sanctum` vs `member` vs `editor` vs `admin` (RBAC)
- Settings whitelist (`PublicSettings`)
- HTML sanitization on write via `HtmlPurifier`
- Prompt injection barrier (`filterPromptInjection` and `<untrusted_material>` wrapping)
- Backend AI model name isolation (`custom_ai_model_name`)
- CSRF protection for session mutations + Sanctum tokens for API endpoints

## Testing Strategy

| Type | Path | Examples |
|---|---|---|
| Unit | `tests/Unit` | Helpers: SafeUrl, PublicSettings, SEO normalize, roles, backup serializer |
| Feature | `tests/Feature` | HTTP: home Inertia, public API, login, social auth, AI generators, admin RBAC guards |

Run: `php artisan test` (80/80 tests passing)

## Architecture Decisions (ADR)

- **Single Process Monolith**: No dual Node.js + PHP production process; assets are compiled statically with Vite to `public/build`.
- **Stateless RAG & Streaming**: RAG responses reference published articles and profile tabs with prompt-injection defense.
- **Dual Cloud Storage**: Local filesystem fallback with immediate Cloudflare R2 synchronization.
