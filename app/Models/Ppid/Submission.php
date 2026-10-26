<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasUuids;

    protected $table = 'ppid_submissions';

    protected $guarded = [];

    protected $hidden = ['access_hash'];

    protected function casts(): array
    {
        return ['answers' => 'encrypted:array', 'form_snapshot' => 'array', 'received_at' => 'datetime', 'due_at' => 'date', 'extended' => 'boolean'];
    }
}
