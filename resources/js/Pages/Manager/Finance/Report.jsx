import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    PrinterIcon,
    ArrowLeftIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';

const PERIODS = [
    { value: 'week',  label: 'This Week'  },
    { value: 'month', label: 'This Month' },
    { value: 'year',  label: 'This Year'  },
    { value: 'all',   label: 'All Time'   },
];

function getPaymentMethodLabel(method) {
    switch (method) {
        case 'paymongo':
        case 'gcash':            return 'GCash / PayMongo';
        case 'cash':
        case 'cash_on_delivery': return 'Cash on Delivery';
        case 'paymaya':          return 'PayMaya';
        case 'card':             return 'Credit / Debit Card';
        default:
            return method
                ? method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : 'N/A';
    }
}

function getPaymentTypeLabel(type) {
    switch (type) {
        case 'down_payment':      return 'Down Payment';
        case 'full_payment':      return 'Full Payment';
        case 'remaining_balance': return 'Remaining Balance';
        default:
            return type
                ? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : 'Payment';
    }
}

/* ─────────────── Small presentational helpers ─────────────── */

function Section({ title, children, breakBefore = false }) {
    return (
        <section className={`mt-8 ${breakBefore ? 'print-break-before' : ''}`}>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b-2 border-stone-300 pb-1.5 mb-3">
                {title}
            </h2>
            {children}
        </section>
    );
}

function SummaryCard({ label, value, accent = 'text-stone-900', emphasized = false, hint }) {
    return (
        <div
            className={`border border-stone-200 rounded-lg p-3 ${
                emphasized ? 'bg-stone-50' : ''
            }`}
        >
            <p className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">
                {label}
            </p>
            <p className={`mt-1 text-lg font-bold ${accent}`}>{value}</p>
            {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
        </div>
    );
}

function PLRow({
    label,
    value,
    bold = false,
    highlight = false,
    negative = false,
    muted = false,
    small = false,
    accent = '',
}) {
    return (
        <tr className={highlight ? 'bg-stone-50' : ''}>
            <td
                className={`py-1.5 pr-4 ${bold ? 'font-bold' : ''} ${
                    muted ? 'text-stone-500' : ''
                } ${small ? 'text-xs' : ''}`}
            >
                {label}
            </td>
            <td
                className={`py-1.5 text-right tabular-nums ${
                    bold ? 'font-bold' : ''
                } ${negative ? 'text-rose-700' : ''} ${accent}`}
            >
                {value !== null && value !== undefined ? formatPrice(value) : ''}
            </td>
        </tr>
    );
}

function TableLabel({ children }) {
    return (
        <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
            {children}
        </p>
    );
}

function MiniTable({
    headers,
    rows,
    emptyText = 'No data',
    cellClass,
    footer,
}) {
    if (!rows || rows.length === 0) {
        return (
            <p className="text-sm text-stone-500 italic py-2">{emptyText}</p>
        );
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
                                        className={`px-3 py-1.5 tabular-nums ${
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
                    <tfoot className="bg-stone-50 border-t border-stone-200">
                        <tr>{footer}</tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Report({
    period,
    periodLabel,
    dateRange,
    generatedAt,
    sales,
    payments,
    outstanding,
    expenses,
    labor,
    profit,
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePeriodChange = (value) => {
        if (value === period || isLoading) return;
        router.get(
            route('manager.finance.report'),
            { period: value },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handlePrint = () => window.print();

    const rangeText =
        dateRange.start && dateRange.end
            ? `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}`
            : 'All time';

    const netProfitColor =
        profit.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700';
    const grossProfitColor =
        profit.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700';
    const marginColor =
        profit.profitMargin >= 0 ? 'text-emerald-700' : 'text-rose-700';

    return (
        <ManagerLayout>
            <Head title="Financial Report" />

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
                        left: 0; top: 0;
                        width: 100%;
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
                    .print-shadow-none { box-shadow: none !important; }
                }
            `}</style>

            <div className="space-y-6">
                {/* Toolbar (hidden on print) */}
                <div className="no-print bg-white rounded-xl shadow-sm border border-stone-100 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <Link
                                href={route('manager.finance.index')}
                                className="inline-flex items-center text-sm text-stone-500 hover:text-[#6F4E37] mb-1"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                Back to Finance Overview
                            </Link>
                            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                                <DocumentTextIcon className="h-7 w-7 text-[#6F4E37]" />
                                Financial Report
                            </h1>
                            <p className="mt-1 text-sm text-stone-500">
                                Printable statement for record-keeping and
                                review.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center rounded-lg bg-stone-100 p-1">
                                {PERIODS.map((p) => {
                                    const active = p.value === period;
                                    return (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() =>
                                                handlePeriodChange(p.value)
                                            }
                                            disabled={isLoading}
                                            className={[
                                                'px-3.5 py-1.5 text-sm font-medium rounded-md transition-all',
                                                active
                                                    ? 'bg-white text-[#6F4E37] shadow-sm'
                                                    : 'text-stone-600 hover:text-stone-900',
                                                isLoading
                                                    ? 'cursor-wait'
                                                    : '',
                                            ].join(' ')}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm"
                            >
                                <PrinterIcon className="h-4 w-4 mr-2" />
                                Print Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═════════ PRINTABLE AREA ═════════ */}
                <div
                    id="printable-report"
                    className={`bg-white rounded-xl shadow-sm border border-stone-100 p-6 sm:p-10 text-stone-900 transition-opacity ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                >
                    {/* Report header */}
                    <div className="border-b-2 border-stone-900 pb-4 mb-6 print-avoid-break">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Financial Report
                                </h1>
                                <p className="text-sm text-stone-600 mt-1">
                                    {periodLabel} · {rangeText}
                                </p>
                            </div>
                            <div className="text-right text-xs text-stone-500 leading-relaxed">
                                <p>
                                    Generated:{' '}
                                    {new Date(generatedAt).toLocaleString(
                                        'en-PH',
                                        {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }
                                    )}
                                </p>
                                <p>Prepared by: Manager</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Executive summary ── */}
                    <Section title="Executive Summary">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <SummaryCard
                                label="Total Sales"
                                value={formatPrice(sales.totalSales)}
                                accent="text-[#6F4E37]"
                                hint={`${sales.completedCount} completed order${
                                    sales.completedCount === 1 ? '' : 's'
                                }`}
                            />
                            <SummaryCard
                                label="Payments Received"
                                value={formatPrice(payments.totalReceived)}
                                accent="text-emerald-700"
                                hint={`${payments.count} payment${
                                    payments.count === 1 ? '' : 's'
                                }`}
                            />
                            <SummaryCard
                                label="Total Expenses"
                                value={formatPrice(expenses.total)}
                                accent="text-rose-700"
                                hint={`${expenses.count} entr${
                                    expenses.count === 1 ? 'y' : 'ies'
                                }`}
                            />
                            <SummaryCard
                                label="Total Labor"
                                value={formatPrice(labor.total)}
                                accent="text-orange-700"
                                hint={`${labor.itemCount} item${
                                    labor.itemCount === 1 ? '' : 's'
                                }`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <SummaryCard
                                label="Gross Profit"
                                value={formatPrice(profit.grossProfit)}
                                accent={grossProfitColor}
                                hint="Sales − Materials − Labor"
                            />
                            <SummaryCard
                                label="Net Profit"
                                value={formatPrice(profit.netProfit)}
                                accent={netProfitColor}
                                emphasized
                                hint="Sales − Expenses − Labor"
                            />
                            <SummaryCard
                                label="Profit Margin"
                                value={`${profit.profitMargin.toFixed(2)}%`}
                                accent={marginColor}
                                hint="Net ÷ Sales"
                            />
                        </div>
                    </Section>

                    {/* ── Profit & Loss ── */}
                    <Section title="Profit & Loss Statement">
                        <table className="w-full text-sm">
                            <tbody>
                                <PLRow
                                    label="Revenue — Completed Sales"
                                    value={sales.totalSales}
                                    bold
                                />
                                <PLRow
                                    label={`   Completed Orders (${sales.completedCount})`}
                                    value={null}
                                    muted
                                    small
                                />
                                <PLRow
                                    label="   Average Order Value"
                                    value={sales.avgOrderValue}
                                    muted
                                    small
                                />

                                <PLRow
                                    label="Less: Material & Purchase Expenses"
                                    value={-expenses.materialsTotal}
                                    negative
                                />
                                <PLRow
                                    label="Less: Labor Costs"
                                    value={-labor.total}
                                    negative
                                />

                                <PLRow
                                    label="Gross Profit"
                                    value={profit.grossProfit}
                                    bold
                                    highlight
                                    accent={grossProfitColor}
                                />

                                <PLRow
                                    label="Less: Operating Expenses"
                                    value={-expenses.otherTotal}
                                    negative
                                />

                                <PLRow
                                    label="Net Profit"
                                    value={profit.netProfit}
                                    bold
                                    highlight
                                    accent={netProfitColor}
                                />
                            </tbody>
                        </table>
                    </Section>

                    {/* ── Payments received ── */}
                    <Section title="Payments Received">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <TableLabel>By Payment Method</TableLabel>
                                <MiniTable
                                    headers={['Method', 'Count', 'Amount']}
                                    rows={payments.byMethod.map((r) => [
                                        getPaymentMethodLabel(r.method),
                                        r.count,
                                        formatPrice(r.total),
                                    ])}
                                    emptyText="No payments recorded"
                                />
                            </div>
                            <div>
                                <TableLabel>By Payment Type</TableLabel>
                                <MiniTable
                                    headers={['Type', 'Count', 'Amount']}
                                    rows={payments.byType.map((r) => [
                                        getPaymentTypeLabel(r.type),
                                        r.count,
                                        formatPrice(r.total),
                                    ])}
                                    emptyText="No payments recorded"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end text-sm font-semibold text-stone-900 border-t border-stone-300 pt-2">
                            <span className="mr-4">Total Received:</span>
                            <span className="text-emerald-700 tabular-nums">
                                {formatPrice(payments.totalReceived)}
                            </span>
                        </div>
                    </Section>

                    {/* ── Expenses breakdown ── */}
                    <Section title="Expenses Breakdown">
                        <MiniTable
                            headers={[
                                'Category',
                                'Count',
                                'Amount',
                                '% of Total',
                            ]}
                            rows={expenses.byCategory.map((r) => [
                                r.category
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                                r.count,
                                formatPrice(r.total),
                                expenses.total > 0
                                    ? `${(
                                          (r.total / expenses.total) *
                                          100
                                      ).toFixed(1)}%`
                                    : '0%',
                            ])}
                            emptyText="No expenses recorded for this period."
                        />
                        <div className="flex justify-between text-sm font-semibold text-stone-900 border-t border-stone-300 mt-2 pt-2">
                            <span>Total Expenses</span>
                            <span className="text-rose-700 tabular-nums">
                                {formatPrice(expenses.total)}
                            </span>
                        </div>
                    </Section>

                    {/* ── Labor cost breakdown ── */}
                    <Section title="Labor Cost Breakdown">
                        {labor.byProduct.length === 0 ? (
                            <p className="text-sm text-stone-500 italic">
                                No labor costs recorded.
                            </p>
                        ) : (
                            <>
                                <MiniTable
                                    headers={[
                                        'Product',
                                        'Orders',
                                        'Estimated',
                                        'Actual Avg',
                                        'Actual Total',
                                        'Variance',
                                    ]}
                                    rows={labor.byProduct.map((r) => [
                                        r.product_name,
                                        r.orders_count,
                                        formatPrice(r.estimated_labor),
                                        formatPrice(r.actual_avg),
                                        formatPrice(r.actual_total),
                                        `${
                                            r.variance > 0 ? '+' : ''
                                        }${formatPrice(r.variance)}`,
                                    ])}
                                    cellClass={(cell, ri, ci) => {
                                        if (ci !== 5) return '';
                                        const v = labor.byProduct[ri].variance;
                                        if (v > 0)
                                            return 'text-rose-700 font-semibold';
                                        if (v < 0)
                                            return 'text-emerald-700 font-semibold';
                                        return 'text-stone-500';
                                    }}
                                />
                                <div className="flex justify-between text-sm font-semibold text-stone-900 border-t border-stone-300 mt-2 pt-2">
                                    <span>
                                        Total Labor Cost ({labor.itemCount}{' '}
                                        items)
                                    </span>
                                    <span className="text-orange-700 tabular-nums">
                                        {formatPrice(labor.total)}
                                    </span>
                                </div>
                            </>
                        )}
                    </Section>

                    {/* ── Outstanding balances ── */}
                    <Section
                        title="Outstanding Balances"
                        breakBefore
                    >
                        {outstanding.orders.length === 0 ? (
                            <p className="text-sm text-stone-500 italic">
                                No outstanding balances — all orders settled
                                for this period.
                            </p>
                        ) : (
                            <>
                                <MiniTable
                                    headers={[
                                        'Order #',
                                        'Customer',
                                        'Date',
                                        'Total',
                                        'Paid',
                                        'Remaining',
                                    ]}
                                    rows={outstanding.orders.map((o) => [
                                        o.order_number,
                                        o.customer,
                                        fmtDate(o.created_at),
                                        formatPrice(o.total),
                                        formatPrice(o.paid),
                                        formatPrice(o.remaining),
                                    ])}
                                    cellClass={(cell, ri, ci) =>
                                        ci === 5
                                            ? 'text-amber-700 font-semibold'
                                            : ''
                                    }
                                />
                                <div className="flex justify-between text-sm font-semibold text-stone-900 border-t border-stone-300 mt-2 pt-2">
                                    <span>
                                        Total Outstanding ({outstanding.count}{' '}
                                        order
                                        {outstanding.count === 1 ? '' : 's'})
                                    </span>
                                    <span className="text-amber-700 tabular-nums">
                                        {formatPrice(outstanding.total)}
                                    </span>
                                </div>
                            </>
                        )}
                    </Section>

                    {/* ── Signature block ── */}
                    <div className="mt-10 pt-6 border-t border-stone-300 print-avoid-break">
                        <div className="grid grid-cols-2 gap-10 text-sm">
                            <div>
                                <div className="border-b border-stone-400 h-12" />
                                <p className="mt-1 text-stone-500">
                                    Prepared by (Manager)
                                </p>
                            </div>
                            <div>
                                <div className="border-b border-stone-400 h-12" />
                                <p className="mt-1 text-stone-500">
                                    Reviewed / Approved by
                                </p>
                            </div>
                        </div>
                        <p className="mt-6 text-center text-xs text-stone-400">
                            This is a system-generated financial report. ·
                            Generated{' '}
                            {new Date(generatedAt).toLocaleString('en-PH')}
                        </p>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
