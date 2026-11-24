import { useForm } from '@inertiajs/react';
import {
    XMarkIcon,
    PlusCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function ProductionModal({ product, isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        quantity: 1,
        variant_id: '',
        notes: '',
    });

    const activeVariants = (product.variants || []).filter((v) => v.is_active);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.production', product.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <form
                onSubmit={submit}
                className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-stone-900">
                            Record Production
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            {product.name}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        This will deduct the standard BOM raw materials from inventory and add finished units to this product's stock. The action is logged and cannot be undone without a database rollback.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                        Quantity to Produce <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="1000"
                        value={data.quantity}
                        onChange={(e) => setData('quantity', parseInt(e.target.value) || 1)}
                        className="block w-full rounded-lg border-stone-200 bg-stone-50/60 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 tabular-nums"
                        autoFocus
                    />
                    {errors.quantity && (
                        <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>
                    )}
                </div>

                {activeVariants.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Wood Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={data.variant_id}
                            onChange={(e) => setData('variant_id', e.target.value)}
                            className="block w-full rounded-lg border-stone-200 bg-stone-50/60 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10"
                        >
                            <option value="">— Select wood type —</option>
                            {activeVariants.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                        {errors.variant_id && (
                            <p className="mt-1 text-xs text-rose-600">{errors.variant_id}</p>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                        Notes <span className="text-stone-400 text-xs">(optional)</span>
                    </label>
                    <textarea
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows="2"
                        placeholder="e.g. Batch for next week's orders"
                        className="block w-full rounded-lg border-stone-200 bg-stone-50/60 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 resize-none"
                    />
                    {errors.notes && (
                        <p className="mt-1 text-xs text-rose-600">{errors.notes}</p>
                    )}
                </div>

                {errors.production && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 whitespace-pre-line leading-relaxed">
                        {errors.production}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6F4E37] text-white text-sm font-semibold rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50"
                    >
                        <PlusCircleIcon className="h-4 w-4" />
                        {processing ? 'Recording…' : 'Confirm Production'}
                    </button>
                </div>
            </form>
        </div>
    );
}
