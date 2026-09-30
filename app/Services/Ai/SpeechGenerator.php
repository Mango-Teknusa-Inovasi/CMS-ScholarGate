<?php

namespace App\Services\Ai;

use App\Models\Setting;

class SpeechGenerator
{
    /**
     * Generate pidato sambutan Kepala Sekolah / Pejabat.
     */
    public function generateWelcomeSpeech(array $params): array
    {
        $speakerName = trim((string) ($params['speaker_name'] ?? $params['speaker'] ?? 'Kepala Sekolah'));
        $speakerTitle = trim((string) ($params['speaker_title'] ?? 'Kepala Sekolah'));
        $tone = (string) ($params['tone'] ?? 'warm');
        $keyPoints = trim((string) ($params['key_points'] ?? $params['theme'] ?? ''));

        $displayModel = AiClient::getDisplayModelName();
        $personaRules = AiClient::buildAssistantPersonaRules($displayModel);

        $toneDesc = match ($tone) {
            'visionary' => 'Fokus pada inovasi digital, kesiapan masa depan, keunggulan akademik, dan daya saing global.',
            'character' => 'Fokus pada pembentukan akhlak mulia, kedisiplinan, kebudayaan sekolah, dan integritas.',
            'religious' => 'Fokus pada nilai-nilai keimanan, ketaqwaan, kebersamaan, dan keteladanan.',
            default => 'Hangat, mengayomi, penuh harapan, menyapa seluruh warga sekolah, siswa, orang tua, dan alumni.',
        };

        $messages = [
            ['role' => 'system', 'content' => "{$personaRules}\n\nAnda adalah penyusun naskah pidato resmi untuk institusi pendidikan (CMS ScholarGate). Buat naskah sambutan resmi yang inspiratif, berbobot, dan mengalir indah."],
            ['role' => 'user', 'content' => "Buat sambutan resmi untuk:\n- Pembicara: {$speakerName} ({$speakerTitle})\n- Gaya/Nada: {$toneDesc}\n- Poin Utama: {$keyPoints}\n\nFormat output JSON:\n{\n  \"title\": \"string (Judul Sambutan)\",\n  \"badge_left\": \"string\",\n  \"badge_right\": \"string\",\n  \"chat_label\": \"string (Label pesan singkat)\",\n  \"body_html\": \"string (Teks sambutan utuh dalam HTML <p>)\"\n}"],
        ];

        $rawJson = AiClient::callOpenAiApi($messages, 0.7, 'json_object');
        $parsed = json_decode($rawJson, true) ?: [];

        return [
            'title' => trim((string) ($parsed['title'] ?? "Sambutan {$speakerTitle}")),
            'badge_left' => trim((string) ($parsed['badge_left'] ?? 'Tahun Ajaran Baru')),
            'badge_right' => trim((string) ($parsed['badge_right'] ?? 'Unggul & Berkarakter')),
            'chat_label' => trim((string) ($parsed['chat_label'] ?? 'Pesan Inspiratif')),
            'body_html' => trim((string) ($parsed['body_html'] ?? '<p>Selamat datang di portal resmi sekolah kami.</p>')),
        ];
    }

    /**
     * Generate konten profil sekolah (Sejarah, Visi Misi, Fasilitas, Budaya).
     */
    public function generateProfileTab(array $params): array
    {
        $tabKey = (string) ($params['tab_key'] ?? $params['tab_label'] ?? 'overview');
        $prompt = trim((string) ($params['prompt'] ?? $params['hints'] ?? ''));

        $displayModel = AiClient::getDisplayModelName();
        $personaRules = AiClient::buildAssistantPersonaRules($displayModel);

        $tabDesc = match ($tabKey) {
            'history' => 'Sejarah pendirian sekolah, perjalan perkembangan dari masa ke masa, dan tonggak prestasi.',
            'vision', 'Visi Misi' => 'Visi, Misi, dan Tujuan Strategis Institusi Sekolah.',
            'facilities' => 'Sarana dan prasarana unggulan, laboratorium digital, perpustakaan, dan fasilitas penunjang.',
            default => 'Gambaran umum profil institusi sekolah modern.',
        };

        $messages = [
            ['role' => 'system', 'content' => "{$personaRules}\n\nAnda adalah penulis profil institusi pendidikan profesional. Buat konten profil dalam format HTML bersih (menggunakan <p>, <h2>, <ul>, <li>) yang menarik dan informatif."],
            ['role' => 'user', 'content' => "Topik Profil: {$tabDesc}\nPetunjuk Khusus: {$prompt}\n\nFormat JSON:\n{\n  \"tab_label\": \"string\",\n  \"content_html\": \"string (HTML bersih)\"\n}"],
        ];

        $rawJson = AiClient::callOpenAiApi($messages, 0.7, 'json_object');
        $parsed = json_decode($rawJson, true) ?: [];

        return [
            'tab_label' => trim((string) ($parsed['tab_label'] ?? $parsed['title'] ?? 'Profil Sekolah')),
            'content_html' => trim((string) ($parsed['content_html'] ?? $parsed['body_html'] ?? '<p>Informasi profil sekolah.</p>')),
        ];
    }
}
