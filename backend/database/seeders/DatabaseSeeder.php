<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Extracurricular;
use App\Models\Article;
use App\Models\Banner;
use App\Models\Category;
use App\Models\ContactInfo;
use App\Models\Download;
use App\Models\GalleryItem;
use App\Models\Partner;
use App\Models\ProfilePage;
use App\Models\QuickService;
use App\Models\ServiceItem;
use App\Models\Setting;
use App\Models\User;
use App\Models\MenuItem;
use App\Models\Tag;
use App\Models\WelcomeBlock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Password dari env (jangan pakai "password" di production)
        $adminPassword = env('SEED_ADMIN_PASSWORD', 'Scholargate!Admin2026');
        $memberPassword = env('SEED_MEMBER_PASSWORD', 'Scholargate!Member2026');

        $admin = User::query()->updateOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'admin@scholargate.test')],
            [
                'name' => 'Admin Scholargate',
                'password' => $adminPassword,
                'role' => 'admin',
            ]
        );

        // Akun member area (portal) — avatar Gravatar dari email
        User::query()->updateOrCreate(
            ['email' => env('SEED_MEMBER_EMAIL', 'member@scholargate.test')],
            [
                'name' => 'Member Demo',
                'password' => $memberPassword,
                'role' => 'member',
            ]
        );

        $settings = [
            'site_name' => 'Scholargate',
            'site_tagline' => 'Portal Informasi & Layanan Pendidikan',
            'site_description' => 'Portal Scholargate menyediakan informasi, layanan digital, dan berbagi praktik baik pendidikan.',
            'footer_text' => 'Scholargate merupakan sistem informasi terintegrasi untuk layanan pendidikan berbasis teknologi.',
            'report_url' => 'https://example.com/lapor',
            'login_url' => '/admin/login',
            'social_facebook' => '#',
            'social_instagram' => '#',
            'social_youtube' => '#',
            'social_x' => '#',
            'copyright' => '© '.date('Y').' Scholargate. All rights reserved.',
            'contact_email' => 'info@scholargate.test',
            'contact_phone' => '(031) 555-0100',
        ];

        foreach ($settings as $key => $value) {
            Setting::setValue($key, $value);
        }

        Banner::query()->delete();
        Banner::create([
            'title' => 'Selamat Datang di Scholargate',
            'subtitle' => 'Portal informasi, layanan, dan kolaborasi pendidikan yang modern.',
            'image_path' => null,
            'cta_label' => 'Jelajahi Artikel',
            'cta_url' => '/artikel',
            'sort_order' => 1,
            'is_active' => true,
        ]);
        Banner::create([
            'title' => 'Inovasi & Prestasi Bersama',
            'subtitle' => 'Dokumentasi karya, prestasi, dan program unggulan komunitas pendidikan.',
            'image_path' => null,
            'cta_label' => 'Lihat Prestasi',
            'cta_url' => '/prestasi',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        WelcomeBlock::query()->updateOrCreate(
            ['key' => 'home'],
            [
                'title' => 'Selamat datang di Portal Scholargate',
                'body' => "Portal ini hadir sebagai pusat informasi dan layanan pendidikan yang terintegrasi.\nMelalui portal ini tersedia ruang informasi, layanan digital, dan berbagi praktik baik yang mendukung pendidikan yang adaptif, kolaboratif, dan relevan dengan kebutuhan masa depan.",
                'image_path' => null,
                'badge_left' => 'SEMANGAT',
                'badge_right' => 'SCHO LAGATE',
                'chat_label' => 'Tanya Portal',
                'is_active' => true,
            ]
        );

        WelcomeBlock::query()->updateOrCreate(
            ['key' => 'profile'],
            [
                'title' => 'Selamat datang di Profil Scholargate',
                'body' => "Portal ini menjadi pusat informasi dan layanan bagi satuan pendidikan.\nMelalui ruang informasi, layanan digital, dan berbagi praktik baik, kami mendorong sinergi untuk mewujudkan pendidikan yang unggul dan berdaya saing.",
                'image_path' => null,
                'badge_left' => 'SEMANGAT',
                'badge_right' => 'SCHO LAGATE',
                'chat_label' => null,
                'is_active' => true,
            ]
        );

        ServiceItem::query()->delete();
        $services = [
            ['e-Layanan', 'Pengajuan layanan online', 'file-text', '#0EA5E9'],
            ['Perizinan', 'Layanan perizinan digital', 'badge-check', '#10B981'],
            ['Kegiatan', 'Agenda dan aktivasi program', 'calendar', '#F59E0B'],
            ['Usulan Bantuan', 'Bantuan serta usulan', 'hand-coins', '#8B5CF6'],
            ['Artikel', 'Berita dan publikasi resmi', 'newspaper', '#3B82F6'],
            ['Download', 'Pusat dokumen resmi', 'download', '#14B8A6'],
        ];
        foreach ($services as $i => [$title, $desc, $icon, $color]) {
            ServiceItem::create([
                'title' => $title,
                'description' => $desc,
                'icon' => $icon,
                'color' => $color,
                'link_url' => '#',
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        $categories = [
            ['Informasi', 'informasi', '#0EA5E9'],
            ['Kegiatan', 'kegiatan', '#10B981'],
            ['Prestasi', 'prestasi', '#F59E0B'],
            ['Pengumuman', 'pengumuman', '#8B5CF6'],
            ['Kerja Sama', 'kerja-sama', '#EC4899'],
        ];
        Category::query()->delete();
        $categoryModels = [];
        foreach ($categories as $i => [$name, $slug, $color]) {
            $categoryModels[] = Category::create([
                'name' => $name,
                'slug' => $slug,
                'color' => $color,
                'sort_order' => $i + 1,
            ]);
        }

        Article::query()->forceDelete();
        $articles = [
            [
                'title' => 'Scholargate Luncurkan Portal Informasi Pendidikan Terpadu',
                'excerpt' => 'Portal baru menghadirkan layanan digital, publikasi, dan kolaborasi untuk ekosistem pendidikan.',
                'featured' => true,
                'views' => 1280,
            ],
            [
                'title' => '200 Siswa Raih Sertifikasi Kompetensi Digital Nasional',
                'excerpt' => 'Program sertifikasi memperkuat kesiapan lulusan menghadapi dunia kerja berbasis teknologi.',
                'featured' => false,
                'views' => 860,
            ],
            [
                'title' => 'Perkuat Kemitraan Industri: Magang Bersertifikat Dimulai',
                'excerpt' => 'Kolaborasi dengan mitra industri membuka jalur magang terstruktur bagi peserta didik.',
                'featured' => false,
                'views' => 640,
            ],
            [
                'title' => 'Workshop Pembelajaran Adaptif untuk Pendidik',
                'excerpt' => 'Pelatihan membekali guru dengan pendekatan pembelajaran yang relevan dan inklusif.',
                'featured' => false,
                'views' => 520,
            ],
            [
                'title' => 'Program Bantuan Sarana Pendidikan Tahun 2026 Dibuka',
                'excerpt' => 'Satuan pendidikan dapat mengajukan usulan bantuan melalui layanan digital Scholargate.',
                'featured' => false,
                'views' => 910,
            ],
            [
                'title' => 'Gelar Karya Inovasi: 50 Proyek Digital Dipamerkan',
                'excerpt' => 'Pameran menampilkan karya terbaik siswa dalam teknologi, desain, dan kewirausahaan.',
                'featured' => true,
                'views' => 1100,
            ],
            [
                'title' => 'SMK Mitra Raih Juara Kompetisi Robotik Internasional',
                'excerpt' => 'Tim robotik membuktikan kemampuan rekayasa dan kolaborasi di kancah internasional.',
                'featured' => false,
                'views' => 1500,
            ],
            [
                'title' => 'Forum Kepala Sekolah Bahas Strategi Mutu 2026',
                'excerpt' => 'Diskusi fokus pada peningkatan mutu, relevansi kurikulum, dan kemitraan industri.',
                'featured' => false,
                'views' => 430,
            ],
        ];

        foreach ($articles as $i => $item) {
            $cat = $categoryModels[$i % count($categoryModels)];
            Article::create([
                'category_id' => $cat->id,
                'user_id' => $admin->id,
                'title' => $item['title'],
                'slug' => Str::slug($item['title']),
                'excerpt' => $item['excerpt'],
                'body' => $this->articleBody($item['title'], $item['excerpt']),
                'cover_path' => null,
                'status' => 'published',
                'is_featured' => $item['featured'],
                'views' => $item['views'],
                'published_at' => now()->subDays(count($articles) - $i),
            ]);
        }

        Achievement::query()->delete();
        $achievements = [
            ['Edsel Paramarta Raih Hat-trick Prestasi Internasional', 'Prestasi Internasional', true],
            ['Tim Robotik Juara 1 Kompetisi Asia Tenggara', 'Robotik', false],
            ['Desain Produk Lokal Masuk Final Global Challenge', 'Desain', false],
            ['Startup Siswa Raih Pendanaan Inkubasi Nasional', 'Kewirausahaan', false],
        ];
        foreach ($achievements as $i => [$title, $badge, $featured]) {
            Achievement::create([
                'title' => $title,
                'slug' => Str::slug($title),
                'excerpt' => 'Dokumentasi prestasi unggulan yang menginspirasi ekosistem pendidikan Scholargate.',
                'body' => '<p>Prestasi ini menjadi bukti komitmen peserta didik dan pendidik dalam berinovasi.</p>',
                'badge_label' => $badge,
                'is_featured' => $featured,
                'status' => 'published',
                'achieved_at' => now()->subMonths($i + 1),
                'sort_order' => $i + 1,
            ]);
        }

        GalleryItem::query()->delete();
        for ($i = 1; $i <= 9; $i++) {
            GalleryItem::create([
                'title' => "Karya Digital {$i}",
                'image_path' => "placeholders/gallery-{$i}.jpg",
                'caption' => "Dokumentasi kegiatan dan karya #{$i}",
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        Partner::query()->delete();
        foreach (['Mitra Industri A', 'Asosiasi B', 'Kampus C', 'Yayasan D', 'Komunitas E', 'Lembaga F'] as $i => $name) {
            Partner::create([
                'name' => $name,
                'logo_path' => null,
                'url' => '#',
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        ContactInfo::query()->delete();
        $contacts = [
            ['address', 'ALAMAT', "Gedung Pusat Layanan\nJl. Pendidikan No. 1", 'map-pin'],
            ['email', 'EMAIL', 'info@scholargate.test', 'mail'],
            ['phone', 'TELEPON', '(031) 555-0100', 'phone'],
            ['fax', 'FAX', '(031) 555-0101', 'printer'],
            ['location', 'LOKASI', 'Lihat peta di Google Maps', 'map'],
        ];
        foreach ($contacts as $i => [$type, $label, $value, $icon]) {
            ContactInfo::create([
                'type' => $type,
                'label' => $label,
                'value' => $value,
                'link_url' => $type === 'location' ? 'https://maps.google.com' : null,
                'icon' => $icon,
                'sort_order' => $i + 1,
            ]);
        }

        QuickService::query()->delete();
        $quick = [
            ['e-Layanan', 'Pengajuan layanan online', 'file-text', '#0EA5E9'],
            ['Perizinan', 'Layanan perizinan', 'badge-check', '#10B981'],
            ['Kegiatan', 'Agenda & aktivasi', 'calendar', '#F59E0B'],
            ['Usulan Bantuan', 'Bantuan serta usulan', 'hand-coins', '#8B5CF6'],
            ['Artikel', 'Berita & publikasi', 'newspaper', '#3B82F6'],
            ['Download', 'Pusat dokumen', 'download', '#14B8A6'],
        ];
        foreach ($quick as $i => [$title, $desc, $icon, $color]) {
            QuickService::create([
                'title' => $title,
                'description' => $desc,
                'icon' => $icon,
                'color' => $color,
                'link_url' => $title === 'Artikel' ? '/artikel' : ($title === 'Download' ? '/download' : '#'),
                'link_label' => 'Buka',
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        Extracurricular::query()->delete();
        $extras = [
            ['Pramuka', 'Kegiatan kepramukaan untuk membentuk karakter, kepemimpinan, dan kerja sama.', 'Users', 'Jumat, 14.00–16.00', 'Budi Santoso'],
            ['Paskibra', 'Latihan baris-berbaris dan pengibaran bendera di upacara resmi.', 'Flag', 'Senin & Rabu, 15.00–17.00', 'Siti Aminah'],
            ['Futsal', 'Latihan dan kompetisi futsal antar sekolah.', 'Trophy', 'Selasa & Kamis, 15.30–17.30', 'Andi Wijaya'],
            ['Paduan Suara', 'Pengembangan bakat seni musik vokal dan penampilan di acara sekolah.', 'Music', 'Rabu, 14.00–16.00', 'Rina Kartika'],
            ['Robotik', 'Klub robotik dan STEM untuk inovasi teknologi siswa.', 'Cpu', 'Sabtu, 09.00–12.00', 'Dewi Lestari'],
            ['English Club', 'Klub bahasa Inggris: conversation, debate, dan storytelling.', 'BookOpen', 'Kamis, 14.00–15.30', 'James Hartono'],
            ['PMR', 'Palang Merah Remaja: pertolongan pertama dan kepedulian sosial.', 'HeartPulse', 'Jumat, 13.00–15.00', 'Nur Aisyah'],
            ['Tari Tradisional', 'Pelestarian seni tari daerah dan penampilan budaya.', 'Sparkles', 'Sabtu, 13.00–15.00', 'Maya Sari'],
        ];
        foreach ($extras as $i => [$title, $desc, $icon, $schedule, $coach]) {
            Extracurricular::create([
                'title' => $title,
                'description' => $desc,
                'icon' => $icon,
                'schedule' => $schedule,
                'coach' => $coach,
                'url' => null,
                'open_in_new_tab' => false,
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        Download::query()->delete();
        foreach (['Panduan Penggunaan Portal', 'Formulir Usulan Kegiatan', 'Template Laporan Bulanan'] as $i => $title) {
            Download::create([
                'title' => $title,
                'description' => 'Dokumen resmi Scholargate.',
                'file_path' => null,
                'file_name' => Str::slug($title).'.pdf',
                'category' => 'Dokumen',
                'download_count' => rand(10, 200),
                'is_active' => true,
                'published_at' => now()->subDays($i),
            ]);
        }

        ProfilePage::query()->delete();
        ProfilePage::create([
            'title' => 'Profil Scholargate',
            'subtitle' => 'Portal informasi dan layanan pendidikan terintegrasi',
            'tabs' => [
                [
                    'key' => 'tugas',
                    'label' => 'Tugas Pokok',
                    'content_html' => '<h3>Tugas Pokok & Fungsi</h3><p>Scholargate bertugas menyediakan informasi, layanan digital, dan ruang kolaborasi untuk meningkatkan mutu dan relevansi pendidikan.</p><ul><li>Merumuskan kebijakan operasional layanan digital</li><li>Menyediakan saluran informasi yang akurat dan mutakhir</li><li>Memfasilitasi kolaborasi antar pemangku kepentingan</li><li>Mendukung monitoring dan evaluasi program</li></ul>',
                ],
                [
                    'key' => 'struktur',
                    'label' => 'Struktur',
                    'content_html' => '<h3>Struktur Organisasi</h3><p>Struktur organisasi dirancang untuk mendukung tata kelola layanan yang efisien, transparan, dan berorientasi pada pengguna.</p>',
                ],
                [
                    'key' => 'program',
                    'label' => 'Program Unggulan',
                    'content_html' => '<h3>Program Unggulan</h3><ul><li>Digitalisasi layanan pendidikan</li><li>Penguatan kemitraan industri</li><li>Pengembangan kapasitas pendidik</li><li>Publikasi praktik baik dan prestasi</li></ul>',
                ],
            ],
        ]);

        MenuItem::query()->delete();
        $headerMenus = [
            ['Beranda', '/', null],
            ['Profil', '/profil', [
                ['Tentang', '/profil'],
                ['Kontak', '/profil#kontak'],
            ]],
            ['Artikel', '/artikel', null],
            ['Prestasi', '/prestasi', null],
            ['Ekstrakurikuler', '/ekstrakurikuler', null],
            ['Download', '/download', null],
        ];
        $order = 1;
        foreach ($headerMenus as [$label, $url, $children]) {
            $parent = MenuItem::create([
                'label' => $label,
                'url' => $url,
                'location' => 'header',
                'sort_order' => $order++,
                'is_active' => true,
            ]);
            if (is_array($children)) {
                $c = 1;
                foreach ($children as [$cl, $cu]) {
                    MenuItem::create([
                        'label' => $cl,
                        'url' => $cu,
                        'location' => 'header',
                        'parent_id' => $parent->id,
                        'sort_order' => $c++,
                        'is_active' => true,
                    ]);
                }
            }
        }

        foreach ([['Profil', '/profil'], ['Artikel', '/artikel'], ['Prestasi', '/prestasi'], ['Ekstrakurikuler', '/ekstrakurikuler'], ['Download', '/download']] as $i => [$label, $url]) {
            MenuItem::create([
                'label' => $label,
                'url' => $url,
                'location' => 'footer',
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        Tag::query()->delete();
        foreach (['Sekolah', 'Prestasi', 'Kegiatan', 'Pengumuman', 'Kerja Sama'] as $name) {
            Tag::create(['name' => $name, 'slug' => \Illuminate\Support\Str::slug($name)]);
        }
    }

    private function articleBody(string $title, string $excerpt): string
    {
        return <<<HTML
<p><strong>{$title}</strong></p>
<p>{$excerpt}</p>
<p>Scholargate berkomitmen menghadirkan informasi yang kredibel, layanan yang mudah diakses, serta ruang kolaborasi yang mendorong inovasi di lingkungan pendidikan. Melalui portal ini, pemangku kepentingan dapat menemukan berita terkini, dokumen resmi, dan kanal layanan dalam satu tempat.</p>
<p>Program dan kegiatan yang dipublikasikan diharapkan menjadi inspirasi bagi satuan pendidikan untuk terus meningkatkan mutu, relevansi, dan daya saing lulusan. Mari bersama membangun ekosistem pendidikan yang adaptif dan berdaya saing global.</p>
HTML;
    }
}
