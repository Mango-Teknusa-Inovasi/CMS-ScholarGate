# Security Policy

ScholarGate takes the security of our application and the educational institutions relying on it very seriously.

---

## 🛡️ Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

---

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability in ScholarGate, please **do not open a public GitHub issue**. Instead, follow these steps to report it responsibly:

1. Send an email to **security@scholargate.test** or contact the lead maintainers directly.
2. Provide a detailed summary of the vulnerability, including:
   - Type of issue (e.g., SQLi, XSS, CSRF, Authentication Bypass).
   - Step-by-step instructions or proof-of-concept to reproduce the issue.
   - Affected endpoints or files.
3. We will acknowledge receipt of your report within **24 to 48 hours**.

---

## 🚨 Security Controls Inventory

ScholarGate implements multiple layers of security protections out of the box:

- **HTML Sanitization**: All user-generated HTML content (articles, welcome blocks) is sanitized on both client and server via `HtmlPurifier` to prevent Cross-Site Scripting (XSS).
- **Authentication & RBAC**: Multi-level authorization middleware (`EnsureAdmin`, `EnsureSuperAdmin`) enforcing strict separation between `admin`, `editor`, and `member` roles.
- **CSRF & Token Security**: Laravel Sanctum stateful cookie authentication combined with CSRF token verification for all mutating requests.
- **Upload Hardening**: Uploaded files and media are verified by MIME type and automatically converted to optimized WebP images stored in Cloudflare R2 / S3 storage.
- **Off-Site Backups**: Portable database backups automatically mirror to Cloudflare R2 Cloud Storage to safeguard against ransomware or local server storage corruption.

Thank you for helping keep ScholarGate and our community secure! 🛡️
