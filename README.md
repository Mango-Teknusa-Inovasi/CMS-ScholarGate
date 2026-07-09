# CMS Scholargate

Portal sekolah + Admin CMS — **Laravel 13 API + React SPA**.

Desain canvas **putih** (referensi portal) dengan aksen soft color pada kartu/tombol tertentu. Siap **shared hosting** (satu document root) maupun VPS.

## Shared hosting — perlu jalankan backend & frontend terpisah?

**Tidak.** Di production cukup **satu** aplikasi PHP:

1. React di-**build** dulu (`npm run build`) → file statis masuk `backend/public/spa`
2. Document root hosting = `backend/public`
3. Laravel melayani **API** (`/api/*`) + **SPA** (semua route lain)

Node.js **tidak** perlu jalan di server production. Node hanya dipakai saat build (di laptop/CI).

| Mode | Cara jalan |
|------|------------|
| **Production / shared hosting** | Hanya PHP + DB. SPA sudah di-build. |
| **Development** | Laravel `:8000` + Vite `:5173` (hot reload) |

Detail: [INSTALL.md](./INSTALL.md)

## Stack

- Backend: Laravel 13, Sanctum (token admin)
- Frontend: React + TypeScript + Vite + Tailwind
- DB install: **PostgreSQL (default)** atau **MySQL / MariaDB**

## Instalasi pertama (pilih database)

### Web installer (shared hosting)

```text
https://domain-anda/install
```

Pilih **PostgreSQL** (default) atau **MySQL/MariaDB**, isi kredensial DB + admin.

### CLI

```bash
cd backend
composer install
php artisan scholargate:install
# default prompt: PostgreSQL

# MySQL/MariaDB:
php artisan scholargate:install --driver=mysql --database=scholargate --username=root --password=secret
```

## Development lokal

```bash
# Backend
cd backend && composer install && cp .env.example .env
php artisan key:generate
# dev cepat dengan sqlite (opsional):
# set DB_CONNECTION=sqlite di .env, lalu:
php artisan migrate --seed
php artisan serve

# Frontend (terminal lain)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

## Build production (wajib sebelum upload hosting)

```bash
cd frontend && npm install && npm run build
# output → backend/public/spa/
```

Lalu upload `backend/` dan set document root ke **`public/`**.

## Akun demo (setelah install / seed)

Hanya untuk development — **jangan** pakai di production.

| Role | Email | Password |
|------|-------|----------|
| Admin CMS | `admin@scholargate.test` | `Scholargate!Admin2026` |
| Member portal | `member@scholargate.test` | `Scholargate!Member2026` |

Login admin: `/admin/login` · Login member: `/login` · Daftar: `/daftar`

Ubah via env `SEED_ADMIN_PASSWORD` / `SEED_MEMBER_PASSWORD` atau menu Users di admin.

## Halaman publik

| Route | Keterangan |
|-------|------------|
| `/` | Homepage |
| `/profil` | Profil sekolah |
| `/artikel` | Berita / artikel |
| `/prestasi` | Prestasi |
| `/ekstrakurikuler` | Ekstrakurikuler |
| `/download` | Unduhan |
| `/admin` | Panel CMS |

## Struktur repo (siap deploy)

```
cms-scholargate/
├── backend/                 # ← UPLOAD INI ke server
│   ├── app/ config/ ...
│   └── public/              # document root
│       └── spa/             # hasil build React
├── frontend/                # source only — build, jangan runtime server
├── docs/
│   ├── DEPLOY.md            # apa yang di-upload
│   ├── GO-LIVE.md           # checklist production
│   ├── STORAGE-R2.md
│   └── SEO-AEO-GEO.md
├── scripts/backup-db.sh
├── package.json             # helper: npm run build, dev:api, dev:web
├── INSTALL.md
└── README.md
```

Detail deploy: [docs/DEPLOY.md](./docs/DEPLOY.md) · Go-live: [docs/GO-LIVE.md](./docs/GO-LIVE.md)

## Design tokens

- Page: `#FAF6F1` · Peach: `#F4E8D9` · Brand: `#0EA5E9`
- Font: Onest · Radius 12–16px
