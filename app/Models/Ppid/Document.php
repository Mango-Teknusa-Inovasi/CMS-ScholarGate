<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasUuids;

    protected $table = 'ppid_documents';

    protected $guarded = [];

    protected $hidden = [];

    protected function casts(): array
    {
        return ['published_snapshot' => 'array', 'version' => 'integer'];
    }
}
