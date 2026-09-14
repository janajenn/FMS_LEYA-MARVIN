import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    PlusIcon,
    EyeIcon,
    TrashIcon,
    DocumentTextIcon,
    PencilSquareIcon,  // <-- added for Revise button
} from '@heroicons/react/24/outline';

export default function Index({ requests }) {
    const { flash } = usePage().props;

    const statusColors = {
        pending_review: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        returned_for_revision: 'bg-blue-100 text-blue-800',
    };

    const statusLabels = {
        pending_review: 'Pending Review',
        approved: 'Approved',
        rejected: 'Rejected',
        returned_for_revision: 'Returned for Revision',
    };

    return (
        <AdminLayout>
            <Head title="Material Requests" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 text-sm font-medium">{flash.success}</div>
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 text-sm font-medium">{flash.error}</div>
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Material Requests</h1>
                                    <p className="mt-1 text-sm text-gray-500">Create and track material requests for procurement</p>
                                </div>
                                <Link
                                    href={route('admin.material-requests.create')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    New Request
                                </Link>
                            </div>

                            {/* Table */}
                            {requests.length === 0 ? (
                                <div className="text-center py-12">
                                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300" />
                                    <div className="mt-2 text-gray-500 text-sm">No material requests found.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request #</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {requests.map((req) => (
                                                <tr key={req.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {req.request_no}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {req.procurement_type === 'supplier_purchase' ? 'Supplier Purchase' : 'Walk-in Purchase'}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {req.supplier?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {req.items_count || req.items?.length || 0}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                                                            {statusLabels[req.status] || req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {req.requester?.name}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        {/* View button */}
                                                        <Link
                                                            href={route('admin.material-requests.show', req.id)}
                                                            className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Link>

                                                        {/* Revise button – only for returned_for_revision */}
                                                        {req.status === 'returned_for_revision' && (
                                                            <Link
                                                                href={route('admin.material-requests.edit', req.id)}
                                                                className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center"
                                                            >
                                                                <PencilSquareIcon className="h-4 w-4" />
                                                                <span className="sr-only">Revise</span>
                                                            </Link>
                                                        )}

                                                        {/* Delete button – only for pending_review */}
                                                        {req.status === 'pending_review' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this request?')) {
                                                                        window.location.href = route('admin.material-requests.destroy', req.id);
                                                                    }
                                                                }}
                                                                className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
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
