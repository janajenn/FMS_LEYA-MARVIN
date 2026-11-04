import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PencilSquareIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
    pending:    'bg-gray-100 text-gray-700',
    assigned:   'bg-blue-100 text-blue-700',
    picked_up:  'bg-amber-100 text-amber-700',
    in_transit: 'bg-indigo-100 text-indigo-700',
    delivered:  'bg-emerald-100 text-emerald-700',
    failed:     'bg-red-100 text-red-700',
};

export default function Index({ deliveries = [] }) {
    const handleDelete = (d) => {
        if (confirm(`Delete delivery ${d.tracking_number}?`)) {
            router.delete(route('admin.deliveries.destroy', d.id));
        }
    };

    return (
        <AdminLayout title="Deliveries">
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Deliveries</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {deliveries.length} total — created automatically when orders ship
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Tracking', 'Order', 'Customer', 'Driver', 'Distance', 'Tier', 'Status', ''].map((h, i) => (
                                        <th
                                            key={h || i}
                                            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === '' ? 'text-right' : 'text-left'}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {deliveries.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                                            <TruckIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                            No deliveries yet. They are created automatically when an order is marked <strong>Shipped</strong>.
                                        </td>
                                    </tr>
                                ) : (
                                    deliveries.map((d) => (
                                        <tr key={d.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 text-sm font-mono text-gray-700">{d.tracking_number}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <Link
                                                    href={route('admin.orders.show', d.order_id)}
                                                    className="text-[#6F4E37] hover:underline"
                                                >
                                                    #{d.order_id}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{d.order?.user?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {d.driver?.name ?? <span className="text-gray-400">Unassigned</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-700">
                                                {d.distance_km != null ? `${Number(d.distance_km).toFixed(2)} km` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{d.tier?.label ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {d.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex gap-1">
                                                    <Link
                                                        href={route('admin.deliveries.edit', d.id)}
                                                        className="p-1.5 text-gray-500 hover:text-[#6F4E37] hover:bg-gray-100 rounded-md"
                                                        title="Update status"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(d)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                        title="Delete"
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
                </div>
            </div>
        </AdminLayout>
    );
}
