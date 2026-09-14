import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { EyeIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function ReviewRequests({ requests }) {
    const { flash } = usePage().props;
    const [statusFilter, setStatusFilter] = useState('all');

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

    // Filter requests by status
    const filteredRequests = statusFilter === 'all'
        ? requests
        : requests.filter(req => req.status === statusFilter);

    return (
        <ManagerLayout>
            <Head title="Review Material Requests" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-[#6F4E37]" />
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Review Material Requests</h1>
                                        <p className="mt-1 text-sm text-gray-500">View and manage all material requests</p>
                                    </div>
                                </div>
                                {/* Status filter dropdown */}
                                <div>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                    >
                                        <option value="all">All Requests</option>
                                        <option value="pending_review">Pending Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="returned_for_revision">Returned for Revision</option>
                                    </select>
                                </div>
                            </div>

                            {filteredRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No material requests found.</div>
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
                                            {filteredRequests.map((req) => {
                                                const isActionable = req.status === 'pending_review' || req.status === 'returned_for_revision';
                                                return (
                                                    <tr key={req.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {req.request_no}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {req.type === 'replacement' ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                    Replacement
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">Regular</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {req.supplier?.name || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {req.items?.length || 0}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                                                                {statusLabels[req.status] || req.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {req.requester?.name}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                                                            <Link
                                                                href={route('manager.procurement.review.show', req.id)}
                                                                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                                    isActionable
                                                                        ? 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B]'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                            >
                                                                <EyeIcon className="h-4 w-4 mr-1.5" />
                                                                {isActionable ? 'Review' : 'View'}
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
        </ManagerLayout>
    );
}
