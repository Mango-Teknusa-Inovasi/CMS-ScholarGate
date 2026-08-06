# Database — multi-engine & portable backup

**Language:** English

## Supported engines (install)

| Driver | Label | PHP extension | Notes |
|--------|-------|---------------|--------|
| **pgsql** | PostgreSQL (**recommended**) | `pdo_pgsql` | Best for production |
| **mysql** | MySQL | `pdo_mysql` | Common on shared hosting |
| **mariadb** | MariaDB | `pdo_mysql` | MySQL-compatible |

Migrations use the **Laravel Schema builder** only:

- Portable types: `id`, `string`, `text`, `longText`, `boolean`, `json`, `timestamp`, `foreignId`
- No engine-specific raw SQL (`jsonb`, MySQL-only ENUMs)
- `->after()` is cosmetic on MySQL; ignored on PostgreSQL (safe)

## Portable JSON backup (cross-database)

Format **portable v2** (`BackupService::FORMAT_VERSION = 2`):

| Concern | Behavior |
|---------|----------|
| Booleans | Stored as true/false; restored as 0/1 on MySQL |
| JSON columns | Arrays in file; encoded on insert |
| Dates | ISO-8601 in file → `Y-m-d H:i:s` on restore |
| User passwords | **Not exported** |
| PostgreSQL | ID sequences reset after restore |
| Foreign keys | Temporarily disabled during restore |

### Example: MySQL → PostgreSQL

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

- Raw SQL dumps (`pg_dump` / `mysqldump`) — different dialects
- Media files on R2/disk — JSON backup is **database content only**
