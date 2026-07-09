<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactInfo extends Model
{
    protected $fillable = [
        'type', 'label', 'value', 'link_url', 'icon', 'sort_order',
    ];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }
}
