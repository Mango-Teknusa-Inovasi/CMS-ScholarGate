<?php

namespace App\Services\Ai;

use Illuminate\Support\Str;

class AchievementGenerator
{
    /**
     * Generate laporan prestasi siswa / kejuaraan.
     */
    public function generateAchievementReport(array $params): array
    {
        $title = trim((string) ($params['title'] ?? 'Prestasi Siswa'));
        $event = trim((string) ($params['event_name'] ?? 'Ajang Kejuaraan'));
        $level = trim((string) ($params['level'] ?? 'Kabupaten/Kota'));
        $winner = trim((string) ($params['winner_name'] ?? 'Tim / Siswa Berprestasi'));
        $details = trim((string) ($params['details'] ?? ''));

        $displayModel = AiClient::getDisplayModelName();
        $personaRules = AiClient::buildAssistantPersonaRules($displayModel);

        $messages = [
            ['role' => 'system', 'content' => "{$personaRules}\n\nAnda adalah jurnalis prestasi sekolah. Buat artikel berita rilis kejuaraan yang membanggakan, inspiratif, dan memberikan apresiasi tinggi."],
            ['role' => 'user', 'content' => "Materi Prestasi:\n- Nama Kejuaraan: {$event}\n- Tingkat: {$level}\n- Pemenang/Peraih: {$winner}\n- Rincian/Catatan: {$details}\n\nFormat JSON:\n{\n  \"title\": \"string (Judul berita kejuaraan)\",\n  \"slug\": \"string (URL-friendly slug)\",\n  \"badge_label\": \"string (misal: Juara 1 Provinsi 🏆)\",\n  \"excerpt\": \"string (ringkasan 1-2 kalimat)\",\n  \"body\": \"string (HTML liputan utuh)\",\n  \"category\": \"string (Prestasi)\"\n}"],
        ];

        $rawJson = AiClient::callOpenAiApi($messages, 0.7, 'json_object');
        $parsed = json_decode($rawJson, true) ?: [];

        $resTitle = trim((string) ($parsed['title'] ?? $title));
        $resBody = trim((string) ($parsed['body'] ?? $parsed['body_html'] ?? "<p>Prestasi diraih oleh {$winner} pada ajang {$event}.</p>"));

        return [
            'title' => $resTitle,
            'slug' => trim((string) ($parsed['slug'] ?? Str::slug($resTitle))),
            'badge_label' => trim((string) ($parsed['badge_label'] ?? "Tingkat {$level}")),
            'excerpt' => trim((string) ($parsed['excerpt'] ?? "Prestasi gemilang diraih oleh {$winner} pada ajang {$event}.")),
            'body' => $resBody,
            'body_html' => $resBody,
            'category' => trim((string) ($parsed['category'] ?? 'Prestasi')),
        ];
    }
}
