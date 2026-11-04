import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { PlusIcon, PencilSquareIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function Index({ tiers = [], storeLocation = null }) {
    const handleDelete = (tier) => {
        if (confirm(`Delete tier "${tier.label}"? Existing deliveries referencing it will just have the reference cleared.`)) {
            router.delete(route('admin.delivery-fee-tiers.destroy', tier.id));
        }
    };

    return (
        <AdminLayout title="Delivery Fee Tiers">
            <div className="py-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Delivery Fee Tiers</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Distance-based delivery fees and estimated delivery days. Tiers must not overlap.
                            </p>
                        </div>
                        <Link
                            href={route('admin.delivery-fee-tiers.create')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B]"
                        >
                            <PlusIcon className="h-4 w-4" />
                            New Tier
                        </Link>
                    </div>

                    {storeLocation && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <MapPinIcon className="h-8 w-8 text-[#6F4E37] flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{storeLocation.name}</p>
                                <p className="text-xs text-gray-500">{storeLocation.address}</p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                    {storeLocation.latitude.toFixed(6)}, {storeLocation.longitude.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance Range</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Days</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {tiers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                                            No tiers yet. Click <strong>New Tier</strong> to create your first distance band.
                                        </td>
                                    </tr>
                                ) : (
                                    tiers.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.label}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                                {Number(t.min_distance_km).toFixed(2)} – {t.max_distance_km === null ? '∞' : Number(t.max_distance_km).toFixed(2)} km
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {Number(t.fee) === 0 ? <span className="text-emerald-600">Free</span> : `₱${Number(t.fee).toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">
                                                {t.estimated_days} day{t.estimated_days === 1 ? '' : 's'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                                    t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {t.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex gap-1">
                                                    <Link
                                                        href={route('admin.delivery-fee-tiers.edit', t.id)}
                                                        className="p-1.5 text-gray-500 hover:text-[#6F4E37] hover:bg-gray-100 rounded-md"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(t)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Tip: leave <strong>Max distance</strong> empty on your last tier to represent "everything beyond this".
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
