<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('code') · @yield('title') — {{ config('app.name', 'SINTESIS') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800&display=swap" rel="stylesheet" />

    <script>
        // Ikut tema aplikasi (localStorage), cegah flicker
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        }
    </script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif; }

        body {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background: #f8fafc;
            color: #0f172a;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }
        .dark body { background: #0f172a; color: #f1f5f9; }

        /* Blob dekoratif */
        .blob {
            position: fixed;
            border-radius: 9999px;
            filter: blur(90px);
            opacity: .45;
            pointer-events: none;
            z-index: 0;
            animation: drift 14s ease-in-out infinite alternate;
        }
        .blob-1 { width: 420px; height: 420px; top: -120px; left: -120px; background: #a5b4fc; }
        .blob-2 { width: 380px; height: 380px; bottom: -140px; right: -100px; background: #c084fc; animation-delay: -7s; }
        .dark .blob { opacity: .18; }

        @keyframes drift {
            from { transform: translate(0, 0) scale(1); }
            to   { transform: translate(40px, 30px) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
            .blob, .code { animation: none !important; }
        }

        main {
            position: relative;
            z-index: 1;
            text-align: center;
            max-width: 34rem;
            animation: rise .5s ease-out both;
        }
        @keyframes rise {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .brand {
            display: inline-block;
            font-weight: 800;
            font-size: 1.125rem;
            letter-spacing: .12em;
            text-decoration: none;
            background-image: linear-gradient(135deg, #0f172a 0%, #4f46e5 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            padding-right: .15em;
            margin-bottom: 1.5rem;
        }
        .dark .brand { background-image: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 100%); }

        .code {
            font-size: clamp(6rem, 22vw, 10.5rem);
            font-weight: 800;
            line-height: 1;
            letter-spacing: -.04em;
            background-image: linear-gradient(135deg, #0f172a 0%, #312e81 50%, #4c1d95 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
        }
        .dark .code { background-image: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%); }

        h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: .75rem;
        }

        .message {
            margin-top: .625rem;
            font-size: .95rem;
            line-height: 1.6;
            color: #64748b;
        }
        .dark .message { color: #94a3b8; }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: .75rem;
            justify-content: center;
            margin-top: 2rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: .5rem;
            padding: .7rem 1.4rem;
            border-radius: .75rem;
            font-family: inherit;
            font-size: .9rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: background-color .15s, border-color .15s, transform .15s;
        }
        .btn:active { transform: scale(.97); }

        .btn-primary {
            background: #4f46e5;
            color: #fff;
            border: 1px solid transparent;
            box-shadow: 0 8px 20px -8px rgba(79, 70, 229, .55);
        }
        .btn-primary:hover { background: #4338ca; }

        .btn-ghost {
            background: transparent;
            color: #334155;
            border: 1px solid #cbd5e1;
        }
        .btn-ghost:hover { border-color: #94a3b8; background: rgba(148, 163, 184, .1); }
        .dark .btn-ghost { color: #cbd5e1; border-color: #334155; }
        .dark .btn-ghost:hover { border-color: #64748b; background: rgba(148, 163, 184, .08); }

        footer {
            position: relative;
            z-index: 1;
            margin-top: 3rem;
            font-size: .75rem;
            color: #94a3b8;
        }
        .dark footer { color: #475569; }
    </style>
</head>
<body>
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <main>
        <a href="{{ url('/') }}" class="brand">SINTESIS</a>
        <div class="code">@yield('code')</div>
        <h1>@yield('title')</h1>
        <p class="message">@yield('message')</p>
        <div class="actions">
            <a href="{{ url('/') }}" class="btn btn-primary">Ke Beranda</a>
            <button type="button" class="btn btn-ghost" onclick="history.back()">&larr; Kembali</button>
        </div>
    </main>

    <footer>&copy; {{ date('Y') }} {{ config('app.name', 'SINTESIS') }}</footer>
</body>
</html>
