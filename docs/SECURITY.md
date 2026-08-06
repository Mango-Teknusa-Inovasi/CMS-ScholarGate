# Security Policy & Controls

| Field | Value |
|-------|--------|
| **Document** | Security Policy & Technical Controls |
| **Product** | CMS Scholargate |
| **Language** | English |
| **Version** | 2.0 |
| **Last updated** | 2026-08-06 |
| **Classification** | Public (implementation inventory; no secrets) |
| **Standards alignment** | OWASP Top 10 (2021), OWASP ASVS L1/L2 themes, OWASP Secure Headers, NIST SSDF practices (selected) |

This document describes **security objectives**, **controls implemented in code**, **deployment requirements**, **residual risks**, and **verification**. It is intended for operators, auditors, and contributors.

---

## 1. Scope

### In scope

- Web application (Laravel 13 + Inertia + React)
- JSON API (`/api/v1/*`)
- Installer (`/install`) and updater (`/update`)
- Session and Sanctum authentication
- Media storage (local / Cloudflare R2)
- Portable backup & restore
- Security-related configuration and HTTP headers

### Out of scope

- Physical data centre / cloud account hardening (customer responsibility)
- Browser extension security
- Third-party CDN / DNS provider compromise (except integration guidance)
- Full ISO 27001 ISMS documentation (this is a product control inventory, not an ISMS)

### Trust model

| Zone | Trust |
|------|--------|
| Public internet | Untrusted |
| Authenticated members | Low privilege |
| CMS editors | Content privilege only |
| Super admins (`role=admin`) | Highest app privilege |
| Hosting filesystem / `.env` | Critical secrets boundary |
| Object storage (R2) | Trusted for media objects when credentials correct |

---

## 2. Security objectives

1. **Confidentiality** — Protect credentials, tokens, backups, and non-public drafts.
2. **Integrity** — Prevent unauthorized content change, mass assignment, and path traversal in media.
3. **Availability** — Rate-limit abuse surfaces; avoid destructive ops without privilege + confirmation.
4. **Accountability** — Separate roles; sensitive ops limited to super admin.
5. **Safe defaults** — Installer locks; SVG blocked; settings whitelist; HTML sanitized on write.

---

## 3. OWASP Top 10 (2021) mapping

| ID | Risk | Status | Controls |
|----|------|--------|----------|
| **A01** Broken Access Control | Mitigated | Role middleware `admin` / `super_admin`; member tokens denied on `/api/v1/admin/*`; self-delete blocked for users |
| **A02** Cryptographic Failures | Mitigated | Password cast `hashed` (bcrypt/argon via Laravel); HTTPS + HSTS when secure; Sanctum token expiration; no password export in backups |
| **A03** Injection | Mitigated | Eloquent/query builder; no user-controlled raw SQL; HTML sanitized server-side (HTMLPurifier) + client DOMPurify |
| **A04** Insecure Design | Mitigated | Installer lock + `looksInstalled()`; update requires super-admin password; backup restore default excludes users |
| **A05** Security Misconfiguration | Operator-dependent | Documented production `.env` (debug off, install locked); security headers middleware; CORS allowlist |
| **A06** Vulnerable Components | Operator-dependent | Composer / npm lockfiles; CI installs; keep `composer update` / Dependabot as ops process |
| **A07** Identification & Auth Failures | Mitigated | Separate member/admin login; rate limits; session + CSRF; optional Bearer; token expiry env |
| **A08** Software & Data Integrity | Partial | No supply-chain signing of releases yet; backup path validation; fillable mass-assignment filter |
| **A09** Logging & Monitoring | Partial | Laravel logs; failed restore reported; no full SIEM / audit log UI yet |
| **A10** SSRF | Low exposure | Outbound limited to configured R2/S3 SDK; no user-controlled arbitrary HTTP fetch |

---

## 4. Authentication & session management

### 4.1 Mechanisms

| Mechanism | Use |
|-----------|-----|
| **Web session** (`auth` guard, cookies) | Inertia UI, preferred for browser |
| **Sanctum personal access tokens** | Optional for API clients; still used for admin JSON |
| **CSRF** | Required for cookie-authenticated state changes (`X-XSRF-TOKEN` / cookie) |

Login flows:

- `POST /api/v1/auth/member/login` — any valid user; issues session (if present) + token name `member-spa`
- `POST /api/v1/auth/admin/login` — **admin/editor only**; token name `admin-spa`
- Register: always `role=member` (cannot self-elevate)

### 4.2 Password handling

- Stored via Eloquent `password` cast **`hashed`** — **never** double-hash with `Hash::make` on create.
- Minimum length enforced on register / admin create (≥ 8).
- Password hashes **excluded** from JSON backups.

### 4.3 Session cookie recommendations (production)

| Setting | Recommended production value |
|---------|------------------------------|
| `SESSION_DRIVER` | `database` or `redis` |
| `SESSION_LIFETIME` | 120 (or stricter) |
| `SESSION_ENCRYPT` | `true` |
| `SESSION_SECURE_COOKIE` | `true` (HTTPS only) |
| `SESSION_HTTP_ONLY` | `true` (default) |
| `SESSION_SAME_SITE` | `lax` (or `strict` if UX allows) |
| `APP_URL` | Public `https://…` origin |
| `SANCTUM_STATEFUL_DOMAINS` | Production host(s) only |
| `SANCTUM_TOKEN_EXPIRATION` | Minutes (default **20160** = 14 days) |

### 4.4 CSRF

- Browser UI: axios `withCredentials` + `ensureCsrf()` → `/sanctum/csrf-cookie`.
- Web forms (`/install`, `/update`): Laravel `@csrf`.
- CSRF exceptions list is **empty** by default (mutations need CSRF or Bearer).

---

## 5. Authorization

| Role | Capabilities |
|------|----------------|
| `member` | Public portal account features; **no** CMS admin API |
| `editor` | CMS content & media; **not** users / backup restore |
| `admin` (super) | Full CMS + users + backup/restore + `/update` |

Middleware:

- `auth:sanctum` — authenticated API
- `admin` — `User::isAdmin()` (`admin` \| `editor`)
- `super_admin` — `User::isSuperAdmin()` (`admin` only)

Inertia admin routes use `auth` + `admin` (+ `super_admin` where needed).

---

## 6. Input validation & XSS

### 6.1 Server-side HTML

- `HtmlSanitizer` (HTMLPurifier) on content save (articles, welcome, achievements, profile tabs/FAQ, restore path).
- Re-sanitize legacy content: `php artisan scholargate:sanitize-html`.

### 6.2 Client-side HTML

- Public rendering via **`SafeHtml` + DOMPurify** only.

### 6.3 URLs

- `SafeUrl::normalize` / `safeHref` block:
  - `javascript:`, `data:`, `vbscript:`, `file:`
- Applied to menu/CTA/link fields and related admin resources.

### 6.4 Settings

- Only keys in `PublicSettings::KEYS` are readable/writable via public or admin settings APIs (whitelist).

### 6.5 Mass assignment

- Eloquent `$fillable` / model attributes.
- Generic resource admin additionally **intersects request keys with model fillable**.

---

## 7. File upload security

| Control | Implementation |
|---------|----------------|
| No SVG | Rejected at validation / MIME checks (XSS vector if served inline) |
| Raster path | Multipart → local process → WebP optimize → storage |
| Non-raster | Presign PUT → confirm; path must match `uploads/[A-Za-z0-9_./-]+` |
| Path traversal | Reject `..`, null bytes, non-`uploads/` prefixes |
| Disk spoofing | Confirm endpoint **ignores client `disk`**; uses `MediaStorage::diskName()` |
| Existence check | Object must exist on storage before media library registration |
| Size limits | Validation `max:` on uploads; backup JSON size cap in service |

Brand logo pipeline (`POST /api/v1/admin/settings/logo`): admin-only, raster only, generates favicon variants under controlled paths.

---

## 8. Backup & restore

| Control | Detail |
|---------|--------|
| Privilege | Super admin only |
| Secrets | Password hashes never exported |
| Users table | Restored only if `include_users=true` |
| Formats | Portable JSON v2 / ZIP; size limits |
| Paths | Backup filenames constrained in routes / service |
| Errors | Fail closed with generic client message; detail in server log |

---

## 9. Installer & updater

### Installer (`/install`)

- Requires `ALLOW_INSTALL=true` for web install in production posture.
- After success: lock file `storage/app/installed` + force `ALLOW_INSTALL=false`.
- `looksInstalled()` blocks reinstall when DB already contains app data (unless explicit reinstall confirmation).
- Rate limited (GET/POST).
- Validated DB driver allowlist: `pgsql`, `mysql`, `mariadb`.

### Updater (`/update`)

- Requires installed app.
- Super-admin email/password + explicit confirmation.
- Runs migrate + cache optimisations — **not** `migrate:fresh`.

---

## 10. HTTP security headers

Applied by `App\Http\Middleware\SecurityHeaders` on all responses:

| Header | Value / policy |
|--------|----------------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Camera/mic/geo/payment/usb disabled |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-site` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` when HTTPS |
| `Content-Security-Policy` | Restrictive baseline (see residual risks for `unsafe-inline`) |
| `X-XSS-Protection` | `0` (deprecated; CSP preferred — OWASP) |

---

## 11. CORS

- Paths: `api/*`, `sanctum/csrf-cookie`
- Origins: allowlist from `APP_URL` / `FRONTEND_URL` + local dev hosts (**no `*`**)
- `supports_credentials`: `true` (session cookies when cross-origin tooling is used)
- Production recommendation: **same-origin only** (Inertia monolith) — minimises CORS surface

---

## 12. Rate limiting

Named limiters in `AppServiceProvider` (approximate defaults):

| Limiter | Typical bound | Targets |
|---------|---------------|---------|
| `api` | 120/min | Default API group |
| `public` | 90/min | Public reads |
| `public-search` | 30/min | Article list/search |
| `public-read` | 60/min | Article detail |
| `preview` | 20/min + 100/hour | Draft preview tokens |
| `auth-login` | 10/min IP + 5/min email+IP | Login |
| `auth-register` | 3/min + 10/hour | Register |
| `seo` | 60/min | SEO meta JSON |

Article view counters: **≤ 1 increment per IP per article per hour** (cache).

---

## 13. Cryptography & secrets

| Item | Practice |
|------|----------|
| `APP_KEY` | Generated; never commit |
| `.env` | Gitignored; production secrets only on host |
| R2 keys | Server-side only; never expose to public JS |
| Tokens | Sanctum hashed at rest by framework design |
| Transport | HTTPS required in production; HSTS enabled when secure |

---

## 14. Secure deployment checklist (production)

```
[ ] APP_ENV=production
[ ] APP_DEBUG=false
[ ] APP_URL=https://your-canonical-host
[ ] ALLOW_INSTALL=false
[ ] SESSION_SECURE_COOKIE=true
[ ] SESSION_ENCRYPT=true
[ ] SESSION_SAME_SITE=lax (or strict)
[ ] SANCTUM_STATEFUL_DOMAINS=<production hosts only>
[ ] FILESYSTEM_DISK=r2 with valid R2_* credentials
[ ] Strong unique admin password (not seed defaults)
[ ] Document root = public/ only (no app/, .env web-accessible)
[ ] storage/ and bootstrap/cache writable by app user only
[ ] Composer --no-dev; npm build committed or built in CI
[ ] HTTPS terminated; trust proxies only if behind known reverse proxy
[ ] /install returns 403
[ ] php artisan test green in CI
```

See also [GO-LIVE.md](./GO-LIVE.md) and [DEPLOY.md](./DEPLOY.md).

---

## 15. Residual risks & limitations

| Risk | Severity | Notes / mitigation |
|------|----------|---------------------|
| CSP `script-src 'unsafe-inline'` | Medium | Needed for some Inertia/inline bootstrap patterns; prefer nonce-based CSP in a future hardening pass |
| Trust proxies `at: '*'` | Medium | Common behind Cloudflare/nginx; ensure only trusted edges terminate TLS |
| No full audit log UI | Low–Medium | Laravel log only; add admin audit trail if compliance requires |
| Dependency CVEs | Medium | Operators must patch Composer/npm regularly |
| Backup download by super admin | Low | Privileged by design; protect admin accounts (MFA at IdP if available — app-level MFA not yet productized) |
| Preview token guessability | Low | Random token + rate limit + expiry (14 days) |
| Editor can publish arbitrary content | By design | XSS mitigated by sanitizers; social-engineering remains human risk |

---

## 16. Verification & testing

Automated (PHPUnit):

```bash
php artisan test
```

Relevant cases include:

- `SafeUrl` dangerous scheme rejection
- `PublicSettings` whitelist filtering
- Admin vs member API authorization
- Public API structure (no secret keys in settings)
- Password cast hashing

Manual smoke (production):

1. Member token → `GET /api/v1/admin/dashboard` → **403**
2. Unauthenticated `POST` mutating API without CSRF/Bearer → **419/401**
3. Upload SVG → rejected
4. Settings key injection (`app_key`) → ignored
5. `/install` locked → **403**
6. Response headers include CSP, nosniff, frame options

CI: `.github/workflows/ci.yml` runs lint, migrate, asset build, and tests.

---

## 17. Vulnerability reporting

If you discover a security issue:

1. **Do not** open a public GitHub issue with exploit details.
2. Contact the project maintainers privately (repository owner / security contact).
3. Include: affected version/commit, reproduction steps, impact assessment, and any suggested fix.
4. Allow reasonable time for a patch before public disclosure.

---

## 18. Document maintenance

| Event | Action |
|-------|--------|
| New admin endpoint | Update §5 / §3; super_admin if destructive |
| Auth change | Update §4 and tests |
| New upload path | Update §7 |
| Header / CSP change | Update §10 and residual risks |
| Production incident | Record root cause; update checklist §14 |

**Agents & contributors:** keep this file aligned with runtime code in the same change set — no silent drift.

---

## 19. Related documents

| Document | Role |
|----------|------|
| [README.md](../README.md) | Overview & quick start |
| [INSTALL.md](../INSTALL.md) | Installation |
| [GO-LIVE.md](./GO-LIVE.md) | Production checklist |
| [DEPLOY.md](./DEPLOY.md) | Hosting layout |
| [STORAGE-R2.md](./STORAGE-R2.md) | Media storage |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Application layers |
| [CLAUDE.md](../CLAUDE.md) | Contributor security rules (non-negotiable) |

---

*End of security document.*
