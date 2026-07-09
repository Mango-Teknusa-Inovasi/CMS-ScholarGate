<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hanya admin/editor CMS. Token member ditolak.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'isAdmin') || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk admin CMS.',
            ], 403);
        }

        return $next($request);
    }
}
