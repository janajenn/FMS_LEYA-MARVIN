import DeliveryDriverLayout from '@/Layouts/DeliveryDriverLayout';
import { Head, Link } from '@inertiajs/react';
import {
    TruckIcon,
    MapPinIcon,
    UserIcon,
    CurrencyDollarIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) => `₱${Number(v).toFixed(2)}`;

const statusBadge = (status) => {
    const map = {
        pending: 'bg-gray-100 text-gray-800',
        picked_up: 'bg-blue-100 text-blue-800',
        in_transit: 'bg-amber-100 text-amber-800',
        delivered: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
};

export default function Index({ deliveries = [] }) {
    return (
        <DeliveryDriverLayout>
            <Head title="My Deliveries" />
            <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TruckIcon className="h-5 w-5 text-[#6F4E37]" />
                    <h1 className="text-2xl font-bold text-stone-900">My Deliveries</h1>
                    <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        {deliveries.length}
                    </span>
                </div>

                {deliveries.length === 0 ? (
                    <p className="mt-4 text-sm text-stone-500">No deliveries assigned yet.</p>
                ) : (
                    <div className="mt-4 space-y-4">
                        {deliveries.map((delivery) => (
                            <div key={delivery.id} className="border border-stone-100 rounded-lg p-4 hover:bg-stone-50/40 transition">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-semibold text-stone-900">
                                            Order #{delivery.order?.order_number}
                                        </p>
                                        <p className="text-xs text-stone-500 flex items-center gap-1">
                                            <UserIcon className="h-3.5 w-3.5" />
                                            {delivery.order?.user?.name}
                                        </p>
                                        <p className="text-xs text-stone-500 flex items-center gap-1">
                                            <MapPinIcon className="h-3.5 w-3.5" />
                                            {delivery.order?.shipping_address}
                                        </p>
                                        <p className="text-xs text-stone-500 flex items-center gap-1">
                                            <CurrencyDollarIcon className="h-3.5 w-3.5" />
                                            {formatPrice(delivery.order?.total)} — {delivery.order?.payment_status}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge(delivery.status)}`}>
                                            {delivery.status.replace('_', ' ')}
                                        </span>
                                        <Link
                                            href={route('driver.deliveries.show', delivery.id)}
                                            className="text-xs font-medium text-[#6F4E37] hover:underline inline-flex items-center gap-1"
                                        >
                                            View Details <ArrowRightIcon className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DeliveryDriverLayout>
    );
}
