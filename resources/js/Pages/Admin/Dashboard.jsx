import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    CubeIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    UserCircleIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const stats = [
        {
            title: 'Total Products',
            value: '0',
            icon: CubeIcon,
            change: '+12%',
            changeType: 'positive',
        },
        {
            title: 'Pending Orders',
            value: '0',
            icon: ClockIcon,
            change: '-3%',
            changeType: 'negative',
        },
        {
            title: 'Low Stock Items',
            value: '0',
            icon: ExclamationTriangleIcon,
            change: '+2',
            changeType: 'warning',
        },
    ];

    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            {/* Coffee Brown greeting container – matches sidebar */}
            <div className="mb-8 rounded-xl bg-[#6F4E37] border border-[#5A3E2B] shadow-lg overflow-hidden">
                <div className="px-6 py-6 sm:px-8 sm:py-8">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-[#5A3E2B] flex items-center justify-center text-white text-lg font-medium ring-2 ring-[#8B6B4F]">
                                {user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {timeGreeting}, {user?.name || 'Admin'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-200">
                                You have full control over your store's operations. Here's a quick overview of what's happening today.
                            </p>
                            <div className="mt-2 flex items-center space-x-2 text-xs text-gray-300">
                                <UserCircleIcon className="h-4 w-4" />
                                <span>{user?.role?.name || 'Administrator'}</span>
                            </div>
                        </div>
                        {/* Subtle decorative icon – now matches brown scheme */}
                        <div className="hidden sm:block flex-shrink-0">
                            <div className="h-16 w-16 rounded-full bg-[#5A3E2B]/50 flex items-center justify-center">
                                <SparklesIcon className="h-6 w-6 text-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats grid – unchanged */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const isPositive = stat.changeType === 'positive';
                    const isWarning = stat.changeType === 'warning';
                    return (
                        <div
                            key={stat.title}
                            className="group relative bg-white overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100/50"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-lg bg-gray-50 p-3 group-hover:bg-gray-100 transition-colors duration-200">
                                        <Icon className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-500 truncate">
                                            {stat.title}
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    {stat.change && (
                                        <div className="ml-4 flex-shrink-0">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    isPositive
                                                        ? 'bg-green-50 text-green-700'
                                                        : isWarning
                                                        ? 'bg-yellow-50 text-yellow-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}
                                            >
                                                {stat.change}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
                        </div>
                    );
                })}
            </div>

            {/* Additional cards – unchanged */}
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-gray-500">No recent activity to show.</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold text-gray-900">System Health</h3>
                        <div className="mt-4 flex items-center space-x-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                            <span className="text-sm text-gray-600">All systems operational</span>
                        </div>
                        <div className="mt-3 flex items-center space-x-2">
                            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-500">Performance: Excellent</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-xs text-gray-400 text-center">
                Last updated: {new Date().toLocaleString()}
            </div>
        </AdminLayout>
    );
}
