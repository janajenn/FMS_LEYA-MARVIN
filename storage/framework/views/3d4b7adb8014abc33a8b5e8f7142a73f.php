<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">


        <title inertia><?php echo e(config('app.name', 'Laravel')); ?></title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>

        <?php if(env('FORCE_BUILT_ASSETS', false)): ?>
            
            <?php
                $manifestPath = public_path('build/manifest.json');
                $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;
            ?>

            <?php if($manifest): ?>
                <?php
                    $entry = $manifest['resources/js/app.jsx'] ?? null;
                    $cssFiles = $entry['css'] ?? [];
                    $jsFile = $entry['file'] ?? null;
                ?>

                <?php $__currentLoopData = $cssFiles; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $css): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <link rel="stylesheet" href="<?php echo e(asset('build/' . $css)); ?>">
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

                <?php if($jsFile): ?>
                    <script type="module" src="<?php echo e(asset('build/' . $jsFile)); ?>"></script>
                <?php endif; ?>

                
                <?php
                    $pageComponent = $page['component'] ?? '';
                    $pageEntry = $manifest['resources/js/Pages/' . $pageComponent . '.jsx'] ?? null;
                    if ($pageEntry) {
                        $pageJs = $pageEntry['file'] ?? null;
                        if ($pageJs && $pageJs !== $jsFile) {
                            echo '<script type="module" src="' . asset('build/' . $pageJs) . '"></script>';
                        }
                    }
                ?>
            <?php endif; ?>
        <?php else: ?>
            
            <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
            <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"]); ?>
        <?php endif; ?>

        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
    </head>
    <body class="font-sans antialiased">
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } elseif (config('inertia.use_script_element_for_initial_page')) { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
    </body>
</html>
<?php /**PATH C:\laragon\www\fms_leya_marvin\resources\views/app.blade.php ENDPATH**/ ?>