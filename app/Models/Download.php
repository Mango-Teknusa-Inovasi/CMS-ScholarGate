<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    protected $fillable = [
        'title', 'description', 'file_path', 'file_name', 'category',
        'download_count', 'is_active', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'download_count' => 'integer',
            'published_at' => 'datetime',
        ];
    }
}
