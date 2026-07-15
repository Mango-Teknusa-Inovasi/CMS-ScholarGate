# Database — multi-engine & backup portable

## Engine yang didukung (install)

| Driver | Label | Ekstensi PHP | Catatan |
|--------|-------|--------------|---------|
| **pgsql** | PostgreSQL (**disarankan**) | `pdo_pgsql` | Produksi ideal |
| **mysql** | MySQL | `pdo_mysql` | Shared hosting umum |
| **mariadb** | MariaDB | `pdo_mysql` | Alternatif MySQL |

Migrasi memakai **Laravel Schema builder** (portable):

- `id`, `string`, `text`, `longText`, `boolean`, `json`, `timestamp`, `foreignId`
- Tidak memakai tipe khusus PG-only (`jsonb` raw) atau MySQL-only enum
- Modifier `->after()` hanya efektif di MySQL/MariaDB; di PostgreSQL diabaikan (aman)

## Backup / restore JSON (lintas DB)

Format **portable v2** (`BackupService::FORMAT_VERSION = 2`):

| Aspek | Perilaku |
|-------|----------|
| Boolean | Disimpan `true`/`false`; di MySQL di-restore sebagai `0`/`1` |
| JSON (`faq_items`, `tabs`) | Array di file; di-encode string saat insert |
| Tanggal | ISO-8601 di file → `Y-m-d H:i:s` saat restore |
| Password users | **Tidak** di-export |
| PostgreSQL | Sequence `id` di-reset setelah restore (agar insert baru tidak bentrok) |
| FK | Dinonaktifkan sementara (MySQL / PG / SQLite) |

### Migrasi engine (contoh MySQL → PostgreSQL)

1. Di server MySQL: Admin → **Backup** → unduh JSON/ZIP.
2. Install Scholargate baru dengan **PostgreSQL** (`/install` atau CLI).
3. Login super admin → **Backup** → Restore file JSON (mode merge/replace).
4. Centang `include_users` hanya jika perlu metadata user (password tetap kosong → set ulang password admin).

Disarankan: **target PostgreSQL**.

### CLI setara

```bash
# Backup lewat admin UI, atau restore setelah upload ke storage
php artisan migrate --force   # skema
# Restore konten: Admin CMS → Backup
```

## Checklist hosting

- [ ] Ekstensi `pdo_pgsql` **atau** `pdo_mysql` aktif
- [ ] `DB_CONNECTION=pgsql|mysql|mariadb` di `.env`
- [ ] Charset UTF-8 (`utf8mb4` MySQL/MariaDB, `utf8` PG)
- [ ] Setelah restore PG: cek insert artikel baru (sequence OK)

## Bukan untuk

- Dump SQL mentah (`pg_dump` / `mysqldump`) — beda dialect
- File media R2/storage — backup JSON = **konten DB saja**; file media tetap di object storage / disk
