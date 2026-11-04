import AdminLayout from '@/Layouts/AdminLayout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const STATUSES = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];

export default function Edit({ delivery }) {
    const { data, setData, put, processing, errors } = useForm({
        status: delivery.status ?? 'pending',
        notes: delivery.notes ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.deliveries.update', delivery.id));
    };

    return (
        <AdminLayout title={`Delivery ${delivery.tracking_number}`}>
            <div className="py-6">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.deliveries.index')} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Delivery {delivery.tracking_number}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Order #{delivery.order_id} · {delivery.order?.user?.name ?? 'Unknown customer'}
                            </p>
                        </div>
                    </div>

                    {/* Read-only details */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Delivery Details</h3>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-gray-500">Driver</div>
                            <div className="col-span-2 text-gray-800">{delivery.driver?.name ?? '—'}</div>

                            <div className="text-gray-500">Ship to</div>
                            <div className="col-span-2 text-gray-800">{delivery.order?.shipping_address ?? '—'}</div>

                            <div className="text-gray-500">Distance</div>
                            <div className="col-span-2 text-gray-800 font-mono">
                                {delivery.distance_km != null ? `${Number(delivery.distance_km).toFixed(2)} km` : '—'}
                            </div>

                            <div className="text-gray-500">Tier</div>
                            <div className="col-span-2 text-gray-800">{delivery.tier?.label ?? '—'}</div>

                            <div className="text-gray-500">Assigned at</div>
                            <div className="col-span-2 text-gray-800">
                                {delivery.assigned_at
                                    ? new Date(delivery.assigned_at).toLocaleString()
                                    : '—'}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                            Driver is assigned automatically when the order ships.
                            To reassign, use <strong>Orders → Order Details</strong>.
                        </p>
                    </div>

                    {/* Status form */}
                    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows="2"
                                placeholder="Internal notes for this delivery"
                                className="block w-full rounded-lg border-gray-200 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                            />
                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link
                                href={route('admin.deliveries.index')}
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
            </div>
        </AdminLayout>
    );
}
