<?php

namespace Tests\Feature\Ppid;

use App\Models\Ppid\Attachment;
use App\Models\Ppid\Configuration;
use App\Models\Ppid\Document;
use App\Models\Ppid\Event;
use App\Models\Ppid\Notice;
use App\Models\Ppid\Submission;
use App\Models\User;
use App\Services\Ppid\Archive;
use App\Services\Ppid\FileStore;
use App\Services\Ppid\Forms;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageAndWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private FileStore $store;

    protected function setUp(): void
    {
        parent::setUp();
        config(['filesystems.default' => 'public', 'cache.default' => 'array', 'session.driver' => 'array']);
        $this->withHeader('Origin', 'http://localhost');
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->store = new class extends FileStore
        {
            public array $seen = [];

            private array $initialized = [];

            public function filesystem(string $disk, array $location)
            {
                $key = 'ppid-test-'.($location['bucket'] ?? (str_contains($location['root'] ?? '', 'private') ? 'private' : 'public'));
                $this->seen[] = [$disk, $location];
                if (! isset($this->initialized[$key])) {
                    Storage::fake($key);
                    $this->initialized[$key] = true;
                }

                return Storage::disk($key);
            }
        };
        $this->app->instance(FileStore::class, $this->store);
    }

    private function submission(string $kind = 'request'): Submission
    {
        return Submission::create(['register' => 'PPID-'.uniqid(), 'kind' => $kind, 'access_hash' => Hash::make('a-private-access-code'), 'answers' => ['name' => 'Pemohon', 'email' => 'applicant@example.test'], 'form_snapshot' => ['version' => 0, 'fields' => Forms::defaults($kind)], 'received_at' => now(), 'due_at' => now()->addDays(10)]);
    }

    public function test_private_upload_publication_withdrawal_and_provider_switch(): void
    {
        foreach (['public', 'r2', 's3'] as $disk) {
            config(['filesystems.default' => $disk, "filesystems.disks.$disk.bucket" => $disk.'-public', "filesystems.ppid_private_buckets.$disk" => $disk.'-private', "filesystems.disks.$disk.url" => "https://$disk.example.test", "filesystems.disks.$disk.driver" => $disk === 'public' ? 'local' : 's3']);
            $document = Document::create(['title' => 'Laporan', 'classification' => 'laporan']);
            $file = $this->store->put(UploadedFile::fake()->createWithContent('laporan.txt', 'Laporan resmi tanpa perubahan'), ['document_id' => $document->id]);
            $this->assertNull($file->public_key);
            $this->assertSame(hash('sha256', 'Laporan resmi tanpa perubahan'), $file->checksum);
            $this->store->publish($file);
            $this->assertNotNull($file->public_key);
            $key = $file->public_key;
            $location = $file->public_location;
            $this->assertSame('Laporan resmi tanpa perubahan', $this->store->filesystem($file->public_disk, $location)->get($key));
            config(['filesystems.default' => 'public', "filesystems.disks.$disk.bucket" => 'replacement-bucket']);
            $this->store->withdraw($file);
            $this->assertFalse($this->store->filesystem($disk, $location)->exists($key));
            $this->assertSame('Laporan resmi tanpa perubahan', $this->store->filesystem($file->disk, $file->storage_location)->get($file->object_key));
        }
    }

    public function test_partial_publication_failure_removes_new_public_copies(): void
    {
        $document = Document::create(['title' => 'Laporan', 'classification' => 'berkala', 'source' => 'upload']);
        $first = $this->store->put(UploadedFile::fake()->createWithContent('one.txt', 'One'), ['document_id' => $document->id]);
        $second = $this->store->put(UploadedFile::fake()->createWithContent('two.txt', 'Two'), ['document_id' => $document->id]);
        $real = $this->store;
        $broken = \Mockery::mock(FileStore::class)->makePartial();
        $broken->shouldReceive('publish')->with(\Mockery::on(fn ($f) => $f->id === $first->id))->once()->andReturnUsing(fn ($f) => $real->publish($f));
        $broken->shouldReceive('publish')->with(\Mockery::on(fn ($f) => $f->id === $second->id))->once()->andThrow(new \RuntimeException('cloud unavailable'));
        $broken->shouldReceive('withdraw')->once()->andReturnUsing(fn ($f) => $real->withdraw($f));
        $this->app->instance(FileStore::class, $broken);
        $staff = User::factory()->create(['role' => 'member', 'ppid_roles' => ['publisher']]);
        $this->actingAs($staff)->postJson('/api/v1/admin/ppid/documents/'.$document->id.'/publish', ['file_ids' => [$first->id, $second->id]])->assertStatus(500);
        $this->assertNull($first->fresh()->public_key);
        $this->assertNull($document->fresh()->published_snapshot);
        $this->assertSame([], $real->filesystem('public', $real->location('public', false))->allFiles());
    }

    public function test_failed_cloud_write_does_not_create_metadata_or_fallback(): void
    {
        config(['filesystems.default' => 's3', 'filesystems.disks.s3.bucket' => 'public', 'filesystems.ppid_private_buckets.s3' => 'private']);
        $fake = \Mockery::mock(FilesystemAdapter::class);
        $fake->shouldReceive('writeStream')->once()->andThrow(new \RuntimeException('cloud unavailable'));
        $store = \Mockery::mock(FileStore::class)->makePartial();
        $store->shouldReceive('filesystem')->once()->with('s3', \Mockery::type('array'))->andReturn($fake);
        try {
            $store->put(UploadedFile::fake()->createWithContent('file.txt', 'Test'), []);
            $this->fail('Expected failure');
        } catch (\RuntimeException $e) {
            $this->assertSame('cloud unavailable', $e->getMessage());
        }
        $this->assertDatabaseCount('ppid_files', 0);
    }

    public function test_private_file_rejects_unrelated_applicant_and_staff(): void
    {
        $s = $this->submission();
        $other = $this->submission();
        $file = $this->store->put(UploadedFile::fake()->createWithContent('identity.txt', 'Sensitive'), ['submission_id' => $s->id]);
        $this->withSession(['ppid.tracking' => ['id' => $other->id, 'expires' => time() + 300]])->getJson('/api/v1/ppid/private-files/'.$file->id)->assertForbidden();
        $staff = User::factory()->create(['role' => 'member', 'ppid_roles' => ['information']]);
        $this->actingAs($staff)->getJson('/api/v1/admin/ppid/files/'.$file->id)->assertForbidden();
        $staff->update(['ppid_roles' => ['service']]);
        $this->get('/api/v1/admin/ppid/files/'.$file->id)->assertOk();
        $this->assertDatabaseHas('ppid_events', ['action' => 'download', 'submission_id' => $s->id]);
    }

    public function test_tracking_rejects_wrong_code_and_hides_internal_notes(): void
    {
        $s = $this->submission();
        Event::create(['submission_id' => $s->id, 'action' => 'note', 'message' => 'Internal confidential', 'public' => false]);
        $this->withSession([])->postJson('/api/v1/ppid/unlock', ['register' => $s->register, 'access_code' => 'wrong'])->assertUnprocessable();
        $this->withSession([])->postJson('/api/v1/ppid/unlock', ['register' => $s->register, 'access_code' => 'a-private-access-code'])->assertOk()->assertJsonCount(0, 'events')->assertJsonMissingPath('submission.access_hash');
    }

    public function test_extension_only_once_and_objection_requires_supervisor(): void
    {
        $staff = User::factory()->create(['role' => 'member', 'ppid_roles' => ['service']]);
        $this->actingAs($staff);
        $s = $this->submission();
        $this->postJson('/api/v1/admin/ppid/submissions/'.$s->id.'/actions', ['action' => 'extend', 'message' => 'Dokumen masih dihimpun.'])->assertOk();
        $this->postJson('/api/v1/admin/ppid/submissions/'.$s->id.'/actions', ['action' => 'extend', 'message' => 'Ulang'])->assertUnprocessable();
        $objection = $this->submission('objection');
        $this->postJson('/api/v1/admin/ppid/submissions/'.$objection->id.'/actions', ['action' => 'respond', 'message' => 'Tanggapan', 'outcome' => 'granted'])->assertForbidden();
    }

    public function test_encrypted_backup_restores_files_and_leaves_intake_closed(): void
    {
        if (! class_exists(\ZipArchive::class)) {
            $this->markTestSkipped('ZIP is unavailable');
        }
        $s = $this->submission();
        $file = $this->store->put(UploadedFile::fake()->createWithContent('identity.txt', 'Sensitive'), ['submission_id' => $s->id]);
        $archive = new Archive;
        $path = $archive->export('A-strong-backup-password');
        try {
            $zip = new \ZipArchive;
            $zip->open($path);
            $this->assertFalse(@$zip->getFromName('manifest.json'));
            $zip->close();
            Attachment::query()->delete();
            Submission::query()->delete();
            $archive->restore($path, 'A-strong-backup-password');
            $restored = Attachment::findOrFail($file->id);
            $this->assertSame('Sensitive', $this->store->filesystem($restored->disk, $restored->storage_location)->get($restored->object_key));
            $this->assertSame('Pemohon', Submission::findOrFail($s->id)->answers['name']);
            $this->assertFalse(Configuration::find(1)->data['accepting']);
            $this->assertFalse(Configuration::find(1)->data['enabled']);
        } finally {
            @unlink($path);
        }
    }

    public function test_conditional_hidden_answers_are_not_retained(): void
    {
        $request = Request::create('/', 'POST', ['answers' => ['kind' => 'individual', 'hidden' => 'Injected']]);
        $schema = ['fields' => [['key' => 'kind', 'label' => 'Type', 'required' => true, 'type' => 'text'], ['key' => 'hidden', 'label' => 'Hidden', 'required' => true, 'type' => 'text', 'condition' => ['field' => 'kind', 'operator' => 'equals', 'value' => 'organization']]]];
        $this->assertSame(['kind' => 'individual'], Forms::answers($request, $schema));
    }

    public function test_mail_failures_are_retained_for_retry(): void
    {
        $s = $this->submission();
        Notice::create(['submission_id' => $s->id, 'recipient' => 'applicant@example.test', 'message' => 'Notice']);
        Mail::shouldReceive('raw')->times(3)->andThrow(new \RuntimeException('temporary mail error'));
        $this->artisan('ppid:send-notices')->assertSuccessful();
        $this->assertSame('pending', Notice::first()->state);
        $this->artisan('ppid:send-notices')->assertSuccessful();
        $this->artisan('ppid:send-notices')->assertSuccessful();
        $this->assertSame('failed', Notice::first()->state);
        $this->assertSame(3, Notice::first()->attempts);
    }
}
