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
└── classic/                         # Tema Portal Berita Klasik (Polos Putih Model News Website)
    ├── theme.json
    ├── layout/
    │   └── ClassicLayout.tsx        # Custom Theme Layout Wrapper
    └── pages/
        ├── HomePage.tsx             # Halaman Beranda Berita Klasik Multi-Kolom
        ├── ArticlesPage.tsx         # Halaman Feed Berita Klasik
        ├── ArticleDetailPage.tsx    # Halaman Detail Baca Berita Klasik
        ├── AchievementsPage.tsx     # Direktori Prestasi Siswa Klasik
        ├── ExtracurricularPage.tsx  # Direktori Ekstrakurikuler Klasik
        ├── DownloadsPage.tsx        # Pusat Unduhan File Klasik
        └── ProfilePage.tsx          # Halaman Profil & Struktur Sekolah Klasik
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

---

## 🏛️ 2. Aturan Utama: Bebas Hardcode & Branding Dinamis

Untuk menjaga standar keamanan enterprise, kompatibilitas multi-lembaga, dan kebersihan kode:

1. **DILARANG KERAS Menulis Teks Hardcoded**:
   - Dilarang menuliskan nama instansi, email, nomor telepon, alamat, atau logo secara hardcoded di komponen TSX.
   - Gunakan props global dari Inertia (`HandleInertiaRequests.php`):
     ```tsx
     const { props } = usePage<{
         app?: {
             name?: string;
             logo_url?: string | null;
             tagline?: string;
             email?: string;
             phone?: string;
             address?: string;
         }
     }>();

     const siteName = props.app?.name || 'Portal Resmi Sekolah';
     const logoUrl = props.app?.logo_url;
     const tagline = props.app?.tagline;
     ```

2. **Render Logo Dinamis**:
   - Periksa apakah `logo_url` tersedia. Jika ada, tampilkan logo resmi `<img src={logoUrl} alt={siteName} />`. Gunakan icon/fallback hanya jika `logo_url` bernilai `null`.

3. **Integrasi Data Dinamis & Safe HTML**:
   - Ambil data artikel, prestasi, ekskul, dan pusat unduhan melalui API `/api/v1/*` atau React Query (`@tanstack/react-query`).
   - Render konten artikel menggunakan komponen aman `<SafeHtml html={article.body_html} />` agar terhindar dari kerentanan XSS.

---

## ⚛️ 3. Membuat Komponen Halaman Tema (`pages/*.tsx`)

Halaman tema menggunakan komponen React 19 dengan props dari Inertia.js.

### 🛡️ Mekanisme Automatic Fallback
Jika tema buatan Anda **tidak** menyediakan file halaman tertentu (misalnya tema Anda hanya meng-kustomisasi `HomePage.tsx`), sistem *dynamic resolver* ScholarGate di `resources/js/app.tsx` akan secara otomatis menggunakan file halaman dari `themes/default/pages/`. Anda hanya perlu membuat file halaman yang ingin diubah saja!

### Contoh: Membuat Halaman `HomePage.tsx` Kustom

```tsx
import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ClassicLayout from '../layout/ClassicLayout';
import { HookSlot } from '@/components/ui/HookSlot';

export default function TemaSayaHomePage() {
    const { props } = usePage<{ app?: { name?: string } }>();
    const siteName = props.app?.name || 'Portal Resmi';

    return (
        <ClassicLayout>
            <Head title={`Beranda Utama — ${siteName}`} />

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
        </ClassicLayout>
    );
}
```

---

## 🔌 4. Menempatkan Slot Plugin (`<HookSlot />`)

Agar tema buatan Anda kompatibel dengan plugin yang terpasang (seperti plugin running text, pengumuman melayanan, atau widget interaktif), tempatkan komponen `<HookSlot />` di posisi strategis:

```tsx
import { HookSlot } from '@/components/ui/HookSlot';

// Slot standar yang direkomendasikan:
<HookSlot name="after_navbar" />
<HookSlot name="home_bento" />
<HookSlot name="before_footer" />
```

---

## 📦 5. Mengemas & Menginstall Tema

1. Kompres folder tema Anda menjadi file `.zip` (yang berisi `theme.json` dan folder `pages/`).
2. Login ke Admin Panel sebagai **Super Admin**.
3. Buka menu **Sistem -> Tema & Layout** (`/admin/themes`).
4. Klik tombol **Unggah Tema (.ZIP)** dan pilih file arsip Anda.
5. Klik **Aktifkan Tema** untuk langsung berganti ke tema baru!

