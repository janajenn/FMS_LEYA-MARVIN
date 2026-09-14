import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    CreditCardIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (value) => `₱${Number(value).toFixed(2)}`;
const formatDate = (date) => new Date(date).toLocaleString();

export default function Index({ orders = [], totalReceived = 0 }) {
    // ✅ Ensure orders is always an array
    const ordersList = Array.isArray(orders) ? orders : [];
    const paidOrders = ordersList.filter(o => o.payment_status === 'Paid').length;
    const partiallyPaidOrders = ordersList.filter(o => o.payment_status === 'Partially Paid').length;
    const unpaidOrders = ordersList.filter(o => o.payment_status === 'Unpaid').length;



    return (
        <ManagerLayout>
            <Head title="Payments" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Total Received */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Payments Received</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {formatPrice(totalReceived)}
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <BanknotesIcon className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Paid Orders */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Fully Paid Orders</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{paidOrders}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Partially Paid */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Partially Paid</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">{partiallyPaidOrders}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <ClockIcon className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Unpaid */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Unpaid Orders</p>
                                    <p className="text-2xl font-bold text-gray-600 mt-1">{unpaidOrders}</p>
                                </div>
                                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <XCircleIcon className="h-6 w-6 text-gray-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCardIcon className="h-5 w-5 text-[#6F4E37]" />
                                <h1 className="text-lg font-bold text-gray-900">Order Payment Status</h1>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {orders.length}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>

                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.order_id} className="hover:bg-gray-50/40">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{order.order_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {order.customer_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatPrice(order.order_total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                {formatPrice(order.total_paid)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                                                {order.remaining_balance > 0 ? formatPrice(order.remaining_balance) : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status_color}`}>
                                                    {order.payment_status}
                                                    {order.payment_status === 'Partially Paid' && order.payment_count > 0 && (
                                                        <span className="ml-1 text-[10px] opacity-75">
                                                            ({order.payment_count} payment{order.payment_count > 1 ? 's' : ''})
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">

</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
