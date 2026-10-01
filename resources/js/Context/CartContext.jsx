import { createContext, useState, useContext, useEffect } from 'react';
import { router } from '@inertiajs/react';

const CartContext = createContext(null);

export function CartProvider({ children, initialCartCount = 0 }) {
    const [cartCount, setCartCount] = useState(initialCartCount);

    /**
     * Keep the badge in sync with the server-provided shared prop.
     *
     * The Laravel `HandleInertiaRequests` middleware sends `cartCount`
     * on every request. This effect reads it after each Inertia
     * navigation (add, remove, checkout, logout, etc.) and updates
     * the context so the navbar badge always reflects reality.
     */
    useEffect(() => {
        const unsubscribe = router.on('navigate', (event) => {
            const serverCount = event?.detail?.page?.props?.cartCount;
            if (typeof serverCount === 'number' && serverCount !== cartCount) {
                setCartCount(serverCount);
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartCount]);

    return (
        <CartContext.Provider value={{ cartCount, setCartCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error('useCart() must be used inside <CartProvider>');
    }
    return ctx;
}
