<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ContactInfo extends Model
{
    use HasUuids;
    protected $fillable = [
        'type', 'label', 'value', 'link_url', 'icon', 'sort_order',
    ];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }
}
