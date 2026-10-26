<?php

namespace App\Console\Commands;

use App\Models\Ppid\Event;
use App\Models\Ppid\Notice;
use App\Models\Ppid\Submission;
use App\Models\User;
use App\Services\Ppid\Settings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class RemindPpidDeadlines extends Command
{
    protected $signature = 'ppid:remind-deadlines';

    protected $description = 'Antrekan pengingat tenggat PPID untuk petugas yang berwenang.';

    public function handle(): int
    {
        if (! Schema::hasTable('ppid_submissions') || ! Settings::get()['enabled']) {
            return self::SUCCESS;
        }
        foreach (Submission::whereNotIn('status', ['responded', 'completed'])->whereDate('due_at', '<=', Settings::due(now(), 2))->get() as $s) {
            if (Event::where('submission_id', $s->id)->where('action', 'deadline_reminder')->whereDate('created_at', today())->exists()) {
                continue;
            }
            $role = $s->kind === 'objection' ? 'supervisor' : 'service';
            foreach (User::whereNotNull('ppid_roles')->get()->filter(fn ($u) => in_array($role, $u->ppid_roles ?? [])) as $user) {
                Notice::create(['submission_id' => $s->id, 'recipient' => $user->email, 'message' => "Pengingat tenggat {$s->register}: ".$s->due_at->format('d/m/Y').'. Periksa ruang kerja PPID.']);
            }
            Event::create(['submission_id' => $s->id, 'action' => 'deadline_reminder', 'message' => 'Pengingat tenggat diantrekan untuk petugas.']);
        }

        return self::SUCCESS;
    }
}
