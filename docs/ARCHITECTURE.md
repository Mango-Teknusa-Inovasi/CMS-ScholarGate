# Architecture

**Language:** English  

## Overview

CMS Scholargate is a **modular monolith**:

- One deployable Laravel application  
- Inertia + React for UI  
- JSON API under `/api/v1` for mutations and client data fetching  
- No separate SPA hosting requirement  

## Application layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Presentation** | `resources/js`, `resources/views` | UI components, pages, Blade root HTML/meta |
| **HTTP / application** | `app/Http`, `routes/` | Controllers, middleware, request validation |
| **Domain services** | `app/Services` | SEO, backup, brand logo, image optimize, HTML sanitize |
| **Support / infrastructure** | `app/Support`, `app/Models`, config | Storage, settings whitelist, installer, Eloquent models |

Traffic flow (simplified):

```
Browser ──▶ public/index.php ──▶ Middleware stack
                │
                ├─ Web/Inertia routes ──▶ PageController ──▶ React page
                │
                └─ /api/v1/* ──▶ API controllers ──▶ Services / Models
```

## Security boundaries

- Public vs `auth:sanctum` vs `admin` vs `super_admin`
- Settings whitelist (`PublicSettings`)
- HTML sanitization on write
- CSRF for session-authenticated mutations

## Testing strategy

| Type | Path | Examples |
|------|------|----------|
| Unit | `tests/Unit` | Pure helpers: SafeUrl, PublicSettings, SEO normalize, roles |
| Feature | `tests/Feature` | HTTP: home Inertia, public API, login, admin 403 |

Run: `php artisan test`

## Not used

- Network **OSI 7-layer** modeling (not applicable as product structure)
- Microservices split
- Dual production Node process
