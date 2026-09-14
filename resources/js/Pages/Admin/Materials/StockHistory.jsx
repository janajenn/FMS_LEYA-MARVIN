import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function StockHistory({ material, history }) {
    // Calculate totals with proper numeric parsing
    const totalAdded = history
        .filter(entry => parseFloat(entry.quantity_change) > 0)
        .reduce((sum, entry) => sum + parseFloat(entry.quantity_change), 0);

    const totalDeducted = history
        .filter(entry => parseFloat(entry.quantity_change) < 0)
        .reduce((sum, entry) => sum + Math.abs(parseFloat(entry.quantity_change)), 0);

    const lastActivity = history.length > 0 ? history[0].created_at : null;

    // Helper to format numbers with 2 decimals
    const formatNumber = (value) => {
        if (value === undefined || value === null) return '0.00';
        return Number(value).toFixed(2);
    };

    return (
        <AdminLayout>
            <Head title={`Stock History – ${material.name}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('admin.materials.index')}
                                    className="text-gray-400 hover:text-[#6F4E37] transition-colors"
                                >
                                    <ArrowLeftIcon className="h-5 w-5" />
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Stock History
                                </h1>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Track inventory movements for <span className="font-medium text-gray-700">{material.name}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center px-3 py-1.5 bg-[#6F4E37]/10 text-[#6F4E37] text-sm font-medium rounded-lg">
                                <CubeIcon className="h-4 w-4 mr-1.5" />
                                {material.category?.name || 'Uncategorized'}
                            </span>
                            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                                Unit: {material.unit}
                            </span>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Current Stock</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(material.stock_quantity)}</p>
                            <p className="text-xs text-gray-400">{material.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Total Added</p>
                            <p className="text-2xl font-bold text-green-600">+{formatNumber(totalAdded)}</p>
                            <p className="text-xs text-gray-400">{material.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Total Deducted</p>
                            <p className="text-2xl font-bold text-red-600">-{formatNumber(totalDeducted)}</p>
                            <p className="text-xs text-gray-400">{material.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Last Activity</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {lastActivity ? new Date(lastActivity).toLocaleDateString() : '—'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {lastActivity ? new Date(lastActivity).toLocaleTimeString() : 'No records'}
                            </p>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                                <h2 className="text-base font-semibold text-gray-900">Movement Log</h2>
                            </div>
                            <span className="text-xs text-gray-400">
                                {history.length} {history.length === 1 ? 'record' : 'records'}
                            </span>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-sm">No stock history recorded for this material.</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {history.map((entry) => {
                                            const change = parseFloat(entry.quantity_change);
                                            const isPositive = change > 0;
                                            const isNegative = change < 0;
                                            return (
                                                <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                        <span className="block">{new Date(entry.created_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleTimeString()}</span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            isPositive ? 'bg-green-100 text-green-800' :
                                                            isNegative ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {isPositive ? '+' : ''}{formatNumber(change)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                        {formatNumber(entry.previous_quantity)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                        <span className="font-medium">{formatNumber(entry.new_quantity)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                        {entry.note || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {entry.creator?.name || '—'}
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
        </AdminLayout>
    );
}
