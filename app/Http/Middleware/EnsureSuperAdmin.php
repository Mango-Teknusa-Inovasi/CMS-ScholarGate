<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Super admin only (role admin) — users, backup/restore.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? Auth::guard('sanctum')->user() ?? Auth::guard('web')->user() ?? Auth::user();

        if (! $user || ! method_exists($user, 'isSuperAdmin') || ! $user->isSuperAdmin()) {
            if ($request->header('X-Inertia') || (! $request->is('api/*') && ! $request->expectsJson())) {
                return redirect()->route('admin.dashboard');
            }

            return response()->json([
                'message' => 'Akses ditolak. Hanya super admin.',
            ], 403);
        }

        return $next($request);
    }
}
