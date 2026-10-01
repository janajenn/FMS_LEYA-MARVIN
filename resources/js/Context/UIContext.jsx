import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useMemo,
    useEffect,
} from 'react';
import ToastContainer from '@/Components/UI/ToastContainer';
import { installNativeOverrides, uninstallNativeOverrides } from '@/Utils/nativeDialogs';
import DialogContainer from '@/Components/UI/DialogContainer';

const UIContext = createContext(null);

export function UIProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const dialogRef = useRef({ resolve: null, cancelValue: false });
    const toastIdRef = useRef(0);

    /* ─────────────── Toasts ─────────────── */

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message, type = 'info', opts = {}) => {
            const id = ++toastIdRef.current;
            const duration = opts.duration ?? 4000;
            setToasts((prev) => [
                ...prev,
                { id, message, type, title: opts.title },
            ]);
            if (duration > 0) {
                setTimeout(() => removeToast(id), duration);
            }
            return id;
        },
        [removeToast]
    );

    const toast = useMemo(
        () => ({
            success: (msg, opts) => addToast(msg, 'success', opts),
            error:   (msg, opts) => addToast(msg, 'error', opts),
            info:    (msg, opts) => addToast(msg, 'info', opts),
            warning: (msg, opts) => addToast(msg, 'warning', opts),
            show:    (msg, opts) => addToast(msg, opts?.type ?? 'info', opts),
            dismiss: (id) => removeToast(id),
        }),
        [addToast, removeToast]
    );

    /* ─────────────── Dialog (promise-based) ─────────────── */

    const openDialog = useCallback((config) => {
        return new Promise((resolve) => {
            if (dialogRef.current.resolve) {
                dialogRef.current.resolve(dialogRef.current.cancelValue);
            }
            const cancelValue = config.type === 'prompt' ? null : false;
            dialogRef.current = { resolve, cancelValue };
            setDialog(config);
        });
    }, []);

    const closeDialog = useCallback((result) => {
        setDialog(null);
        if (dialogRef.current.resolve) {
            dialogRef.current.resolve(result);
            dialogRef.current = { resolve: null, cancelValue: false };
        }
    }, []);

    const alert = useCallback(
        (opts) => {
            const c = typeof opts === 'string' ? { message: opts } : opts ?? {};
            return openDialog({
                type: 'alert',
                title: c.title ?? 'Notice',
                message: c.message ?? '',
                confirmText: c.confirmText ?? 'OK',
                variant: c.variant ?? 'info',
            });
        },
        [openDialog]
    );

    const confirm = useCallback(
        (opts) => {
            const c = typeof opts === 'string' ? { message: opts } : opts ?? {};
            return openDialog({
                type: 'confirm',
                title: c.title ?? 'Please confirm',
                message: c.message ?? '',
                confirmText: c.confirmText ?? 'Confirm',
                cancelText: c.cancelText ?? 'Cancel',
                variant: c.variant ?? 'warning',
            });
        },
        [openDialog]
    );

    const prompt = useCallback(
        (opts) => {
            const c = typeof opts === 'string' ? { message: opts } : opts ?? {};
            return openDialog({
                type: 'prompt',
                title: c.title ?? 'Input',
                message: c.message ?? '',
                placeholder: c.placeholder ?? '',
                defaultValue: c.defaultValue ?? '',
                confirmText: c.confirmText ?? 'Submit',
                cancelText: c.cancelText ?? 'Cancel',
                variant: c.variant ?? 'info',
            });
        },
        [openDialog]
    );

    const value = useMemo(
        () => ({ toast, alert, confirm, prompt }),
        [toast, alert, confirm, prompt]
    );

    /* ─── Install global window.alert / confirm / prompt overrides ─── */
    useEffect(() => {
        installNativeOverrides(value);
        return () => uninstallNativeOverrides();
    }, [value]);

    return (
        <UIContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <DialogContainer dialog={dialog} onClose={closeDialog} />
        </UIContext.Provider>
    );
}

export function useUI() {
    const ctx = useContext(UIContext);
    if (!ctx) {
        throw new Error('useUI() must be used inside <UIProvider>');
    }
    return ctx;
}
