import AdminLayout from '@/Layouts/AdminLayout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Edit({ tier }) {
    const { data, setData, put, processing, errors } = useForm({
        label: tier.label ?? '',
        min_distance_km: tier.min_distance_km ?? 0,
        max_distance_km: tier.max_distance_km ?? '',
        fee: tier.fee ?? 0,
        estimated_days: tier.estimated_days ?? 1,
        is_active: !!tier.is_active,
        sort_order: tier.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.delivery-fee-tiers.update', tier.id));
    };

    return (
        <AdminLayout title={`Edit ${tier.label}`}>
            <div className="py-6">
                <form onSubmit={submit} className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.delivery-fee-tiers.index')} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <h2 className="text-xl font-semibold text-gray-800">Edit: {tier.label}</h2>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Label <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.label}
                                onChange={(e) => setData('label', e.target.value)}
                                className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                            />
                            {errors.label && <p className="mt-1 text-sm text-red-600">{errors.label}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Min distance (km) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.min_distance_km}
                                    onChange={(e) => setData('min_distance_km', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                />
                                {errors.min_distance_km && <p className="mt-1 text-sm text-red-600">{errors.min_distance_km}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max distance (km) <span className="text-gray-400 text-xs">(blank = ∞)</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.max_distance_km}
                                    onChange={(e) => setData('max_distance_km', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                />
                                {errors.max_distance_km && <p className="mt-1 text-sm text-red-600">{errors.max_distance_km}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fee (₱) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.fee}
                                    onChange={(e) => setData('fee', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                />
                                {errors.fee && <p className="mt-1 text-sm text-red-600">{errors.fee}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estimated delivery (days) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="90"
                                    value={data.estimated_days}
                                    onChange={(e) => setData('estimated_days', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                />
                                {errors.estimated_days && <p className="mt-1 text-sm text-red-600">{errors.estimated_days}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer pb-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link
                            href={route('admin.delivery-fee-tiers.index')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50"
                        >
                            <CheckIcon className="h-4 w-4" />
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
