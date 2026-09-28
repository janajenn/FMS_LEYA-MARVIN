import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

const EMPTY_FORM = {
    id: null,
    category_id: '',
    label: '',
    length: '',
    width: '',
    height: '',
    thickness: '',
    diameter: '',
    depth: '',
    sort_order: 0,
    is_active: true,
};

export default function Index({ templates = [], categories = [] }) {
    const { flash = {} } = usePage().props;

    const [filterCategory, setFilterCategory] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm(EMPTY_FORM);

    const visibleTemplates = useMemo(() => {
        return filterCategory
            ? templates.filter((t) => String(t.category_id) === String(filterCategory))
            : templates;
    }, [templates, filterCategory]);

    const openCreate = () => {
        reset();
        setData({ ...EMPTY_FORM, category_id: filterCategory || '' });
        setModalOpen(true);
    };

    const openEdit = (t) => {
        setData({
            id: t.id,
            category_id: t.category_id,
            label: t.label,
            length: t.length ?? '',
            width: t.width ?? '',
            height: t.height ?? '',
            thickness: t.thickness ?? '',
            diameter: t.diameter ?? '',
            depth: t.depth ?? '',
            sort_order: t.sort_order ?? 0,
            is_active: !!t.is_active,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.id) {
            put(route('admin.product-size-templates.update', data.id), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.product-size-templates.store'), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (t) => {
        if (!confirm(`Delete size template "${t.label}"?`)) return;
        router.delete(route('admin.product-size-templates.destroy', t.id), {
            preserveScroll: true,
        });
    };

    const grouped = useMemo(() => {
        const map = {};
        visibleTemplates.forEach((t) => {
            const cat = t.category?.name || 'Uncategorized';
            if (!map[cat]) map[cat] = [];
            map[cat].push(t);
        });
        return map;
    }, [visibleTemplates]);

    return (
        <AdminLayout>
            <Head title="Standard Sizes" />

            <div className="py-4">
                <div className="w-full">
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm font-medium">
                            {flash.success}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-5">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Standard Sizes
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Fixed sizes per category. Products using a category with
                                        templates must select one of these sizes.
                                    </p>
                                </div>
                                <button
                                    onClick={openCreate}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Size
                                </button>
                            </div>

                            {/* Filter */}
                            <div className="mb-4 max-w-xs">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Filter by category
                                </label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                >
                                    <option value="">All categories</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tables */}
                            {Object.keys(grouped).length === 0 ? (
                                <p className="text-sm text-gray-400 py-8 text-center">
                                    No size templates yet. Click "Add Size" to create one.
                                </p>
                            ) : (
                                Object.entries(grouped).map(([catName, items]) => (
                                    <div key={catName} className="mt-5">
                                        <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <ArrowsPointingOutIcon className="h-4 w-4 text-[#6F4E37]" />
                                            {catName}
                                        </h2>
                                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-100">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Label
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Dimensions
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                                            Sort
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                                            Active
                                                        </th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {items.map((t) => (
                                                        <tr key={t.id} className="hover:bg-gray-50/40">
                                                            <td className="px-4 py-2.5 text-sm text-gray-800 font-medium">
                                                                {t.label}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-sm text-gray-600 font-mono">
                                                                {t.dimensions_summary}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-sm text-gray-500 text-center">
                                                                {t.sort_order}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                        t.is_active
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}
                                                                >
                                                                    {t.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right space-x-2">
                                                                <button
                                                                    onClick={() => openEdit(t)}
                                                                    className="text-gray-400 hover:text-[#6F4E37] inline-flex"
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(t)}
                                                                    className="text-gray-400 hover:text-red-600 inline-flex"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">
                                {data.id ? 'Edit Size Template' : 'Add Size Template'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder="e.g. 48 × 75 (Double)"
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                    required
                                />
                                {errors.label && (
                                    <p className="mt-1 text-xs text-red-600">{errors.label}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dimensions <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-500 ml-1 font-normal">
                                        (fill at least one)
                                    </span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['length', 'width', 'height', 'thickness', 'diameter', 'depth'].map((k) => (
                                        <div key={k}>
                                            <label className="block text-[10px] font-medium text-stone-600 mb-0.5 capitalize">
                                                {k}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data[k]}
                                                onChange={(e) => setData(k, e.target.value)}
                                                className="block w-full rounded-md border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                placeholder="—"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {errors.length && (
                                    <p className="mt-1 text-xs text-red-600">{errors.length}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        value={data.sort_order}
                                        onChange={(e) =>
                                            setData('sort_order', parseInt(e.target.value) || 0)
                                        }
                                        className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37]"
                                        />
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : data.id ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
