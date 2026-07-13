<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hanya role admin murni (bukan editor). Backup & user management.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'isSuperAdmin') || ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Akses ditolak. Hanya super admin yang diizinkan.',
            ], 403);
        }

        return $next($request);
    }
}
