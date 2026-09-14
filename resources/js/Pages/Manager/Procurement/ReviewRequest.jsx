import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function ReviewRequest({ request }) {
    const { data, setData, post, processing, errors } = useForm({
        action: '',
        remarks: '',
    });

    const [showRemarks, setShowRemarks] = useState(false);

    const handleAction = (action) => {
        setData('action', action);
        if (action === 'approve') {
            // Approve without remarks (remarks optional)
            if (confirm('Approve this material request? This will generate a Purchase Order.')) {
                post(route('manager.procurement.review.process', request.id));
            }
        } else {
            // Reject or Return - require remarks
            setShowRemarks(true);
        }
    };

    const handleSubmitWithRemarks = (e) => {
        e.preventDefault();
        if (!data.remarks.trim()) {
            alert('Please provide remarks.');
            return;
        }
        post(route('manager.procurement.review.process', request.id));
    };

    const statusColors = {
        pending_review: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        returned_for_revision: 'bg-blue-100 text-blue-800',
    };

    return (
        <ManagerLayout>
            <Head title={`Review Request #${request.request_no}`} />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <Link
                                    href={route('manager.procurement.review.index')}
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
                                        <span className="text-xs text-gray-400 uppercase">Previous Remarks</span>
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

                            {/* Action Buttons */}
                            {request.status === 'pending_review' || request.status === 'returned_for_revision' ? (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Review Actions</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleAction('approve')}
                                            disabled={processing}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction('reject')}
                                            disabled={processing}
                                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircleIcon className="h-5 w-5 mr-2" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction('return')}
                                            disabled={processing}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                                            Return for Revision
                                        </button>
                                    </div>

                                    {/* Remarks Form for Reject/Return */}
                                    {showRemarks && (
                                        <form onSubmit={handleSubmitWithRemarks} className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Remarks <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={data.remarks}
                                                    onChange={e => setData('remarks', e.target.value)}
                                                    rows="3"
                                                    className="mt-1 block w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                    placeholder="Please provide reason for rejection or revision..."
                                                    required
                                                />
                                                {errors.remarks && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-3 mt-3">
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Submit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRemarks(false)}
                                                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">This request has already been reviewed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
