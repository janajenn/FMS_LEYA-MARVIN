import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ShoppingBagIcon,
    TruckIcon,
    CheckCircleIcon,
    ShoppingCartIcon,
    UserIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatRelative = (dateString) => {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
};

const statusStyles = (status) => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'delivered':
            return 'bg-blue-100 text-blue-800';
        case 'shipped':
            return 'bg-amber-100 text-amber-800';
        case 'processing':
            return 'bg-indigo-100 text-indigo-800';
        case 'accepted':
            return 'bg-sky-100 text-sky-800';
        case 'cancelled':
            return 'bg-rose-100 text-rose-800';
        default:
            return 'bg-stone-100 text-stone-700';
    }
};

export default function Dashboard({ stats = {}, recentOrders = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const safeStats = {
        totalOrders: stats.totalOrders ?? 0,
        pendingDeliveries: stats.pendingDeliveries ?? 0,
        completedOrders: stats.completedOrders ?? 0,
        totalSpent: stats.totalSpent ?? 0,
        outstandingBalance: stats.outstandingBalance ?? 0,
    };

    const statCards = [
        {
            label: 'Total Orders',
            value: safeStats.totalOrders,
            icon: ShoppingBagIcon,
            color: 'text-[#9a784f]',
            bg: 'bg-[#F5EDE8]',
        },
        {
            label: 'Pending Delivery',
            value: safeStats.pendingDeliveries,
            icon: TruckIcon,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            label: 'Completed',
            value: safeStats.completedOrders,
            icon: CheckCircleIcon,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
    ];

    const financialCards = [
        {
            label: 'Total Spent',
            value: formatPrice(safeStats.totalSpent),
            icon: CurrencyDollarIcon,
            color: 'text-[#9a784f]',
            bg: 'bg-[#F5EDE8]',
        },
        {
            label: 'Outstanding Balance',
            value: formatPrice(safeStats.outstandingBalance),
            icon: ClockIcon,
            color: safeStats.outstandingBalance > 0 ? 'text-orange-600' : 'text-emerald-600',
            bg: safeStats.outstandingBalance > 0 ? 'bg-orange-50' : 'bg-emerald-50',
        },
    ];

    return (
        <CustomerLayout>
            <Head title="Customer Dashboard" />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ─── Greeting ─── */}
                    <div
                        className="rounded-xl shadow-lg overflow-hidden mb-6"
                        style={{ backgroundColor: '#9a784f' }}
                    >
                        <div className="px-6 py-6 sm:px-8 sm:py-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white tracking-tight">
                                        Welcome back, {user?.name?.split(' ')[0] || 'Customer'}
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

                    {/* ─── Primary Stats ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {statCards.map((card) => (
                            <div
                                key={card.label}
                                className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {card.label}
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">
                                            {card.value}
                                        </p>
                                    </div>
                                    <div
                                        className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}
                                    >
                                        <card.icon className={`h-5 w-5 ${card.color}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ─── Financial Snapshot ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {financialCards.map((card) => (
                            <div
                                key={card.label}
                                className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 flex items-center gap-4"
                            >
                                <div
                                    className={`h-12 w-12 rounded-full ${card.bg} flex items-center justify-center shrink-0`}
                                >
                                    <card.icon className={`h-6 w-6 ${card.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {card.label}
                                    </p>
                                    <p className={`text-lg font-bold ${card.color} truncate`}>
                                        {card.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ─── Quick Actions & Recent Orders ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 lg:col-span-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Quick Actions
                            </h3>
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

                        {/* Recent Orders */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Recent Orders
                                </h3>
                                <Link
                                    href={route('customer.orders.index')}
                                    className="text-xs text-[#9a784f] hover:underline inline-flex items-center gap-1"
                                >
                                    View all <ArrowRightIcon className="h-3 w-3" />
                                </Link>
                            </div>

                            {recentOrders.length === 0 ? (
                                <div className="py-8 text-center">
                                    <ShoppingBagIcon className="h-10 w-10 mx-auto text-gray-300" />
                                    <p className="mt-2 text-sm text-gray-500">
                                        No orders yet. Start shopping to place your first order.
                                    </p>
                                    <Link
                                        href={route('shop.index')}
                                        className="mt-3 inline-block px-4 py-2 bg-[#9a784f] text-white text-sm font-medium rounded-lg hover:bg-[#7a6240] transition"
                                    >
                                        Browse Products
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={route('customer.orders.show', order.id)}
                                            className="flex items-center justify-between py-3 hover:bg-gray-50/60 -mx-3 px-3 rounded-lg transition"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    #{order.order_number}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {order.items_count} item
                                                    {order.items_count !== 1 ? 's' : ''} •{' '}
                                                    {formatRelative(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatPrice(order.total)}
                                                    </p>
                                                    <span
                                                        className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyles(
                                                            order.status
                                                        )}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <ArrowRightIcon className="h-4 w-4 text-gray-300" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
