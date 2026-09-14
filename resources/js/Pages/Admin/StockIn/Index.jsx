import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { EyeIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Index({ stockEntries }) {
    const { flash } = usePage().props;

    // ✅ Safe handling: support both plain array and paginator object
    const entries = stockEntries?.data ?? (Array.isArray(stockEntries) ? stockEntries : []);
    const paginator = stockEntries?.data ? stockEntries : null;

    const total = paginator?.total ?? entries.length;
    const from = paginator?.from ?? (entries.length > 0 ? 1 : 0);
    const to = paginator?.to ?? entries.length;
    const links = paginator?.links ?? [];

    return (
        <AdminLayout>
            <Head title="Stock In Records" />

            <div className="py-3">
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

                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Stock In Records</h1>
                                <p className="text-sm text-gray-500">
                                    {total > 0
                                        ? `Showing ${from}–${to} of ${total} entries`
                                        : 'No stock‑in transactions yet'}
                                </p>
                            </div>
                            <Link
                                href={route('admin.stock-in.create')}
                                className="inline-flex items-center px-4 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-sm font-medium rounded-lg transition-colors duration-150 shadow-sm"
                            >
                                <PlusIcon className="h-4 w-4 mr-1.5" />
                                New Stock In
                            </Link>
                        </div>

                        {/* Table */}
                        {entries.length === 0 ? (
                            <div className="text-center py-16">
                                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300" />
                                <div className="mt-3 text-gray-500 text-sm">No stock‑in records found.</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock In #</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">GR #</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO #</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Material</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Received</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Received By</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>

                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {entries.map((entry) => {
                                            const isConfirmed = entry.goods_receipt_status === 'confirmed';
                                            return (
                                                <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        SIN-{String(entry.id).padStart(6, '0')}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {entry.gr_number}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {entry.po_number}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        {entry.material?.name}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        {entry.quantity_change}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {entry.material?.unit}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {entry.received_date
                                                            ? new Date(entry.received_date).toLocaleDateString()
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {entry.creator?.name || '—'}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            isConfirmed
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {isConfirmed ? 'Confirmed' : 'Pending'}
                                                        </span>
                                                    </td>

                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination – only when paginator exists */}
                        {paginator && total > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium text-gray-700">{from}</span> to{' '}
                                    <span className="font-medium text-gray-700">{to}</span> of{' '}
                                    <span className="font-medium text-gray-700">{total}</span> results
                                </div>
                                <div className="flex items-center space-x-1">
                                    {links.map((link, index) => {
                                        const isActive = link.active;
                                        let displayLabel = link.label;
                                        if (displayLabel === '&laquo; Previous') displayLabel = '‹';
                                        else if (displayLabel === 'Next &raquo;') displayLabel = '›';
                                        else if (displayLabel === '...') displayLabel = '…';

                                        if (link.url === null) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{ __html: displayLabel }}
                                                />
                                            );
                                        }

                                        return (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-150 ${
                                                    isActive
                                                        ? 'bg-[#6F4E37] text-white font-medium shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: displayLabel }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
