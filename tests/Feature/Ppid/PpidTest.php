<?php

namespace Tests\Feature\Ppid;

use App\Models\Ppid\Configuration;
use App\Models\Ppid\Document;
use App\Models\Ppid\Form;
use App\Models\Ppid\Submission;
use App\Models\Setting;
use App\Models\User;
use App\Services\Ppid\FileStore;
use App\Services\Ppid\Forms;
use App\Services\Ppid\Settings;
use App\Support\MediaStorage;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\TestCase;

class PpidTest extends TestCase
{
    use RefreshDatabase;

    private function staff(array $roles = []): User
    {
        return User::factory()->create(['role' => 'member', 'ppid_roles' => $roles]);
    }

    private function document(): Document
    {
        return Document::create(['title' => 'Anggaran sekolah', 'classification' => 'berkala', 'source' => 'physical', 'physical_location' => 'Sekretariat']);
    }

    public function test_public_reads_do_not_consume_tracking_attempts(): void
    {
        config(['cache.default' => 'array']);
        $this->withHeader('Origin', 'http://localhost')->withSession([]);
        for ($i = 0; $i < 7; $i++) {
            $this->getJson('/api/v1/ppid')->assertOk();
        }
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/ppid/unlock', [])->assertUnprocessable();
        }
        $this->postJson('/api/v1/ppid/unlock', [])->assertStatus(429);
    }

    public function test_member_without_assignment_cannot_enter_ppid(): void
    {
        $this->actingAs($this->staff())->getJson('/api/v1/admin/ppid')->assertForbidden();
    }

    public function test_staff_can_work_without_becoming_cms_admin(): void
    {
        $this->actingAs($this->staff(['information']))->getJson('/api/v1/admin/ppid')->assertOk();
        $this->getJson('/api/v1/admin/ppid/documents')->assertOk();
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->putJson('/api/v1/admin/ppid/settings', [])->assertForbidden();
        $this->postJson('/api/v1/admin/ppid/documents/'.$this->document()->id.'/publish', ['file_ids' => []])->assertForbidden();
    }

    public function test_draft_is_private_and_published_snapshot_survives_edits(): void
    {
        $d = $this->document();
        $this->getJson('/api/v1/ppid/documents/'.$d->id)->assertNotFound();
        $this->actingAs($this->staff(['publisher']))->postJson('/api/v1/admin/ppid/documents/'.$d->id.'/publish', ['file_ids' => []])->assertOk();
        $d->update(['title' => 'Perubahan rahasia', 'status' => 'draft']);
        $this->getJson('/api/v1/ppid/documents/'.$d->id)->assertOk()->assertJsonPath('title', 'Anggaran sekolah');
        $this->postJson('/api/v1/admin/ppid/documents/'.$d->id.'/withdraw')->assertOk();
        $this->getJson('/api/v1/ppid/documents/'.$d->id)->assertNotFound();
    }

    public function test_offline_request_and_frontdesk_cannot_read_identity(): void
    {
        $this->actingAs($this->staff(['frontdesk']));
        $response = $this->postJson('/api/v1/admin/ppid/offline/request', ['submission_key' => (string) Str::uuid(), 'channel' => 'langsung', 'answers' => ['name' => 'Pemohon', 'phone' => '0812345', 'address' => 'Malang', 'occupation' => 'Guru', 'applicant_type' => 'Perorangan', 'category' => 'Informasi umum', 'details' => 'Anggaran', 'purpose' => 'Penelitian', 'access_method' => 'Mendapatkan salinan', 'delivery' => 'Mengambil langsung', 'consent' => true]])->assertCreated();
        $s = Submission::first();
        $this->assertNotNull($s);
        $this->assertStringNotContainsString('Pemohon', $s->getRawOriginal('answers'));
        $this->getJson('/api/v1/admin/ppid/submissions/'.$s->id)->assertForbidden();
    }

    public function test_core_form_fields_cannot_be_removed_and_versions_are_preserved(): void
    {
        $this->actingAs($this->staff(['manager']));
        $fields = Forms::defaults('guest');
        $this->putJson('/api/v1/admin/ppid/forms/guest', ['active' => true, 'fields' => array_slice($fields, 1)])->assertUnprocessable();
        $this->putJson('/api/v1/admin/ppid/forms/guest', ['active' => true, 'fields' => $fields])->assertOk();
        $fields[0]['label'] = 'Nama pengunjung';
        $this->putJson('/api/v1/admin/ppid/forms/guest', ['active' => true, 'fields' => $fields])->assertOk();
        $this->assertDatabaseCount('ppid_forms', 2);
        $this->assertSame('Nama lengkap', Form::first()->fields[0]['label']);
    }

    public function test_business_days_skip_holidays_and_weekends(): void
    {
        Configuration::create(['id' => 1, 'data' => ['holidays' => ['2026-10-26']]]);
        $this->assertSame('2026-10-28', Settings::due(Carbon::parse('2026-10-23'), 2)->toDateString());
    }

    public function test_provider_selection_respects_s3_and_private_bucket_is_required(): void
    {
        config(['filesystems.default' => 's3', 'filesystems.disks.r2.endpoint' => 'https://example.invalid', 'filesystems.disks.r2.key' => 'key', 'filesystems.disks.r2.secret' => 'secret', 'filesystems.disks.r2.bucket' => 'public', 'filesystems.disks.s3.bucket' => 'public', 'filesystems.ppid_private_buckets.s3' => null]);
        $this->assertSame('s3', MediaStorage::diskName());
        $store = new FileStore;
        $this->assertFalse($store->ready());
        config(['filesystems.ppid_private_buckets.s3' => 'public']);
        $this->assertFalse($store->ready());
        config(['filesystems.ppid_private_buckets.s3' => 'private']);
        $this->assertTrue($store->ready());
        $this->assertSame('private', $store->location('s3', true)['bucket']);
        $this->assertArrayNotHasKey('url', $store->location('s3', true));
    }

    public function test_disable_closes_public_portal_without_deleting_records(): void
    {
        $d = $this->document();
        Configuration::create(['id' => 1, 'data' => ['enabled' => false]]);
        $this->getJson('/api/v1/ppid')->assertNotFound();
        $this->assertDatabaseHas('ppid_documents', ['id' => $d->id]);
    }

    public function test_invalid_file_type_is_rejected(): void
    {
        $this->actingAs($this->staff(['information']));
        $d = $this->document();
        $this->post('/api/v1/admin/ppid/documents/'.$d->id.'/files', ['file' => UploadedFile::fake()->create('payload.svg', 1, 'image/svg+xml')], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_manager_can_save_settings_through_specific_route(): void
    {
        $this->actingAs($this->staff(['manager']))
            ->putJson('/api/v1/admin/ppid/settings', Settings::get())
            ->assertOk()->assertJsonPath('settings.accepting', false);
    }

    public function test_only_admin_can_manage_shared_storage_and_secrets_are_masked(): void
    {
        $this->actingAs($this->staff(['manager']))->getJson('/api/v1/admin/storage')->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->putJson('/api/v1/admin/storage', [
            'provider' => 's3', 's3' => ['bucket' => 'public-test', 'private_bucket' => 'private-test', 'key' => 'sensitive-access-key', 'secret' => 'sensitive-secret-key', 'region' => 'ap-southeast-1'],
        ])->assertOk()->assertJsonPath('provider', 's3')->assertJsonMissingPath('s3.key')->assertJsonMissingPath('s3.secret');
        $this->assertStringNotContainsString('sensitive-secret-key', Setting::where('key', 'storage.configuration')->value('value'));
        $this->assertSame('private-test', config('filesystems.ppid_private_buckets.s3'));
    }
}
