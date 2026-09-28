import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    CubeIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    UserCircleIcon,
    SparklesIcon,
    ShoppingBagIcon,
    WrenchScrewdriverIcon,
    ClipboardDocumentListIcon,
    UserGroupIcon,
    BeakerIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowRightIcon,
    BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

/* ─── Helpers ─── */
const STATUS_STYLES = {
    pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
    accepted:   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
    processing: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
    shipped:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400'    },
    delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    cancelled:  { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
    failed:     { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
    assigned:   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
    picked_up:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
    in_transit: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
    default:    { bg: 'bg-stone-100',  text: 'text-stone-700',   dot: 'bg-stone-400'   },
};

const prettyLabel = (s) =>
    String(s || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.default;

const timeAgo = (iso) => {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)   return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

export default function Dashboard({
    stats = {},
    orderStatusCounts = {},
    deliveryStatusCounts = {},
    poStatusCounts = {},
    mrStatusCounts = {},
    productionPipeline = {},
    lowStockMaterials = [],
    recentOrders = [],
    recentMaterialRequests = [],
}) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';

    /* ─── Primary KPI cards ─── */
    const kpiCards = [
        {
            title: 'Pending Orders',
            value: stats.pendingOrders ?? 0,
            subtitle: `${stats.processingOrders ?? 0} in production`,
            icon: ClockIcon,
            accent: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            title: 'Orders In Production',
            value: stats.processingOrders ?? 0,
            subtitle: `${stats.shippedOrders ?? 0} ready to ship`,
            icon: WrenchScrewdriverIcon,
            accent: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            title: 'Low Stock Materials',
            value: stats.lowStockCount ?? 0,
            subtitle: `${stats.outOfStockCount ?? 0} out of stock`,
            icon: ExclamationTriangleIcon,
            accent: 'text-rose-600',
            bg: 'bg-rose-50',
        },
        {
            title: 'Pending Deliveries',
            value: stats.pendingDeliveries ?? 0,
            subtitle: `${stats.inTransitDeliveries ?? 0} in transit`,
            icon: TruckIcon,
            accent: 'text-cyan-600',
            bg: 'bg-cyan-50',
        },
    ];

    /* ─── Secondary quick stats ─── */
    const quickStats = [
        {
            label: 'Total Orders',
            value: stats.totalOrders ?? 0,
            icon: ShoppingBagIcon,
            accent: 'text-stone-700',
        },
        {
            label: 'Products',
            value: `${stats.activeProducts ?? 0} / ${stats.totalProducts ?? 0}`,
            hint: 'active / total',
            icon: CubeIcon,
            accent: 'text-emerald-700',
        },
        {
            label: 'Materials',
            value: `${stats.activeMaterials ?? 0} / ${stats.totalMaterials ?? 0}`,
            hint: 'active / total',
            icon: BeakerIcon,
            accent: 'text-[#6F4E37]',
        },
        {
            label: 'Customers',
            value: stats.totalCustomers ?? 0,
            icon: UserGroupIcon,
            accent: 'text-blue-700',
        },
        {
            label: 'Drivers',
            value: stats.totalDrivers ?? 0,
            icon: TruckIcon,
            accent: 'text-cyan-700',
        },
        {
            label: 'Suppliers',
            value: stats.totalSuppliers ?? 0,
            icon: BuildingStorefrontIcon,
            accent: 'text-purple-700',
        },
    ];

    /* ─── Order status breakdown (non-financial) ─── */
    const orderBreakdown = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled']
        .map((status) => ({
            status,
            label: prettyLabel(status),
            count: orderStatusCounts[status] ?? 0,
            style: statusStyle(status),
        }))
        .filter((s) => s.count > 0 || ['pending', 'processing', 'shipped', 'delivered'].includes(s.status));

    const maxOrderCount = Math.max(1, ...orderBreakdown.map((s) => s.count));

    /* ─── Production pipeline ─── */
    const productionStages = [
        { key: 'carpentry',    label: 'Carpentry / Assembly'    },
        { key: 'sanding',      label: 'Sanding'                  },
        { key: 'wood_filling', label: 'Wood Filling / Prep'      },
        { key: 'varnishing',   label: 'Varnishing / Finishing'   },
    ].map((s) => ({
        ...s,
        count: productionPipeline[s.key] ?? 0,
    }));

    const totalInProduction = productionStages.reduce((sum, s) => sum + s.count, 0);
    const maxStageCount = Math.max(1, ...productionStages.map((s) => s.count));

    /* ─── Procurement snapshot ─── */
    const procurementItems = [
        {
            label: 'Pending Material Requests',
            value: stats.pendingMaterialRequests ?? 0,
            route: 'admin.material-requests.index',
            icon: ClipboardDocumentListIcon,
            accent: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            label: 'Pending Purchase Orders',
            value: stats.pendingPurchaseOrders ?? 0,
            route: 'admin.purchase-orders.index',
            icon: ClipboardDocumentListIcon,
            accent: 'text-blue-600',
            bg: 'bg-blue-50',
        },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            {/* ─── Coffee Brown Greeting ─── */}
            <div className="mb-8 rounded-xl bg-[#6F4E37] border border-[#5A3E2B] shadow-lg overflow-hidden">
                <div className="px-6 py-6 sm:px-8 sm:py-8">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-[#5A3E2B] flex items-center justify-center text-white text-lg font-medium ring-2 ring-[#8B6B4F]">
                                {user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {timeGreeting}, {user?.name || 'Admin'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-200">
                                Here's a live snapshot of store operations — orders, inventory, production, and deliveries.
                            </p>
                            <div className="mt-2 flex items-center space-x-2 text-xs text-gray-300">
                                <UserCircleIcon className="h-4 w-4" />
                                <span>{user?.role?.name || 'Administrator'}</span>
                            </div>
                        </div>
                        <div className="hidden sm:block flex-shrink-0">
                            <div className="h-16 w-16 rounded-full bg-[#5A3E2B]/50 flex items-center justify-center">
                                <SparklesIcon className="h-6 w-6 text-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Primary KPI Cards ─── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="px-5 py-5 flex items-start gap-4">
                                <div className={`flex-shrink-0 rounded-lg ${card.bg} p-3`}>
                                    <Icon className={`h-6 w-6 ${card.accent}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 truncate">
                                        {card.title}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {card.value}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {card.subtitle}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Quick Stats Row ─── */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickStats.map((q) => {
                    const Icon = q.icon;
                    return (
                        <div
                            key={q.label}
                            className="bg-white rounded-xl shadow-sm border border-gray-100/50 px-4 py-3"
                        >
                            <div className="flex items-center gap-2 text-gray-500">
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-medium truncate">{q.label}</span>
                            </div>
                            <p className={`mt-1 text-lg font-bold ${q.accent}`}>{q.value}</p>
                            {q.hint && <p className="text-[10px] text-gray-400">{q.hint}</p>}
                        </div>
                    );
                })}
            </div>

            {/* ─── Order Status + Production Pipeline ─── */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Order breakdown */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900">
                            Order Status Overview
                        </h3>
                        <Link
                            href={route('admin.orders.index')}
                            className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] inline-flex items-center gap-1"
                        >
                            View all <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    </div>

                    {orderBreakdown.length === 0 ? (
                        <p className="text-sm text-gray-500">No orders yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {orderBreakdown.map((s) => (
                                <li key={s.status}>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${s.style.dot}`} />
                                            <span className="font-medium text-gray-700">
                                                {s.label}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            {s.count}
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${s.style.dot} rounded-full transition-all`}
                                            style={{ width: `${(s.count / maxOrderCount) * 100}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Production pipeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900">
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
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 capitalize">
                                            {stage.label}
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            {stage.count}
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#6F4E37] rounded-full transition-all"
                                            style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {stats.shippedOrders > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircleIcon className="h-4 w-4 text-cyan-600" />
                                <span className="text-gray-700">
                                    <strong>{stats.shippedOrders}</strong> ready to ship
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Low Stock + Recent Orders ─── */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Low stock materials */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-rose-500" />
                            <h3 className="text-base font-semibold text-gray-900">
                                Low Stock Alerts
                            </h3>
                        </div>
                        <Link
                            href={route('admin.materials.index')}
                            className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] inline-flex items-center gap-1"
                        >
                            Manage <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    </div>

                    {lowStockMaterials.length === 0 ? (
                        <div className="p-5 flex items-center gap-2 text-sm text-emerald-700">
                            <CheckCircleIcon className="h-5 w-5" />
                            All materials are above their reorder levels.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {lowStockMaterials.map((m) => {
                                const pct = m.reorder_level > 0
                                    ? Math.min(100, (m.stock_quantity / m.reorder_level) * 100)
                                    : 0;
                                const critical = m.stock_quantity <= 0;
                                return (
                                    <li key={m.id} className="px-5 py-3">
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
                                                        critical ? 'text-rose-600' : 'text-amber-600'
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
                                                    critical ? 'bg-rose-500' : 'bg-amber-500'
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

                {/* Recent orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                            <h3 className="text-base font-semibold text-gray-900">
                                Recent Orders
                            </h3>
                        </div>
                        <Link
                            href={route('admin.orders.index')}
                            className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] inline-flex items-center gap-1"
                        >
                            View all <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <p className="p-5 text-sm text-gray-500">No orders yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {recentOrders.map((o) => {
                                const st = statusStyle(o.status);
                                return (
                                    <li key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link
                                                href={route('admin.orders.show', o.id)}
                                                className="text-sm font-medium text-gray-900 hover:text-[#6F4E37] transition-colors"
                                            >
                                                #{o.order_number}
                                            </Link>
                                            <p className="text-xs text-gray-500 truncate">
                                                {o.customer} · {o.items_count} item
                                                {o.items_count === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${st.bg} ${st.text}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                {prettyLabel(o.status)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {timeAgo(o.created_at)}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ─── Procurement Snapshot + Material Request Queue ─── */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Procurement summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Procurement
                    </h3>
                    <div className="space-y-3">
                        {procurementItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={route(item.route)}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center`}>
                                            <Icon className={`h-5 w-5 ${item.accent}`} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {item.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${item.accent}`}>
                                            {item.value}
                                        </span>
                                        <ArrowRightIcon className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Purchase Order status breakdown */}
                    {Object.keys(poStatusCounts).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Purchase Orders
                            </p>
                            <ul className="space-y-1.5">
                                {Object.entries(poStatusCounts).map(([status, count]) => (
                                    <li
                                        key={status}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <span className="text-gray-600 capitalize">
                                            {prettyLabel(status)}
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            {count}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Material request queue */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-amber-500" />
                            <h3 className="text-base font-semibold text-gray-900">
                                Awaiting Review
                            </h3>
                        </div>
                        <Link
                            href={route('admin.material-requests.index')}
                            className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] inline-flex items-center gap-1"
                        >
                            View all <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    </div>

                    {recentMaterialRequests.length === 0 ? (
                        <div className="p-5 flex items-center gap-2 text-sm text-emerald-700">
                            <CheckCircleIcon className="h-5 w-5" />
                            No material requests waiting for review.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {recentMaterialRequests.map((r) => {
                                const st = statusStyle(r.status);
                                return (
                                    <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('admin.material-requests.show', r.id)}
                                                    className="text-sm font-medium text-gray-900 hover:text-[#6F4E37] transition-colors"
                                                >
                                                    {r.request_no}
                                                </Link>
                                                {r.type === 'replacement' && (
                                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                                                        REPLACEMENT
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                by {r.requester} · {timeAgo(r.created_at)}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${st.bg} ${st.text} whitespace-nowrap`}
                                        >
                                            {prettyLabel(r.status)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ─── System Health ─── */}
            <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3">System Health</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        {(stats.lowStockCount ?? 0) === 0 ? (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="text-sm text-gray-600">
                            Inventory: {(stats.lowStockCount ?? 0) === 0
                                ? 'healthy'
                                : `${stats.lowStockCount} item${stats.lowStockCount === 1 ? '' : 's'} below reorder`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {(stats.pendingDeliveries ?? 0) === 0 ? (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <ClockIcon className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="text-sm text-gray-600">
                            Deliveries: {(stats.pendingDeliveries ?? 0) === 0
                                ? 'all assigned'
                                : `${stats.pendingDeliveries} awaiting dispatch`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {(stats.cancelledOrders ?? 0) === 0 ? (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <XCircleIcon className="h-5 w-5 text-rose-500" />
                        )}
                        <span className="text-sm text-gray-600">
                            Orders: {(stats.cancelledOrders ?? 0) === 0
                                ? 'no cancellations'
                                : `${stats.cancelledOrders} cancelled`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-xs text-gray-400 text-center">
                Last updated: {new Date().toLocaleString()}
            </div>
        </AdminLayout>
    );
}
