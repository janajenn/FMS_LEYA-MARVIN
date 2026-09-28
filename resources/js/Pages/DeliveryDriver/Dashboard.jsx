import DeliveryDriverLayout from '@/Layouts/DeliveryDriverLayout';
import { Head, Link } from '@inertiajs/react';
import {
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    MapPinIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard({ stats = {}, recentDeliveries = [] }) {
    const statCards = [
        { label: 'Assigned Deliveries', value: stats.assigned ?? 0, icon: TruckIcon, color: 'text-[#6F4E37]' },
        { label: 'In Progress', value: stats.in_progress ?? 0, icon: ClockIcon, color: 'text-amber-600' },
        { label: 'Completed', value: stats.completed ?? 0, icon: CheckCircleIcon, color: 'text-emerald-600' },
    ];

    return (
        <DeliveryDriverLayout title="Driver Dashboard">
            <Head title="Driver Dashboard" />

            <div className="space-y-6">
                {/* Welcome header */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100/50 p-6">
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Driver Dashboard</h1>
                    <p className="mt-1 text-sm text-stone-500">
                        View your deliveries and update their status in real time.
                    </p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-xl shadow-sm border border-stone-100/50 p-6 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                                    <p className="mt-1 text-3xl font-bold text-stone-900">{stat.value}</p>
                                </div>
                                <div className={`h-12 w-12 rounded-full bg-stone-50 flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Deliveries */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-stone-800">Recent Deliveries</h2>
                        <Link
                            href={route('driver.deliveries.index')}
                            className="text-sm font-medium text-[#6F4E37] hover:underline inline-flex items-center gap-1"
                        >
                            View all <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                    </div>

                    {recentDeliveries.length === 0 ? (
                        <p className="text-sm text-stone-500">No deliveries assigned yet.</p>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {recentDeliveries.map((d) => (
                                <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-stone-900 truncate">
                                            #{d.order?.order_number} — {d.order?.user?.name}
                                        </p>
                                        <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                                            <MapPinIcon className="h-3.5 w-3.5" />
                                            {d.order?.shipping_address}
                                        </p>
                                    </div>
                                    <Link
                                        href={route('driver.deliveries.show', d.id)}
                                        className="text-xs font-medium text-[#6F4E37] hover:underline whitespace-nowrap"
                                    >
                                        View
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DeliveryDriverLayout>
    );
}
