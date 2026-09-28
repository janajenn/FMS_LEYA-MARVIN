import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    TruckIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ReceiptPercentIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleString('en-PH', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : '—';

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

export default function Show({ purchaseOrder }) {
    const po = purchaseOrder;
    const hasCost = po.actual_total_cost != null;
    const items = po.items || [];

    return (
        <ManagerLayout>
            <Head title={`Purchase Order ${po.po_number}`} />

            <div className="py-6">
                <div className="max-w-5xl mx-auto space-y-4">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('manager.purchase-orders.index')}
                                    className="p-2 rounded-lg hover:bg-stone-100 transition"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 text-stone-500" />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                                        <DocumentTextIcon className="h-5 w-5 text-[#6F4E37]" />
                                        {po.po_number}
                                    </h1>
                                    <p className="text-sm text-stone-500 mt-0.5">
                                        Created{' '}
                                        {new Date(po.created_at).toLocaleDateString(
                                            'en-PH',
                                            { dateStyle: 'medium' }
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize ${statusStyles(
                                        po.status
                                    )}`}
                                >
                                    {po.status.replace('_', ' ')}
                                </span>

                                {po.status === 'completed' && hasCost && (
                                    <Link
                                        href={route(
                                            'manager.purchase-orders.receipt',
                                            po.id
                                        )}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                                    >
                                        <ReceiptPercentIcon className="h-4 w-4" />
                                        View Purchase Receipt
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <p className="text-xs uppercase text-stone-400 tracking-wide">
                                Supplier
                            </p>
                            <p className="text-sm font-medium text-stone-800 mt-1 flex items-center gap-2">
                                <TruckIcon className="h-4 w-4 text-stone-400" />
                                {po.supplier?.name || 'Walk-in Purchase'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase text-stone-400 tracking-wide">
                                Material Request
                            </p>
                            <p className="text-sm font-medium text-stone-800 mt-1 flex items-center gap-2">
                                <ClipboardDocumentListIcon className="h-4 w-4 text-stone-400" />
                                {po.material_request?.request_no ||
                                    po.materialRequest?.request_no ||
                                    '—'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase text-stone-400 tracking-wide">
                                Approved By
                            </p>
                            <p className="text-sm font-medium text-stone-800 mt-1 flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-stone-400" />
                                {po.approver?.name || '—'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase text-stone-400 tracking-wide">
                                Approved At
                            </p>
                            <p className="text-sm text-stone-700 mt-1 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-stone-400" />
                                {formatDate(po.approved_at)}
                            </p>
                        </div>

                        {po.recorder && (
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Purchase Recorded By
                                </p>
                                <p className="text-sm text-stone-700 mt-1 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-stone-400" />
                                    {po.recorder.name}
                                </p>
                            </div>
                        )}

                        {po.purchase_recorded_at && (
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Recorded At
                                </p>
                                <p className="text-sm text-stone-700 mt-1 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-stone-400" />
                                    {formatDate(po.purchase_recorded_at)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-100">
                            <h2 className="text-base font-semibold text-stone-900">
                                Ordered Items
                            </h2>
                        </div>
                        {items.length === 0 ? (
                            <div className="p-6 text-sm text-stone-500">
                                No items on this purchase order.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-stone-100">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 uppercase">
                                                Material
                                            </th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">
                                                Ordered
                                            </th>
                                            <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 uppercase">
                                                Unit
                                            </th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">
                                                Unit Cost
                                            </th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-stone-50/40">
                                                <td className="px-6 py-3 text-sm font-medium text-stone-800">
                                                    {item.material?.name || 'Material'}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-right text-stone-700">
                                                    {Number(item.ordered_quantity)}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-stone-500">
                                                    {item.material?.unit || '—'}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-right text-stone-700">
                                                    {item.actual_unit_cost != null
                                                        ? formatPrice(item.actual_unit_cost)
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-right font-medium text-stone-800">
                                                    {item.actual_subtotal != null
                                                        ? formatPrice(item.actual_subtotal)
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {hasCost && (
                                        <tfoot className="bg-emerald-50/60 border-t-2 border-emerald-100">
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-3 text-right text-sm font-semibold text-emerald-900 uppercase tracking-wide"
                                                >
                                                    Actual Total Purchase Cost
                                                </td>
                                                <td className="px-6 py-3 text-right text-base font-bold text-emerald-800">
                                                    {formatPrice(po.actual_total_cost)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Expense Summary (auto-recorded) */}
                    {hasCost && (
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <BanknotesIcon className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-emerald-900">
                                    Recorded as Business Expense
                                </p>
                                <p className="text-xs text-emerald-700 mt-1">
                                    This purchase has been automatically added to{' '}
                                    <strong>Expenses</strong> under category{' '}
                                    <strong>Supplier Purchase</strong>. It is reflected in
                                    the Financial Overview dashboard.
                                </p>
                            </div>
                            <Link
                                href={route('manager.finance.index')}
                                className="text-xs font-medium text-emerald-800 hover:underline whitespace-nowrap mt-1"
                            >
                                View Finance →
                            </Link>
                        </div>
                    )}

                    {/* Receipt hint */}
                    {po.status !== 'completed' && hasCost && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
                            <CheckCircleIcon className="h-5 w-5 text-blue-700 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">
                                    Receipt Pending
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    The Purchase Receipt will be available once all items
                                    have been received and the PO status becomes{' '}
                                    <strong>Completed</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
}
