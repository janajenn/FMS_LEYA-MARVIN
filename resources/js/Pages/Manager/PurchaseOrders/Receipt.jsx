import { Head, Link } from '@inertiajs/react';
import { PrinterIcon, ArrowLeftIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

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

export default function Receipt({ purchaseOrder, receivedSummary, storeLocation }) {
    const po = purchaseOrder;
    const expense = po.expense;

    const handlePrint = () => window.print();

    return (
        <>
            <Head title={`Purchase Receipt ${po.po_number}`} />

            <div className="min-h-screen bg-stone-100 py-8 print:bg-white print:py-0">
                <div className="max-w-3xl mx-auto px-4">
                    {/* ── Actions (hidden when printing) ── */}
                    <div className="mb-4 flex items-center justify-between no-print">
                        <Link
                            href={
                                window.history.length > 1
                                    ? 'javascript:history.back()'
                                    : route('admin.purchase-orders.index')
                            }
                            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#6F4E37] transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Print Receipt
                        </button>
                    </div>

                    {/* ── Receipt Body ── */}
                    <div className="receipt-content bg-white rounded-xl shadow-sm border border-stone-200 p-8 print:shadow-none print:border-0 print:rounded-none">
                        {/* Header */}
                        <div className="text-center border-b-2 border-stone-300 pb-6">
                            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                                {storeLocation.name}
                            </h1>
                            {storeLocation.address && (
                                <p className="text-sm text-stone-500 mt-1">
                                    {storeLocation.address}
                                </p>
                            )}
                            <div className="mt-4 inline-block">
                                <p className="text-base font-semibold text-[#6F4E37] uppercase tracking-[0.2em]">
                                    Purchase Receipt
                                </p>
                            </div>
                            <p className="mt-1 text-xs text-stone-400">
                                Official record of purchase and receipt
                            </p>
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    PO Number
                                </p>
                                <p className="font-semibold text-stone-800 mt-0.5">
                                    {po.po_number}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Date Recorded
                                </p>
                                <p className="font-semibold text-stone-800 mt-0.5">
                                    {formatDate(po.purchase_recorded_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Supplier
                                </p>
                                <p className="font-semibold text-stone-800 mt-0.5">
                                    {po.supplier?.name || 'Walk-in Purchase'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Material Request
                                </p>
                                <p className="font-semibold text-stone-800 mt-0.5">
                                    {po.material_request?.request_no ||
                                        po.materialRequest?.request_no ||
                                        '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Approved By
                                </p>
                                <p className="font-semibold text-stone-800 mt-0.5">
                                    {po.approver?.name || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-stone-400 tracking-wide">
                                    Recorded By
                                </p>
                                <p className="font-semibold text-stone-800 mt-0.5">
                                    {po.recorder?.name || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mt-8">
                            <table className="min-w-full text-sm">
                                <thead className="border-b-2 border-stone-300">
                                    <tr>
                                        <th className="text-left py-2 font-semibold text-stone-700 text-xs uppercase tracking-wide">
                                            Material
                                        </th>
                                        <th className="text-right py-2 font-semibold text-stone-700 text-xs uppercase tracking-wide">
                                            Ordered
                                        </th>
                                        <th className="text-right py-2 font-semibold text-stone-700 text-xs uppercase tracking-wide">
                                            Received
                                        </th>
                                        <th className="text-right py-2 font-semibold text-stone-700 text-xs uppercase tracking-wide">
                                            Unit Cost
                                        </th>
                                        <th className="text-right py-2 font-semibold text-stone-700 text-xs uppercase tracking-wide">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivedSummary.map((item) => (
                                        <tr key={item.id} className="border-b border-stone-100">
                                            <td className="py-3 text-stone-800">
                                                {item.material_name}
                                                {item.unit && (
                                                    <span className="text-xs text-stone-400 ml-1">
                                                        ({item.unit})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-stone-600">
                                                {item.ordered_quantity}
                                            </td>
                                            <td className="py-3 text-right text-stone-600">
                                                {item.received_quantity}
                                                {item.damaged_quantity > 0 && (
                                                    <span className="text-xs text-rose-500 ml-1">
                                                        ({item.damaged_quantity} damaged)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-stone-600">
                                                {formatPrice(item.actual_unit_cost)}
                                            </td>
                                            <td className="py-3 text-right font-medium text-stone-800">
                                                {formatPrice(item.actual_subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-stone-300">
                                        <td
                                            colSpan={4}
                                            className="py-3 text-right font-semibold text-stone-800 text-sm uppercase tracking-wide"
                                        >
                                            Total Purchase Cost
                                        </td>
                                        <td className="py-3 text-right text-lg font-bold text-[#6F4E37]">
                                            {formatPrice(po.actual_total_cost)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Confirmation Section */}
                        <div className="mt-8 pt-6 border-t border-stone-200">
                            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                                <CheckBadgeIcon className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-emerald-900">
                                        Purchase Completed
                                    </p>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                        All items have been confirmed received. This purchase
                                        has been recorded in the system and reflected in the
                                        expense tracking.
                                    </p>
                                </div>
                                <span className="text-xs font-medium uppercase text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full whitespace-nowrap">
                                    {po.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-8 grid grid-cols-2 gap-12">
                            <div>
                                <div className="border-t border-stone-400 pt-2">
                                    <p className="text-xs text-stone-500 uppercase tracking-wide">
                                        Prepared By
                                    </p>
                                    <p className="text-sm font-medium text-stone-800 mt-1">
                                        {po.recorder?.name || '—'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="border-t border-stone-400 pt-2">
                                    <p className="text-xs text-stone-500 uppercase tracking-wide">
                                        Confirmed By
                                    </p>
                                    <p className="text-sm font-medium text-stone-800 mt-1">
                                        {po.approver?.name || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center text-xs text-stone-400 italic">
                            This is a system-generated receipt for internal record purposes.
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Print CSS ── */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .receipt-content,
                    .receipt-content * {
                        visibility: visible;
                    }
                    .receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        margin: 0.5in;
                    }
                }
            `}</style>
        </>
    );
}
