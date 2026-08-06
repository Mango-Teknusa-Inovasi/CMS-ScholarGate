<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['gravatar_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    /** CMS staff (admin atau editor) */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'editor'], true);
    }

    /** Super admin — users, backup/restore, ops sensitif */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isMember(): bool
    {
        return $this->role === 'member' || $this->isAdmin();
    }

    /**
     * Gravatar wajib — avatar dari email (MD5).
     * d=identicon fallback jika belum set Gravatar.
     */
    public function getGravatarUrlAttribute(): string
    {
        $md5 = md5(strtolower(trim((string) $this->email)));

        return 'https://www.gravatar.com/avatar/'.$md5.'?s=128&d=identicon&r=g';
    }
}
