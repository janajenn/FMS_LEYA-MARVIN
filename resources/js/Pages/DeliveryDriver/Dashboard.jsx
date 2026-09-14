// Driver Dashboard (pages/driver/dashboard.tsx)
import DeliveryDriverLayout from '@/Layouts/DeliveryDriverLayout';
import { Head } from '@inertiajs/react';
import { TruckIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
    // Example stats (replace with real data)
    const stats = [
        { label: 'Assigned Deliveries', value: 0, icon: TruckIcon, color: 'text-[#6F4E37]' },
        { label: 'In Progress', value: 0, icon: ClockIcon, color: 'text-amber-600' },
        { label: 'Completed', value: 0, icon: CheckCircleIcon, color: 'text-emerald-600' },
    ];

    return (
        <DeliveryDriverLayout title="Driver Dashboard">
            <Head title="Driver Dashboard" />

            <div className="space-y-6">
                {/* Welcome header */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100/50 p-6">
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Driver Dashboard</h1>
                    <p className="mt-1 text-sm text-stone-500">View your deliveries and update their status in real time.</p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat) => (
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

                {/* Placeholder for upcoming deliveries table or map */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100/50 p-6">
                    <h2 className="text-lg font-semibold text-stone-800">Recent Activity</h2>
                    <p className="mt-2 text-sm text-stone-500">No recent deliveries yet.</p>
                </div>
            </div>
        </DeliveryDriverLayout>
    );
}
