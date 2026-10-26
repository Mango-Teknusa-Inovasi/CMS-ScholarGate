<?php

namespace App\Models\Ppid;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $table = 'ppid_notifications';

    protected $guarded = [];

    protected $hidden = [];

    protected function casts(): array
    {
        return ['recipient' => 'encrypted', 'message' => 'encrypted', 'sent_at' => 'datetime'];
    }
}
