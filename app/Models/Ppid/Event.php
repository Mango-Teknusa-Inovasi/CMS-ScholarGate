<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $table = 'ppid_events';

    protected $guarded = [];

    protected $hidden = [];

    protected function casts(): array
    {
        return ['message' => 'encrypted', 'public' => 'boolean'];
    }
}
