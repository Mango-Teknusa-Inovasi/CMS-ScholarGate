<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use ZipArchive;

class PluginUploadSecurityTest extends TestCase
{
    use RefreshDatabase;

    private string $tempZipPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempZipPath = tempnam(sys_get_temp_dir(), 'test_zip') . '.zip';
    }

    protected function tearDown(): void
    {
        if (file_exists($this->tempZipPath)) {
            @unlink($this->tempZipPath);
        }
        parent::tearDown();
    }

    public function test_non_admin_cannot_upload_plugin(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);
        Sanctum::actingAs($editor);

        $response = $this->postJson('/api/v1/admin/plugins/upload', [
            'file' => UploadedFile::fake()->create('plugin.zip', 100),
        ]);
        $response->assertForbidden();
    }

    public function test_plugin_upload_rejects_missing_plugin_json(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $zip = new ZipArchive();
        $zip->open($this->tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('somefile.txt', 'hello');
        $zip->close();

        $uploadedFile = new UploadedFile($this->tempZipPath, 'plugin.zip', 'application/zip', null, true);

        $response = $this->postJson('/api/v1/admin/plugins/upload', [
            'file' => $uploadedFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'File ZIP tidak valid: plugin.json tidak ditemukan.']);
    }

    public function test_plugin_upload_rejects_invalid_slug(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $zip = new ZipArchive();
        $zip->open($this->tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('plugin.json', json_encode(['slug' => 'invalid_slug_with_underscores', 'name' => 'Test']));
        $zip->close();

        $uploadedFile = new UploadedFile($this->tempZipPath, 'plugin.zip', 'application/zip', null, true);

        $response = $this->postJson('/api/v1/admin/plugins/upload', [
            'file' => $uploadedFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Slug plugin hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).']);
    }

    public function test_plugin_upload_rejects_zip_slip(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $zip = new ZipArchive();
        $zip->open($this->tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('plugin.json', json_encode(['slug' => 'test-plugin', 'name' => 'Test']));
        $zip->addFromString('../../dangerous.php', '<?php echo "evil";');
        $zip->close();

        $uploadedFile = new UploadedFile($this->tempZipPath, 'plugin.zip', 'application/zip', null, true);

        $response = $this->postJson('/api/v1/admin/plugins/upload', [
            'file' => $uploadedFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'File ZIP ditolak karena terdeteksi percobaan Path Traversal (Zip Slip).']);
    }

    public function test_plugin_upload_rejects_forbidden_files(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $zip = new ZipArchive();
        $zip->open($this->tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('plugin.json', json_encode(['slug' => 'test-plugin', 'name' => 'Test']));
        $zip->addFromString('.htaccess', 'RewriteEngine On');
        $zip->close();

        $uploadedFile = new UploadedFile($this->tempZipPath, 'plugin.zip', 'application/zip', null, true);

        $response = $this->postJson('/api/v1/admin/plugins/upload', [
            'file' => $uploadedFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'File ZIP ditolak karena berisi file terlarang (.htaccess).']);
    }
}
