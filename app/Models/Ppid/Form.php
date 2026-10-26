<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Model;

class Form extends Model
{
    protected $table = 'ppid_forms';

    protected $guarded = [];

    protected $hidden = [];

    protected function casts(): array
    {
        return ['fields' => 'array', 'active' => 'boolean'];
    }
}
