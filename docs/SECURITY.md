# Keamanan — hardening yang diterapkan

## CSRF
- API: Bearer Sanctum (bukan cookie session) → CSRF klasik tidak relevan.
- Form web `/install`: `@csrf`.

## XSS
- Semua HTML konten di-render lewat `SafeHtml` + **DOMPurify**.
- `safeHref()` memblokir `javascript:`, `data:`, `vbscript:`.
- Upload **SVG dilarang**.

## SQL injection
- Eloquent / query builder (parameter binding). Tidak ada raw SQL user-controlled.

## AuthZ
- `admin` middleware: role admin|editor.
- `super_admin` middleware: role **admin** only — users & backup/restore.
- Register member: role selalu `member`.

## Backup
- Password hash **tidak** di-export.
- Restore **tidak** menyentuh `users` kecuali `include_users=true` (super admin).
- Limit ukuran JSON/ZIP; path zip traversal dicek.

## Media
- Confirm path harus `uploads/...` tanpa `..`.
- MIME/extension berbahaya ditolak.

## Settings
- Public & admin update: **whitelist** key (`PublicSettings::KEYS`).

## Token
- `SANCTUM_TOKEN_EXPIRATION` default 14 hari (menit: 20160).

## Headers
- Middleware `SecurityHeaders`: nosniff, frame SAMEORIGIN, Referrer-Policy, Permissions-Policy, HSTS (HTTPS), CSP dasar.
