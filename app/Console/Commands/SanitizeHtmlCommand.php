<?php

namespace App\Console\Commands;

use App\Models\Achievement;
use App\Models\Article;
use App\Models\ProfilePage;
use App\Models\WelcomeBlock;
use App\Services\HtmlSanitizer;
use Illuminate\Console\Command;

/**
 * Re-sanitize HTML konten yang sudah tersimpan (satu kali setelah deploy).
 */
class SanitizeHtmlCommand extends Command
{
    protected $signature = 'scholargate:sanitize-html
        {--dry-run : Hanya hitung, tidak menyimpan}';

    protected $description = 'Sanitize HTML konten CMS (artikel, sambutan, prestasi, profil) lewat HTMLPurifier';

    public function handle(HtmlSanitizer $sanitizer): int
    {
        $dry = (bool) $this->option('dry-run');
        $this->components->info($dry ? 'Dry-run — tidak menyimpan' : 'Membersihkan HTML tersimpan…');

        $counts = [
            'articles' => 0,
            'welcome_blocks' => 0,
            'achievements' => 0,
            'profile_pages' => 0,
        ];

        Article::query()->orderBy('id')->chunkById(50, function ($rows) use ($sanitizer, $dry, &$counts) {
            foreach ($rows as $row) {
                $dirty = false;
                $body = is_string($row->body) ? $sanitizer->clean($row->body) : $row->body;
                if ($body !== $row->body) {
                    $row->body = $body;
                    $dirty = true;
                }
                if (is_array($row->faq_items)) {
                    $faq = $sanitizer->cleanFaq($row->faq_items);
                    if ($faq != $row->faq_items) {
                        $row->faq_items = $faq;
                        $dirty = true;
                    }
                }
                if ($dirty) {
                    $counts['articles']++;
                    if (! $dry) {
                        // saveQuietly agar tidak double-sanitize confusion; tetap clean
                        $row->saveQuietly();
                    }
                }
            }
        });

        WelcomeBlock::query()->orderBy('id')->chunkById(50, function ($rows) use ($sanitizer, $dry, &$counts) {
            foreach ($rows as $row) {
                if (! is_string($row->body)) {
                    continue;
                }
                $body = $sanitizer->clean($row->body);
                if ($body !== $row->body) {
                    $counts['welcome_blocks']++;
                    if (! $dry) {
                        $row->body = $body;
                        $row->saveQuietly();
                    }
                }
            }
        });

        Achievement::query()->orderBy('id')->chunkById(50, function ($rows) use ($sanitizer, $dry, &$counts) {
            foreach ($rows as $row) {
                if (! is_string($row->body)) {
                    continue;
                }
                $body = $sanitizer->clean($row->body);
                if ($body !== $row->body) {
                    $counts['achievements']++;
                    if (! $dry) {
                        $row->body = $body;
                        $row->saveQuietly();
                    }
                }
            }
        });

        ProfilePage::query()->orderBy('id')->chunkById(20, function ($rows) use ($sanitizer, $dry, &$counts) {
            foreach ($rows as $row) {
                if (! is_array($row->tabs)) {
                    continue;
                }
                $tabs = $sanitizer->cleanTabs($row->tabs);
                if ($tabs != $row->tabs) {
                    $counts['profile_pages']++;
                    if (! $dry) {
                        $row->tabs = $tabs;
                        $row->saveQuietly();
                    }
                }
            }
        });

        $this->table(['Resource', 'Diubah'], [
            ['articles', $counts['articles']],
            ['welcome_blocks', $counts['welcome_blocks']],
            ['achievements', $counts['achievements']],
            ['profile_pages', $counts['profile_pages']],
        ]);

        $this->components->info($dry ? 'Dry-run selesai.' : 'Sanitize selesai.');

        return self::SUCCESS;
    }
}
