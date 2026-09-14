import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingBagIcon,
    TruckIcon,
    CheckCircleIcon,
    ShoppingCartIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard({ stats = null }) {
    // Fallback stats if not provided by controller
    const defaultStats = {
        totalOrders: 0,
        pendingDeliveries: 0,
        completedOrders: 0,
    };
    const data = stats || defaultStats;

    return (
        <CustomerLayout>
            <Head title="Customer Dashboard" />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Greeting Container – matches sidebar color (tortilla #9a784f) */}
                    <div
                        className="rounded-xl shadow-lg overflow-hidden mb-6"
                        style={{ backgroundColor: '#9a784f' }}
                    >
                        <div className="px-6 py-6 sm:px-8 sm:py-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white tracking-tight">
                                        Welcome back, Customer
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-200">
                                        Here's what's happening with your orders today.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#7a6240] text-gray-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
                                        Store open
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Orders
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {data.totalOrders}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                    <ShoppingBagIcon className="h-5 w-5 text-[#9a784f]" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pending Delivery
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {data.pendingDeliveries}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                    <TruckIcon className="h-5 w-5 text-[#9a784f]" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Completed
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {data.completedOrders}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                    <CheckCircleIcon className="h-5 w-5 text-[#9a784f]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions & Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 lg:col-span-1">
                            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                            <div className="mt-4 space-y-2">
                                <Link
                                    href={route('shop.index')}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#F5EDE8] transition-colors text-sm font-medium text-gray-700 flex items-center"
                                >
                                    <ShoppingCartIcon className="h-4 w-4 mr-2 text-[#9a784f]" />
                                    Continue Shopping
                                </Link>
                                <Link
                                    href={route('customer.orders.index')}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#F5EDE8] transition-colors text-sm font-medium text-gray-700 flex items-center"
                                >
                                    <ShoppingBagIcon className="h-4 w-4 mr-2 text-[#9a784f]" />
                                    My Orders
                                </Link>
                                <Link
                                    href={route('profile.edit')}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#F5EDE8] transition-colors text-sm font-medium text-gray-700 flex items-center"
                                >
                                    <UserIcon className="h-4 w-4 mr-2 text-[#9a784f]" />
                                    Update Profile
                                </Link>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
                                <Link
                                    href={route('customer.orders.index')}
                                    className="text-xs text-[#9a784f] hover:underline"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="mt-4 space-y-3">
                                {data.totalOrders > 0 ? (
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm text-gray-700">You placed an order</span>
                                        <span className="text-xs text-gray-400">1 day ago</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No recent activity.</p>
                                )}
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-700">Browse our latest collection</span>
                                    <span className="text-xs text-gray-400">2 days ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
