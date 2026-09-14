import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    FunnelIcon,
    PrinterIcon,
    XMarkIcon,
    ShoppingCartIcon,
} from '@heroicons/react/24/outline';

export default function Sales({ orders, filters, products, categories }) {
    const { data, setData, get } = useForm({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        product_id: filters.product_id || '',
        category_id: filters.category_id || '',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        get(route('admin.reports.sales'));
    };

    return (
        <AdminLayout>
            <Head title="Sales Report" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Report</h1>
                                <p className="mt-1 text-sm text-gray-500">View and filter sales orders</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <PrinterIcon className="h-4 w-4 mr-1.5" />
                                    Print
                                </button>
                                <Link
                                    href={route('admin.reports.dashboard')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-4 w-4 mr-1.5" />
                                    Back
                                </Link>
                            </div>
                        </div>

                        {/* Filters */}
                        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={e => setData('start_date', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={e => setData('end_date', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Product</label>
                                <select
                                    value={data.product_id}
                                    onChange={e => setData('product_id', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors appearance-none"
                                >
                                    <option value="">All Products</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</label>
                                <select
                                    value={data.category_id}
                                    onChange={e => setData('category_id', e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors appearance-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-full flex justify-end gap-2">
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <FunnelIcon className="h-4 w-4 mr-1.5" />
                                    Apply Filters
                                </button>
                                <Link
                                    href={route('admin.reports.sales')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-4 w-4 mr-1.5" />
                                    Reset
                                </Link>
                            </div>
                        </form>

                        {/* Table */}
                        {orders.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-sm">No orders found matching your criteria.</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <div className="min-w-full align-middle">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <div className="flex items-center">
                                                            <ShoppingCartIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                            {order.order_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {order.user?.name || 'Guest'}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-[#6F4E37]">
                                                        ₱{order.total.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
