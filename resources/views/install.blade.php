<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalasi — Scholargate CMS</title>
    <style>
        :root {
            --page: #faf6f1;
            --peach: #f4e8d9;
            --peach-soft: #faf3eb;
            --ink: #1f2937;
            --body: #374151;
            --subtle: #6b7280;
            --line: #ebe2d6;
            --brand: #0ea5e9;
            --brand-dark: #0284c7;
            --danger: #dc2626;
            --ok: #047857;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Segoe UI", system-ui, sans-serif;
            background: var(--page);
            color: var(--body);
            line-height: 1.5;
        }
        .wrap { max-width: 720px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
        .card {
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 1.75rem;
            box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }
        .brand {
            display: flex; align-items: center; gap: .75rem; margin-bottom: 1.5rem;
        }
        .logo {
            width: 42px; height: 42px; border-radius: 12px; background: var(--brand);
            color: #fff; display: grid; place-items: center; font-weight: 700;
        }
        h1 { margin: 0; font-size: 1.5rem; color: var(--ink); }
        .sub { color: var(--subtle); font-size: .9rem; margin-top: .25rem; }
        h2 { font-size: 1rem; color: var(--ink); margin: 1.5rem 0 .75rem; }
        label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .35rem; color: var(--ink); }
        input, select {
            width: 100%; padding: .65rem .75rem; border: 1px solid var(--line);
            border-radius: 12px; font-size: .95rem; background: var(--peach-soft);
        }
        input:focus, select:focus { outline: 2px solid color-mix(in srgb, var(--brand) 35%, transparent); border-color: var(--brand); }
        .grid { display: grid; gap: 1rem; }
        @media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
        .field { margin-bottom: .15rem; }
        .hint { font-size: .75rem; color: var(--subtle); margin-top: .25rem; }
        .check {
            display: flex; gap: .5rem; align-items: flex-start; padding: .75rem;
            border-radius: 12px; border: 1px solid var(--line); background: var(--peach-soft);
            margin-bottom: .5rem; font-size: .9rem;
        }
        .check.ok { border-color: #a7f3d0; background: #ecfdf5; color: var(--ok); }
        .check.bad { border-color: #fecaca; background: #fef2f2; color: var(--danger); }
        .alert {
            padding: .85rem 1rem; border-radius: 12px; margin-bottom: 1rem;
            background: #fef2f2; color: var(--danger); border: 1px solid #fecaca; font-size: .9rem;
        }
        .alert ul { margin: .5rem 0 0; padding-left: 1.1rem; }
        .note {
            padding: .85rem 1rem; border-radius: 12px; margin: 1rem 0;
            background: var(--peach); border: 1px solid var(--line); font-size: .875rem; color: var(--body);
        }
        .actions { margin-top: 1.5rem; display: flex; gap: .75rem; flex-wrap: wrap; }
        button {
            appearance: none; border: 0; border-radius: 12px; padding: .75rem 1.25rem;
            background: var(--brand); color: #fff; font-weight: 600; font-size: .95rem; cursor: pointer;
        }
        button:hover { background: var(--brand-dark); }
        button:disabled { opacity: .5; cursor: not-allowed; }
        .checkbox { display: flex; align-items: center; gap: .5rem; font-size: .9rem; }
        .checkbox input { width: auto; }
        footer { text-align: center; margin-top: 1.5rem; font-size: .8rem; color: var(--subtle); }
    </style>
</head>
<body>
<div class="wrap">
    <div class="brand">
        <div class="logo">S</div>
        <div>
            <h1>Instalasi Scholargate</h1>
            <div class="sub">CMS portal sekolah — setup database & admin</div>
        </div>
    </div>

    <div class="card">
        <h2>1. Cek persyaratan</h2>
        @foreach($requirements['missing'] as $item)
            <div class="check bad">✗ {{ $item }}</div>
        @endforeach
        @if($requirements['ok'])
            <div class="check ok">✓ PHP & folder writable siap</div>
        @endif

        @foreach($drivers as $key => $meta)
            <div class="check {{ $meta['available'] ? 'ok' : 'bad' }}">
                {{ $meta['available'] ? '✓' : '✗' }}
                Driver {{ $meta['label'] }}
                (ekstensi {{ $meta['extension'] }}{{ $meta['available'] ? ' aktif' : ' tidak aktif' }})
            </div>
        @endforeach

        <div class="note">
            <strong>Deploy shared hosting:</strong> cukup satu document root ke folder
            <code>backend/public</code>. SPA React di-build ke <code>public/spa</code> —
            tidak perlu jalankan Node di server production.
        </div>

        @if($errors->any())
            <div class="alert">
                <strong>{{ $errors->first('install') ?: 'Gagal instalasi' }}</strong>
                @if(session('install_errors'))
                    <ul>
                        @foreach(session('install_errors') as $err)
                            <li>{{ $err }}</li>
                        @endforeach
                    </ul>
                @endif
                @foreach($errors->all() as $err)
                    @if($err !== $errors->first('install'))
                        <div>{{ $err }}</div>
                    @endif
                @endforeach
            </div>
        @endif

        <form method="post" action="{{ route('install.store') }}" id="install-form">
            @csrf

            <h2>2. Database</h2>
            <div class="grid grid-2">
                <div class="field">
                    <label for="db_connection">Jenis database</label>
                    <select name="db_connection" id="db_connection" required>
                        <option value="pgsql" @selected(old('db_connection', $defaults['db_connection']) === 'pgsql')>
                            PostgreSQL (disarankan)
                        </option>
                        <option value="mysql" @selected(old('db_connection') === 'mysql')>
                            MySQL
                        </option>
                        <option value="mariadb" @selected(old('db_connection') === 'mariadb')>
                            MariaDB
                        </option>
                    </select>
                    <div class="hint">Disarankan PostgreSQL. Migrasi & backup JSON portable ke/dari MySQL/MariaDB.</div>
                </div>
                <div class="field">
                    <label for="db_host">Host</label>
                    <input id="db_host" name="db_host" value="{{ old('db_host', $defaults['db_host']) }}" required>
                </div>
                <div class="field">
                    <label for="db_port">Port</label>
                    <input id="db_port" name="db_port" type="number" value="{{ old('db_port', $defaults['db_port']) }}" required>
                </div>
                <div class="field">
                    <label for="db_database">Nama database</label>
                    <input id="db_database" name="db_database" value="{{ old('db_database', $defaults['db_database']) }}" required>
                </div>
                <div class="field">
                    <label for="db_username">Username</label>
                    <input id="db_username" name="db_username" value="{{ old('db_username', $defaults['db_username']) }}" required>
                </div>
                <div class="field">
                    <label for="db_password">Password</label>
                    <input id="db_password" name="db_password" type="password" value="{{ old('db_password') }}" autocomplete="new-password">
                </div>
            </div>

            <h2>3. Situs & admin</h2>
            <div class="grid grid-2">
                <div class="field" style="grid-column: 1 / -1">
                    <label for="app_url">URL situs</label>
                    <input id="app_url" name="app_url" type="url" value="{{ old('app_url', $defaults['app_url']) }}" required>
                    <div class="hint">Contoh: https://sekolahmu.sch.id (tanpa slash di akhir)</div>
                </div>
                <div class="field">
                    <label for="admin_name">Nama admin</label>
                    <input id="admin_name" name="admin_name" value="{{ old('admin_name', $defaults['admin_name']) }}" required>
                </div>
                <div class="field">
                    <label for="admin_email">Email admin</label>
                    <input id="admin_email" name="admin_email" type="email" value="{{ old('admin_email', $defaults['admin_email']) }}" required>
                </div>
                <div class="field" style="grid-column: 1 / -1">
                    <label for="admin_password">Password admin (min. 8 karakter)</label>
                    <input id="admin_password" name="admin_password" type="password" minlength="8" required autocomplete="new-password">
                </div>
            </div>

            <div class="checkbox" style="margin-top: 1rem">
                <input type="hidden" name="seed" value="0">
                <input type="checkbox" name="seed" id="seed" value="1" @checked((string) old('seed', '1') === '1')>
                <label for="seed" style="margin:0;font-weight:500">Isi data demo (artikel, banner, ekstrakurikuler)</label>
            </div>

            @if(!empty($forceWarning))
                <div class="alert" style="margin-top:1rem">
                    <strong>Re-install terdeteksi</strong>
                    Database sudah berisi data. Melanjutkan akan menjalankan
                    <code>migrate:fresh</code> (semua data terhapus).
                </div>
                <div class="checkbox" style="margin-top: .75rem">
                    <input type="checkbox" name="confirm_reinstall" id="confirm_reinstall" value="1" required>
                    <label for="confirm_reinstall" style="margin:0;font-weight:600;color:var(--danger)">
                        Saya paham dan setuju menghapus semua data database
                    </label>
                </div>
            @endif

            <div class="actions">
                <button type="submit" id="submit-btn" @disabled(! $requirements['ok'])>
                    Install sekarang
                </button>
            </div>
        </form>
    </div>
    <footer>Scholargate CMS · satu document root (Laravel public) untuk shared hosting</footer>
</div>
<script>
    const driver = document.getElementById('db_connection');
    const port = document.getElementById('db_port');
    const user = document.getElementById('db_username');
    const defaults = {
        pgsql: { port: '5432', user: 'postgres' },
        mysql: { port: '3306', user: 'root' },
        mariadb: { port: '3306', user: 'root' },
    };
    driver.addEventListener('change', () => {
        const d = defaults[driver.value] || defaults.pgsql;
        port.value = d.port;
        if (!user.dataset.touched) user.value = d.user;
    });
    user.addEventListener('input', () => { user.dataset.touched = '1'; });
    document.getElementById('install-form').addEventListener('submit', () => {
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = 'Menginstal...';
    });
</script>
</body>
</html>
