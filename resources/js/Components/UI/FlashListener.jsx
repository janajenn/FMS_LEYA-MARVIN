import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useUI } from '@/Context/UIContext';

/**
 * Fires toast notifications for Laravel flash messages.
 *
 * - On initial page load, reads `initialFlash` passed from app.jsx.
 * - On subsequent Inertia navigations, subscribes to router events.
 *
 * Uses `router.on(...)` (imperative) instead of `usePage()` so this
 * component can live outside the Inertia React context.
 */
export default function FlashListener({ initialFlash = {} }) {
    const { toast } = useUI();
    const firedOnMount = useRef(false);

    /* ── 1. Initial page load (SSR / first paint) ── */
    useEffect(() => {
        if (firedOnMount.current) return;
        firedOnMount.current = true;

        if (initialFlash.success) toast.success(initialFlash.success);
        if (initialFlash.error)   toast.error(initialFlash.error);
        if (initialFlash.warning) toast.warning(initialFlash.warning);
        if (initialFlash.info)    toast.info(initialFlash.info);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── 2. Every subsequent Inertia visit ── */
    useEffect(() => {
        const unsubscribe = router.on('navigate', (event) => {
            const flash = event?.detail?.page?.props?.flash ?? {};

            if (flash.success) toast.success(flash.success);
            if (flash.error)   toast.error(flash.error);
            if (flash.warning) toast.warning(flash.warning);
            if (flash.info)    toast.info(flash.info);
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [toast]);

    return null;
}
