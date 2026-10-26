<?php

use App\Http\Controllers\Ppid\AdminController as AdminPpid;
use App\Http\Controllers\Ppid\PublicController as PublicPpid;
use App\Http\Middleware\PpidPrivacy;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/ppid')->middleware(['throttle:60,1,ppid-public', PpidPrivacy::class])->group(function () {
    Route::get('/', [PublicPpid::class, 'home']);
    Route::get('/documents', [PublicPpid::class, 'documents']);
    Route::get('/documents/{document}', [PublicPpid::class, 'showDocument']);
    Route::get('/files/{file}', [PublicPpid::class, 'file']);
    Route::post('/submit/{kind}', [PublicPpid::class, 'submit'])->middleware('throttle:6,1,ppid-submit');
    Route::post('/unlock', [PublicPpid::class, 'unlock'])->middleware('throttle:6,1,ppid-unlock');
    Route::get('/tracking', [PublicPpid::class, 'tracking']);
    Route::post('/supplement', [PublicPpid::class, 'supplement']);
    Route::get('/private-files/{file}', [PublicPpid::class, 'privateFile']);
    Route::post('/recover', [PublicPpid::class, 'recover'])->middleware('throttle:3,10,ppid-recovery');
    Route::post('/reset-code', [PublicPpid::class, 'resetCode'])->middleware('throttle:6,1,ppid-resetCode');
});
Route::prefix('v1/admin/ppid')->middleware(['auth:sanctum', 'throttle:120,1,ppid-staff', PpidPrivacy::class])->group(function () {
    Route::get('/', [AdminPpid::class, 'bootstrap']);
    Route::put('/settings', [AdminPpid::class, 'settings']);
    Route::post('/backup', [AdminPpid::class, 'exportBackup']);
    Route::post('/restore', [AdminPpid::class, 'restoreBackup']);
    Route::get('/staff', [AdminPpid::class, 'staff']);
    Route::put('/staff/{user}', [AdminPpid::class, 'assign']);
    Route::put('/forms/{kind}', [AdminPpid::class, 'form']);
    Route::get('/documents', [AdminPpid::class, 'documents']);
    Route::post('/documents', [AdminPpid::class, 'saveDocument']);
    Route::get('/documents/{document}', [AdminPpid::class, 'document']);
    Route::put('/documents/{document}', [AdminPpid::class, 'saveDocument']);
    Route::post('/documents/{document}/files', [AdminPpid::class, 'upload']);
    Route::post('/documents/{document}/publish', [AdminPpid::class, 'publish']);
    Route::post('/documents/{document}/withdraw', [AdminPpid::class, 'withdraw']);
    Route::get('/submissions', [AdminPpid::class, 'submissions']);
    Route::post('/offline/{kind}', [AdminPpid::class, 'offline']);
    Route::get('/submissions/{submission}', [AdminPpid::class, 'submission']);
    Route::post('/submissions/{submission}/actions', [AdminPpid::class, 'action']);
    Route::get('/files/{file}', [AdminPpid::class, 'file']);
    Route::post('/notices/{notice}/retry', [AdminPpid::class, 'retryNotice']);
});
