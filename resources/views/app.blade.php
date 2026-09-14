<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">


        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes

        @if (env('FORCE_BUILT_ASSETS', false))
            {{-- Force use of built assets --}}
            @php
                $manifestPath = public_path('build/manifest.json');
                $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;
            @endphp

            @if ($manifest)
                @php
                    $entry = $manifest['resources/js/app.jsx'] ?? null;
                    $cssFiles = $entry['css'] ?? [];
                    $jsFile = $entry['file'] ?? null;
                @endphp

                @foreach ($cssFiles as $css)
                    <link rel="stylesheet" href="{{ asset('build/' . $css) }}">
                @endforeach

                @if ($jsFile)
                    <script type="module" src="{{ asset('build/' . $jsFile) }}"></script>
                @endif

                {{-- Also include page-specific JS if needed --}}
                @php
                    $pageComponent = $page['component'] ?? '';
                    $pageEntry = $manifest['resources/js/Pages/' . $pageComponent . '.jsx'] ?? null;
                    if ($pageEntry) {
                        $pageJs = $pageEntry['file'] ?? null;
                        if ($pageJs && $pageJs !== $jsFile) {
                            echo '<script type="module" src="' . asset('build/' . $pageJs) . '"></script>';
                        }
                    }
                @endphp
            @endif
        @else
            {{-- Default Vite dev server --}}
            @viteReactRefresh
            @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @endif

        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
