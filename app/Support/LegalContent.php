<?php

namespace App\Support;

/**
 * Default legal page copy — placeholders filled with institution/app name.
 * Content remains editable in Admin after seed.
 */
class LegalContent
{
    public static function institutionName(): string
    {
        $name = trim((string) \App\Models\Setting::getValue('site_name', ''));

        return $name !== '' ? $name : (string) config('app.name', 'Portal Resmi');
    }

    /**
     * @return array{key: string, title: string, body: string, is_published: bool}
     */
    public static function privacy(string $org): array
    {
        $org = e($org);
        $year = date('Y');

        $body = <<<HTML
<p><strong>{$org}</strong> ("kami", "portal") berkomitmen melindungi privasi pengunjung dan pengguna layanan digital ini. Kebijakan Privasi ini menjelaskan data yang kami kumpulkan, bagaimana data digunakan, dan hak Anda sebagai subjek data.</p>

<h2>1. Ruang lingkup</h2>
<p>Kebijakan ini berlaku untuk situs/portal <strong>{$org}</strong>, termasuk halaman publik, area member, dan panel administrasi yang kami kelola.</p>

<h2>2. Data yang dikumpulkan</h2>
<ul>
<li><strong>Data akun</strong> — nama, alamat email, dan kredensial yang Anda berikan saat registrasi/login (jika fitur member diaktifkan).</li>
<li><strong>Data teknis</strong> — alamat IP, jenis perangkat/browser, dan log akses yang diperlukan untuk keamanan dan analisis agregat.</li>
<li><strong>Konten yang Anda kirim</strong> — misalnya formulir atau unggahan yang disediakan fitur portal (jika ada).</li>
<li><strong>Cookie / sesi</strong> — cookie sesi login, CSRF, dan preferensi teknis agar portal berfungsi dengan aman.</li>
</ul>

<h2>3. Tujuan pemrosesan</h2>
<ul>
<li>Menyediakan informasi dan layanan pendidikan atas nama <strong>{$org}</strong>.</li>
<li>Mengelola autentikasi, otorisasi, dan keamanan sistem.</li>
<li>Meningkatkan kualitas konten, performa, dan pengalaman pengguna.</li>
<li>Memenuhi kewajiban hukum atau permintaan otoritas yang sah.</li>
</ul>

<h2>4. Dasar pemrosesan</h2>
<p>Data diproses berdasarkan kepentingan sah operasional portal, pelaksanaan layanan yang Anda minta, dan/atau kewajiban hukum yang berlaku di wilayah hukum Indonesia (sesuai kebijakan internal {$org}).</p>

<h2>5. Penyimpanan & keamanan</h2>
<p>Kami menerapkan langkah teknis dan organisasional yang wajar (kontrol akses, sanitasi konten, header keamanan, pembatasan unggahan). Media dapat disimpan di penyimpanan objek terenkripsi/HTTPS. Tidak ada sistem yang 100% bebas risiko; kami terus memperbaiki proteksi seiring waktu.</p>

<h2>6. Berbagi data</h2>
<p>Data tidak dijual. Data dapat diproses oleh penyedia infrastruktur (hosting, CDN, email) semata-mata untuk menjalankan portal atas nama {$org}, dengan kewajiban kerahasiaan yang sesuai.</p>

<h2>7. Hak Anda</h2>
<p>Sesuai ketentuan yang berlaku, Anda dapat meminta akses, koreksi, atau penghapusan data akun tertentu dengan menghubungi kontak resmi {$org}. Kami dapat meminta verifikasi identitas sebelum memproses permintaan.</p>

<h2>8. Cookie</h2>
<p>Portal menggunakan cookie sesi yang diperlukan. Menonaktifkan cookie dapat membuat login atau fitur tertentu tidak berfungsi.</p>

<h2>9. Perubahan kebijakan</h2>
<p>Kami dapat memperbarui kebijakan ini. Tanggal efektif terbaru tercantum di halaman ini. Penggunaan berkelanjutan setelah perubahan berarti Anda memahami versi terbaru.</p>

<h2>10. Kontak</h2>
<p>Pertanyaan terkait privasi dapat ditujukan ke kontak resmi yang tertera di portal <strong>{$org}</strong> (halaman Profil/Kontak atau pengaturan situs).</p>

<p><em>Terakhir diperbarui: {$year}. Dokumen ini dihasilkan untuk {$org} dan dapat diedit oleh administrator CMS.</em></p>
HTML;

        return [
            'key' => 'privacy',
            'title' => 'Kebijakan Privasi',
            'body' => $body,
            'is_published' => true,
        ];
    }

    /**
     * @return array{key: string, title: string, body: string, is_published: bool}
     */
    public static function terms(string $org): array
    {
        $org = e($org);
        $year = date('Y');

        $body = <<<HTML
<p>Dengan mengakses dan menggunakan portal <strong>{$org}</strong> ("Portal"), Anda menyetujui Syarat &amp; Ketentuan berikut. Jika Anda tidak setuju, mohon tidak menggunakan layanan ini.</p>

<h2>1. Penerimaan syarat</h2>
<p>Portal dikelola untuk kepentingan informasi dan layanan pendidikan oleh <strong>{$org}</strong>. Penggunaan Portal tunduk pada syarat ini serta hukum yang berlaku di Republik Indonesia.</p>

<h2>2. Sifat layanan</h2>
<ul>
<li>Konten bersifat informatif; dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
<li>Fitur member/admin hanya untuk pengguna yang berwenang.</li>
<li>{$org} berhak membatasi, menangguhkan, atau menghentikan akses jika terjadi penyalahgunaan.</li>
</ul>

<h2>3. Akun pengguna</h2>
<p>Anda bertanggung jawab menjaga kerahasiaan kredensial akun. Segala aktivitas di bawah akun Anda dianggap dilakukan oleh pemegang akun. Segera laporkan dugaan akses tidak sah kepada pengelola {$org}.</p>

<h2>4. Konten & kekayaan intelektual</h2>
<p>Materi di Portal (teks, logo, gambar, dokumen) dilindungi hak cipta dan/atau hak terkait milik {$org} atau pemberi lisensi, kecuali dinyatakan lain. Anda tidak diperkenankan menyalin, memodifikasi, atau mendistribusikan ulang secara komersial tanpa izin tertulis.</p>

<h2>5. Perilaku yang dilarang</h2>
<ul>
<li>Mengunggah atau menyebarkan konten ilegal, menyesatkan, atau melanggar hak pihak ketiga.</li>
<li>Mencoba meretas, memindai kerentanan, atau mengganggu ketersediaan layanan.</li>
<li>Menggunakan bot/scraper yang membebani sistem tanpa izin.</li>
<li>Menyamar sebagai pihak lain atau menyalahgunakan peran admin/editor.</li>
</ul>

<h2>6. Tautan pihak ketiga</h2>
<p>Portal dapat memuat tautan ke situs eksternal. {$org} tidak mengendalikan dan tidak bertanggung jawab atas konten atau kebijakan privasi pihak ketiga tersebut.</p>

<h2>7. Penafian</h2>
<p>Portal disediakan "sebagaimana adanya". Sepanjang diizinkan hukum, {$org} tidak menjamin ketiadaan gangguan, kesalahan, atau kesesuaian penuh untuk tujuan tertentu di luar layanan resmi yang diumumkan.</p>

<h2>8. Batasan tanggung jawab</h2>
<p>Sejauh diizinkan hukum, {$org} tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan Portal.</p>

<h2>9. Perubahan syarat</h2>
<p>{$org} dapat memperbarui Syarat &amp; Ketentuan ini. Versi terbaru ditampilkan di halaman ini. Penggunaan lanjutan setelah pembaruan merupakan penerimaan atas syarat yang diperbarui.</p>

<h2>10. Hukum yang berlaku</h2>
<p>Syarat ini diatur oleh hukum Republik Indonesia. Sengketa diupayakan diselesaikan secara musyawarah; bila gagal, diselesaikan melalui forum yang berwenang sesuai domisili {$org}.</p>

<h2>11. Kontak</h2>
<p>Pertanyaan terkait syarat ini dapat diajukan melalui kontak resmi di portal <strong>{$org}</strong>.</p>

<p><em>Terakhir diperbarui: {$year}. Dokumen ini dihasilkan untuk {$org} dan dapat diedit oleh administrator CMS.</em></p>
HTML;

        return [
            'key' => 'terms',
            'title' => 'Syarat & Ketentuan',
            'body' => $body,
            'is_published' => true,
        ];
    }

    /**
     * @return list<array{key: string, title: string, body: string, is_published: bool}>
     */
    public static function allDefaults(?string $org = null): array
    {
        $name = $org ?: self::institutionName();

        return [
            self::privacy($name),
            self::terms($name),
        ];
    }
}
