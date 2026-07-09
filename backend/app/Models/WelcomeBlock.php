<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WelcomeBlock extends Model
{
    protected $fillable = [
        'key', 'title', 'body', 'image_path', 'badge_left',
        'badge_right', 'chat_label', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
