import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    PrinterIcon,
    ArrowLeftIcon,
    DocumentTextIcon,
    FunnelIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';

const fmtDateTime = (d) =>
    d
        ? new Date(d).toLocaleString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

const prettify = (s) =>
    s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

/* ─────────────── Small presentational helpers ─────────────── */

function Section({ title, subtitle, children, breakBefore = false }) {
    return (
        <section className={`mt-8 ${breakBefore ? 'print-break-before' : ''}`}>
            <div className="border-b-2 border-stone-300 pb-1.5 mb-3">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
                )}
            </div>
            {children}
        </section>
    );
}

function SummaryCard({ label, value, accent = 'text-stone-900', hint }) {
    return (
        <div className="border border-stone-200 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">
                {label}
            </p>
            <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
            {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
        </div>
    );
}

function MiniTable({ headers, rows, emptyText = 'No data', cellClass, footer }) {
    if (!rows || rows.length === 0) {
        return <p className="text-sm text-stone-500 italic py-2">{emptyText}</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border border-stone-200">
                <thead className="bg-stone-50">
                    <tr>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className={`px-3 py-2 text-xs font-semibold text-stone-600 uppercase tracking-wide border-b border-stone-200 ${
                                    i === 0 ? 'text-left' : 'text-right'
                                }`}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                    {rows.map((row, ri) => (
                        <tr key={ri}>
                            {row.map((cell, ci) => {
                                const extra = cellClass
                                    ? cellClass(cell, ri, ci)
                                    : '';
                                return (
                                    <td
                                        key={ci}
                                        className={`px-3 py-1.5 ${
                                            ci === 0 ? 'text-left' : 'text-right'
                                        } ${extra}`}
                                    >
                                        {cell}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                {footer && (
                    <tfoot className="bg-stone-50 border-t border-stone-200 font-semibold">
                        <tr>{footer}</tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

function StatusBadge({ status }) {
    const cls =
        status === 'completed' || status === 'delivered'
            ? 'bg-emerald-100 text-emerald-800'
            : status === 'cancelled' || status === 'failed'
            ? 'bg-rose-100 text-rose-800'
            : status === 'processing' || status === 'in_transit'
            ? 'bg-amber-100 text-amber-800'
            : status === 'pending' ||
              status === 'assigned' ||
              status === 'picked_up' ||
              status === 'shipped'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-stone-100 text-stone-700';
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}
        >
            {prettify(status)}
        </span>
    );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Printable({
    dateRange,
    generatedAt,
    orderStatusCounts,
    totalOrders,
    productionPipeline,
    deliveryStatusCounts,
    totalDeliveries,
    mrStatusCounts,
    poStatusCounts,
    materials,
    materialsByCategory,
    lowStockMaterials,
    outOfStockItems,
    totalMaterials,
    lowStockCount,
    outOfStockCount,
    stockMovements,
    attendanceByEmployee,
    totalAttendanceLogs,
    attendanceEmployees,
    recentOrders,
    recentDeliveries,
    userSummary,
}) {
    const [startDate, setStartDate] = useState(dateRange.start || '');
    const [endDate, setEndDate]     = useState(dateRange.end || '');
    const [isLoading, setIsLoading] = useState(false);

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(
            route('admin.reports.printable'),
            { start_date: startDate, end_date: endDate },
            {
                preserveScroll: true,
                onStart:  () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const resetFilter = () => {
        router.get(
            route('admin.reports.printable'),
            {},
            { preserveScroll: true }
        );
    };

    const handlePrint = () => window.print();

    const rangeText = `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}`;

    const totalProcurement =
        Object.values(mrStatusCounts).reduce((a, b) => a + b, 0) +
        Object.values(poStatusCounts).reduce((a, b) => a + b, 0);

    return (
        <AdminLayout>
            <Head title="Operations Report" />

            <style>{`
                @media print {
                    @page { margin: 12mm; size: A4; }
                    html, body { background: #fff !important; }
                    .no-print { display: none !important; }
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    body { position: relative; }
                    #printable-report {
                        position: absolute !important;
                        left: 0; top: 0; width: 100%;
                        margin: 0 !important; padding: 0 !important;
                        background: #fff !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        color: #000 !important;
                    }
                    .print-avoid-break { page-break-inside: avoid; }
                    .print-break-before { page-break-before: always; }
                    table { page-break-inside: auto; }
                    tr    { page-break-inside: avoid; }
                    thead { display: table-header-group; }
                }
            `}</style>

            <div className="space-y-6">
                {/* Toolbar (hidden on print) */}
                <div className="no-print bg-white rounded-xl shadow-sm border border-stone-100 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <Link
                                href={route('admin.reports.dashboard')}
                                className="inline-flex items-center text-sm text-stone-500 hover:text-[#6F4E37] mb-1"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                Back to Reports Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                                <DocumentTextIcon className="h-7 w-7 text-[#6F4E37]" />
                                Operations Report
                            </h1>
                            <p className="mt-1 text-sm text-stone-500">
                                Operational &amp; administrative records for
                                printing and filing.
                            </p>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm self-start lg:self-auto"
                        >
                            <PrinterIcon className="h-4 w-4 mr-2" />
                            Print Report
                        </button>
                    </div>

                    {/* Date filter */}
                    <form
                        onSubmit={applyFilter}
                        className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100"
                    >
                        <div>
                            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm disabled:opacity-60"
                            >
                                <FunnelIcon className="h-4 w-4 mr-1.5" />
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                <XMarkIcon className="h-4 w-4 mr-1.5" />
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {/* ═════════ PRINTABLE AREA ═════════ */}
                <div
                    id="printable-report"
                    className={`bg-white rounded-xl shadow-sm border border-stone-100 p-6 sm:p-10 text-stone-900 transition-opacity ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                >
                    {/* Header */}
                    <div className="border-b-2 border-stone-900 pb-4 mb-6 print-avoid-break">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Operations Report
                                </h1>
                                <p className="text-sm text-stone-600 mt-1">
                                    Reporting Period: {rangeText}
                                </p>
                            </div>
                            <div className="text-right text-xs text-stone-500 leading-relaxed">
                                <p>Generated: {fmtDateTime(generatedAt)}</p>
                                <p>Prepared by: Admin</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Operational Overview ── */}
                    <Section title="Operational Overview">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <SummaryCard
                                label="Total Orders"
                                value={totalOrders}
                                accent="text-[#6F4E37]"
                                hint="Placed in this period"
                            />
                            <SummaryCard
                                label="Total Deliveries"
                                value={totalDeliveries}
                                accent="text-blue-700"
                                hint="Dispatched in this period"
                            />
                            <SummaryCard
                                label="Procurement Records"
                                value={totalProcurement}
                                accent="text-stone-900"
                                hint="Material requests + POs"
                            />
                            <SummaryCard
                                label="Stock Alerts"
                                value={lowStockCount + outOfStockCount}
                                accent={
                                    outOfStockCount > 0
                                        ? 'text-rose-700'
                                        : lowStockCount > 0
                                        ? 'text-amber-700'
                                        : 'text-emerald-700'
                                }
                                hint={`${lowStockCount} low · ${outOfStockCount} out of stock`}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                            <SummaryCard
                                label="Customers"
                                value={userSummary.customers}
                            />
                            <SummaryCard
                                label="Employees"
                                value={userSummary.employees}
                            />
                            <SummaryCard
                                label="Drivers"
                                value={userSummary.drivers}
                            />
                            <SummaryCard
                                label="Suppliers"
                                value={userSummary.suppliers}
                            />
                            <SummaryCard
                                label="Active Products"
                                value={userSummary.active_products}
                                hint={`${userSummary.total_products} total`}
                            />
                            <SummaryCard
                                label="Active Materials"
                                value={totalMaterials}
                                hint="Being tracked"
                            />
                        </div>
                    </Section>

                    {/* ── Order Status ── */}
                    <Section title="Order Status Breakdown">
                        {totalOrders === 0 ? (
                            <p className="text-sm text-stone-500 italic">
                                No orders placed in this period.
                            </p>
                        ) : (
                            <MiniTable
                                headers={[
                                    'Status',
                                    'Count',
                                    '% of Orders',
                                ]}
                                rows={Object.entries(orderStatusCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([status, count]) => [
                                        prettify(status),
                                        count,
                                        `${(
                                            (count / totalOrders) *
                                            100
                                        ).toFixed(1)}%`,
                                    ])}
                                footer={[
                                    <td
                                        key="l"
                                        className="px-3 py-1.5 text-left"
                                    >
                                        Total
                                    </td>,
                                    <td
                                        key="c"
                                        className="px-3 py-1.5 text-right"
                                    >
                                        {totalOrders}
                                    </td>,
                                    <td
                                        key="p"
                                        className="px-3 py-1.5 text-right"
                                    >
                                        100.0%
                                    </td>,
                                ]}
                            />
                        )}
                    </Section>

                    {/* ── Production Pipeline ── */}
                    <Section
                        title="Production Pipeline"
                        subtitle="Orders currently in the processing stage, broken down by production stage."
                    >
                        {Object.keys(productionPipeline).length === 0 ? (
                            <p className="text-sm text-stone-500 italic">
                                No orders currently in production.
                            </p>
                        ) : (
                            <MiniTable
                                headers={['Production Stage', 'Orders']}
                                rows={[
                                    ['Carpentry / Assembly', productionPipeline.carpentry ?? 0],
                                    ['Sanding', productionPipeline.sanding ?? 0],
                                    ['Wood Filling / Prep', productionPipeline.wood_filling ?? 0],
                                    ['Varnishing / Finishing', productionPipeline.varnishing ?? 0],
                                    ['Completed', productionPipeline.completed ?? 0],
                                ].filter(([, n]) => n > 0)}
                                footer={[
                                    <td key="l" className="px-3 py-1.5 text-left">
                                        Total In Production
                                    </td>,
                                    <td key="c" className="px-3 py-1.5 text-right">
                                        {Object.values(productionPipeline).reduce(
                                            (a, b) => a + b,
                                            0
                                        )}
                                    </td>,
                                ]}
                            />
                        )}
                    </Section>

                    {/* ── Deliveries ── */}
                    <Section title="Delivery Status">
                        {totalDeliveries === 0 ? (
                            <p className="text-sm text-stone-500 italic">
                                No deliveries in this period.
                            </p>
                        ) : (
                            <MiniTable
                                headers={['Status', 'Count']}
                                rows={[
                                    ['Pending',    deliveryStatusCounts.pending    ?? 0],
                                    ['Assigned',   deliveryStatusCounts.assigned   ?? 0],
                                    ['Picked Up',  deliveryStatusCounts.picked_up  ?? 0],
                                    ['In Transit', deliveryStatusCounts.in_transit ?? 0],
                                    ['Delivered',  deliveryStatusCounts.delivered  ?? 0],
                                    ['Failed',     deliveryStatusCounts.failed     ?? 0],
                                ].filter(([, n]) => n > 0)}
                                footer={[
                                    <td key="l" className="px-3 py-1.5 text-left">
                                        Total Deliveries
                                    </td>,
                                    <td key="c" className="px-3 py-1.5 text-right">
                                        {totalDeliveries}
                                    </td>,
                                ]}
                            />
                        )}
                    </Section>

                    {/* ── Procurement ── */}
                    <Section
                        title="Procurement Status"
                        subtitle="Material requests and purchase orders tracked during this period."
                        breakBefore
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                                    Material Requests
                                </p>
                                <MiniTable
                                    headers={['Status', 'Count']}
                                    rows={Object.entries(mrStatusCounts).map(
                                        ([s, c]) => [prettify(s), c]
                                    )}
                                    emptyText="No material requests recorded"
                                    footer={[
                                        <td
                                            key="l"
                                            className="px-3 py-1.5 text-left"
                                        >
                                            Total
                                        </td>,
                                        <td
                                            key="c"
                                            className="px-3 py-1.5 text-right"
                                        >
                                            {Object.values(mrStatusCounts).reduce(
                                                (a, b) => a + b,
                                                0
                                            )}
                                        </td>,
                                    ]}
                                />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                                    Purchase Orders
                                </p>
                                <MiniTable
                                    headers={['Status', 'Count']}
                                    rows={Object.entries(poStatusCounts).map(
                                        ([s, c]) => [prettify(s), c]
                                    )}
                                    emptyText="No purchase orders recorded"
                                    footer={[
                                        <td
                                            key="l"
                                            className="px-3 py-1.5 text-left"
                                        >
                                            Total
                                        </td>,
                                        <td
                                            key="c"
                                            className="px-3 py-1.5 text-right"
                                        >
                                            {Object.values(poStatusCounts).reduce(
                                                (a, b) => a + b,
                                                0
                                            )}
                                        </td>,
                                    ]}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ── Inventory Summary ── */}
                    <Section
                        title="Inventory Status by Category"
                        subtitle="Active materials grouped by category, with stock alert counts."
                        breakBefore
                    >
                        <MiniTable
                            headers={[
                                'Category',
                                'Materials',
                                'Low Stock',
                                'Out of Stock',
                            ]}
                            rows={materialsByCategory.map((c) => [
                                c.category,
                                c.count,
                                c.low,
                                c.out,
                            ])}
                            emptyText="No active materials tracked."
                            cellClass={(cell, ri, ci) => {
                                if (ci === 2 && cell > 0) return 'text-amber-700 font-semibold';
                                if (ci === 3 && cell > 0) return 'text-rose-700 font-semibold';
                                if ((ci === 2 || ci === 3) && cell === 0) return 'text-stone-400';
                                return '';
                            }}
                            footer={[
                                <td key="l" className="px-3 py-1.5 text-left">
                                    Total
                                </td>,
                                <td key="a" className="px-3 py-1.5 text-right">
                                    {totalMaterials}
                                </td>,
                                <td key="b" className="px-3 py-1.5 text-right text-amber-700">
                                    {lowStockCount}
                                </td>,
                                <td key="c" className="px-3 py-1.5 text-right text-rose-700">
                                    {outOfStockCount}
                                </td>,
                            ]}
                        />
                    </Section>

                    {/* ── Low Stock Alert ── */}
                    <Section
                        title="Low Stock Alert"
                        subtitle="Materials at or below their reorder level."
                    >
                        {lowStockMaterials.length === 0 && outOfStockItems.length === 0 ? (
                            <p className="text-sm text-emerald-700 italic">
                                ✓ All materials are above their reorder levels.
                            </p>
                        ) : (
                            <MiniTable
                                headers={[
                                    'Material',
                                    'Category',
                                    'On Hand',
                                    'Reorder Level',
                                    'Status',
                                ]}
                                rows={[...outOfStockItems, ...lowStockMaterials].map(
                                    (m) => [
                                        m.name,
                                        m.category,
                                        `${m.stock_quantity} ${m.unit || ''}`.trim(),
                                        `${m.reorder_level} ${m.unit || ''}`.trim(),
                                        m.state === 'out' ? 'OUT OF STOCK' : 'LOW',
                                    ]
                                )}
                                cellClass={(cell, ri, ci) => {
                                    if (ci === 4) {
                                        return cell === 'OUT OF STOCK'
                                            ? 'text-rose-700 font-bold'
                                            : 'text-amber-700 font-semibold';
                                    }
                                    return '';
                                }}
                            />
                        )}
                    </Section>

                    {/* ── Attendance ── */}
                    <Section
                        title="Attendance Summary"
                        subtitle={`${totalAttendanceLogs} log${
                            totalAttendanceLogs === 1 ? '' : 's'
                        } recorded across ${attendanceEmployees} employee${
                            attendanceEmployees === 1 ? '' : 's'
                        }.`}
                        breakBefore
                    >
                        <MiniTable
                            headers={[
                                'Employee',
                                'Logs',
                                'First Entry',
                                'Last Entry',
                            ]}
                            rows={attendanceByEmployee.map((a) => [
                                a.name,
                                a.logs_count,
                                fmtDateTime(a.first_log),
                                fmtDateTime(a.last_log),
                            ])}
                            emptyText="No attendance logs recorded in this period."
                        />
                    </Section>

                    {/* ── Recent Orders ── */}
                    <Section
                        title="Recent Orders"
                        subtitle="Latest 30 orders in this period."
                        breakBefore
                    >
                        <MiniTable
                            headers={[
                                'Order #',
                                'Customer',
                                'Items',
                                'Status',
                                'Stage',
                                'Date',
                            ]}
                            rows={recentOrders.map((o) => [
                                o.order_number,
                                o.customer,
                                o.items_count,
                                prettify(o.status),
                                o.production_stage
                                    ? prettify(o.production_stage)
                                    : '—',
                                fmtDate(o.created_at),
                            ])}
                            emptyText="No orders in this period."
                        />
                    </Section>

                    {/* ── Recent Deliveries ── */}
                    <Section
                        title="Recent Deliveries"
                        subtitle="Latest 30 deliveries in this period."
                    >
                        <MiniTable
                            headers={[
                                'Order #',
                                'Driver',
                                'Zone',
                                'Status',
                                'Date',
                            ]}
                            rows={recentDeliveries.map((d) => [
                                d.order_number,
                                d.driver,
                                d.zone,
                                prettify(d.status),
                                fmtDate(d.created_at),
                            ])}
                            emptyText="No deliveries in this period."
                        />
                    </Section>

                    {/* ── Stock Movements ── */}
                    <Section
                        title="Recent Stock Movements"
                        subtitle="Latest 60 stock in/out transactions."
                        breakBefore
                    >
                        <MiniTable
                            headers={[
                                'Date',
                                'Material',
                                'Change',
                                'Reference',
                                'Recorded By',
                            ]}
                            rows={stockMovements.map((s) => [
                                fmtDateTime(s.created_at),
                                s.material,
                                `${
                                    s.quantity_change > 0 ? '+' : ''
                                }${s.quantity_change} ${s.unit || ''}`.trim(),
                                prettify(s.reference_type),
                                s.created_by,
                            ])}
                            cellClass={(cell, ri, ci) => {
                                if (ci === 2) {
                                    return stockMovements[ri].quantity_change > 0
                                        ? 'text-emerald-700 font-semibold'
                                        : 'text-rose-700 font-semibold';
                                }
                                return '';
                            }}
                            emptyText="No stock movements in this period."
                        />
                    </Section>

                    {/* ── Signature Block ── */}
                    <div className="mt-10 pt-6 border-t border-stone-300 print-avoid-break">
                        <div className="grid grid-cols-2 gap-10 text-sm">
                            <div>
                                <div className="border-b border-stone-400 h-12" />
                                <p className="mt-1 text-stone-500">
                                    Prepared by (Admin)
                                </p>
                            </div>
                            <div>
                                <div className="border-b border-stone-400 h-12" />
                                <p className="mt-1 text-stone-500">
                                    Received / Acknowledged by
                                </p>
                            </div>
                        </div>
                        <p className="mt-6 text-center text-xs text-stone-400">
                            System-generated operations report · Generated{' '}
                            {fmtDateTime(generatedAt)}
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}