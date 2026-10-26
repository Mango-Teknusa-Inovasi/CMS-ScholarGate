<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    protected $table = 'ppid_settings';

    protected $guarded = [];

    protected $hidden = [];

    protected function casts(): array
    {
        return ['data' => 'array'];
    }
}
