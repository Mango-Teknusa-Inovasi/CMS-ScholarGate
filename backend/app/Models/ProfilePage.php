<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfilePage extends Model
{
    protected $fillable = ['title', 'subtitle', 'tabs'];

    protected function casts(): array
    {
        return ['tabs' => 'array'];
    }
}
