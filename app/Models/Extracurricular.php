<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Extracurricular extends Model
{
    use HasUuids;
    protected $fillable = [
        'title',
        'description',
        'icon',
        'logo_path',
        'schedule',
        'coach',
        'url',
        'open_in_new_tab',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'open_in_new_tab' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
