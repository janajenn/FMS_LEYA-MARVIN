import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Create({ purchaseOrder }) {
    const [items, setItems] = useState(
        purchaseOrder.items.map(poItem => ({
            po_item_id: poItem.id,
            material_name: poItem.material.name,
            unit: poItem.material.unit,
            ordered: poItem.ordered_quantity,
            received: poItem.goods_receipt_items?.reduce((sum, gri) => sum + gri.accepted_quantity, 0) || 0,
            remaining: poItem.remaining_quantity || poItem.ordered_quantity,
            received_quantity: '',
            condition: 'good',
            damaged_quantity: 0,
            damage_reason: '',
            thickness: poItem.thickness,
            width: poItem.width,
            length: poItem.length,
        }))
    );

    const { data, setData, post, processing, errors } = useForm({
        received_date: new Date().toISOString().split('T')[0],
        items: items,
    });

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
        // Update form data
        const formItems = newItems.map(item => ({
            po_item_id: item.po_item_id,
            received_quantity: item.received_quantity,
            condition: item.condition,
            damaged_quantity: item.damaged_quantity,
            damage_reason: item.damage_reason,
        }));
        setData('items', formItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate remaining quantities
        const hasError = items.some(item => {
            const remaining = item.remaining;
            const received = parseFloat(item.received_quantity) || 0;
            if (received <= 0) return true;
            if (received > remaining) return true;
            if (item.condition === 'damaged' && (parseFloat(item.damaged_quantity) || 0) > received) return true;
            return false;
        });

        if (hasError) {
            alert('Please check your entries. Received quantity must be > 0, not exceed remaining, and damaged quantity must not exceed received quantity.');
            return;
        }

        post(route('admin.goods-receipt.store', purchaseOrder.id));
    };

    return (
        <AdminLayout>
            <Head title="Receive Materials" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Link
                                    href={route('admin.purchase-orders.show', purchaseOrder.id)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Receive Materials – PO #{purchaseOrder.po_number}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Supplier: {purchaseOrder.supplier?.name || 'N/A'}
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

                                {/* Items */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Previous Received</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Remaining</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Receive Now</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Condition</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Damaged Qty</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Damage Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2 text-sm text-gray-700">
                                                        {item.material_name}
                                                        {item.thickness || item.width || item.length ? (
                                                            <span className="text-xs text-gray-400 block">
                                                                {item.thickness && `${item.thickness}"`}
                                                                {item.width && ` × ${item.width}"`}
                                                                {item.length && ` × ${item.length}'`}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-gray-700">{item.ordered}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700">{item.received}</td>
                                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.remaining}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.received_quantity}
                                                            onChange={e => handleItemChange(idx, 'received_quantity', e.target.value)}
                                                            className="w-20 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={item.condition}
                                                            onChange={e => handleItemChange(idx, 'condition', e.target.value)}
                                                            className="rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                        >
                                                            <option value="good">Good</option>
                                                            <option value="damaged">Damaged</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.damaged_quantity}
                                                            onChange={e => handleItemChange(idx, 'damaged_quantity', e.target.value)}
                                                            className="w-16 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            disabled={item.condition !== 'damaged'}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.condition === 'damaged' ? (
                                                            <select
                                                                value={item.damage_reason}
                                                                onChange={e => handleItemChange(idx, 'damage_reason', e.target.value)}
                                                                className="rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors w-28"
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="broken">Broken</option>
                                                                <option value="cracked">Cracked</option>
                                                                <option value="wet">Wet</option>
                                                                <option value="wrong_item">Wrong Item</option>
                                                                <option value="defective">Defective</option>
                                                                <option value="others">Others</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">—</span>
                                                        )}
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
                                        {processing ? 'Saving...' : 'Receive Materials'}
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
