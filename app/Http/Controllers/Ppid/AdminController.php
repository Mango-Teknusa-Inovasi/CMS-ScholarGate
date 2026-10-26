<?php

namespace App\Http\Controllers\Ppid;

use App\Http\Controllers\Controller;
use App\Models\Ppid\Attachment;
use App\Models\Ppid\Configuration;
use App\Models\Ppid\Document;
use App\Models\Ppid\Event;
use App\Models\Ppid\Notice;
use App\Models\Ppid\Submission;
use App\Models\User;
use App\Services\Ppid\Access;
use App\Services\Ppid\Archive;
use App\Services\Ppid\FileStore;
use App\Services\Ppid\Forms;
use App\Services\Ppid\Settings;
use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private function allow(Request $r, string ...$roles): void
    {
        Access::require($r->user(), ...$roles);
        if (! in_array($r->route()?->getActionMethod(), ['bootstrap', 'settings', 'form'])) {
            Settings::enabled();
        }
    }

    private function serviceAccess(Request $r, Submission $s): void
    {
        $this->allow($r, ...match ($s->kind) {
            'objection' => ['supervisor', 'service'], 'guest', 'visit' => ['frontdesk', 'service'], default => ['service']
        });
    }

    public function bootstrap(Request $r)
    {
        $this->allow($r, ...Access::ROLES);

        return response()->json(['settings' => Settings::get(), 'ready' => Settings::ready(), 'storage' => ['provider' => MediaStorage::diskName(), 'private_ready' => app(FileStore::class)->ready()], 'roles' => $r->user()->isSuperAdmin() ? Access::ROLES : $r->user()->ppid_roles, 'is_admin' => $r->user()->isSuperAdmin(), 'forms' => collect(Forms::KINDS)->map(fn ($k) => Forms::current($k)), 'statistics' => (new PublicController)->statistics()]);
    }

    public function settings(Request $r)
    {
        $this->allow($r, 'manager');
        $v = $r->validate(['enabled' => 'required|boolean', 'accepting' => 'required|boolean', 'name' => 'required|string|max:200', 'email' => 'nullable|email|max:254', 'phone' => 'nullable|string|max:80', 'address' => 'nullable|string|max:2000', 'hours' => 'nullable|string|max:500', 'profile' => 'nullable|string|max:30000', 'standards' => 'nullable|string|max:30000', 'complaint_url' => 'nullable|url:http,https|max:2000', 'holidays' => 'present|array|max:366', 'holidays.*' => 'date_format:Y-m-d', 'weekend' => 'required|array|min:1|max:6', 'weekend.*' => 'integer|min:0|max:6', 'survey_weights' => 'sometimes|array', 'survey_weights.*' => 'numeric|min:0|max:100']);
        $old = Settings::get();
        if ($v['accepting']) {
            abort_unless(! empty($v['email']) && ! empty($v['phone']) && User::whereNotNull('ppid_roles')->exists() && app(FileStore::class)->ready(), 422, 'Lengkapi kontak, penugasan petugas, dan bucket privat terlebih dahulu.');
        }
        Configuration::updateOrCreate(['id' => 1], ['data' => array_replace($old, $v)]);

        return $this->bootstrap($r);
    }

    public function staff(Request $r)
    {
        abort_unless($r->user()->isSuperAdmin(), 403);

        return response()->json(User::orderBy('name')->get(['id', 'name', 'email', 'role', 'ppid_roles']));
    }

    public function assign(Request $r, User $user)
    {
        abort_unless($r->user()->isSuperAdmin(), 403);
        $v = $r->validate(['ppid_roles' => 'present|array', 'ppid_roles.*' => [Rule::in(Access::ROLES)]]);
        $user->update(['ppid_roles' => $v['ppid_roles'] ?: null]);
        Event::create(['actor_id' => $r->user()->id, 'action' => 'staff_assignment', 'message' => json_encode(['user' => $user->id, 'roles' => $v['ppid_roles']])]);

        return $this->staff($r);
    }

    public function form(Request $r, string $kind)
    {
        $this->allow($r, 'manager');

        return response()->json(Forms::save($kind, $r));
    }

    public function documents(Request $r)
    {
        $this->allow($r, 'information', 'publisher');

        return response()->json(Document::when($r->filled('q'), fn ($q) => $q->where('title', 'like', '%'.mb_substr($r->input('q'), 0, 200).'%'))->orderByDesc('updated_at')->paginate(25));
    }

    public function document(Request $r, Document $document)
    {
        $this->allow($r, 'information', 'publisher');

        return response()->json(['document' => $document, 'files' => Attachment::where('document_id', $document->id)->orderByDesc('created_at')->get()]);
    }

    public function saveDocument(Request $r, ?Document $document = null)
    {
        $this->allow($r, 'information', 'publisher');
        $v = $r->validate(['title' => 'required|string|max:255', 'summary' => 'nullable|string|max:20000', 'classification' => ['required', Rule::in(['berkala', 'serta_merta', 'setiap_saat', 'laporan', 'terbatas'])], 'category' => 'nullable|string|max:150', 'year' => 'nullable|integer|min:1900|max:2200', 'owner' => 'nullable|string|max:255', 'retention' => 'nullable|string|max:255', 'format' => 'nullable|string|max:100', 'source' => 'required|in:upload,link,physical', 'source_url' => 'nullable|required_if:source,link|url:http,https|max:2000', 'physical_location' => 'nullable|required_if:source,physical|string|max:2000', 'status' => 'required|in:draft,review']);
        $document ??= new Document;
        $document->fill($v)->save();

        return $this->document($r, $document);
    }

    public function upload(Request $r, Document $document)
    {
        $this->allow($r, 'information', 'publisher');
        $r->validate(['file' => 'required|file|max:20480']);

        return response()->json(app(FileStore::class)->put($r->file('file'), ['document_id' => $document->id, 'version' => $document->version + 1]), 201);
    }

    public function publish(Request $r, Document $document)
    {
        $this->allow($r, 'publisher');
        abort_if($document->classification === 'terbatas', 422, 'Dokumen terbatas tidak dapat diterbitkan.');
        $v = $r->validate(['file_ids' => 'present|array|max:50', 'file_ids.*' => 'uuid']);
        $files = Attachment::where('document_id', $document->id)->whereIn('id', $v['file_ids'])->get();
        abort_unless($files->count() === count(array_unique($v['file_ids'])), 422, 'Lampiran tidak sesuai dokumen.');
        abort_if($document->source === 'upload' && $files->isEmpty(), 422, 'Unggah dan pilih setidaknya satu lampiran.');
        $store = app(FileStore::class);
        $newCopies = [];
        try {
            foreach ($files as $f) {
                $alreadyPublic = filled($f->public_key);
                $store->publish($f);
                if (! $alreadyPublic) {
                    $newCopies[] = $f;
                }
            }
            $snapshot = $document->only(['title', 'summary', 'classification', 'category', 'year', 'owner', 'retention', 'format', 'source', 'source_url', 'physical_location']);
            $document->update(['version' => $document->version + 1, 'published_snapshot' => $snapshot + ['file_ids' => $files->modelKeys(), 'published_at' => now()->toIso8601String(), 'version' => $document->version + 1], 'status' => 'published']);
        } catch (\Throwable $e) {
            foreach ($newCopies as $copy) {
                $store->withdraw($copy);
            }
            throw $e;
        }
        foreach (Attachment::where('document_id', $document->id)->whereNotIn('id', $files->modelKeys())->whereNotNull('public_key')->get() as $f) {
            $store->withdraw($f);
        }
        Event::create(['document_id' => $document->id, 'actor_id' => $r->user()->id, 'action' => 'publish']);

        return $this->document($r, $document);
    }

    public function withdraw(Request $r, Document $document)
    {
        $this->allow($r, 'publisher');
        foreach (Attachment::where('document_id', $document->id)->whereNotNull('public_key')->get() as $f) {
            app(FileStore::class)->withdraw($f);
        }
        $document->update(['published_snapshot' => null, 'status' => 'archived']);
        Event::create(['document_id' => $document->id, 'actor_id' => $r->user()->id, 'action' => 'withdraw']);

        return $this->document($r, $document);
    }

    public function submissions(Request $r)
    {
        $this->allow($r, 'service', 'supervisor', 'frontdesk');
        $allowed = [];
        if (Access::allows($r->user(), 'service')) {
            $allowed = Forms::KINDS;
        }
        if (Access::allows($r->user(), 'supervisor')) {
            $allowed[] = 'objection';
        }
        if (Access::allows($r->user(), 'frontdesk')) {
            $allowed = array_merge($allowed, ['guest', 'visit']);
        }
        $q = Submission::whereIn('kind', $allowed)->when($r->filled('kind'), fn ($q) => $q->where('kind', $r->input('kind')))->when($r->filled('status'), fn ($q) => $q->where('status', $r->input('status')))->when($r->filled('q'), fn ($q) => $q->where('register', 'like', '%'.mb_substr($r->input('q'), 0, 80).'%'));
        if ($r->boolean('priority')) {
            $q->whereNotIn('status', ['responded', 'completed'])->orderBy('due_at')->orderBy('received_at');
        } else {
            $q->orderByDesc('received_at');
        }
        foreach (['from' => '>=', 'to' => '<='] as $key => $op) {
            if ($r->filled($key)) {
                $r->validate([$key => 'date_format:Y-m-d']);
                $q->whereDate('received_at', $op, $r->input($key));
            }
        }
        if ($r->filled('channel')) {
            $q->where('channel', $r->input('channel'));
        }
        if ($r->boolean('export')) {
            return response()->streamDownload(function () use ($q) {
                $out = fopen('php://output', 'w');
                fputcsv($out, ['Nomor', 'Layanan', 'Kanal', 'Status', 'Tanggal', 'Tenggat']);
                foreach ($q->cursor() as $s) {
                    fputcsv($out, [$s->register, $s->kind, $s->channel, $s->status, $s->received_at->toDateString(), $s->due_at?->toDateString()]);
                } fclose($out);
            }, 'register-ppid.csv', ['Content-Type' => 'text/csv', 'Cache-Control' => 'private, no-store']);
        }
        $result = $q->paginate(25);
        $result->getCollection()->transform(fn ($s) => $s->only(['id', 'register', 'kind', 'channel', 'status', 'received_at', 'due_at', 'outcome']));

        return response()->json($result);
    }

    public function submission(Request $r, Submission $submission)
    {
        $this->serviceAccess($r, $submission);
        Event::create(['submission_id' => $submission->id, 'actor_id' => $r->user()->id, 'action' => 'view']);

        return response()->json(['submission' => $submission, 'files' => Attachment::where('submission_id', $submission->id)->get(), 'events' => Event::where('submission_id', $submission->id)->whereNotIn('action', ['view', 'download'])->orderBy('id')->get(), 'notices' => Notice::where('submission_id', $submission->id)->get(['id', 'state', 'attempts', 'sent_at'])]);
    }

    public function offline(Request $r, string $kind)
    {
        $this->allow($r, 'frontdesk', 'service');
        abort_unless(in_array($kind, ['request', 'guest', 'visit']), 422);

        return (new PublicController)->createSubmission($r, $kind, true);
    }

    public function action(Request $r, Submission $submission)
    {
        $this->serviceAccess($r, $submission);
        $v = $r->validate(['action' => 'required|in:note,needs_information,processing,extend,respond,complete', 'message' => 'required|string|max:20000', 'outcome' => 'nullable|in:granted,partial,rejected,accepted,rescheduled', 'file' => 'nullable|file|max:20480']);
        if ($v['action'] === 'respond' && $submission->kind === 'objection') {
            $this->allow($r, 'supervisor');
        }
        $allowed = ['note' => ['received', 'needs_information', 'processing', 'responded', 'completed'], 'needs_information' => ['received', 'processing'], 'processing' => ['received', 'needs_information'], 'extend' => ['received', 'needs_information', 'processing'], 'respond' => ['received', 'needs_information', 'processing'], 'complete' => ['responded']];
        abort_unless(in_array($submission->status, $allowed[$v['action']]), 422, 'Tindakan tidak sesuai tahap layanan.');
        if ($v['action'] === 'respond') {
            abort_unless(! empty($v['outcome']), 422, 'Pilih hasil pelayanan.');
        }
        $public = $v['action'] !== 'note';
        DB::transaction(function () use ($r, $submission, $v, $public, $allowed) {
            $s = Submission::whereKey($submission->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($s->status, $allowed[$v['action']]), 422, 'Status sudah berubah. Muat ulang pengajuan.');
            if ($v['action'] === 'extend') {
                abort_unless($s->kind === 'request' && ! $s->extended, 422, 'Perpanjangan hanya satu kali untuk permohonan informasi.');
                $s->extended = true;
                $s->due_at = Settings::due($s->due_at, 7);
            } elseif ($v['action'] !== 'note') {
                $s->status = match ($v['action']) {
                    'respond' => 'responded', 'complete' => 'completed', default => $v['action']
                };
            }
            if ($v['action'] === 'respond') {
                $s->outcome = $v['outcome'];
            }
            $s->save();
            if ($r->hasFile('file')) {
                app(FileStore::class)->put($r->file('file'), ['submission_id' => $s->id, 'field' => 'response', 'recipient_visible' => $public]);
            }
            Event::create(['submission_id' => $s->id, 'actor_id' => $r->user()->id, 'action' => $v['action'], 'message' => $v['message'], 'public' => $public]);
            if ($public && ! empty($s->answers['email'])) {
                Notice::create(['submission_id' => $s->id, 'recipient' => $s->answers['email'], 'message' => 'Ada pembaruan layanan '.$s->register.'. Buka '.url('/ppid/lacak').' dengan kode akses Anda.']);
            }
        });

        return $this->submission($r, $submission->fresh());
    }

    public function file(Request $r, Attachment $file)
    {
        if ($file->document_id) {
            $this->allow($r, 'information', 'publisher');
        } else {
            $this->serviceAccess($r, Submission::findOrFail($file->submission_id));
        }
        Event::create(['submission_id' => $file->submission_id, 'document_id' => $file->document_id, 'actor_id' => $r->user()->id, 'action' => 'download', 'message' => $file->id]);

        return app(FileStore::class)->response($file);
    }

    public function retryNotice(Request $r, Notice $notice)
    {
        $this->serviceAccess($r, Submission::findOrFail($notice->submission_id));
        abort_unless($notice->state === 'failed', 422);
        $notice->update(['state' => 'pending', 'attempts' => 0]);

        return response()->json(['message' => 'Pengiriman dijadwalkan ulang.']);
    }

    public function exportBackup(Request $r)
    {
        abort_unless($r->user()->isSuperAdmin(), 403);
        $v = $r->validate(['password' => 'required|string|min:12|max:200']);
        $path = app(Archive::class)->export($v['password']);

        return response()->download($path, 'ppid-'.now()->format('Ymd-His').'.zip', ['Cache-Control' => 'private, no-store'])->deleteFileAfterSend();
    }

    public function restoreBackup(Request $r)
    {
        abort_unless($r->user()->isSuperAdmin(), 403);
        $v = $r->validate(['password' => 'required|string|min:12|max:200', 'file' => 'required|file|max:524288|mimes:zip']);
        app(Archive::class)->restore($r->file('file')->getRealPath(), $v['password']);

        return response()->json(['message' => 'Cadangan dipulihkan. Periksa pengaturan sebelum membuka layanan.']);
    }
}
