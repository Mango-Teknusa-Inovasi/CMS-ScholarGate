# PPID module

PPID is built into ScholarGate. It does not depend on the plugin manager or an external archive application. Public pages live under `/ppid`; staff use `/admin/ppid`. Existing CMS roles keep their original permissions.

## Installation and activation

1. Deploy the application and compiled assets, then run `php artisan migrate --force` through the normal update process.
2. In **Pengaturan → Penyimpanan media dan dokumen**, choose local, R2, or S3. Existing environment settings remain the defaults until an administrator saves an override. Saved overrides, including credentials, are encrypted with `APP_KEY`.
3. For cloud storage, create a separate private bucket on the same provider. Do not attach a public domain or enable public bucket access for this bucket. Set it in the shared storage settings or use `R2_PRIVATE_BUCKET_NAME` / `AWS_PRIVATE_BUCKET`.
4. Open **PPID → Petugas** as an administrator and assign existing accounts. A member account can be a PPID officer without being a CMS administrator.
5. Complete **PPID → Pengaturan**: institutional name, service email/phone, hours, profile, procedures, holidays, and non-working days. Enable online intake only after these settings and private storage are ready.
6. Run Laravel's scheduler every minute: `* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1`. Configure the normal Laravel mail transport. No email is sent merely by opening a form.

`ppid:send-notices` processes the database notification queue, retries up to three times, and leaves failures visible to staff. `ppid:remind-deadlines` queues daily reminders for responsible officers within two working days of a deadline, including overdue cases.

## Manual DIP uploads

Use **PPID → Informasi publik → Tambah informasi**. Complete the metadata, select **Unggah berkas dari komputer**, select or drop files, then save the draft. Files initially remain private. A publisher selects the attachments for the next public version and publishes it. Saving an edit does not replace the previously published snapshot.

Other source options are an HTTP(S) document link and physical availability with collection instructions. Manual uploads always remain available without an external integration. Files are limited to 20 MB each. Supported types: PDF, JPEG, PNG, WebP, DOC/DOCX, XLS/XLSX, PPT/PPTX, text, CSV. Document bytes are preserved, including signed PDF documents.

A published version has a separate public copy. Withdrawing it removes that copy; the private original is retained. Public objects use `Cache-Control: public, max-age=0, must-revalidate`. Configure the CDN to respect origin cache policy, without an overriding edge/browser TTL. If a pre-existing CDN rule cached a file longer, its operator must purge that cache. Previously downloaded copies cannot be revoked.

## Storage and portability

Media and PPID use `MediaStorage::diskName()` and the same provider configuration. `FILESYSTEM_DISK` is authoritative unless the administrator saved a storage override. Merely having R2 credentials no longer overrides an explicit S3 selection.

Public and private PPID files record their provider, bucket/endpoint or local root, object key, original name, MIME type, size, checksum, and version. Storage location snapshots are encrypted. Object keys are immutable. Changing providers affects new uploads; it does not migrate old objects. Keep credentials with access to old buckets until their documents have been migrated or archived. Cloud errors do not silently fall back to local storage.

Private attachments are served through authorization-checked download endpoints, never through the public media URL helper. Identity and request records are excluded from public media, sitemap, and RAG.

## Roles

- **Pengelola modul**: configure PPID and form templates.
- **Petugas informasi**: create/edit DIP drafts and upload attachments.
- **Penerbit informasi**: review, publish, and withdraw public information/reports.
- **Petugas layanan**: read/process requests and prepare responses.
- **Atasan PPID**: issue objection responses.
- **Front desk**: enter offline requests, manage guest/visit records; cannot open information-request identities or attachments unless additionally assigned service permissions.

Administrators assign roles; editors receive no PPID authority automatically. Permissions are checked on every endpoint. Access to request details and private downloads is audited. Staff may hold multiple roles.

## Forms and service operation

Five built-in templates: information request, objection, survey, guest book, and visit. The form editor supports labels, hints, ordering, optional/custom fields, required fields, choices, and conditional visibility. Conditions reference preceding fields. Core keys/types/required semantics are protected. Publishing creates a new form version; submissions retain their original schema and labels. Server validation rejects hidden answers rather than storing them.

Public submission uses a random register number and private access code. Tracking grants a 30-minute server session. Recovery emails a single-use, 30-minute link to the address recorded with the application; requesting recovery alone does not invalidate the existing code. A verified recovery rotates the code.

Permitted service actions depend on the current state. Requests may be extended once by seven working days with a written explanation. Only supervisors issue objection responses. Internal notes never appear in applicant tracking. Ordinary notices contain only the register and tracking URL; private documents remain inside the authenticated tracking view.

Offline intake records the actual received date and channel. Email/identity upload is not mandatory for offline entry; staff must complete any identity examination through the institution's physical procedure. Register exports contain no identity documents or applicant contact details.

Survey statistics are grouped by form version. Numeric questions display averages and respondent counts. Optional configured weights produce a weighted mean of 1–4 scores converted to 100, described in the public report; this is not automatically a certified national SKM methodology.

## Backup and recovery

**PPID → Pengaturan → Cadangan PPID terlindungi** exports an AES-256 encrypted ZIP containing PPID records and original attachments. Use a password of at least 12 characters. ZIP AES support is required. Credentials for cloud storage are not included in this archive. Protect the archive password separately.

PPID backups are intentionally separate from ordinary public-content exports. Restore accepts up to 512 MB of uncompressed attachments and a 40 MB manifest; individual attachments remain limited to 20 MB. It checks file checksums and writes originals to the currently selected private storage. Restore only runs against an empty PPID register/document store. Do not use it as a merge/import operation.

Restored service intake and module visibility remain disabled until reviewed. Configure accounts and role assignments at the destination before activation. Preserve `APP_KEY` for normal database backups: encrypted request fields, configuration, and storage locations depend on it. Password-protected PPID archives are portable across application keys.

## Verification

Automated coverage lives in `tests/Feature/Ppid`. Cloud-storage workflow tests use filesystem doubles: they validate provider/bucket routing, private/public copies, failure behavior, and location preservation without making paid or external storage requests. Deployment still requires a real upload/download check against the institution's buckets and CDN policy.

Browser regression: `tests/browser/ppid.cjs` exercises manual upload/publication/download, public intake/tracking, non-admin staff authorization, form versions, and both themes at 375/768/1440 px. It requires Playwright and Chrome, and writes captures into `.cache/ppid-review`. Run only with this isolated local fixture (the test changes the active theme):

```sh
mkdir -p .cache/ppid-review
touch .cache/ppid-review/database.sqlite
export APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE="$PWD/.cache/ppid-review/database.sqlite" DB_URL=''
export FILESYSTEM_DISK=public APP_URL=http://127.0.0.1:8137 SANCTUM_STATEFUL_DOMAINS=127.0.0.1:8137,localhost
export CACHE_STORE=file SESSION_DRIVER=file MAIL_MAILER=array
php artisan migrate --force
php tests/browser/ppid-fixture.php
npm run build
php -S 127.0.0.1:8137 -t public tests/browser/ppid-router.php
```

In a second terminal run `node tests/browser/ppid.cjs`. The fixture refuses other databases; its known passwords must never be used for real accounts. Test files use local storage; no real email is sent. The router bypasses a development Vite hot file and uses a separate cache so existing application sessions are unaffected. Repeated runs remain subject to rate limits; clear only `.cache/ppid-review/cache` between test runs when needed. Stop the test server and unset the exported variables after testing.
