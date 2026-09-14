import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',      // Listen on all network interfaces
        cors: true,           // Allow requests from any origin (for development)
        strictPort: true,     // Avoid port conflicts
        // Optionally, force HTTPS if needed, but ngrok already handles HTTPS
    },
});
