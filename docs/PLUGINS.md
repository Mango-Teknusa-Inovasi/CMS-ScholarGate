# Panduan Pembuatan Plugin — CMS ScholarGate

Dokumen ini menjelaskan arsitektur, standar struktur, sistem hook (Action & Filter), database migration, serta langkah-langkah pembuatan dan distribusi plugin untuk **CMS ScholarGate**.

---

## 1. Filosofi & Arsitektur Plugin

CMS ScholarGate mengadopsi arsitektur plugin modular (mirip ekosistem WordPress / Laravel Packages). Tujuan utama sistem plugin adalah:
- **Zero Core Modification**: Menambahkan fungsionalitas baru (seperti PPDB Online, E-Library, Sistem Kelulusan, Notifikasi WhatsApp/Telegram) tanpa mengubah satupun baris kode inti (*core code*) CMS.
- **Isolasi Penuh**: Setiap plugin memiliki folder mandiri di dalam direktori `plugins/<slug>/`.
- **Hot-Toggleable**: Plugin dapat diaktifkan atau dinonaktifkan secara instan melalui Admin Dashboard (`/admin/plugins`) atau REST API.
- **Aman**: Pengunggahan plugin via `.ZIP` dilindungi dari kerentanan *Zip Slip*, file berbahaya (`.env`, `.phar`, `.htaccess`), serta batas kuota file & ukuran uncompressed.

---

## 2. Struktur Direktori Plugin

Setiap plugin wajib ditempatkan di dalam direktori `plugins/<plugin-slug>/` dengan struktur standar berikut:

```text
plugins/
└── ppdb-online/
    ├── plugin.json               # [Wajib] Manifest metadata plugin
    ├── routes/
    │   ├── web.php               # [Opsional] Rute web (middleware 'web')
    │   └── api.php               # [Opsional] Rute API (middleware 'api', otomatis prefix '/api/v1')
    ├── database/
    │   └── migrations/           # [Opsional] Migrasi tabel database plugin
    ├── src/
    │   ├── PpdbServiceProvider.php
    │   └── Controllers/
    │       └── PpdbController.php
    └── README.md                 # [Opsional] Dokumentasi internal plugin
```

---

## 3. Spesifikasi Manifest (`plugin.json`)

File `plugin.json` adalah file manifest konfigurasi yang **wajib ada** di root folder setiap plugin.

### Contoh `plugin.json`:
```json
{
  "name": "PPDB Online 2026",
  "slug": "ppdb-online",
  "version": "1.0.0",
  "description": "Modul Penerimaan Peserta Didik Baru Terintegrasi untuk SMA Negeri 1 Gedeg.",
  "author": "Mango Teknusa Inovasi",
  "author_url": "https://mangoteknusa.com",
  "provider": "Plugins\\PpdbOnline\\PpdbServiceProvider",
  "icon": "GraduationCap"
}
```

### Penjelasan Field Manifest:
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | **Ya** | Nama tampilan plugin yang muncul di daftar admin. |
| `slug` | string | **Ya** | Identifier unik (hanya huruf kecil `a-z`, angka `0-9`, dan tanda hubung `-`). Harus sama dengan nama foldernya. |
| `version` | string | **Ya** | Nomor versi semver (contoh: `1.0.0`). |
| `description` | string | Tidak | Deskripsi fungsi dan kegunaan plugin. |
| `author` | string | Tidak | Nama pengembang atau institusi pembuat. |
| `author_url` | string | Tidak | Tautan website atau portofolio pembuat. |
| `provider` | string | Tidak | Namespace Service Provider Laravel jika plugin membutuhkan dependency injection atau custom bindings. |
| `icon` | string | Tidak | Nama icon Lucide untuk badge visual di dashboard. |

---

## 4. Routing Plugin (Web & API)

CMS ScholarGate secara otomatis memuat file rute dari plugin yang berstatus **aktif**:

### Rute Web (`routes/web.php`)
Secara otomatis dimasukkan ke dalam middleware group `web` (mendukung cookie, session, dan proteksi CSRF):
```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/ppdb', function () {
    return inertia('Ppdb/Index', [
        'title' => 'Pendaftaran PPDB 2026',
    ]);
});
```

### Rute API (`routes/api.php`)
Secara otomatis dimasukkan ke dalam middleware group `api` dengan prefix `/api/v1/`:
```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/ppdb/status', function () {
    return response()->json([
        'status' => 'open',
        'quota' => 360,
    ]);
});
```
*Endpoint di atas dapat diakses langsung melalui `GET /api/v1/ppdb/status`.*

---

## 5. Aturan Isolasi Database & Konvensi Prefix Tabel (Lepas-Pasang Aman)

CMS ScholarGate menerapkan prinsip isolasi data yang ketat seperti arsitektur plugin modern (WordPress / Laravel Packages) untuk menjamin database inti tetap bersih, stabil, dan aman saat plugin dilepas-pasang.

### 🛡️ Aturan Utama (Golden Rule)
1. **DILARANG Mengubah Tabel Inti CMS**:
   - Plugin **tidak boleh** menjalankan `Schema::table('articles', ...)` atau `Schema::table('users', ...)` untuk menambah atau mengubah kolom pada tabel inti.
   - *Mengapa?* Menambah kolom pada tabel inti membuat skema menjadi kotor (*dirty schema*), menimbulkan konflik jika ada 2 plugin berbeda menambah kolom serupa, dan meninggalkan kolom *zombie* yang merusak integritas data saat plugin dicopot.
2. **WAJIB Menggunakan Prefix Tabel Plugin**:
   - Seluruh tabel database yang dibuat oleh plugin **wajib** diawali dengan nama slug plugin atau prefix unik, misalnya:
     - Plugin `ppdb-online` $\to$ `ppdb_registrations`, `ppdb_documents`, `ppdb_settings`
     - Plugin `elibrary` $\to$ `elibrary_books`, `elibrary_loans`
   - Dengan prefix ini, seluruh tabel plugin terisolasi 100% dan tidak akan pernah bertabrakan dengan tabel core CMS ataupun plugin lainnya.

---

### 🔄 Siklus Hidup Lepas-Pasang (Plugin Lifecycle)

ScholarGate membedakan dengan jelas antara **Menonaktifkan (Deactivate)** dan **Menghapus Bersih (Uninstall/Delete)**:

| Aksi | Status Database | Status Berkas & Rute | Kapan Digunakan |
|---|---|---|---|
| **Aktifkan (Activate)** | Tabel ber-prefix dibuat otomatis via `up()` migration | Rute, hook, dan controller aktif di memori | Saat modul ingin mulai digunakan sekolah |
| **Nonaktifkan (Deactivate)** | **Tabel & data fisik tetap utuh** (*preserved*) | Rute, hook, dan controller diputus dari memori | Saat modul dihentikan sementara (misal: PPDB ditutup) tanpa takut kehilangan data riwayat |
| **Hapus Bersih (Uninstall/Delete)** | Seluruh tabel ber-prefix di-drop via `down()` migration | Berkas fisik `plugins/<slug>/` dan data DB dihapus bersih | Saat modul dicopot permanen dari sistem |

---

### 📝 Contoh File Migrasi Berstandar Isolasi

Tempatkan file migrasi di `plugins/<slug>/database/migrations/`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Jalankan migrasi: buat tabel khusus dengan prefix plugin.
     */
    public function up(): void
    {
        Schema::create('ppdb_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('registration_number')->unique();
            $table->string('student_name');
            $table->string('nisn', 10);
            $table->string('origin_school');
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('ppdb_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('ppdb_registrations')->cascadeOnDelete();
            $table->string('document_type'); // misal: kartu_keluarga, ijazah
            $table->string('file_path');
            $table->timestamps();
        });
    }

    /**
     * Rollback migrasi: drop seluruh tabel ber-prefix saat di-uninstall.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppdb_documents');
        Schema::dropIfExists('ppdb_registrations');
    }
};
```

---

### 💡 Bagaimana jika Plugin Butuh Menghubungkan Data ke Artikel atau Pengguna?
Jika plugin Anda membutuhkan data relasi ke entitas core (seperti Siswa/User atau Artikel Berita):
- **Gunakan Tabel Relasi Ber-Prefix**: Buat tabel relasi seperti `ppdb_applicant_users` yang memuat foreign key `user_id` mengarah ke tabel `users`.
- **Gunakan Filter Hook**: Gunakan `Hook::applyFilter('article_content', ...)` untuk menyisipkan tombol atau formulir ke dalam konten artikel tanpa perlu mengubah struktur tabel `articles`.
- **Gunakan Pengaturan JSON**: Konfigurasi modul disimpan di kolom JSON `manifest` pada tabel `plugins` atau di tabel `settings` dengan key `plugin_{slug}_{key}`.

---

## 6. Sistem Hook (Actions & Filters)

ScholarGate menyediakan fasad `App\Support\Hook` untuk berkomunikasi antar-komponen tanpa keterikatan erat (*loose coupling*).

### Action Hook (Event Listener)
Digunakan untuk mengeksekusi kode saat peristiwa tertentu terjadi:
```php
use App\Support\Hook;

// Mendaftarkan action listener
Hook::addAction('article_published', function ($article) {
    // Kirim notifikasi WhatsApp atau Telegram saat artikel diterbitkan
    \Log::info("Artikel baru terbit: {$article->title}");
}, priority: 10);

// Memicu action hook (biasanya di core CMS atau plugin lain)
Hook::doAction('article_published', $article);
```

### Filter Hook (Data Transformer)
Digunakan untuk memodifikasi atau menyaring data sebelum ditampilkan atau diproses:
```php
use App\Support\Hook;

// Mendaftarkan filter untuk menambahkan watermark atau catatan kaki
Hook::addFilter('article_content', function (string $content) {
    return $content . '<p class="text-xs text-subtle">Dipublikasikan melalui Portal Resmi Sekolah.</p>';
}, priority: 10);

// Menerapkan filter hook
$content = Hook::applyFilter('article_content', $rawContent);
```

---

## 7. Packaging & Distribusi Plugin (.ZIP)

Untuk mendistribusikan plugin ke pengguna lain:
1. Pastikan file `plugin.json` berada di root zip atau di dalam 1 level folder utama:
   ```bash
   cd plugins/
   zip -r ppdb-online.zip ppdb-online/
   ```
2. **Aturan Keamanan Pengunggahan**:
   - Ukuran maksimum file ZIP: **20 MB**.
   - Maksimum file di dalam ZIP: **500 file**.
   - Ukuran total uncompressed: maksimum **50 MB**.
   - Dilarang memuat file: `.env`, `.htaccess`, `web.config`, `.phar`, `.phtml`.
   - File dengan path traversal (`../`) akan otomatis ditolak.
3. Administrator dapat mengunggah file `.ZIP` langsung melalui menu:
   **Admin CMS** $\to$ **Plugins** $\to$ **Unggah Plugin (.ZIP)**.

---

## 8. Contoh Tutorial: Membuat Plugin "Pengumuman Kelulusan"

Berikut adalah panduan cepat membuat plugin pengumuman kelulusan:

### Langkah 1: Buat Folder & Manifest
Buat folder `plugins/kelulusan-online/` dan file `plugin.json`:
```json
{
  "name": "Pengumuman Kelulusan Siswa",
  "slug": "kelulusan-online",
  "version": "1.0.0",
  "description": "Cek status kelulusan siswa secara mandiri menggunakan NISN.",
  "author": "Tim IT Sekolah",
  "icon": "Award"
}
```

### Langkah 2: Buat Rute Pengecekan
Buat file `plugins/kelulusan-online/routes/api.php`:
```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/kelulusan/cek', function (Request $request) {
    $request->validate(['nisn' => 'required|string']);
    $nisn = $request->input('nisn');

    // Logika pengecekan data siswa
    return response()->json([
        'success' => true,
        'nisn' => $nisn,
        'status' => 'LULUS',
        'message' => 'Selamat, Anda dinyatakan LULUS!',
    ]);
});
```

### Langkah 3: Aktifkan di Admin
1. Buka menu `/admin/plugins` di browser.
2. Plugin "Pengumuman Kelulusan Siswa" akan terdeteksi secara otomatis.
3. Klik tombol switch untuk mengaktifkan.
4. Endpoint `POST /api/v1/kelulusan/cek` langsung aktif dan siap diakses.
