<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hanya admin/editor CMS. Token/session member ditolak.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $user || ! method_exists($user, 'isAdmin') || ! $user->isAdmin()) {
            if ($request->header('X-Inertia') || $request->expectsJson() === false && ! $request->is('api/*')) {
                if ($request->header('X-Inertia')) {
                    return redirect()->route('admin.login');
                }

                if (! $request->is('api/*')) {
                    return redirect()->route('admin.login');
                }
            }

            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk admin CMS.',
            ], 403);
        }

        return $next($request);
    }
}
