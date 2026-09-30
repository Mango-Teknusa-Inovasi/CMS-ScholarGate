<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') - {{ config('app.name', 'Portal Resmi') }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: '#0ea5e9',
                        ink: '#0f172a',
                    },
                    fontFamily: {
                        sans: ['Onest', 'sans-serif'],
                    }
                }
            }
        }
    </script>
</head>
<body class="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col min-h-screen">
    <header class="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" class="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white font-black text-sm">S</span>
                <span>{{ config('app.name', 'Portal Resmi') }}</span>
            </a>
            <a href="/" class="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline">Kembali ke Beranda &rarr;</a>
        </div>
    </header>

    <main class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-lg text-center space-y-6">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-lg">
                @yield('icon')
            </div>
            
            <div className="space-y-2">
                <span class="text-xs font-extrabold tracking-widest text-sky-600 dark:text-sky-400 uppercase">GALAT @yield('code')</span>
                <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">@yield('title')</h1>
            </div>

            <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                @yield('message')
            </p>

            <div class="pt-4 flex items-center justify-center gap-3">
                <a href="/" class="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-sky-500 text-white font-bold text-sm shadow-md hover:bg-sky-600 transition">
                    Kembali ke Beranda
                </a>
            </div>
        </div>
    </main>

    <footer class="w-full py-6 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-900">
        &copy; {{ date('Y') }} {{ config('app.name', 'Portal Resmi') }} &mdash; Hak Cipta Dilindungi.
    </footer>
</body>
</html>
