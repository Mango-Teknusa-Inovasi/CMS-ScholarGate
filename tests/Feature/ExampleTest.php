<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint(): void
    {
        File::ensureDirectoryExists(storage_path('app'));
        File::put(storage_path('app/installed'), '1');

        try {
            $this->get('/up')->assertOk();
        } finally {
            File::delete(storage_path('app/installed'));
        }
    }
}
