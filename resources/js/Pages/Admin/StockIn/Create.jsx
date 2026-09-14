import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    PlusIcon,
    XMarkIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function Create({ materials, suppliers }) {
    const { data, setData, post, processing, errors } = useForm({
        material_id: '',
        supplier_id: '',
        quantity: '',
        unit_cost: '',
        date_received: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.stock-in.store'));
    };

    return (
        <AdminLayout>
            <Head title="Record Stock In" />

            <div className="py-4">
                <div className="w-full">
                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Record Stock In</h1>
                                    <p className="mt-1 text-sm text-gray-500">Add stock to your raw materials inventory</p>
                                </div>
                                <Link
                                    href={route('admin.materials.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Material */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Material <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.material_id}
                                            onChange={e => setData('material_id', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                        >
                                            <option value="">Select Material</option>
                                            {materials.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                            ))}
                                        </select>
                                        {errors.material_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.material_id}</p>
                                        )}
                                    </div>

                                    {/* Supplier */}
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
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        {errors.supplier_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.quantity}
                                            onChange={e => setData('quantity', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="0.00"
                                        />
                                        {errors.quantity && (
                                            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                                        )}
                                    </div>

                                    {/* Unit Cost */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Unit Cost <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.unit_cost}
                                                onChange={e => setData('unit_cost', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-7 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.unit_cost && (
                                            <p className="mt-1 text-sm text-red-600">{errors.unit_cost}</p>
                                        )}
                                    </div>

                                    {/* Date Received */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date Received <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="date"
                                                value={data.date_received}
                                                onChange={e => setData('date_received', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            />
                                        </div>
                                        {errors.date_received && (
                                            <p className="mt-1 text-sm text-red-600">{errors.date_received}</p>
                                        )}
                                    </div>

                                    {/* Notes (spans full width) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes <span className="text-gray-400 text-xs">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 pointer-events-none">
                                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <textarea
                                                value={data.notes}
                                                onChange={e => setData('notes', e.target.value)}
                                                rows="3"
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="Add any additional notes..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Recording...' : 'Record Stock In'}
                                    </button>
                                    <Link
                                        href={route('admin.materials.index')}
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
