import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Create({ purchaseOrder }) {
    const { data, setData, post, processing, errors } = useForm({
        received_date: new Date().toISOString().split('T')[0],
        items: purchaseOrder.items
            .filter(item => item.replacement_quantity > 0)
            .map(item => ({
                po_item_id: item.id,
                material_name: item.material.name,
                unit: item.material.unit,
                replacement_remaining: item.replacement_quantity,
                replacement_quantity: '',
            })),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.purchase-orders.receive-replacement.store', purchaseOrder.id));
    };

    return (
        <AdminLayout>
            <Head title="Receive Replacement" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <Link
                                    href={route('admin.purchase-orders.show', purchaseOrder.id)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Receive Replacement – PO #{purchaseOrder.po_number}
                                    </h1>
                                    <p className="mt-1 text-sm text-amber-600">
                                        ⚠️ Receiving replacement items for damaged materials from previous deliveries.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Received Date */}
                                <div className="max-w-xs">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Received Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.received_date}
                                        onChange={e => setData('received_date', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                        required
                                    />
                                    {errors.received_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.received_date}</p>
                                    )}
                                </div>

                                {/* Items Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remaining Replacement</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Receive Now</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {data.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{item.material_name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{item.unit}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-amber-600">
                                                        {item.replacement_remaining}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max={item.replacement_remaining}
                                                            value={item.replacement_quantity}
                                                            onChange={e => {
                                                                const newItems = [...data.items];
                                                                newItems[idx].replacement_quantity = e.target.value;
                                                                setData('items', newItems);
                                                            }}
                                                            className="w-24 rounded-lg border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            required
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Submit */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Saving...' : 'Receive Replacement'}
                                    </button>
                                    <Link
                                        href={route('admin.purchase-orders.show', purchaseOrder.id)}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
