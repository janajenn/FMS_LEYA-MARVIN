import { useEffect, useMemo, useState } from 'react';
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheck } from '@heroicons/react/24/solid';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatDimensions(wood) {
    const parts = [];
    if (wood.thickness) parts.push(`${wood.thickness}" T`);
    if (wood.width)     parts.push(`${wood.width}" W`);
    if (wood.length)    parts.push(`${wood.length}' L`);
    return parts.join(' · ');
}

export default function WoodTypePickerModal({
    isOpen,
    onClose,
    woods = [],
    alreadySelectedIds = [],
    onConfirm,
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedIds([]);
            setSearch('');
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return woods;
        return woods.filter((w) =>
            w.name.toLowerCase().includes(q) ||
            (w.thickness && String(w.thickness).includes(q)) ||
            (w.width && String(w.width).includes(q))
        );
    }, [woods, search]);

    if (!isOpen) return null;

    const toggle = (id) => {
        if (alreadySelectedIds.includes(id)) return;
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (selectedIds.length === 0) return;
        onConfirm(selectedIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#6F4E37]/10 flex items-center justify-center">
                            <CubeIcon className="h-5 w-5 text-[#6F4E37]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-900">
                                Select Wood Types
                            </h2>
                            <p className="text-xs text-stone-500">
                                Pick from your Wood materials. You'll add a finished-product photo for each one next.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        aria-label="Close"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 pt-4 pb-3 border-b border-stone-100">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by wood name or dimensions…"
                            className="w-full rounded-lg border-stone-200 bg-stone-50 pl-9 pr-3 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {woods.length === 0 && (
                        <div className="py-12 text-center text-sm text-stone-500">
                            No wood materials found.
                            <br />
                            Add materials under the <strong>Wood</strong> category first.
                        </div>
                    )}

                    {woods.length > 0 && filtered.length === 0 && (
                        <div className="py-12 text-center text-sm text-stone-500">
                            No woods match "{search}".
                        </div>
                    )}

                    {filtered.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filtered.map((w) => {
                                const isSelected = selectedIds.includes(w.id);
                                const isAlready  = alreadySelectedIds.includes(w.id);

                                return (
                                    <button
                                        type="button"
                                        key={w.id}
                                        onClick={() => toggle(w.id)}
                                        disabled={isAlready}
                                        className={`relative flex items-start gap-3 text-left rounded-xl border-2 px-4 py-3 transition-all ${
                                            isAlready
                                                ? 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                                                : isSelected
                                                ? 'border-[#6F4E37] bg-[#F5EDE8]/40 ring-2 ring-[#6F4E37]/20'
                                                : 'border-stone-200 hover:border-[#6F4E37]/60 hover:bg-stone-50'
                                        }`}
                                    >
                                        {/* Optional material thumbnail */}
                                        <div className="h-12 w-12 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                                            {w.image_url ? (
                                                <img
                                                    src={w.image_url}
                                                    alt={w.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                    <CubeIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-stone-900 truncate">
                                                {w.name}
                                            </p>

                                            {formatDimensions(w) && (
                                                <p className="text-[11px] text-stone-500 truncate">
                                                    {formatDimensions(w)}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                                                <span
                                                    className={
                                                        w.stock_quantity <= 0
                                                            ? 'text-rose-600 font-medium'
                                                            : 'text-stone-600 font-medium'
                                                    }
                                                >
                                                    {w.stock_quantity} {w.unit} in stock
                                                </span>
                                                <span className="text-stone-300">·</span>
                                                <span className="text-stone-600 font-medium">
                                                    {formatPrice(w.cost)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Selected check / Already-added badge */}
                                        {isSelected && !isAlready && (
                                            <SolidCheck className="h-5 w-5 text-[#6F4E37] flex-shrink-0" />
                                        )}
                                        {isAlready && (
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full flex-shrink-0">
                                                Added
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50/60">
                    <p className="text-sm text-stone-600">
                        {selectedIds.length === 0
                            ? 'No woods selected yet'
                            : `${selectedIds.length} wood${selectedIds.length === 1 ? '' : 's'} selected`}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={selectedIds.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6F4E37] rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircleIcon className="h-4 w-4" />
                            Add {selectedIds.length > 0 ? selectedIds.length : ''} Wood Type
                            {selectedIds.length === 1 ? '' : 's'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
