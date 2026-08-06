<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPA belum di-build — Scholargate</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #faf6f1; color: #374151; margin: 0; }
        .box { max-width: 560px; margin: 4rem auto; padding: 2rem; background: #fff; border-radius: 16px; border: 1px solid #ebe2d6; }
        h1 { font-size: 1.25rem; color: #1f2937; }
        code { background: #f4e8d9; padding: .15rem .4rem; border-radius: 6px; font-size: .9em; }
        pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 12px; overflow: auto; font-size: .85rem; }
        a { color: #0ea5e9; }
    </style>
</head>
<body>
<div class="box">
    <h1>Frontend SPA belum di-build</h1>
    <p>Build React sekali (bisa di komputer lokal), lalu upload hasilnya ke server. Node <strong>tidak</strong> perlu jalan di shared hosting.</p>
    <pre>cd frontend
npm install
npm run build</pre>
    <p>Output masuk ke <code>backend/public/spa</code>. Setelah itu refresh halaman ini.</p>
    <p><a href="/install">← Installer</a> · <a href="/api/v1/settings/public">Cek API</a></p>
</div>
</body>
</html>
