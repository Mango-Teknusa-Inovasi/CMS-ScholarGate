<?php

namespace App\Console\Commands;

use App\Models\Ppid\Notice;
use App\Services\Ppid\Settings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class SendPpidNotices extends Command
{
    protected $signature = 'ppid:send-notices';

    protected $description = 'Kirim antrean pemberitahuan PPID dan coba ulang kegagalan sementara.';

    public function handle(): int
    {
        if (! Schema::hasTable('ppid_notifications') || ! Settings::get()['enabled']) {
            return self::SUCCESS;
        }
        foreach (Notice::where('state', 'pending')->where('attempts', '<', 3)->orderBy('id')->limit(50)->get() as $notice) {
            $notice->increment('attempts');
            try {
                Mail::raw($notice->message, fn ($mail) => $mail->to($notice->recipient)->subject('Pemberitahuan layanan PPID'));
                $notice->update(['state' => 'sent', 'sent_at' => now()]);
            } catch (\Throwable $e) {
                report($e);
                if ($notice->attempts >= 3) {
                    $notice->update(['state' => 'failed']);
                }
            }
        }

        return self::SUCCESS;
    }
}
