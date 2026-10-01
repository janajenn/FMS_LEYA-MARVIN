import { useEffect, useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const VARIANTS = {
    success: {
        bg: 'bg-emerald-50',
        icon: 'text-emerald-600',
        Icon: CheckCircleIcon,
        btn: 'bg-emerald-600 hover:bg-emerald-700',
    },
    error: {
        bg: 'bg-rose-50',
        icon: 'text-rose-600',
        Icon: ExclamationCircleIcon,
        btn: 'bg-rose-600 hover:bg-rose-700',
    },
    warning: {
        bg: 'bg-amber-50',
        icon: 'text-amber-600',
        Icon: ExclamationTriangleIcon,
        btn: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        Icon: InformationCircleIcon,
        btn: 'bg-[#6F4E37] hover:bg-[#5A3E2B]',
    },
};

export default function DialogContainer({ dialog, onClose }) {
    const [promptValue, setPromptValue] = useState('');

    useEffect(() => {
        if (dialog) {
            setPromptValue(dialog.defaultValue ?? '');
        }
    }, [dialog]);

    const handleConfirm = () => {
        if (!dialog) return;
        if (dialog.type === 'prompt') onClose(promptValue);
        else onClose(true);
    };

    const handleCancel = () => {
        if (!dialog) return;
        if (dialog.type === 'prompt') onClose(null);
        else onClose(false);
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!dialog) return;
        const onKey = (e) => {
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Enter' && dialog.type !== 'prompt') handleConfirm();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialog]);

    if (!dialog) return null;

    const v = VARIANTS[dialog.variant] ?? VARIANTS.info;
    const Icon = dialog.type === 'confirm' ? QuestionMarkCircleIcon : v.Icon;

    return (
        <div
            className="fixed inset-0 isolate"
            style={{ zIndex: 100002 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-dialog-title"
        >
            <div
                className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm"
                onClick={handleCancel}
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                    style={{ zIndex: 100003 }}
                >
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={`h-11 w-11 rounded-full ${v.bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`h-6 w-6 ${v.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2
                                    id="ui-dialog-title"
                                    className="text-lg font-bold text-stone-900"
                                >
                                    {dialog.title}
                                </h2>
                                {dialog.message && (
                                    <p className="mt-1 text-sm text-stone-500 whitespace-pre-line">
                                        {dialog.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {dialog.type === 'prompt' && (
                            <div className="mt-4">
                                <input
                                    type="text"
                                    autoFocus
                                    value={promptValue}
                                    onChange={(e) => setPromptValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirm();
                                        if (e.key === 'Escape') handleCancel();
                                    }}
                                    placeholder={dialog.placeholder}
                                    className="block w-full rounded-lg border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                />
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            {dialog.type !== 'alert' && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="inline-flex items-center px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition"
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                type="button"
                                autoFocus={dialog.type === 'alert'}
                                onClick={handleConfirm}
                                className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition shadow-sm ${v.btn}`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
