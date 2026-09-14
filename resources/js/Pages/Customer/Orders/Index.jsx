import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingBagIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function Orders({ orders }) {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'delivered':
                return CheckCircleIcon;
            case 'cancelled':
                return XCircleIcon;
            default:
                return ClockIcon;
        }
    };

    const getStatusColors = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const getPaymentStatusColors = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partially_paid':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <CustomerLayout>
            <Head title="My Orders" />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                                <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {orders.length}
                                </span>
                            </div>
                            <Link
                                href={route('shop.index')}
                                className="text-sm text-gray-500 hover:text-[#6F4E37] transition-colors flex items-center gap-1"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                Continue Shopping
                            </Link>
                        </div>

                        {/* Orders List */}
                        {orders.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F5EDE8] mb-4">
                                    <ShoppingBagIcon className="h-7 w-7 text-[#6F4E37]" />
                                </div>
                                <h2 className="text-base font-medium text-gray-900">No orders yet</h2>
                                <p className="mt-1 text-sm text-gray-500">Start shopping to place your first order.</p>
                                <Link
                                    href={route('shop.index')}
                                    className="mt-3 inline-block px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors shadow-sm"
                                >
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {orders.map((order) => {
                                    const StatusIcon = getStatusIcon(order.status);
                                    return (
                                        <div key={order.id} className="px-4 py-4 hover:bg-gray-50/40 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                {/* Left – Order info */}
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                                                    <Link
                                                        href={route('customer.orders.show', order.id)}
                                                        className="text-sm font-semibold text-[#6F4E37] hover:underline truncate"
                                                    >
                                                        #{order.order_number}
                                                    </Link>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarIcon className="h-3.5 w-3.5" />
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <CurrencyDollarIcon className="h-3.5 w-3.5" />
                                                            ₱{order.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right – Status and payment */}
                                                <div className="flex items-center gap-3 ml-auto sm:ml-0 flex-wrap">
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${getStatusColors(order.status)}`}>
                                                        <StatusIcon className="h-3.5 w-3.5" />
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPaymentStatusColors(order.payment_status)}`}>
                                                        {order.payment_status === 'partially_paid' ? 'Partially Paid' : order.payment_status}
                                                    </span>
                                                    <Link
                                                        href={route('customer.orders.show', order.id)}
                                                        className="text-xs font-medium text-[#6F4E37] hover:underline whitespace-nowrap"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
