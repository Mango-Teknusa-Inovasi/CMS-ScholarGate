<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plugin extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'version',
        'description',
        'author',
        'is_active',
        'manifest',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'manifest' => 'array',
            'settings' => 'array',
        ];
    }
}
