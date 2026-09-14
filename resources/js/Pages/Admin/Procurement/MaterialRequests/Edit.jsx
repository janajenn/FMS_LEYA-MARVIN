import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Edit({ request, materials, suppliers, categories }) {
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [itemErrors, setItemErrors] = useState({});

    // Build initial items from request
    const initialItems = request.items.map(item => ({
        material_id: item.material_id,
        quantity: item.quantity,
        thickness: item.thickness || '',
        width: item.width || '',
        length: item.length || '',
        notes: item.notes || '',
        is_wood: item.material?.category?.slug === 'wood' || item.material?.category?.name?.toLowerCase() === 'wood',
    }));

    const { data, setData, put, processing, errors } = useForm({
        procurement_type: request.procurement_type,
        supplier_id: request.supplier_id || '',
        reason: request.reason || '',
        items: initialItems,
    });

    const isWoodCategory = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.slug === 'wood' || cat?.name?.toLowerCase() === 'wood';
    };

    const addItem = () => {
        if (!selectedMaterial) {
            alert('Please select a material first.');
            return;
        }

        const newItem = {
            material_id: selectedMaterial.id,
            quantity: '',
            thickness: '',
            width: '',
            length: '',
            notes: '',
            is_wood: isWoodCategory(selectedMaterial.category_id),
        };

        const exists = data.items.some(item => item.material_id === selectedMaterial.id);
        if (exists) {
            alert('This material is already in the list.');
            return;
        }

        setData('items', [...data.items, newItem]);
        setSelectedMaterial(null);
        document.getElementById('material-select').value = '';
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const hasErrors = data.items.some(item => !item.quantity || parseFloat(item.quantity) <= 0);
        if (hasErrors) {
            alert('Please enter valid quantities for all items.');
            return;
        }
        if (data.items.length === 0) {
            alert('Please add at least one material.');
            return;
        }
        put(route('admin.material-requests.update', request.id));
    };

    return (
        <AdminLayout>
            <Head title={`Revise Request #${request.request_no}`} />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Revise Request #{request.request_no}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Modify this request based on the manager's remarks.
                                        {request.remarks && (
                                            <span className="block text-blue-600 bg-blue-50 px-3 py-1 rounded mt-2">
                                                <strong>Remarks:</strong> {request.remarks}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.material-requests.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Same form as Create – re-use the fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Procurement Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Procurement Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.procurement_type}
                                            onChange={e => setData('procurement_type', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                        >
                                            <option value="supplier_purchase">Supplier Purchase</option>
                                            <option value="walk_in_purchase">Walk-in Purchase</option>
                                        </select>
                                        {errors.procurement_type && (
                                            <p className="mt-1 text-sm text-red-600">{errors.procurement_type}</p>
                                        )}
                                    </div>

                                    {/* Supplier */}
                                    {data.procurement_type === 'supplier_purchase' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Supplier <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={data.supplier_id}
                                                onChange={e => setData('supplier_id', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            >
                                                <option value="">Select Supplier</option>
                                                {suppliers.map(sup => (
                                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                                ))}
                                            </select>
                                            {errors.supplier_id && (
                                                <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Reason */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.reason}
                                            onChange={e => setData('reason', e.target.value)}
                                            rows="3"
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="Why is this material request needed?"
                                        />
                                        {errors.reason && (
                                            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Items Section – same as Create */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">Materials Requested</h3>
                                        <div className="flex gap-2">
                                            <select
                                                id="material-select"
                                                onChange={e => {
                                                    const id = parseInt(e.target.value);
                                                    const mat = materials.find(m => m.id === id);
                                                    setSelectedMaterial(mat || null);
                                                }}
                                                className="rounded-lg border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            >
                                                <option value="">Select Material</option>
                                                {materials.map(mat => (
                                                    <option key={mat.id} value={mat.id}>
                                                        {mat.name} ({mat.unit})
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="inline-flex items-center px-3 py-1.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-1" />
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {data.items.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No items added yet.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50/80">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                                                        {data.items.some(i => i.is_wood) && (
                                                            <>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Thickness</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Width</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Length</th>
                                                            </>
                                                        )}
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {data.items.map((item, idx) => {
                                                        const mat = materials.find(m => m.id === item.material_id);
                                                        return (
                                                            <tr key={idx}>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                                                    {mat?.name} ({mat?.unit})
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0.01"
                                                                        value={item.quantity}
                                                                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                                        className="w-20 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                                        required
                                                                    />
                                                                </td>
                                                                {item.is_wood && (
                                                                    <>
                                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                value={item.thickness}
                                                                                onChange={e => updateItem(idx, 'thickness', e.target.value)}
                                                                                className="w-16 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                                                placeholder="2"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                value={item.width}
                                                                                onChange={e => updateItem(idx, 'width', e.target.value)}
                                                                                className="w-16 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                                                placeholder="6"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                value={item.length}
                                                                                onChange={e => updateItem(idx, 'length', e.target.value)}
                                                                                className="w-16 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                                                placeholder="10"
                                                                            />
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <input
                                                                        type="text"
                                                                        value={item.notes}
                                                                        onChange={e => updateItem(idx, 'notes', e.target.value)}
                                                                        className="w-24 rounded-lg border-gray-200 bg-gray-50/50 px-2 py-1 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                                        placeholder="Notes"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeItem(idx)}
                                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {errors.items && (
                                        <p className="mt-2 text-sm text-red-600">{errors.items}</p>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Submitting...' : 'Resubmit Request'}
                                    </button>
                                    <Link
                                        href={route('admin.material-requests.index')}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <XMarkIcon className="h-5 w-5 mr-2" />
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
