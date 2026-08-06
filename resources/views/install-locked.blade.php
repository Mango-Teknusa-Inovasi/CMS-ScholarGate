<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installer terkunci — Scholargate</title>
    <style>
        :root {
            --page: #faf6f1; --ink: #1f2937; --body: #374151; --subtle: #6b7280;
            --line: #ebe2d6; --brand: #0ea5e9; --danger: #b91c1c;
        }
        body {
            margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
            background: var(--page); color: var(--body); line-height: 1.5;
        }
        .wrap { max-width: 520px; margin: 4rem auto; padding: 0 1.25rem; }
        .card {
            background: #fff; border: 1px solid var(--line); border-radius: 16px;
            padding: 1.75rem; box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }
        h1 { margin: 0 0 .5rem; font-size: 1.35rem; color: var(--ink); }
        p { margin: 0 0 .75rem; font-size: .95rem; }
        .reason {
            margin: 1rem 0; padding: .85rem 1rem; border-radius: 12px;
            background: #fef2f2; border: 1px solid #fecaca; color: var(--danger); font-size: .875rem;
        }
        code {
            font-size: .8rem; background: #f3f4f6; padding: .15rem .4rem; border-radius: 6px;
        }
        a { color: var(--brand); font-weight: 600; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ol { margin: .5rem 0 0; padding-left: 1.2rem; font-size: .875rem; color: var(--subtle); }
        li { margin-bottom: .35rem; }
    </style>
</head>
<body>
<div class="wrap">
    <div class="card">
        <h1>Installer web terkunci</h1>
        <p>Endpoint <code>/install</code> tidak tersedia untuk mencegah instalasi ulang yang tidak sah.</p>
        <div class="reason">{{ $reason }}</div>
        <p style="font-size:.875rem;color:var(--subtle)">Jika Anda operator yang sengaja ingin setup ulang:</p>
        <ol>
            <li>Set <code>ALLOW_INSTALL=true</code> di file <code>.env</code></li>
            <li>Hapus lock (opsional): <code>storage/app/installed</code></li>
            <li>Buka <code>/install</code> sekali, lalu pastikan flag kembali <code>false</code></li>
            <li>Atau pakai CLI: <code>php artisan scholargate:install --force</code></li>
        </ol>
        <p style="margin-top:1.25rem"><a href="/">← Kembali ke beranda</a></p>
    </div>
</div>
</body>
</html>
