import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Create({ categories, suppliers }) {
    const [isWoodCategory, setIsWoodCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        name: '',
        unit: '',
        cost: '',
        supplier_id: '',
        procurement_type: 'supplier_purchase',
        reorder_level: 5,
        status: 'active',
        // Wood specifications
        thickness: '',
        width: '',
        length: '',
        // NEW: finish flag
        is_finish: false,
    });

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setData('category_id', categoryId);
        setSelectedCategory(categoryId);

        const category = categories.find(c => c.id === parseInt(categoryId));
        const isWood = category?.slug === 'wood' || category?.name?.toLowerCase() === 'wood';
        setIsWoodCategory(isWood);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let attributes = {};
        if (isWoodCategory) {
            attributes = {
                thickness: data.thickness || null,
                width: data.width || null,
                length: data.length || null,
            };
        }

        post(route('admin.materials.store'), {
            data: {
                ...data,
                attributes: attributes,
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Material" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Material</h1>
                                    <p className="mt-1 text-sm text-gray-500">Add a new raw material to your inventory</p>
                                </div>
                                <Link
                                    href={route('admin.materials.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.category_id}
                                            onChange={handleCategoryChange}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {errors.category_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="e.g. Oak Wood"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Unit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Unit <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.unit}
                                            onChange={e => setData('unit', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="e.g. Board Feet"
                                        />
                                        {errors.unit && (
                                            <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
                                        )}
                                    </div>

                                    {/* Cost */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cost <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.cost}
                                                onChange={e => setData('cost', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-7 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.cost && (
                                            <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
                                        )}
                                    </div>

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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Default Supplier <span className="text-gray-400 text-xs">(optional)</span>
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
                                    </div>

                                    {/* Reorder Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reorder Level <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.reorder_level}
                                            onChange={e => setData('reorder_level', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="5"
                                        />
                                        {errors.reorder_level && (
                                            <p className="mt-1 text-sm text-red-600">{errors.reorder_level}</p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {errors.status && (
                                            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                        )}
                                    </div>

                                    {/* ====== NEW: is_finish CHECKBOX ====== */}
                                    <div className="md:col-span-2 flex items-center space-x-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_finish"
                                            checked={data.is_finish}
                                            onChange={e => setData('is_finish', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37] focus:ring-offset-0"
                                        />
                                        <label htmlFor="is_finish" className="text-sm text-gray-700 font-medium">
                                            This material is a finish (e.g., varnish, stain, paint)
                                        </label>
                                    </div>
                                    {/* ====== END ====== */}

                                    {/* Wood Specifications – only show for Wood category */}
                                    {isWoodCategory && (
                                        <>
                                            <div className="md:col-span-2">
                                                <h3 className="text-sm font-medium text-gray-700 mb-2">Wood Specifications</h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Thickness (inches)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={data.thickness}
                                                            onChange={e => setData('thickness', e.target.value)}
                                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            placeholder="2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Width (inches)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={data.width}
                                                            onChange={e => setData('width', e.target.value)}
                                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            placeholder="6"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Length (feet)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={data.length}
                                                            onChange={e => setData('length', e.target.value)}
                                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            placeholder="10"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Creating...' : 'Create Material'}
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
