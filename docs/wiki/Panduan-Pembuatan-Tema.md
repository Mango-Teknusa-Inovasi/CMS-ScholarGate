# 🎨 Panduan Pembuatan & Pengembangan Tema (Theme Development Guide)

CMS ScholarGate dilengkapi dengan **Dual Theme & Hook Engine**. Tema bertugas mengontrol seluruh tampilan visual dan tata letak halaman publik (`resources/js/themes/{slug_tema}/`), sedangkan **Plugin Hook** memungkinkan modul add-on menyuntikkan widget atau script ke slot `<HookSlot />` di tema manapun.

---

## 📁 Struktur Folder Tema

Setiap tema berada di dalam folder tersendiri di bawah `resources/js/themes/`:

```text
resources/js/themes/
├── default/                         # Tema Bento Grid (Default)
│   ├── theme.json                   # Manifes Tema (Metadata)
│   └── pages/                       # Komponen Halaman React Inertia
│       ├── HomePage.tsx             # Halaman Utama Portal
│       ├── ArticlesPage.tsx         # Daftar Artikel & Berita
│       ├── ArticleDetailPage.tsx    # Detail Baca Artikel
│       ├── AchievementsPage.tsx     # Direktori Prestasi
│       ├── ExtracurricularPage.tsx  # Direktori Ekstrakurikuler
│       ├── DownloadsPage.tsx        # Halaman Pusat Unduhan
│       └── ProfilePage.tsx          # Halaman Profil Sekolah
│
└── classic/                         # Tema Portal Berita Klasik (Polos Putih)
    ├── theme.json
    └── pages/
        └── HomePage.tsx             # Meng-override Halaman Utama dengan Tampilan Berita Klasik
```

---

## 📝 1. Membuat Manifes Tema (`theme.json`)

Setiap tema **wajib** memiliki file `theme.json` di root foldernya:

```json
{
  "name": "Classic News Portal",
  "slug": "classic",
  "version": "1.0.0",
  "author": "ScholarGate Community",
  "description": "Tema portal berita klasik berbasis latar putih bersih (Plain White News Portal) dengan tatanan headline multi-kolom dan pengumuman resmi.",
  "screenshot": "/favicon.svg",
  "supported_slots": ["after_navbar", "before_footer", "home_bento"]
}
```

### Atribut Manifes:
| Atribut | Tipe Data | Keterangan |
|---|---|---|
| `name` | `string` | Nama tema yang tampil di Admin Panel |
| `slug` | `string` | Identifikasi unik folder tema (huruf kecil & strip, misal `classic`, `modern`) |
| `version` | `string` | Versi tema (misal `1.0.0`) |
| `author` | `string` | Nama pengembang atau organisasi pembuat |
| `description` | `string` | Deskripsi singkat mengenai gaya visual tema |
| `supported_slots` | `array` | Daftar nama `<HookSlot />` yang didukung oleh tema ini |

---

## ⚛️ 2. Membuat Komponen Halaman Tema (`pages/*.tsx`)

Halaman tema menggunakan komponen React 19 dengan props dari Inertia.js.

### 🛡️ Mekanisme Automatic Fallback
Jika tema buatan Anda **tidak** menyediakan file halaman tertentu (misalnya tema Anda hanya meng-kustomisasi `HomePage.tsx`), sistem *dynamic resolver* ScholarGate di `resources/js/app.tsx` akan secara otomatis menggunakan file halaman dari `themes/default/pages/`. Anda hanya perlu membuat file halaman yang ingin diubah saja!

### Contoh: Membuat Halaman `HomePage.tsx` Kustom

```tsx
import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/components/layout/PublicLayout';
import { HookSlot } from '@/components/ui/HookSlot';

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_url: string | null;
    published_at: string | null;
}

interface HomePageProps {
    articles?: Article[];
    latest_articles?: Article[];
}

export default function TemaSayaHomePage({ articles = [], latest_articles = [] }: HomePageProps) {
    const { props } = usePage<{ app?: { name?: string } }>();
    const siteName = props.app?.name || 'Portal Resmi';

    return (
        <PublicLayout>
            <Head title={`Beranda Utama — ${siteName}`} />

            {/* Header Tema Kustom */}
            <header className="bg-white border-b p-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900">{siteName}</h1>
            </header>

            {/* Hook Slot untuk Menyuntikkan Widget Plugin */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <HookSlot name="after_navbar" />
            </div>

            {/* Konten Berita Tema */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Kode HTML / Tailwind Tema Anda */}
            </main>

            {/* Hook Slot Sebelum Footer */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <HookSlot name="before_footer" />
            </div>
        </PublicLayout>
    );
}
```

---

## 🔌 3. Menempatkan Slot Plugin (`<HookSlot />`)

Agar tema buatan Anda kompatibel dengan plugin yang terpasang (seperti plugin running text, pengumuman melayang, atau widget interaktif), tempatkan komponen `<HookSlot />` di posisi strategis:

```tsx
import { HookSlot } from '@/components/ui/HookSlot';

// Slot standar yang direkomendasikan:
<HookSlot name="after_navbar" />
<HookSlot name="home_bento" />
<HookSlot name="before_footer" />
```

---

## 📦 4. Mengemas & Menginstall Tema

1. Kompres folder tema Anda menjadi file `.zip` (yang berisi `theme.json` dan folder `pages/`).
2. Login ke Admin Panel sebagai **Super Admin**.
3. Buka menu **Sistem -> Tema & Layout** (`/admin/themes`).
4. Klik tombol **Unggah Tema (.ZIP)** dan pilih file arsip Anda.
5. Klik **Aktifkan Tema** untuk langsung berganti ke tema baru!
