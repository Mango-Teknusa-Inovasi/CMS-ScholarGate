<?php

namespace App\Http\Controllers\Ppid;

use App\Http\Controllers\Controller;
use App\Models\Ppid\Attachment;
use App\Models\Ppid\Document;
use App\Models\Ppid\Event;
use App\Models\Ppid\Notice;
use App\Models\Ppid\Submission;
use App\Services\Ppid\FileStore;
use App\Services\Ppid\Forms;
use App\Services\Ppid\Settings;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicController extends Controller
{
    public function home()
    {
        Settings::enabled();

        return response()->json(['settings' => Settings::publicData(), 'forms' => collect(Forms::KINDS)->map(fn ($kind) => Forms::current($kind)), 'statistics' => $this->statistics(), 'survey' => $this->surveyStatistics()]);
    }

    public function statistics(): array
    {
        return Submission::query()->selectRaw('kind, status, COUNT(*) as total')->groupBy('kind', 'status')->get()->toArray();
    }

    public function surveyStatistics(): array
    {
        $groups = Submission::where('kind', 'survey')->get()->groupBy(fn ($s) => $s->form_snapshot['version']);

        return $groups->map(function ($rows, $version) {
            $fields = collect($rows->first()->form_snapshot['fields'])->filter(fn ($f) => $f['type'] === 'select');
            $averages = [];
            $weighted = 0;
            $weightTotal = 0;
            $weights = Settings::get()['survey_weights'];
            foreach ($fields as $f) {
                if (array_filter($f['options'], fn ($option) => ! is_numeric($option))) {
                    continue;
                }
                $values = $rows->map(fn ($s) => $s->answers[$f['key']] ?? null)->filter(fn ($v) => is_numeric($v));
                if ($values->isEmpty()) {
                    continue;
                }
                $mean = (float) $values->avg();
                $averages[] = ['label' => $f['label'], 'mean' => round($mean, 2), 'responses' => $values->count()];
                $weight = (float) ($weights[$f['key']] ?? 0);
                if ($f['options'] === ['1', '2', '3', '4'] && $weight > 0) {
                    $weighted += $mean / 4 * 100 * $weight;
                    $weightTotal += $weight;
                }
            }

            return ['version' => (int) $version, 'responses' => $rows->count(), 'from' => $rows->min('received_at')?->toDateString(), 'to' => $rows->max('received_at')?->toDateString(), 'averages' => $averages, 'index' => $weightTotal > 0 ? round($weighted / $weightTotal, 2) : null, 'method' => $weightTotal > 0 ? 'Rata-rata berbobot skala 1–4, dikonversi ke 100' : null];
        })->values()->all();
    }

    public function documents(Request $request)
    {
        Settings::enabled();
        $q = Document::whereNotNull('published_snapshot')->orderByDesc('updated_at');
        // Search the published snapshot, so unpublished edits never affect public search results.
        $items = $q->get()->map(fn ($d) => $this->documentData($d))->filter(function ($d) use ($request) {
            return (! $request->filled('q') || mb_stripos($d['title'].' '.$d['summary'], mb_substr($request->string('q'), 0, 200)) !== false)
                && (! $request->filled('classification') || $d['classification'] === $request->input('classification'))
                && (! $request->filled('year') || (string) $d['year'] === $request->input('year'));
        })->values();
        $page = max(1, (int) $request->input('page', 1));

        return response()->json(['data' => $items->slice(($page - 1) * 20, 20)->values(), 'total' => $items->count(), 'page' => $page]);
    }

    public function documentData(Document $document): array
    {
        $snapshot = $document->published_snapshot;
        $files = Attachment::where('document_id', $document->id)->whereIn('id', $snapshot['file_ids'] ?? [])->whereNotNull('public_key')->get();

        return $snapshot + ['id' => $document->id, 'files' => $files->map(fn ($f) => ['id' => $f->id, 'name' => $f->name, 'size' => $f->size, 'mime' => $f->mime, 'url' => app(FileStore::class)->publicUrl($f)])->all()];
    }

    public function showDocument(Document $document)
    {
        Settings::enabled();
        abort_unless($document->published_snapshot, 404);

        return response()->json($this->documentData($document));
    }

    public function file(Attachment $file)
    {
        Settings::enabled();
        $d = Document::find($file->document_id);
        abort_unless($file->public_key && $d && in_array($file->id, $d->published_snapshot['file_ids'] ?? []), 404);

        return app(FileStore::class)->response($file, true);
    }

    public function submit(Request $request, string $kind)
    {
        Settings::enabled();
        abort_unless($request->hasSession(), 403, 'Buka formulir melalui situs PPID.');
        abort_unless(Settings::get()['accepting'] && Settings::ready(), 422, 'Pengajuan online belum dibuka. Silakan hubungi petugas.');
        if ($kind === 'objection') {
            $this->tracked($request);
        }

        return Cache::lock('ppid-submit:'.hash('sha256', $request->session()->getId()), 60)->block(5, fn () => $this->createSubmission($request, $kind));
    }

    public function createSubmission(Request $request, string $kind, bool $offline = false)
    {
        $form = Forms::current($kind);
        abort_unless($form['active'], 422, 'Formulir sedang ditutup.');
        $answers = Forms::answers($request, $form, $offline);
        $input = $request->validate(['submission_key' => 'required|uuid', 'received_at' => 'nullable|date|before_or_equal:now', 'channel' => 'nullable|in:online,langsung,surat,telepon']);
        $idempotency = 'ppid.sent.'.$input['submission_key'];
        if (! $offline && $request->session()->has($idempotency)) {
            return response()->json($request->session()->get($idempotency));
        }
        $secret = Str::random(24);
        $parent = $kind === 'objection' ? $this->tracked($request)->id : null;
        $stored = [];
        try {
            $submission = DB::transaction(function () use ($request, $kind, $form, $answers, $offline, $input, $secret, $parent, &$stored) {
                $received = $offline && ! empty($input['received_at']) ? Carbon::parse($input['received_at']) : now();
                $s = Submission::create(['kind' => $kind, 'register' => 'PPID-'.now()->format('Ymd').'-'.Str::upper(Str::random(10)), 'access_hash' => Hash::make($secret), 'answers' => $answers, 'form_snapshot' => $form, 'parent_id' => $parent, 'channel' => $offline ? ($input['channel'] ?? 'langsung') : 'online', 'received_at' => $received, 'due_at' => in_array($kind, ['request', 'objection']) ? Settings::due($received, $kind === 'objection' ? 30 : 10) : null]);
                foreach ($form['fields'] as $f) {
                    if ($f['type'] === 'file' && Forms::visible($f, $answers) && $request->hasFile('files.'.$f['key'])) {
                        $stored[] = app(FileStore::class)->put($request->file('files.'.$f['key']), ['submission_id' => $s->id, 'field' => $f['key']]);
                    }
                }
                Event::create(['submission_id' => $s->id, 'actor_id' => $offline ? $request->user()->id : null, 'action' => 'received', 'message' => 'Pengajuan diterima.', 'public' => true]);
                if (! empty($answers['email'])) {
                    Notice::create(['submission_id' => $s->id, 'recipient' => $answers['email'], 'message' => "Pengajuan Anda diterima. Nomor: {$s->register}. Kode akses: {$secret}. Simpan kode ini secara pribadi. Lacak: ".url('/ppid/lacak')]);
                }

                return $s;
            });
        } catch (\Throwable $e) {
            foreach ($stored as $f) {
                app(FileStore::class)->filesystem($f->disk, $f->storage_location)->delete($f->object_key);
            }
            throw $e;
        }
        $result = ['id' => $submission->id, 'register' => $submission->register, 'access_code' => $secret];
        if (! $offline) {
            $request->session()->put($idempotency, $result);
        }

        return response()->json($result, 201);
    }

    public function unlock(Request $request)
    {
        Settings::enabled();
        abort_unless($request->hasSession(), 403, 'Buka pelacakan melalui situs PPID.');
        $v = $request->validate(['register' => 'required|string|max:80', 'access_code' => 'required|string|max:100']);
        $s = Submission::where('register', $v['register'])->first();
        abort_unless($s && Hash::check($v['access_code'], $s->access_hash), 422, 'Nomor atau kode akses tidak sesuai.');
        $request->session()->put('ppid.tracking', ['id' => $s->id, 'expires' => now()->addMinutes(30)->timestamp]);

        return $this->tracking($request);
    }

    public function tracked(Request $request): Submission
    {
        Settings::enabled();
        abort_unless($request->hasSession(), 403, 'Buka pelacakan melalui situs PPID.');
        $session = $request->session()->get('ppid.tracking', []);
        abort_unless(($session['expires'] ?? 0) > time(), 403, 'Masukkan nomor register dan kode akses kembali.');

        return Submission::findOrFail($session['id']);
    }

    public function tracking(Request $request)
    {
        $s = $this->tracked($request);

        return response()->json(['submission' => $s, 'events' => Event::where('submission_id', $s->id)->where('public', true)->orderBy('id')->get(), 'files' => Attachment::where('submission_id', $s->id)->where('recipient_visible', true)->get(), 'related' => Submission::where('parent_id', $s->id)->get(['id', 'register', 'kind', 'status', 'due_at'])]);
    }

    public function supplement(Request $request)
    {
        $s = $this->tracked($request);
        abort_unless($s->status === 'needs_information', 422, 'Saat ini tidak ada permintaan kelengkapan.');
        $request->validate(['file' => 'required|file|max:20480']);
        app(FileStore::class)->put($request->file('file'), ['submission_id' => $s->id, 'field' => 'supplement']);
        Event::create(['submission_id' => $s->id, 'action' => 'supplement', 'message' => 'Pemohon menambahkan kelengkapan.', 'public' => true]);

        return $this->tracking($request);
    }

    public function privateFile(Request $request, Attachment $file)
    {
        $s = $this->tracked($request);
        abort_unless($file->submission_id === $s->id && $file->recipient_visible, 403);
        Event::create(['submission_id' => $s->id, 'action' => 'applicant_download', 'message' => $file->id]);

        return app(FileStore::class)->response($file);
    }

    public function recover(Request $request)
    {
        Settings::enabled();
        $v = $request->validate(['register' => 'required|string|max:80', 'email' => 'required|email|max:254']);
        $s = Submission::where('register', $v['register'])->first();
        if ($s && strtolower($s->answers['email'] ?? '') === strtolower($v['email'])) {
            $token = Str::random(48);
            Cache::put('ppid.recovery.'.hash('sha256', $token), $s->id, now()->addMinutes(30));
            Notice::create(['submission_id' => $s->id, 'recipient' => $v['email'], 'message' => 'Buka tautan ini dalam 30 menit untuk mengganti kode akses: '.url('/ppid/lacak?recovery='.$token)]);
        }

        return response()->json(['message' => 'Jika data sesuai, tautan pemulihan akan dikirim ke email terdaftar.']);
    }

    public function resetCode(Request $request)
    {
        Settings::enabled();
        $v = $request->validate(['token' => 'required|string|size:48']);
        $id = Cache::pull('ppid.recovery.'.hash('sha256', $v['token']));
        abort_unless($id, 422, 'Tautan sudah digunakan atau kedaluwarsa.');
        $s = Submission::findOrFail($id);
        $code = Str::random(24);
        $s->update(['access_hash' => Hash::make($code)]);

        return response()->json(['register' => $s->register, 'access_code' => $code]);
    }
}
