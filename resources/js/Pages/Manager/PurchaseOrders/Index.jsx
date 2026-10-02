import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    DocumentTextIcon,
    EyeIcon,
    TruckIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—';

const statusStyles = (status) => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'partially_delivered':
            return 'bg-amber-100 text-amber-800';
        case 'waiting_delivery':
            return 'bg-blue-100 text-blue-800';
        case 'cancelled':
            return 'bg-rose-100 text-rose-800';
        default:
            return 'bg-stone-100 text-stone-700';
    }
};

const statusLabels = {
    waiting_delivery: 'Waiting for Delivery',
    partially_delivered: 'Partially Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const statusIcons = {
    waiting_delivery: ClockIcon,
    partially_delivered: TruckIcon,
    completed: CheckCircleIcon,
    cancelled: XCircleIcon,
};

export default function Index({ purchaseOrders = [] }) {
    return (
        <ManagerLayout>
            <Head title="Purchase Orders" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="h-5 w-5 text-[#6F4E37]" />
                                <h1 className="text-lg font-bold text-stone-900">
                                    Purchase Orders
                                </h1>
                                <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                                    {purchaseOrders.length}
                                </span>
                            </div>
                        </div>

                        {/* Empty state */}
                        {purchaseOrders.length === 0 ? (
                            <div className="py-16 text-center">
                                <DocumentTextIcon className="h-12 w-12 mx-auto text-stone-300" />
                                <p className="mt-3 text-sm text-stone-500">
                                    No purchase orders yet.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-stone-100">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                PO #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                Supplier
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                Request #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                Total Cost
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-stone-100">
                                        {purchaseOrders.map((po) => {
                                            const StatusIcon = statusIcons[po.status] || ClockIcon;
                                            const hasCost = po.actual_total_cost != null;

                                            return (
                                                <tr
                                                    key={po.id}
                                                    className="hover:bg-stone-50/40 transition"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                                                        {po.po_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                                                        {po.supplier?.name || 'Walk-in'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                                                        {po.material_request?.request_no ||
                                                            po.materialRequest?.request_no ||
                                                            '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                                        {formatDate(po.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles(
                                                                po.status
                                                            )}`}
                                                        >
                                                            <StatusIcon className="h-3.5 w-3.5" />
                                                            {statusLabels[po.status] || po.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {hasCost ? (
                                                            <span className="text-emerald-700">
                                                                {formatPrice(po.actual_total_cost)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-stone-400">
                                                                Not recorded
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center gap-3">
                                                            <Link
                                                                href={route(
                                                                    'manager.purchase-orders.show',
                                                                    po.id
                                                                )}
                                                                className="inline-flex items-center gap-1 text-xs font-medium text-[#6F4E37] hover:underline"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" />
                                                                View
                                                            </Link>

                                                            {hasCost && po.status === 'completed' && (
                                                                <Link
                                                                    href={route(
                                                                        'manager.purchase-orders.receipt',
                                                                        po.id
                                                                    )}
                                                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                                                                >
                                                                    <ReceiptPercentIcon className="h-3.5 w-3.5" />
                                                                    Receipt
                                                                </Link>
                                                            )}

                                                            {hasCost && po.status !== 'completed' && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 cursor-not-allowed"
                                                                    title={`Receipt available once PO is completed (currently ${po.status.replace(
                                                                        '_',
                                                                        ' '
                                                                    )})`}
                                                                >
                                                                    <ReceiptPercentIcon className="h-3.5 w-3.5" />
                                                                    Receipt
                                                                </span>
                                                            )}
                                                        </div>
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
        </ManagerLayout>
    );
}
