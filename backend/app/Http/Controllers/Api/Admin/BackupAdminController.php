<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupAdminController extends Controller
{
    public function __construct(private BackupService $backups) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'backups' => $this->backups->list(),
        ]);
    }

    public function store(): JsonResponse
    {
        $meta = $this->backups->create();

        return response()->json([
            'message' => 'Backup dibuat',
            'backup' => $meta,
        ], 201);
    }

    public function download(string $filename): BinaryFileResponse
    {
        $path = $this->backups->absolutePath($filename);

        return response()->download($path, basename($path));
    }

    public function destroy(string $filename): JsonResponse
    {
        $this->backups->delete($filename);

        return response()->json(['message' => 'Backup dihapus']);
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:40960', 'mimes:json,zip,txt'],
            'mode' => ['nullable', 'in:merge,replace'],
            // Restore tabel users (password) — default false demi keamanan
            'include_users' => ['nullable', 'boolean'],
        ]);

        $file = $request->file('file');
        $mode = $request->string('mode', 'merge')->toString() ?: 'merge';
        $includeUsers = $request->boolean('include_users');

        try {
            $json = $this->backups->extractJsonFromUpload(
                $file->getRealPath() ?: '',
                $file->getClientOriginalName()
            );
            $result = $this->backups->restoreFromJson($json, $mode, $includeUsers);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Restore gagal. Periksa log server.',
            ], 500);
        }

        return response()->json([
            'message' => 'Restore berhasil',
            'tables' => $result['tables'],
            'rows' => $result['rows'],
            'skipped' => $result['skipped'] ?? [],
            'mode' => $mode,
            'include_users' => $includeUsers,
        ]);
    }
}
