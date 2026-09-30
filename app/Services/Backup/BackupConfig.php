<?php

namespace App\Services\Backup;

class BackupConfig
{
    /** Format backup portable (naik versi jika skema berubah). */
    public const FORMAT_VERSION = 2;

    public const MAX_JSON_BYTES = 40 * 1024 * 1024; // 40MB

    /** @var list<string> Tabel konten CMS (restore pada mode Merge & Replace). */
    public static array $cmsContentTables = [
        'categories',
        'tags',
        'articles',
        'article_tag',
        'banners',
        'welcome_blocks',
        'service_items',
        'achievements',
        'gallery_items',
        'partners',
        'quick_services',
        'downloads',
        'profile_pages',
        'extracurriculars',
        'media',
    ];

    /** @var list<string> Tabel pengaturan & sistem (restore pada mode Replace atau full restore). */
    public static array $systemSettingTables = [
        'settings',
        'contact_infos',
        'menu_items',
        'legal_pages',
        'plugins',
    ];

    /** @var list<string> Semua tabel untuk export backup. */
    public static array $tables = [
        'settings',
        'categories',
        'tags',
        'articles',
        'article_tag',
        'banners',
        'welcome_blocks',
        'service_items',
        'achievements',
        'gallery_items',
        'partners',
        'contact_infos',
        'quick_services',
        'downloads',
        'menu_items',
        'profile_pages',
        'legal_pages',
        'extracurriculars',
        'media',
        'plugins',
    ];

    /** Tabel sensitif — export tanpa password; restore butuh flag + super admin. */
    public static array $sensitiveTables = [
        'users',
    ];

    /** Kolom JSON (disimpan sebagai struktur di JSON backup). */
    public static array $jsonColumns = [
        'articles' => ['faq_items'],
        'profile_pages' => ['tabs'],
        'plugins' => ['manifest', 'settings'],
    ];

    /** Kolom boolean (normalisasi 0/1 ↔ true/false). */
    public static array $boolColumns = [
        'articles' => ['is_featured', 'noindex'],
        'achievements' => ['is_featured'],
        'banners' => ['is_active'],
        'welcome_blocks' => ['is_active'],
        'service_items' => ['is_active'],
        'gallery_items' => ['is_active'],
        'partners' => ['is_active'],
        'contact_infos' => ['is_active'],
        'quick_services' => ['is_active'],
        'downloads' => ['is_active'],
        'menu_items' => ['is_active', 'open_in_new_tab'],
        'extracurriculars' => ['is_active', 'open_in_new_tab'],
        'media' => ['optimized'],
        'legal_pages' => ['is_published'],
        'plugins' => ['is_active'],
        'users' => ['is_admin'],
    ];

    /** Kolom tanggal/waktu. */
    public static array $dateColumns = [
        'articles' => ['published_at', 'created_at', 'updated_at', 'deleted_at', 'preview_token_expires_at'],
        'achievements' => ['achieved_at', 'created_at', 'updated_at'],
        'users' => ['email_verified_at', 'created_at', 'updated_at'],
        'media' => ['created_at', 'updated_at'],
        'settings' => ['created_at', 'updated_at'],
        'categories' => ['created_at', 'updated_at'],
        'tags' => ['created_at', 'updated_at'],
        'banners' => ['created_at', 'updated_at'],
        'welcome_blocks' => ['created_at', 'updated_at'],
        'service_items' => ['created_at', 'updated_at'],
        'gallery_items' => ['created_at', 'updated_at'],
        'partners' => ['created_at', 'updated_at'],
        'contact_infos' => ['created_at', 'updated_at'],
        'quick_services' => ['created_at', 'updated_at'],
        'downloads' => ['published_at', 'created_at', 'updated_at'],
        'menu_items' => ['created_at', 'updated_at'],
        'profile_pages' => ['created_at', 'updated_at'],
        'extracurriculars' => ['created_at', 'updated_at'],
        'legal_pages' => ['created_at', 'updated_at'],
        'plugins' => ['created_at', 'updated_at'],
    ];
}
