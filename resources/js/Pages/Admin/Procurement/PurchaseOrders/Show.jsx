import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function Show({
    order,
    hasRemaining,
    hasReplacementPending,
    hasDamagedItems,
}) {
    const { flash } = usePage().props;

    const statusColors = {
        waiting_delivery: 'bg-yellow-100 text-yellow-800',
        partially_delivered: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    const isComplete = order.status === 'completed' || order.status === 'cancelled';

    /* ─── Aggregate totals across all receipts (computed once) ─── */
    const receiptTotals = (order.goods_receipts || []).reduce(
        (acc, gr) => {
            (gr.items || []).forEach((it) => {
                acc.received += Number(it.received_quantity || 0);
                acc.accepted += Number(it.accepted_quantity || 0);
                acc.damaged  += Number(it.damaged_quantity || 0);
            });
            if (gr.status !== 'confirmed') acc.pending += 1;
            return acc;
        },
        { received: 0, accepted: 0, damaged: 0, pending: 0 }
    );

    return (
        <AdminLayout>
            <Head title={`Purchase Order #${order.po_number}`} />

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
                            {/* ─── HEADER ─── */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={route('admin.purchase-orders.index')}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                                    </Link>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                            Purchase Order #{order.po_number}
                                        </h1>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Status:{' '}
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    statusColors[order.status] ||
                                                    'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {order.status
                                                    ?.replace('_', ' ')
                                                    .toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {!isComplete && hasRemaining && (
                                        <Link
                                            href={route(
                                                'admin.goods-receipt.create',
                                                order.id
                                            )}
                                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                        >
                                            <DocumentArrowDownIcon className="h-5 w-5 mr-1.5" />
                                            Receive Materials
                                        </Link>
                                    )}

                                    {!isComplete &&
                                        hasDamagedItems &&
                                        !hasReplacementPending && (
                                            <Link
                                                href={route(
                                                    'admin.purchase-orders.replacement-request',
                                                    order.id
                                                )}
                                                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors duration-200 shadow-sm"
                                            >
                                                <ArrowPathIcon className="h-5 w-5 mr-1.5" />
                                                Request Replacement
                                            </Link>
                                        )}

                                    {!isComplete && hasReplacementPending && (
                                        <Link
                                            href={route(
                                                'admin.purchase-orders.receive-replacement',
                                                order.id
                                            )}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
                                        >
                                            <ArrowPathIcon className="h-5 w-5 mr-1.5" />
                                            Receive Replacement
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* ─── DETAILS GRID ─── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 rounded-lg mb-6">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">
                                        Supplier
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">
                                        {order.supplier?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">
                                        Approved By
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">
                                        {order.approver?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">
                                        Approved At
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">
                                        {order.approved_at
                                            ? new Date(order.approved_at).toLocaleString()
                                            : 'N/A'}
                                    </p>
                                </div>
                                {order.expected_delivery && (
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase">
                                            Expected Delivery
                                        </span>
                                        <p className="text-sm font-medium text-gray-700">
                                            {new Date(
                                                order.expected_delivery
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* ─── ORDERED ITEMS TABLE ─── */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                Ordered Items
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Material
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Ordered
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Received
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Remaining
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Damaged
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Replacement Remaining
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                Specifications
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.material?.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.ordered_quantity}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.received_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {item.remaining_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-red-600">
                                                    {item.damaged_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-amber-600">
                                                    {item.replacement_quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {item.thickness ||
                                                    item.width ||
                                                    item.length ? (
                                                        <span>
                                                            {item.thickness &&
                                                                `${item.thickness}"`}
                                                            {item.width &&
                                                                ` × ${item.width}"`}
                                                            {item.length &&
                                                                ` × ${item.length}'`}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ─── RECEIVING HISTORY ─── */}
                            {order.goods_receipts &&
                                order.goods_receipts.length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <h3 className="text-sm font-semibold text-gray-700">
                                                Receiving History
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {order.goods_receipts.length} receipt
                                                {order.goods_receipts.length === 1
                                                    ? ''
                                                    : 's'}{' '}
                                                recorded
                                            </span>
                                        </div>

                                        {/* ─── Aggregate summary ─── */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                            <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Total Received
                                                </p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {receiptTotals.received}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Total Accepted
                                                </p>
                                                <p className="text-base font-semibold text-emerald-700">
                                                    {receiptTotals.accepted}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Total Damaged
                                                </p>
                                                <p
                                                    className={`text-base font-semibold ${
                                                        receiptTotals.damaged > 0
                                                            ? 'text-rose-600'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {receiptTotals.damaged}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Pending Confirmation
                                                </p>
                                                <p
                                                    className={`text-base font-semibold ${
                                                        receiptTotals.pending > 0
                                                            ? 'text-amber-600'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {receiptTotals.pending}
                                                </p>
                                            </div>
                                        </div>

                                        {/* ─── One card per Goods Receipt ─── */}
                                        <div className="space-y-4">
                                            {order.goods_receipts.map((gr) => {
                                                const items = gr.items || [];
                                                const grTotals = items.reduce(
                                                    (acc, it) => {
                                                        acc.received += Number(
                                                            it.received_quantity || 0
                                                        );
                                                        acc.accepted += Number(
                                                            it.accepted_quantity || 0
                                                        );
                                                        acc.damaged += Number(
                                                            it.damaged_quantity || 0
                                                        );
                                                        return acc;
                                                    },
                                                    {
                                                        received: 0,
                                                        accepted: 0,
                                                        damaged: 0,
                                                    }
                                                );

                                                const isConfirmed =
                                                    gr.status === 'confirmed';
                                                const isReplacement =
                                                    !!gr.is_replacement;
                                                const hasDamage =
                                                    grTotals.damaged > 0;

                                                return (
                                                    <div
                                                        key={gr.id}
                                                        className="border border-gray-200 rounded-lg overflow-hidden"
                                                    >
                                                        {/* Receipt header */}
                                                        <div className="bg-gray-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-semibold text-gray-900">
                                                                    {gr.gr_number}
                                                                </span>

                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                                                        isReplacement
                                                                            ? 'bg-amber-100 text-amber-800'
                                                                            : 'bg-stone-100 text-stone-700'
                                                                    }`}
                                                                >
                                                                    {isReplacement
                                                                        ? 'Replacement'
                                                                        : 'Regular'}
                                                                </span>

                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                                        isConfirmed
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                    }`}
                                                                >
                                                                    {isConfirmed
                                                                        ? 'Confirmed'
                                                                        : 'Pending Confirmation'}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                <span>
                                                                    <span className="text-gray-400">
                                                                        Received:
                                                                    </span>{' '}
                                                                    <span className="font-medium text-gray-700">
                                                                        {new Date(
                                                                            gr.received_date
                                                                        ).toLocaleDateString()}
                                                                    </span>
                                                                </span>
                                                                <span>
                                                                    <span className="text-gray-400">
                                                                        By:
                                                                    </span>{' '}
                                                                    <span className="font-medium text-gray-700">
                                                                        {gr.receiver?.name ||
                                                                            'N/A'}
                                                                    </span>
                                                                </span>
                                                                {gr.created_at && (
                                                                    <span className="hidden sm:inline">
                                                                        <span className="text-gray-400">
                                                                            Logged:
                                                                        </span>{' '}
                                                                        <span className="font-medium text-gray-700">
                                                                            {new Date(
                                                                                gr.created_at
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Line items */}
                                                        {items.length === 0 ? (
                                                            <div className="px-4 py-3 text-xs text-gray-400 italic">
                                                                No item lines recorded on this
                                                                receipt.
                                                            </div>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-100">
                                                                    <thead className="bg-white">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                                                                Material
                                                                            </th>
                                                                            <th className="px-4 py-2 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                                                                Received
                                                                            </th>
                                                                            <th className="px-4 py-2 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                                                                Accepted
                                                                            </th>
                                                                            <th className="px-4 py-2 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                                                                Damaged
                                                                            </th>
                                                                            <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                                                                Condition
                                                                            </th>
                                                                            <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                                                                Notes
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-50">
                                                                        {items.map((it) => {
                                                                            const poi =
                                                                                it.purchase_order_item;
                                                                            const materialName =
                                                                                poi?.material
                                                                                    ?.name ||
                                                                                'Unknown material';
                                                                            const unit =
                                                                                poi?.material
                                                                                    ?.unit || '';
                                                                            const ordered =
                                                                                poi?.ordered_quantity;
                                                                            const damaged =
                                                                                Number(
                                                                                    it.damaged_quantity ||
                                                                                        0
                                                                                );
                                                                            const accepted =
                                                                                Number(
                                                                                    it.accepted_quantity ||
                                                                                        0
                                                                                );
                                                                            const received =
                                                                                Number(
                                                                                    it.received_quantity ||
                                                                                        0
                                                                                );
                                                                            const isGood =
                                                                                it.condition ===
                                                                                'good';

                                                                            return (
                                                                                <tr
                                                                                    key={it.id}
                                                                                    className="hover:bg-gray-50/40"
                                                                                >
                                                                                    <td className="px-4 py-2.5 text-sm text-gray-800">
                                                                                        <div className="font-medium">
                                                                                            {
                                                                                                materialName
                                                                                            }
                                                                                        </div>
                                                                                        {ordered !=
                                                                                            null && (
                                                                                            <div className="text-[11px] text-gray-400">
                                                                                                {
                                                                                                    ordered
                                                                                                }{' '}
                                                                                                {
                                                                                                    unit
                                                                                                }{' '}
                                                                                                ordered
                                                                                                on
                                                                                                PO
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                                                                                        {
                                                                                            received
                                                                                        }{' '}
                                                                                        {unit}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-sm text-right text-emerald-700 font-medium whitespace-nowrap">
                                                                                        {
                                                                                            accepted
                                                                                        }{' '}
                                                                                        {unit}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-sm text-right whitespace-nowrap">
                                                                                        {damaged >
                                                                                        0 ? (
                                                                                            <span className="font-semibold text-rose-600">
                                                                                                {
                                                                                                    damaged
                                                                                                }{' '}
                                                                                                {
                                                                                                    unit
                                                                                                }
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-gray-300">
                                                                                                —
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-sm">
                                                                                        <span
                                                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                                                                isGood
                                                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                                                    : 'bg-rose-100 text-rose-800'
                                                                                            }`}
                                                                                        >
                                                                                            {isGood
                                                                                                ? 'Good'
                                                                                                : 'Damaged'}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-sm text-gray-500 max-w-xs">
                                                                                        {it.damage_reason ? (
                                                                                            <span className="italic">
                                                                                                {
                                                                                                    it.damage_reason
                                                                                                }
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-gray-300">
                                                                                                —
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                    {/* Receipt totals */}
                                                                    <tfoot className="bg-gray-50/60">
                                                                        <tr>
                                                                            <td className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                                                Receipt
                                                                                Totals
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-right font-bold text-gray-900">
                                                                                {
                                                                                    grTotals.received
                                                                                }
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-right font-bold text-emerald-700">
                                                                                {
                                                                                    grTotals.accepted
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                className={`px-4 py-2 text-sm text-right font-bold ${
                                                                                    grTotals.damaged >
                                                                                    0
                                                                                        ? 'text-rose-600'
                                                                                        : 'text-gray-300'
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    grTotals.damaged
                                                                                }
                                                                            </td>
                                                                            <td colSpan={2} />
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        )}

                                                        {/* Damage callout */}
                                                        {hasDamage && (
                                                            <div className="px-4 py-2 bg-rose-50/60 border-t border-rose-100 text-xs text-rose-700 flex items-center gap-1.5">
                                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                                {grTotals.damaged} item
                                                                {grTotals.damaged === 1
                                                                    ? ''
                                                                    : 's'}{' '}
                                                                arrived damaged on this receipt.
                                                                {isReplacement
                                                                    ? ' This receipt is a replacement delivery.'
                                                                    : ' A replacement request may be needed.'}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
