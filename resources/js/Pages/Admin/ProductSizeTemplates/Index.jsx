import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    PlusIcon,
    XMarkIcon,
    PencilIcon,
    TrashIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';

const DIMENSION_FIELDS = [
    { key: 'length',    label: 'Length',    placeholder: '48' },
    { key: 'width',     label: 'Width',     placeholder: '24' },
    { key: 'height',    label: 'Height',    placeholder: '30' },
    { key: 'thickness', label: 'Thickness', placeholder: '1' },
    { key: 'diameter',  label: 'Diameter',  placeholder: '—' },
    { key: 'depth',     label: 'Depth',     placeholder: '—' },
];

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

export default function Index({ templates = [], categories = [], units }) {
    const unitShort = units?.dimensionShort || 'in';
    const unitFull  = units?.dimension       || 'inches';

    const [editingId, setEditingId] = useState(null); // null = closed, 'new' = creating
    const [form, setForm] = useState(EMPTY_FORM);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setErrors({});
        setEditingId('new');
    };

    const openEdit = (template) => {
        setForm({
            id: template.id,
            category_id: template.category_id ?? '',
            label: template.label ?? '',
            length: template.length ?? '',
            width: template.width ?? '',
            height: template.height ?? '',
            thickness: template.thickness ?? '',
            diameter: template.diameter ?? '',
            depth: template.depth ?? '',
            sort_order: template.sort_order ?? 0,
            is_active: !!template.is_active,
        });
        setErrors({});
        setEditingId(template.id);
    };

    const closeForm = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setErrors({});
    };

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const isEdit = editingId && editingId !== 'new';
        const url = isEdit
            ? route('admin.product-size-templates.update', editingId)
            : route('admin.product-size-templates.store');

        const payload = isEdit ? { _method: 'put', ...form } : form;

        router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                closeForm();
            },
            onError: (errs) => {
                setErrors(errs);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleDelete = (template) => {
        if (!confirm(`Delete size template "${template.label}"?`)) return;
        router.delete(
            route('admin.product-size-templates.destroy', template.id),
            { preserveScroll: true }
        );
    };

    return (
        <AdminLayout>
            <Head title="Standard Sizes" />

            <div className="py-4">
                <div className="w-full space-y-5">
                    {/* ─── HEADER ─── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Standard Sizes
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Predefined sizes per product category. All dimensions are entered in{' '}
                                    <strong>{unitFull}</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B]"
                            >
                                <PlusIcon className="h-5 w-5 mr-1.5" />
                                Add Standard Size
                            </button>
                        </div>
                    </div>

                    {/* ─── INLINE FORM ─── */}
                    {editingId !== null && (
                        <div className="bg-white rounded-xl shadow-sm border border-amber-200/70 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Squares2X2Icon className="h-5 w-5 text-[#6F4E37]" />
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {editingId === 'new' ? 'Add Standard Size' : 'Edit Standard Size'}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Category + Label */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.category_id}
                                            onChange={(e) => updateField('category_id', e.target.value)}
                                            className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.category_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Label <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.label}
                                            onChange={(e) => updateField('label', e.target.value)}
                                            className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                            placeholder="e.g. Small, Medium, Large"
                                            required
                                        />
                                        {errors.label && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.label}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Dimensions — all in INCHES */}
                                <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-lg">
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold text-amber-900">
                                            Dimensions
                                            <span className="ml-2 text-xs font-normal text-amber-700">
                                                All values in <strong>{unitFull}</strong>
                                            </span>
                                        </h3>
                                        <p className="text-[10px] text-amber-700 mt-0.5">
                                            Leave a field blank if it does not apply (e.g. Diameter is only for round objects).
                                            At least one dimension is required.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {DIMENSION_FIELDS.map((f) => (
                                            <div key={f.key}>
                                                <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                                                    {f.label}
                                                    <span className="ml-1 text-gray-400">({unitShort})</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={form[f.key]}
                                                        onChange={(e) => updateField(f.key, e.target.value)}
                                                        className="block w-full rounded-md border-gray-200 bg-white pl-2 pr-8 py-1.5 text-xs focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                        placeholder={f.placeholder}
                                                    />
                                                    <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[10px] text-gray-400">
                                                        {unitShort}
                                                    </span>
                                                </div>
                                                {errors[f.key] && (
                                                    <p className="mt-0.5 text-[10px] text-red-600">
                                                        {errors[f.key]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort + Active */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sort Order
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.sort_order}
                                            onChange={(e) =>
                                                updateField('sort_order', parseInt(e.target.value) || 0)
                                            }
                                            className="block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-3 pt-6">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={form.is_active}
                                            onChange={(e) => updateField('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37]"
                                        />
                                        <label
                                            htmlFor="is_active"
                                            className="text-sm text-gray-700 font-medium"
                                        >
                                            Active
                                        </label>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : editingId === 'new'
                                            ? 'Create Standard Size'
                                            : 'Update Standard Size'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ─── LIST ─── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                                        <th className="py-2 pr-3">Category</th>
                                        <th className="py-2 pr-3">Label</th>
                                        <th className="py-2 pr-3">
                                            Dimensions ({unitShort})
                                        </th>
                                        <th className="py-2 pr-3">Sort</th>
                                        <th className="py-2 pr-3">Active</th>
                                        <th className="py-2 pr-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-6 text-center text-gray-400"
                                            >
                                                No standard sizes yet. Click{' '}
                                                <strong>Add Standard Size</strong> to create one.
                                            </td>
                                        </tr>
                                    )}
                                    {templates.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="border-b border-gray-50 hover:bg-gray-50/40"
                                        >
                                            <td className="py-2 pr-3">{t.category?.name}</td>
                                            <td className="py-2 pr-3 font-medium">{t.label}</td>
                                            <td className="py-2 pr-3 text-gray-600">
                                                {t.dimensions_summary}
                                            </td>
                                            <td className="py-2 pr-3">{t.sort_order}</td>
                                            <td className="py-2 pr-3">
                                                {t.is_active ? (
                                                    <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500 font-semibold">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 pr-3 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(t)}
                                                    className="inline-flex items-center text-[#6F4E37] hover:text-[#5A3E2B] mr-3"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(t)}
                                                    className="inline-flex items-center text-red-500 hover:text-red-700"
                                                    title="Delete"
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
                </div>
            </div>
        </AdminLayout>
    );
}
