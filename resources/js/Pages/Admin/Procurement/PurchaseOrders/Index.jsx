import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    EyeIcon,
    DocumentTextIcon,
    ShoppingBagIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function Index({ orders, stats }) {
    const { flash } = usePage().props;

    const statusColors = {
        waiting_delivery: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        partially_delivered: 'bg-blue-100 text-blue-800 border-blue-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    const statusIcons = {
        waiting_delivery: ClockIcon,
        partially_delivered: ClockIcon,
        completed: CheckCircleIcon,
        cancelled: XCircleIcon,
    };

    // Default stats if not provided
    const defaultStats = {
        total: orders.length,
        waiting_delivery: orders.filter(o => o.status === 'waiting_delivery').length,
        partially_delivered: orders.filter(o => o.status === 'partially_delivered').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
    const data = stats || defaultStats;

    const statCards = [
        { label: 'Total Orders', value: data.total, icon: ShoppingBagIcon, color: 'text-[#6F4E37]' },
        { label: 'Waiting Delivery', value: data.waiting_delivery, icon: ClockIcon, color: 'text-yellow-600' },
        { label: 'Partially Delivered', value: data.partially_delivered, icon: ClockIcon, color: 'text-blue-600' },
        { label: 'Completed', value: data.completed, icon: CheckCircleIcon, color: 'text-green-600' },
        { label: 'Cancelled', value: data.cancelled, icon: XCircleIcon, color: 'text-red-600' },
    ];

    return (
        <AdminLayout>
            <Head title="Purchase Orders" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0 mr-2" />
                            <span className="text-sm font-medium">{flash.success}</span>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {stat.label}
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className="h-10 w-10 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                            <Icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Orders</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage approved purchase orders</p>
                                </div>
                            </div>

                            {orders.length === 0 ? (
                                <div className="text-center py-12">
                                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300" />
                                    <div className="mt-2 text-gray-500 text-sm">No purchase orders found.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {orders.map((order) => {
                                                const StatusIcon = statusIcons[order.status] || ClockIcon;
                                                return (
                                                    <tr key={order.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {order.po_number}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {order.supplier?.name || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {order.material_request?.request_no || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {order.items_count || order.items?.length || 0}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                                <StatusIcon className="h-3 w-3" />
                                                                {order.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {order.approved_at ? new Date(order.approved_at).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                                                            <Link
                                                                href={route('admin.purchase-orders.show', order.id)}
                                                                className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                                <span className="sr-only">View</span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
