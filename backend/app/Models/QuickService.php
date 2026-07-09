<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuickService extends Model
{
    protected $fillable = [
        'title', 'description', 'icon', 'color', 'link_url',
        'link_label', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
