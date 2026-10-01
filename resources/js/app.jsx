import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { CartProvider } from './Context/CartContext';
import { UIProvider } from './Context/UIContext';
import FlashListener from './Components/UI/FlashListener';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Extract the initial flash from the first page's props
        const initialFlash = props.initialPage?.props?.flash ?? {};

        root.render(
            <UIProvider>
                <CartProvider
                    initialCartCount={props.initialPage.props.cartCount || 0}
                >
                    <FlashListener initialFlash={initialFlash} />
                    <App {...props} />
                </CartProvider>
            </UIProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
