<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    use HasUuids;

    protected $table = 'ppid_files';

    protected $guarded = [];

    protected $hidden = ['storage_location', 'public_location', 'object_key', 'public_key', 'disk', 'public_disk'];

    protected function casts(): array
    {
        return ['storage_location' => 'encrypted:array', 'public_location' => 'encrypted:array', 'recipient_visible' => 'boolean'];
    }
}
