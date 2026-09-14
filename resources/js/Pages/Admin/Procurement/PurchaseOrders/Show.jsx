import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Show({ order, hasRemaining, hasReplacementPending, hasDamagedItems }) {
    const { flash } = usePage().props;

    const statusColors = {
        waiting_delivery: 'bg-yellow-100 text-yellow-800',
        partially_delivered: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    const isComplete = order.status === 'completed' || order.status === 'cancelled';

    return (
        <AdminLayout>
            <Head title={`Purchase Order #${order.po_number}`} />

            <div className="py-4">
                <div className="w-full">
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="ml-3 text-sm font-medium">{flash.success}</div>
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="ml-3 text-sm font-medium">{flash.error}</div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={route('admin.purchase-orders.index')}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                                    </Link>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                            Purchase Order #{order.po_number}
                                        </h1>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {/* ✅ Receive Materials button – only if remaining quantity > 0 */}
                                    {!isComplete && hasRemaining && (
                                        <Link
                                            href={route('admin.goods-receipt.create', order.id)}
                                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                        >
                                            <DocumentArrowDownIcon className="h-5 w-5 mr-1.5" />
                                            Receive Materials
                                        </Link>
                                    )}

                                    {/* ✅ Request Replacement button – only if damaged items exist and no pending replacements */}
                                    {!isComplete && hasDamagedItems && !hasReplacementPending && (
                                        <Link
                                            href={route('admin.purchase-orders.replacement-request', order.id)}
                                            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors duration-200 shadow-sm"
                                        >
                                            <ArrowPathIcon className="h-5 w-5 mr-1.5" />
                                            Request Replacement
                                        </Link>
                                    )}

                                    {/* ✅ Receive Replacement button – only if replacement is pending (approved) */}
                                    {!isComplete && hasReplacementPending && (
                                        <Link
                                            href={route('admin.purchase-orders.receive-replacement', order.id)}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
                                        >
                                            <ArrowPathIcon className="h-5 w-5 mr-1.5" />
                                            Receive Replacement
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 rounded-lg mb-6">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Supplier</span>
                                    <p className="text-sm font-medium text-gray-700">{order.supplier?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Approved By</span>
                                    <p className="text-sm font-medium text-gray-700">{order.approver?.name}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Approved At</span>
                                    <p className="text-sm font-medium text-gray-700">{new Date(order.approved_at).toLocaleString()}</p>
                                </div>
                                {order.expected_delivery && (
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase">Expected Delivery</span>
                                        <p className="text-sm font-medium text-gray-700">{new Date(order.expected_delivery).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ordered Items</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remaining</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Damaged</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Replacement Remaining</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Specifications</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.material?.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.ordered_quantity}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.received_quantity || 0}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {item.remaining_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-red-600">
                                                    {item.damaged_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-amber-600">
                                                    {item.replacement_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {item.thickness || item.width || item.length ? (
                                                        <span>
                                                            {item.thickness && `${item.thickness}"`}
                                                            {item.width && ` × ${item.width}"`}
                                                            {item.length && ` × ${item.length}'`}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Goods Receipts History */}
                            {order.goods_receipts && order.goods_receipts.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Goods Receipt History</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">GR #</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received By</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {order.goods_receipts.map((gr) => (
                                                    <tr key={gr.id}>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{gr.gr_number}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(gr.received_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{gr.receiver?.name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {gr.is_replacement ? 'Replacement' : 'Regular'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gr.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {gr.status === 'confirmed' ? 'Confirmed' : 'Pending Confirmation'}
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
            </div>
        </AdminLayout>
    );
}
