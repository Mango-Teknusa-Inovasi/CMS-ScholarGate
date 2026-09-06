# Database — multi-engine & portable backup

**Language:** English

## Supported engines (install)

| Driver | Label | PHP extension | Notes |
|--------|-------|---------------|--------|
| **pgsql** | PostgreSQL (**recommended**) | `pdo_pgsql` | Best for production |
| **mysql** | MySQL | `pdo_mysql` | Common on shared hosting |
| **mariadb** | MariaDB | `pdo_mysql` | MySQL-compatible |

Migrations use the **Laravel Schema builder** only:

- Primary Keys: Core business models (`articles`, `tags`, `categories`, `media`, `users`, etc.) use UUIDs (`char(36)` / `uuid`) with `HasUuids`.
- Pivot Tables: Many-to-many tables like `article_tag` use composite primary keys `(article_id, tag_id)` without redundant single-column surrogate keys.
- Extensibility: System tables such as `plugins` store structured JSON manifests/settings alongside active state flags.
- Portable types: `id`, `uuid`, `string`, `text`, `longText`, `boolean`, `json`, `timestamp`, `foreignId`
- No engine-specific raw SQL (`jsonb`, MySQL-only ENUMs)
- `->after()` is cosmetic on MySQL; ignored on PostgreSQL (safe)

## Portable JSON backup (cross-database)

Format **portable v2** (`BackupService::FORMAT_VERSION = 2`):

| Concern | Behavior |
|---------|----------|
| Booleans | Stored as true/false; normalized to 0/1 on MySQL/MariaDB and boolean on PostgreSQL |
| JSON columns | Decoded as nested structures in JSON export; re-encoded to driver format on insert (`faq_items`, `tabs`, `manifest`, `settings`) |
| Dates | ISO-8601 in backup archive → converted to universal `Y-m-d H:i:s` on restore |
| User passwords | **Excluded from exports** for zero credential leakage |
| Foreign keys | Temporarily disabled during restore; re-enabled safely in `finally` block |
| Transactions | Handled via nested database transactions / savepoints |
| PostgreSQL | Auto-increment sequences reset after restore |
| Cloud Sync | Automatically synced to Cloudflare R2 (`scholargate/backups/`) with local failover |

### Restore Modes

1. **Merge Mode**:
   Restores CMS content tables only (`articles`, `tags`, `categories`, `article_tag`, `banners`, `welcome_blocks`, `service_items`, `achievements`, `gallery_items`, `partners`, `quick_services`, `downloads`, `profile_pages`, `extracurriculars`, `media`).
   Preserves existing site settings, menu structures, and contact information.

2. **Replace Mode**:
   Performs a complete environment restoration including CMS content and system configurations (`settings`, `contact_infos`, `menu_items`, `legal_pages`, `plugins`).

### Native SQL Backup & Restore CLI Scripts

For full physical database backups outside the admin panel:
- **Backup**: `./scripts/backup-db.sh`
  Creates a timestamped, gzip-compressed dump (`backups/scholargate_YYYYMMDD_HHMMSS.sql.gz`) for PostgreSQL (`pg_dump`) or MySQL/MariaDB (`mysqldump`) reading credentials from `.env`.
- **Restore**: `./scripts/restore-db.sh <path-to-dump.sql[.gz]> [--force]`
  Restores SQL or GZ dumps directly to the active database connection defined in `.env`.

### Example: MySQL → PostgreSQL Migration via Portable Backup

1. On MySQL install: Admin → **Backup** → download JSON/ZIP.
2. Fresh Scholargate on **PostgreSQL** (`/install` or CLI).
3. Super admin → **Backup** → Restore (merge/replace).
4. Check `include_users` only if needed (passwords empty → reset admin password).

Prefer **PostgreSQL** as the long-term target.

## Hosting checklist

- [ ] `pdo_pgsql` **or** `pdo_mysql` enabled
- [ ] `DB_CONNECTION=pgsql|mysql|mariadb` in `.env`
- [ ] UTF-8 (`utf8mb4` MySQL/MariaDB; UTF-8 on PG)
- [ ] After PG restore: create a new article (sequences OK)

## Not covered by JSON backup

- Raw binary media files stored on local disks or R2 — JSON backup is **database content & metadata only**. Use R2 bucket replication or disk rsync for binary files.
