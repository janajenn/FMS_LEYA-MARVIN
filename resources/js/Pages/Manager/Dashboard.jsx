import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    UsersIcon,
    ClockIcon,
    WalletIcon,
    CubeIcon,
    ShoppingBagIcon,
    TruckIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowRightIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const timeAgo = (iso) => {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const prettyLabel = (s) =>
    String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ACTIVITY_ICONS = {
    'shopping-bag': ShoppingBagIcon,
    clipboard: ClipboardDocumentListIcon,
    truck: TruckIcon,
    currency: CurrencyDollarIcon,
};

const PRODUCTION_STAGES = [
    { key: 'carpentry',    label: 'Carpentry / Assembly'  },
    { key: 'sanding',      label: 'Sanding'                },
    { key: 'wood_filling', label: 'Wood Filling / Prep'    },
    { key: 'varnishing',   label: 'Varnishing / Finishing' },
];

export default function Dashboard({
    today,
    orders,
    production,
    procurement,
    receipts,
    deliveries,
    inventory,
    finance,
    team,
    recentActivity,
}) {
    const productionStages = PRODUCTION_STAGES.map((s) => ({
        ...s,
        count: production.pipeline?.[s.key] ?? 0,
    }));
    const totalInProduction = productionStages.reduce((sum, s) => sum + s.count, 0);
    const maxStageCount = Math.max(1, ...productionStages.map((s) => s.count));

    // Order breakdown bars
    const orderBreakdown = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled']
        .map((s) => ({
            status: s,
            label: prettyLabel(s),
            count: orders.byStatus?.[s] ?? 0,
        }))
        .filter((s) => s.count > 0);
    const maxOrderCount = Math.max(1, ...orderBreakdown.map((s) => s.count));

    // Driver load — max for bar scaling
    const maxDriverLoad = Math.max(1, ...(deliveries.driverWorkload || []).map((d) => d.active_deliveries_count));

    return (
        <ManagerLayout>
            <Head title="Manager Dashboard" />

            <div className="space-y-6">
                {/* ─── GREETING ─── */}
                <div
                    className="rounded-xl shadow-lg overflow-hidden"
                    style={{ backgroundColor: '#3f301d' }}
                >
                    <div className="px-6 py-6 sm:px-8 sm:py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    Welcome back, Manager
                                </h1>
                                <p className="mt-1 text-sm text-gray-300">
                                    Real-time snapshot of operations, procurement, and finances.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#5C4E34] text-gray-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
                                    System online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── TODAY'S SNAPSHOT ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Orders Today
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {today.orders}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                <ShoppingBagIcon className="h-5 w-5" style={{ color: '#3f301d' }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue Today
                                </p>
                                <p className="mt-1 text-2xl font-bold text-emerald-700">
                                    {formatPrice(today.revenue)}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expenses Today
                                </p>
                                <p className="mt-1 text-2xl font-bold text-rose-700">
                                    {formatPrice(today.expenses)}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-lg bg-rose-50 flex items-center justify-center">
                                <ArrowTrendingDownIcon className="h-5 w-5 text-rose-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Net Today
                                </p>
                                <p
                                    className={`mt-1 text-2xl font-bold ${
                                        today.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                    }`}
                                >
                                    {formatPrice(today.net)}
                                </p>
                            </div>
                            <div
                                className={`h-11 w-11 rounded-lg flex items-center justify-center ${
                                    today.net >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
                                }`}
                            >
                                <WalletIcon
                                    className={`h-5 w-5 ${
                                        today.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── PRIORITY ALERTS ─── */}
                {(receipts.pendingCount > 0 ||
                    procurement.requestsPendingReview > 0 ||
                    procurement.posMissingCost > 0 ||
                    inventory.outOfStockCount > 0) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                            Needs Your Attention
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {receipts.pendingCount > 0 && (
                                <Link
                                    href={route('manager.procurement.confirm.index')}
                                    className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 hover:bg-amber-50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-amber-800">
                                            Receipts to Confirm
                                        </p>
                                        <ArrowRightIcon className="h-3.5 w-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold text-amber-900">
                                        {receipts.pendingCount}
                                    </p>
                                </Link>
                            )}

                            {procurement.requestsPendingReview > 0 && (
                                <Link
                                    href={route('manager.procurement.review.index')}
                                    className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 hover:bg-blue-50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-blue-800">
                                            Requests to Review
                                        </p>
                                        <ArrowRightIcon className="h-3.5 w-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold text-blue-900">
                                        {procurement.requestsPendingReview}
                                    </p>
                                    {procurement.replacementRequestsPending > 0 && (
                                        <p className="text-[10px] text-blue-600 mt-0.5">
                                            {procurement.replacementRequestsPending} replacement
                                        </p>
                                    )}
                                </Link>
                            )}

                            {procurement.posMissingCost > 0 && (
                                <Link
                                    href={route('manager.procurement.review.index')}
                                    className="rounded-lg border border-purple-100 bg-purple-50/60 p-3 hover:bg-purple-50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-purple-800">
                                            Missing PO Costs
                                        </p>
                                        <ArrowRightIcon className="h-3.5 w-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold text-purple-900">
                                        {procurement.posMissingCost}
                                    </p>
                                </Link>
                            )}

                            {inventory.outOfStockCount > 0 && (
                                <Link
                                    href={route('manager.products.index')}
                                    className="rounded-lg border border-rose-100 bg-rose-50/60 p-3 hover:bg-rose-50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-rose-800">
                                            Out of Stock
                                        </p>
                                        <ArrowRightIcon className="h-3.5 w-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold text-rose-900">
                                        {inventory.outOfStockCount}
                                    </p>
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── ORDER OPERATIONS + PRODUCTION ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order status overview */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Order Status Overview
                            </h3>
                            <Link
                                href={route('manager.orders.index')}
                                className="text-xs font-medium text-[#6B5A3E] hover:underline inline-flex items-center gap-1"
                            >
                                View all <ArrowRightIcon className="h-3 w-3" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Pending
                                </p>
                                <p className="text-lg font-bold text-amber-600">
                                    {orders.pending}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    In Production
                                </p>
                                <p className="text-lg font-bold text-indigo-600">
                                    {orders.processing}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Shipped
                                </p>
                                <p className="text-lg font-bold text-cyan-600">
                                    {orders.shipped}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Delivered
                                </p>
                                <p className="text-lg font-bold text-emerald-600">
                                    {orders.delivered}
                                </p>
                            </div>
                        </div>

                        {orderBreakdown.length === 0 ? (
                            <p className="text-sm text-gray-500">No orders yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {orderBreakdown.map((s) => (
                                    <li key={s.status}>
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium text-gray-700">
                                                {s.label}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {s.count}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#6F4E37] rounded-full transition-all"
                                                style={{
                                                    width: `${(s.count / maxOrderCount) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Production pipeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Production Pipeline
                            </h3>
                            <span className="text-xs font-semibold text-gray-500">
                                {totalInProduction} active
                            </span>
                        </div>

                        {totalInProduction === 0 ? (
                            <p className="text-sm text-gray-500">
                                No orders currently in production.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {productionStages.map((stage) => (
                                    <li key={stage.key}>
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium text-gray-700">
                                                {stage.label}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {stage.count}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${(stage.count / maxStageCount) * 100}%`,
                                                    backgroundColor: '#3f301d',
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {production.stale?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-2">
                                    ⚠ Stuck 14+ days
                                </p>
                                <ul className="space-y-1.5">
                                    {production.stale.slice(0, 3).map((o) => (
                                        <li
                                            key={o.id}
                                            className="flex justify-between text-xs"
                                        >
                                            <Link
                                                href={route('manager.orders.show', o.id)}
                                                className="text-gray-700 hover:text-[#6B5A3E] truncate"
                                            >
                                                #{o.order_number}
                                            </Link>
                                            <span className="text-amber-600 font-medium whitespace-nowrap ml-2">
                                                {o.days_in_stage}d
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── PROCUREMENT + RECEIPTS ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Procurement overview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-4 w-4 text-[#6F4E37]" />
                            Procurement Overview
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href={route('manager.procurement.review.index')}
                                className="rounded-lg bg-gray-50 p-3 hover:bg-[#F5EDE8] transition-colors"
                            >
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                    Pending Review
                                </p>
                                <p className="mt-1 text-xl font-bold text-amber-600">
                                    {procurement.requestsPendingReview}
                                </p>
                            </Link>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                    Approved Requests
                                </p>
                                <p className="mt-1 text-xl font-bold text-emerald-600">
                                    {procurement.requestsApproved}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                    POs Waiting Delivery
                                </p>
                                <p className="mt-1 text-xl font-bold text-blue-600">
                                    {procurement.posWaitingDelivery}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                    Missing Cost
                                </p>
                                <p className="mt-1 text-xl font-bold text-purple-600">
                                    {procurement.posMissingCost}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Receipts awaiting confirmation */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                Receipts Awaiting Confirmation
                            </h3>
                            <Link
                                href={route('manager.procurement.confirm.index')}
                                className="text-xs font-medium text-[#6B5A3E] hover:underline inline-flex items-center gap-1"
                            >
                                View all <ArrowRightIcon className="h-3 w-3" />
                            </Link>
                        </div>

                        {receipts.pendingList.length === 0 ? (
                            <div className="p-6 flex items-center gap-2 text-sm text-emerald-700">
                                <CheckCircleIcon className="h-5 w-5" />
                                Nothing waiting for confirmation.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {receipts.pendingList.map((gr) => (
                                    <li
                                        key={gr.id}
                                        className="px-6 py-3 hover:bg-gray-50/40"
                                    >
                                        <Link
                                            href={route(
                                                'manager.procurement.confirm.show',
                                                gr.id
                                            )}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {gr.gr_number}
                                                    </span>
                                                    {gr.is_replacement && (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                                            REPLACEMENT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">
                                                    PO {gr.po_number} ·{' '}
                                                    {gr.supplier || 'No supplier'} · by{' '}
                                                    {gr.received_by || 'N/A'}
                                                </p>
                                            </div>
                                            <ArrowRightIcon className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ─── DELIVERIES + DRIVERS ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Delivery stats */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TruckIcon className="h-4 w-4 text-[#6F4E37]" />
                            Deliveries
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending / Assigned</span>
                                <span className="text-sm font-bold text-amber-600">
                                    {deliveries.pending}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">In Transit</span>
                                <span className="text-sm font-bold text-indigo-600">
                                    {deliveries.inTransit}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Failed</span>
                                <span className="text-sm font-bold text-rose-600">
                                    {deliveries.failed}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Driver workload */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                            Driver Workload
                        </h3>
                        {deliveries.driverWorkload.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No drivers registered.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {deliveries.driverWorkload.map((d) => (
                                    <li key={d.id}>
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium text-gray-700">
                                                {d.name}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {d.active_deliveries_count} active
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#3f301d] rounded-full transition-all"
                                                style={{
                                                    width: `${
                                                        (d.active_deliveries_count /
                                                            maxDriverLoad) *
                                                        100
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ─── FINANCE + INVENTORY ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Financial summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <WalletIcon className="h-4 w-4 text-[#6F4E37]" />
                            Finance (This Month)
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Revenue
                                </p>
                                <p className="text-lg font-bold text-emerald-700">
                                    {formatPrice(finance.revenueThisMonth)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Expenses
                                </p>
                                <p className="text-lg font-bold text-rose-700">
                                    {formatPrice(finance.expensesThisMonth)}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Net Profit
                                </p>
                                <p
                                    className={`text-xl font-bold ${
                                        finance.netThisMonth >= 0
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                    }`}
                                >
                                    {formatPrice(finance.netThisMonth)}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                    Outstanding Balance
                                </p>
                                <p className="text-sm font-semibold text-amber-700">
                                    {formatPrice(finance.outstandingBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Low stock materials */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <CubeIcon className="h-4 w-4 text-[#6F4E37]" />
                                Low Stock Materials
                            </h3>
                            <span className="text-xs text-gray-500">
                                {inventory.lowStockCount} below reorder level
                            </span>
                        </div>

                        {inventory.lowStockMaterials.length === 0 ? (
                            <div className="p-6 flex items-center gap-2 text-sm text-emerald-700">
                                <CheckCircleIcon className="h-5 w-5" />
                                All materials are sufficiently stocked.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {inventory.lowStockMaterials.map((m) => {
                                    const pct =
                                        m.reorder_level > 0
                                            ? Math.min(
                                                  100,
                                                  (m.stock_quantity / m.reorder_level) * 100
                                              )
                                            : 0;
                                    const critical = m.stock_quantity <= 0;
                                    return (
                                        <li key={m.id} className="px-6 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {m.name}
                                                    </p>
                                                    {m.category && (
                                                        <p className="text-xs text-gray-400">
                                                            {m.category}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p
                                                        className={`text-sm font-semibold ${
                                                            critical
                                                                ? 'text-rose-600'
                                                                : 'text-amber-600'
                                                        }`}
                                                    >
                                                        {m.stock_quantity} {m.unit}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        reorder at {m.reorder_level}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        critical
                                                            ? 'bg-rose-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ─── TEAM SUMMARY ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                            <UsersIcon className="h-5 w-5" style={{ color: '#3f301d' }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customers
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                {team.customers}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                            <TruckIcon className="h-5 w-5" style={{ color: '#3f301d' }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Drivers
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                {team.drivers}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                            <UsersIcon className="h-5 w-5" style={{ color: '#3f301d' }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Managers
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                {team.managers}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── QUICK ACTIONS + RECENT ACTIVITY ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Quick Actions
                        </h3>
                        <div className="mt-4 space-y-2">
                            {[
                                {
                                    label: 'Review Material Requests',
                                    icon: ClipboardDocumentListIcon,
                                    route: 'manager.procurement.review.index',
                                },
                                {
                                    label: 'Confirm Goods Receipts',
                                    icon: DocumentTextIcon,
                                    route: 'manager.procurement.confirm.index',
                                },
                                {
                                    label: 'Financial Overview',
                                    icon: WalletIcon,
                                    route: 'manager.finance.index',
                                },
                                {
                                    label: 'View All Orders',
                                    icon: ShoppingBagIcon,
                                    route: 'manager.orders.index',
                                },
                            ].map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.label}
                                        href={route(action.route)}
                                        className="block w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#F5EDE8] transition-colors text-sm font-medium text-gray-700"
                                    >
                                        <span className="flex items-center">
                                            <Icon
                                                className="h-4 w-4 mr-2"
                                                style={{ color: '#3f301d' }}
                                            />
                                            {action.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent activity */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Recent Activity
                            </h3>
                        </div>
                        <div className="mt-4 space-y-2">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No recent activity.
                                </p>
                            ) : (
                                recentActivity.map((a, idx) => {
                                    const Icon =
                                        ACTIVITY_ICONS[a.icon] || ClockIcon;
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-[#F5EDE8] flex items-center justify-center flex-shrink-0">
                                                <Icon
                                                    className="h-4 w-4"
                                                    style={{ color: '#3f301d' }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-gray-700">
                                                    {a.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {timeAgo(a.time)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
