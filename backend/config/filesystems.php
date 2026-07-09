<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Wajib object storage (Cloudflare R2 / S3). Default: r2
    | Dev lokal boleh public jika R2_* belum diisi (lihat MediaStorage).
    |
    */

    'default' => env('FILESYSTEM_DISK', 'r2'),

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        /*
        |--------------------------------------------------------------------------
        | Cloudflare R2 (S3-compatible) — wajib production
        | Env pattern sama twibbon-moklet / moklet-dev
        |--------------------------------------------------------------------------
        */
        'r2' => [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('R2_BUCKET_NAME'),
            'url' => env('R2_PUBLIC_URL'),
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', true),
            'throw' => true,
            'report' => false,
            'visibility' => 'private', // R2 public via custom domain (R2_PUBLIC_URL)
            'folder' => env('R2_FOLDER_PATH', 'scholargate'),
            'options' => [
                'http' => [
                    'timeout' => 60,
                ],
            ],
        ],

        // Alias AWS env (opsional S3 murni)
        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID', env('R2_ACCESS_KEY_ID')),
            'secret' => env('AWS_SECRET_ACCESS_KEY', env('R2_SECRET_ACCESS_KEY')),
            'region' => env('AWS_DEFAULT_REGION', env('R2_REGION', 'auto')),
            'bucket' => env('AWS_BUCKET', env('R2_BUCKET_NAME')),
            'url' => env('AWS_URL', env('R2_PUBLIC_URL')),
            'endpoint' => env('AWS_ENDPOINT', env('R2_ENDPOINT')),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', true),
            'throw' => true,
            'report' => false,
            'visibility' => 'private',
            'folder' => env('R2_FOLDER_PATH', 'scholargate'),
        ],

    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
