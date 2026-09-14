import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Show({ request }) {
    const { flash } = usePage().props;

    const statusColors = {
        pending_review: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        returned_for_revision: 'bg-blue-100 text-blue-800',
    };

    return (
        <AdminLayout>
            <Head title={`Material Request #${request.request_no}`} />

            <div className="py-4">
                <div className="w-full">
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="ml-3 text-sm font-medium">{flash.success}</div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={route('admin.material-requests.index')}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                                    </Link>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                            Material Request #{request.request_no}
                                        </h1>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {request.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Requested: {new Date(request.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-lg mb-6">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Procurement Type</span>
                                    <p className="text-sm font-medium text-gray-700">
                                        {request.procurement_type === 'supplier_purchase' ? 'Supplier Purchase' : 'Walk-in Purchase'}
                                    </p>
                                </div>
                                {request.supplier && (
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase">Supplier</span>
                                        <p className="text-sm font-medium text-gray-700">{request.supplier.name}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Requested By</span>
                                    <p className="text-sm font-medium text-gray-700">{request.requester?.name}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Reason</span>
                                    <p className="text-sm text-gray-700">{request.reason}</p>
                                </div>
                                {request.remarks && (
                                    <div className="md:col-span-2">
                                        <span className="text-xs text-gray-400 uppercase">Remarks</span>
                                        <p className="text-sm text-gray-700">{request.remarks}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Requested Items</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Specifications</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {request.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.material.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.material.unit}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.thickness || item.width || item.length ? (
                                                        <span>
                                                            {item.thickness && `${item.thickness}"`}
                                                            {item.width && ` × ${item.width}"`}
                                                            {item.length && ` × ${item.length}'`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{item.notes || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* PO Link if approved */}
                            {request.status === 'approved' && request.purchase_order && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        ✅ Approved. Purchase Order <Link href={route('admin.purchase-orders.show', request.purchase_order.id)} className="font-semibold underline hover:text-green-900">
                                            #{request.purchase_order.po_number}
                                        </Link> has been generated.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}   
