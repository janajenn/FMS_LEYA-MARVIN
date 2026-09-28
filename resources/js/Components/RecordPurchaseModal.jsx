import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function RecordPurchaseModal({ isOpen, onClose, request }) {
    const [costs, setCosts] = useState({});
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    // ✅ Normalize items — prefer PO items, else fall back to request items
    const normalizeItems = () => {
        if (!request) return [];

        // If PO items exist, use them
        if (request.purchase_order?.items?.length) {
            return request.purchase_order.items.map((it) => ({
                key: `po-${it.id}`,
                material_id: it.material_id,
                material_name: it.material?.name || 'Material',
                unit: it.material?.unit || '—',
                quantity: Number(it.ordered_quantity ?? 0),
                actual_unit_cost: it.actual_unit_cost,
            }));
        }

        // Otherwise fall back to the material request items
        if (request.items?.length) {
            return request.items.map((ri) => ({
                key: `req-${ri.id}`,
                material_id: ri.material_id,
                material_name: ri.material?.name || 'Material',
                unit: ri.material?.unit || '—',
                quantity: Number(ri.quantity ?? 0),
                actual_unit_cost: null,
            }));
        }

        return [];
    };

    const items = normalizeItems();

    // Initialize costs when modal opens
    useEffect(() => {
        if (isOpen && items.length) {
            const initial = {};
            items.forEach((item) => {
                initial[item.key] = item.actual_unit_cost ?? '';
            });
            setCosts(initial);
            setError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    const handleChange = (key, value) => {
        setCosts((prev) => ({ ...prev, [key]: value }));
    };

    const subtotalOf = (item) => {
        const unit = parseFloat(costs[item.key] || 0);
        return item.quantity * (unit || 0);
    };

    const grandTotal = items.reduce((sum, item) => sum + subtotalOf(item), 0);

    const handleSubmit = () => {
        for (const item of items) {
            const v = costs[item.key];
            if (v === '' || v === undefined || v === null) {
                setError('Please enter an actual unit cost for every material.');
                return;
            }
            if (isNaN(parseFloat(v)) || parseFloat(v) < 0) {
                setError('Unit costs must be non-negative numbers.');
                return;
            }
        }

        setProcessing(true);
        setError(null);

        const payload = {
            items: items.map((item) => ({
                material_id: item.material_id,
                actual_unit_cost: parseFloat(costs[item.key]),
            })),
        };

        router.post(
            route('manager.procurement.review.record-purchase', request.id),
            payload,
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onError: () => setError('Failed to save. Please check the values.'),
                onSuccess: () => onClose(),
            }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
        >
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div
                    className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#F5EDE8] flex items-center justify-center">
                                <BanknotesIcon className="h-5 w-5 text-[#6F4E37]" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-stone-900">
                                    Record Purchase Cost
                                </h2>
                                <p className="text-xs text-stone-500">
                                    {request.purchase_order?.po_number
                                        ? `${request.purchase_order.po_number} · enter actual supplier price`
                                        : `Request #${request.request_no} · enter actual supplier price`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="text-sm text-stone-500">
                                No materials to record.
                            </p>
                        ) : (
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-100">
                                        <th className="pb-2">Material</th>
                                        <th className="pb-2 text-right">Qty</th>
                                        <th className="pb-2">Unit</th>
                                        <th className="pb-2 text-right w-40">
                                            Actual Unit Cost
                                        </th>
                                        <th className="pb-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {items.map((item) => (
                                        <tr key={item.key}>
                                            <td className="py-3 pr-3 font-medium text-stone-800">
                                                {item.material_name}
                                            </td>
                                            <td className="py-3 text-right text-stone-700">
                                                {item.quantity}
                                            </td>
                                            <td className="py-3 text-stone-500">
                                                {item.unit}
                                            </td>
                                            <td className="py-3">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                                                        ₱
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={costs[item.key] ?? ''}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                item.key,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full pl-7 pr-3 py-1.5 rounded-lg border-stone-200 focus:border-[#6F4E37] focus:ring-[#6F4E37]/20 text-sm text-right"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-medium text-stone-800">
                                                {formatPrice(subtotalOf(item))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-stone-200">
                                        <td
                                            colSpan={4}
                                            className="py-3 text-right font-semibold text-stone-800"
                                        >
                                            Total Actual Purchase Cost
                                        </td>
                                        <td className="py-3 text-right text-lg font-bold text-[#6F4E37]">
                                            {formatPrice(grandTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}

                        {error && (
                            <div className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100">
                        <button
                            onClick={onClose}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing || items.length === 0}
                            className="inline-flex items-center px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50 transition"
                        >
                            {processing ? 'Saving...' : 'Confirm Purchase'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
