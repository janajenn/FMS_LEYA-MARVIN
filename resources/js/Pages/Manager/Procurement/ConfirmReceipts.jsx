import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { EyeIcon, CheckBadgeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function ConfirmReceipts({ receipts }) {
    const { flash } = usePage().props;
    const [statusFilter, setStatusFilter] = useState('all');

    const statusColors = {
        pending_confirmation: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
    };

    const statusLabels = {
        pending_confirmation: 'Pending Confirmation',
        confirmed: 'Confirmed',
    };

    // Filter receipts by status
    const filteredReceipts = statusFilter === 'all'
        ? receipts
        : receipts.filter(r => r.status === statusFilter);

    return (
        <ManagerLayout>
            <Head title="Confirm Goods Receipts" />

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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <CheckBadgeIcon className="h-8 w-8 text-[#6F4E37]" />
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Confirm Goods Receipts</h1>
                                        <p className="mt-1 text-sm text-gray-500">Review and confirm material receipts</p>
                                    </div>
                                </div>
                                <div>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                    >
                                        <option value="all">All Receipts</option>
                                        <option value="pending_confirmation">Pending Confirmation</option>
                                        <option value="confirmed">Confirmed</option>
                                    </select>
                                </div>
                            </div>

                            {filteredReceipts.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No goods receipts found.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received By</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredReceipts.map((receipt) => {
                                                const isPending = receipt.status === 'pending_confirmation';
                                                return (
                                                    <tr key={receipt.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {receipt.gr_number}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {receipt.purchase_order?.po_number || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {receipt.purchase_order?.supplier?.name || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {new Date(receipt.received_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {receipt.receiver?.name}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[receipt.status] || 'bg-gray-100 text-gray-800'}`}>
                                                                {statusLabels[receipt.status] || receipt.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                                                            <Link
                                                                href={route('manager.procurement.confirm.show', receipt.id)}
                                                                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                                    isPending
                                                                        ? 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B]'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                            >
                                                                <EyeIcon className="h-4 w-4 mr-1.5" />
                                                                {isPending ? 'Review' : 'View'}
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
