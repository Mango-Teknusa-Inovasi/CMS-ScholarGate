<?php

namespace App\Services\Ppid;

use App\Models\User;

class Access
{
    public const ROLES = ['manager', 'information', 'publisher', 'service', 'supervisor', 'frontdesk'];

    public static function allows(?User $user, string ...$roles): bool
    {
        return $user && ($user->isSuperAdmin() || count(array_intersect($user->ppid_roles ?? [], $roles)) > 0);
    }

    public static function staff(?User $user): bool
    {
        return self::allows($user, ...self::ROLES);
    }

    public static function require(?User $user, string ...$roles): void
    {
        abort_unless(self::allows($user, ...$roles), 403);
    }
}
