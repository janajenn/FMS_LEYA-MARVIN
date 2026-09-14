import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800';

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 transform translate-y-0 ${bgColor}`}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{message}</span>
                <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
