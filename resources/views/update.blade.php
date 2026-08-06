<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>Update — Scholargate CMS</title>
    <style>
        :root {
            --page: #faf6f1; --peach: #f4e8d9; --ink: #1f2937; --body: #374151;
            --subtle: #6b7280; --line: #ebe2d6; --brand: #0ea5e9; --brand-dark: #0284c7;
            --ok: #047857; --danger: #b91c1c; --warn: #b45309;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
            background: var(--page); color: var(--body); line-height: 1.5;
        }
        .wrap { max-width: 560px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
        .card {
            background: #fff; border: 1px solid var(--line); border-radius: 16px;
            padding: 1.75rem; box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }
        .brand { display: flex; align-items: center; gap: .75rem; margin-bottom: 1.25rem; }
        .logo {
            width: 42px; height: 42px; border-radius: 12px; background: var(--brand);
            color: #fff; display: grid; place-items: center; font-weight: 700;
        }
        h1 { margin: 0; font-size: 1.4rem; color: var(--ink); }
        .sub { color: var(--subtle); font-size: .9rem; margin-top: .25rem; }
        h2 { font-size: .95rem; color: var(--ink); margin: 1.25rem 0 .6rem; }
        label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .35rem; color: var(--ink); }
        input[type=email], input[type=password] {
            width: 100%; padding: .65rem .75rem; border: 1px solid var(--line);
            border-radius: 12px; font-size: .95rem; background: #faf3eb; margin-bottom: .75rem;
        }
        input:focus { outline: 2px solid color-mix(in srgb, var(--brand) 35%, transparent); border-color: var(--brand); }
        .note {
            padding: .85rem 1rem; border-radius: 12px; margin: 1rem 0;
            background: var(--peach); border: 1px solid var(--line); font-size: .875rem;
        }
        .stat {
            display: flex; gap: .75rem; flex-wrap: wrap; margin: .75rem 0 1rem;
        }
        .pill {
            border-radius: 999px; padding: .35rem .75rem; font-size: .8rem; font-weight: 600;
            border: 1px solid var(--line); background: #f8fafc;
        }
        .pill.warn { background: #fffbeb; border-color: #fde68a; color: var(--warn); }
        .pill.ok { background: #ecfdf5; border-color: #a7f3d0; color: var(--ok); }
        .alert {
            padding: .85rem 1rem; border-radius: 12px; margin-bottom: 1rem;
            background: #fef2f2; color: var(--danger); border: 1px solid #fecaca; font-size: .9rem;
        }
        .success {
            padding: .85rem 1rem; border-radius: 12px; margin-bottom: 1rem;
            background: #ecfdf5; color: var(--ok); border: 1px solid #a7f3d0; font-size: .9rem;
        }
        .checkbox { display: flex; align-items: flex-start; gap: .5rem; font-size: .875rem; margin: .75rem 0; }
        .checkbox input { margin-top: .2rem; }
        button {
            appearance: none; border: 0; border-radius: 12px; padding: .75rem 1.25rem;
            background: var(--brand); color: #fff; font-weight: 600; font-size: .95rem; cursor: pointer;
            width: 100%;
        }
        button:hover { background: var(--brand-dark); }
        button:disabled { opacity: .55; cursor: not-allowed; }
        code { font-size: .8rem; background: #f3f4f6; padding: .1rem .35rem; border-radius: 6px; }
        pre {
            margin: .5rem 0 0; padding: .65rem .75rem; border-radius: 10px;
            background: #0f172a; color: #e2e8f0; font-size: .72rem; overflow: auto; max-height: 160px;
        }
        .step { margin: .5rem 0; font-size: .85rem; }
        .step.ok { color: var(--ok); }
        .step.bad { color: var(--danger); }
        footer { text-align: center; margin-top: 1.25rem; font-size: .8rem; color: var(--subtle); }
        a { color: var(--brand); font-weight: 600; text-decoration: none; }
        ul.pending { margin: .4rem 0 0; padding-left: 1.1rem; font-size: .8rem; color: var(--subtle); }
    </style>
</head>
<body>
<div class="wrap">
    <div class="brand">
        <div class="logo">S</div>
        <div>
            <h1>Update aplikasi</h1>
            <div class="sub">Jalankan migrasi & bersihkan cache setelah ganti file</div>
        </div>
    </div>

    <div class="card">
        @if(session('status'))
            <div class="{{ !empty($result['ok']) ? 'success' : 'alert' }}">
                {{ session('status') }}
            </div>
        @endif

        @if($errors->any())
            <div class="alert">
                {{ $errors->first() }}
            </div>
        @endif

        <div class="stat">
            @if(($status['pending_count'] ?? 0) > 0)
                <span class="pill warn">{{ $status['pending_count'] }} migrasi menunggu</span>
            @else
                <span class="pill ok">Database mutakhir</span>
            @endif
            @if(!empty($status['last_update']['updated_at']))
                <span class="pill">Update terakhir: {{ \Illuminate\Support\Carbon::parse($status['last_update']['updated_at'])->timezone(config('app.timezone'))->format('d M Y H:i') }}</span>
            @endif
        </div>

        @if(!empty($status['pending']))
            <h2>Migrasi pending</h2>
            <ul class="pending">
                @foreach(array_slice($status['pending'], 0, 12) as $m)
                    <li><code>{{ $m }}</code></li>
                @endforeach
                @if(count($status['pending']) > 12)
                    <li>… dan {{ count($status['pending']) - 12 }} lainnya</li>
                @endif
            </ul>
        @endif

        @if(!empty($result['steps']))
            <h2>Hasil langkah terakhir</h2>
            @foreach($result['steps'] as $step)
                <div class="step {{ $step['ok'] ? 'ok' : 'bad' }}">
                    <strong>{{ $step['name'] }}</strong>
                    @if(!empty($step['output']))
                        <pre>{{ $step['output'] }}</pre>
                    @endif
                </div>
            @endforeach
        @endif

        <div class="note">
            <strong>Alur deploy sederhana:</strong>
            <ol style="margin:.4rem 0 0;padding-left:1.15rem">
                <li>Upload/ganti file <code>backend/</code> (+ SPA build bila ada)</li>
                <li>Buka halaman ini: <code>/update</code></li>
                <li>Login admin → jalankan update</li>
            </ol>
            Tidak menghapus data (bukan <code>migrate:fresh</code>).
        </div>

        <form method="post" action="{{ route('update.store') }}" id="update-form">
            @csrf
            <h2>Login admin</h2>
            <label for="email">Email admin</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username">

            <label for="password">Password</label>
            <input id="password" type="password" name="password" required autocomplete="current-password">

            <div class="checkbox">
                <input type="hidden" name="optimize" value="0">
                <input type="checkbox" name="optimize" id="optimize" value="1" @checked(old('optimize', '1') === '1')>
                <label for="optimize" style="margin:0;font-weight:500">
                    Optimize production (config/route cache) — disarankan di server live
                </label>
            </div>

            <div class="checkbox">
                <input type="checkbox" name="confirm" id="confirm" value="1" required>
                <label for="confirm" style="margin:0;font-weight:500">
                    Saya sudah backup database dan yakin menjalankan update
                </label>
            </div>

            <button type="submit" id="submit-btn">Jalankan update</button>
        </form>
    </div>

    <footer>
        <a href="/">← Portal</a>
        ·
        <a href="/admin">Admin CMS</a>
    </footer>
</div>
<script>
document.getElementById('update-form').addEventListener('submit', () => {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Menjalankan…';
});
</script>
</body>
</html>
