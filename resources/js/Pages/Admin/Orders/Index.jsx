import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    ShoppingBagIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';

const formatPrice = (value) => `₱${Number(value).toFixed(2)}`;
const formatDate = (date) => new Date(date).toLocaleDateString();

export default function Index({ orders }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Compute stats
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'delivered').length;

    // Filter orders
    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) return orders;
        const term = searchTerm.toLowerCase().trim();
        return orders.filter(order =>
            order.order_number.toLowerCase().includes(term) ||
            (order.user?.name?.toLowerCase() || '').includes(term)
        );
    }, [orders, searchTerm]);

    return (
        <AdminLayout>
            <Head title="Order Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ─── Stats Cards ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">Total Orders</p>
                                    <p className="mt-1 text-2xl font-bold text-stone-900">{total}</p>
                                </div>
                                <div className="h-11 w-11 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
                                    <ShoppingBagIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">Pending</p>
                                    <p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p>
                                </div>
                                <div className="h-11 w-11 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                    <ClockIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">Processing</p>
                                    <p className="mt-1 text-2xl font-bold text-blue-600">{processing}</p>
                                </div>
                                <div className="h-11 w-11 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <TruckIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">Delivered</p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-600">{completed}</p>
                                </div>
                                <div className="h-11 w-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <SolidCheckCircle className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Table Card ─── */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
                        {/* Header with search */}
                        <div className="px-6 py-4 border-b border-stone-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                                <h1 className="text-lg font-bold text-stone-900">All Orders</h1>
                                <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                                    {filteredOrders.length}
                                </span>
                            </div>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by order # or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm rounded-lg border border-stone-200 bg-white placeholder:text-stone-400 focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-stone-200">
                                <thead className="bg-stone-50/80">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Order #</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Customer</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Total</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Payment</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Production</th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-stone-100">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-sm text-stone-500">
                                                {orders.length === 0
                                                    ? 'No orders found.'
                                                    : 'No orders match your search.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order, index) => (
                                            <tr
                                                key={order.id}
                                                className={`hover:bg-stone-50/60 transition-colors duration-150 ${
                                                    index % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                                                }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                                                    #{order.order_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                                                    {order.user?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                                                    {formatPrice(order.total)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                                        order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                                        order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                                                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                        'bg-stone-100 text-stone-700'
                                                    }`}>
                                                        {order.status === 'delivered' && <SolidCheckCircle className="h-3 w-3 mr-1" />}
                                                        {order.status === 'cancelled' && <XCircleIcon className="h-3 w-3 mr-1" />}
                                                        {order.status === 'processing' && <ClockIcon className="h-3 w-3 mr-1" />}
                                                        {order.status === 'shipped' && <TruckIcon className="h-3 w-3 mr-1" />}
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                                        order.payment_status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {order.payment_status === 'paid' && <SolidCheckCircle className="h-3 w-3 mr-1" />}
                                                        {order.payment_status === 'partially_paid' && <ClockIcon className="h-3 w-3 mr-1" />}
                                                        {order.payment_status === 'unpaid' && <XCircleIcon className="h-3 w-3 mr-1" />}
                                                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {order.production_stage ? (
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            order.production_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {order.production_completed ? (
                                                                <SolidCheckCircle className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                            )}
                                                            {order.production_label || order.production_stage}
                                                        </span>
                                                    ) : (
                                                        <span className="text-stone-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <Link
                                                        href={route('admin.orders.show', order.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 hover:text-[#6F4E37] hover:bg-stone-100 transition-colors"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        <span className="text-xs font-medium">View</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
