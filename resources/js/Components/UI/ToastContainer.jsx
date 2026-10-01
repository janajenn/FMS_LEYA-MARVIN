import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const STYLES = {
    success: {
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-800',
        icon: 'text-emerald-600',
        Icon: CheckCircleIcon,
    },
    error: {
        bg: 'bg-rose-50 border-rose-200',
        text: 'text-rose-800',
        icon: 'text-rose-600',
        Icon: ExclamationCircleIcon,
    },
    warning: {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-800',
        icon: 'text-amber-600',
        Icon: ExclamationTriangleIcon,
    },
    info: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        Icon: InformationCircleIcon,
    },
};

export default function ToastContainer({ toasts, onDismiss }) {
    return (
        <div
            className="fixed top-4 right-4 flex flex-col gap-2 pointer-events-none"
            style={{ zIndex: 100001 }}
            aria-live="polite"
            aria-atomic="true"
        >
            {toasts.map((t) => {
                const s = STYLES[t.type] ?? STYLES.info;
                const Icon = s.Icon;
                return (
                    <div
                        key={t.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-md rounded-xl border shadow-lg px-4 py-3 ${s.bg}`}
                        style={{ animation: 'ui-toast-in 0.2s ease-out' }}
                    >
                        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${s.icon}`} />
                        <div className="flex-1 min-w-0">
                            {t.title && (
                                <p className={`text-sm font-semibold ${s.text}`}>
                                    {t.title}
                                </p>
                            )}
                            <p className={`text-sm ${t.title ? 'mt-0.5' : ''} ${s.text} break-words`}>
                                {t.message}
                            </p>
                        </div>
                        <button
                            onClick={() => onDismiss(t.id)}
                            className={`shrink-0 -mr-1 -mt-1 p-1 rounded-full ${s.text} opacity-60 hover:opacity-100 transition-opacity`}
                            aria-label="Dismiss notification"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}

            <style>{`
                @keyframes ui-toast-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
