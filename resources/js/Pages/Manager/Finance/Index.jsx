import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    WalletIcon,
    CreditCardIcon,
    ReceiptPercentIcon,
    ClockIcon,
    WrenchScrewdriverIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) => `₱${Number(v || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
});

const PERIODS = [
    { value: 'week',  label: 'This Week'  },
    { value: 'month', label: 'This Month' },
    { value: 'year',  label: 'This Year'  },
    { value: 'all',   label: 'All Time'   },
];

const PERIOD_LABELS = {
    week:  'this week',
    month: 'this month',
    year:  'this year',
    all:   'all time',
};

const TREND_TITLES = {
    week:  'Income vs Costs (This Week)',
    month: 'Income vs Costs (This Month)',
    year:  'Income vs Costs (This Year)',
    all:   'Income vs Costs (Last 6 Months)',
};

const RECENT_TITLES = {
    week:  'Recent Expenses (This Week)',
    month: 'Recent Expenses (This Month)',
    year:  'Recent Expenses (This Year)',
    all:   'Recent Expenses (All Time)',
};

export default function Index({
    period = 'month',
    summary,
    expensesByCategory,
    laborByProduct = [],
    monthlyTrend,
    recentExpenses,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const periodLabel = PERIOD_LABELS[period] ?? '';

    const handlePeriodChange = (value) => {
        if (value === period || isLoading) return;
        router.get(
            route('manager.finance.index'),
            { period: value },
            {
                preserveState:  true,
                preserveScroll: true,
                replace:        true,
                onStart:  () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const headlineCards = [
        {
            label: 'Current Balance',
            value: summary.currentBalance,
            icon: WalletIcon,
            color: summary.currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600',
            bg:    summary.currentBalance >= 0 ? 'bg-emerald-50'    : 'bg-rose-50',
            hint:  'Cash on hand (all time)',
        },
        {
            label: 'Net Profit',
            value: summary.netProfit,
            icon: ArrowTrendingUpIcon,
            color: summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
            bg:    summary.netProfit >= 0 ? 'bg-emerald-50'    : 'bg-rose-50',
            hint:  `Sales − Expenses − Labor (${periodLabel})`,
        },
        {
            label: 'Total Sales',
            value: summary.totalSales,
            icon: ReceiptPercentIcon,
            color: 'text-[#6F4E37]',
            bg:    'bg-stone-50',
            hint:  `Completed orders (${periodLabel})`,
        },
        {
            label: 'Total Expenses',
            value: summary.totalExpenses,
            icon: ArrowTrendingDownIcon,
            color: 'text-rose-600',
            bg:    'bg-rose-50',
            hint:  `Recorded expenses (${periodLabel})`,
        },
    ];

    const moneyInOut = [
        {
            label: 'Payments Received',
            value: summary.totalReceived,
            icon:  BanknotesIcon,
            color: 'text-emerald-600',
        },
        {
            label: 'GCash / PayMongo',
            value: summary.gcashPayments,
            icon:  CreditCardIcon,
            color: 'text-blue-600',
        },
        {
            label: 'Cash',
            value: summary.cashPayments,
            icon:  BanknotesIcon,
            color: 'text-amber-600',
        },
        {
            label: 'Outstanding Balances',
            value: summary.remainingPayments,
            icon:  ClockIcon,
            color: 'text-orange-600',
        },
    ];

    const maxTrend = Math.max(
        ...monthlyTrend.map((m) => Math.max(m.income, m.expense, m.labor || 0)),
        1
    );

    return (
        <ManagerLayout>
            <Head title="Financial Overview" />

            <div className="space-y-6">
                {/* Header + Period Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                                <BanknotesIcon className="h-7 w-7 text-[#6F4E37]" />
                                Financial Overview
                            </h1>
                            <p className="mt-1 text-sm text-stone-500">
                                Monitor cash flow, sales, expenses, labor, and profit at a glance.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                            <div className="inline-flex items-center rounded-lg bg-stone-100 p-1">
                                {PERIODS.map((p) => {
                                    const active = p.value === period;
                                    return (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => handlePeriodChange(p.value)}
                                            disabled={isLoading}
                                            className={[
                                                'px-3.5 py-1.5 text-sm font-medium rounded-md transition-all',
                                                active
                                                    ? 'bg-white text-[#6F4E37] shadow-sm'
                                                    : 'text-stone-600 hover:text-stone-900',
                                                isLoading && !active ? 'opacity-60' : '',
                                                isLoading ? 'cursor-wait' : '',
                                            ].join(' ')}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <Link
                                href={route('manager.finance.report', { period })}
                                className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm"
                            >
                                <DocumentTextIcon className="h-4 w-4 mr-2" />
                                View Financial Report
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={`space-y-6 transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {/* Headline Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {headlineCards.map((card) => (
                            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                                            {card.label}
                                        </p>
                                        <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                                            {formatPrice(card.value)}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-1">{card.hint}</p>
                                    </div>
                                    <div className={`h-11 w-11 rounded-full ${card.bg} flex items-center justify-center`}>
                                        <card.icon className={`h-6 w-6 ${card.color}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* LABOR COST CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
                                    Labor Cost ({periodLabel})
                                </p>
                                <p className="mt-2 text-3xl font-bold text-orange-700">
                                    {formatPrice(summary.totalLaborCost)}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    From {summary.laborItemCount} completed production
                                    {summary.laborItemCount === 1 ? '' : 's'}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                                <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    {/* Money In / Out Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {moneyInOut.map((card) => (
                            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-full ${card.color.replace('text-', 'bg-').replace('-600', '-100')} flex items-center justify-center shrink-0`}>
                                    <card.icon className={`h-6 w-6 ${card.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-stone-500">{card.label}</p>
                                    <p className={`text-lg font-bold ${card.color} truncate`}>
                                        {formatPrice(card.value)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trend + Categories */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-stone-900">
                                    {TREND_TITLES[period] ?? 'Income vs Costs'}
                                </h2>
                                <div className="flex items-center gap-3 text-xs text-stone-500">
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> Income
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-rose-500" /> Expenses
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" /> Labor
                                    </span>
                                </div>
                            </div>
                           <div className="flex items-stretch justify-between gap-2 h-56">
                                {monthlyTrend.map((m) => (
                                    <div key={m.label} className="flex-1 flex flex-col items-center min-w-0">
                                        <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                                            <div className="w-1/3 bg-emerald-500 rounded-t transition-all"
                                                style={{ height: `${(m.income / maxTrend) * 100}%` }}
                                                title={`Income: ${formatPrice(m.income)}`} />
                                            <div className="w-1/3 bg-rose-500 rounded-t transition-all"
                                                style={{ height: `${(m.expense / maxTrend) * 100}%` }}
                                                title={`Expense: ${formatPrice(m.expense)}`} />
                                            <div className="w-1/3 bg-orange-500 rounded-t transition-all"
                                                style={{ height: `${((m.labor || 0) / maxTrend) * 100}%` }}
                                                title={`Labor: ${formatPrice(m.labor || 0)}`} />
                                        </div>
                                        <div className="mt-2 text-center truncate w-full">
                                            <p className="text-xs font-medium text-stone-700 truncate">{m.label}</p>
                                            <p className={`text-[10px] font-semibold ${m.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Net: {formatPrice(m.net)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                            <h2 className="text-lg font-semibold text-stone-900 mb-4">Expenses by Category</h2>
                            {expensesByCategory.length === 0 ? (
                                <p className="text-sm text-stone-500">No expenses recorded for this period.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {expensesByCategory.map((e) => {
                                        const pct = summary.totalExpenses > 0
                                            ? (e.total / summary.totalExpenses) * 100
                                            : 0;
                                        return (
                                            <li key={e.category}>
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-stone-700 capitalize">
                                                        {e.category.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-stone-600">{formatPrice(e.total)}</span>
                                                </div>
                                                <div className="mt-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#6F4E37] rounded-full transition-all"
                                                        style={{ width: `${pct}%` }} />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* LABOR VARIANCE TABLE */}
                    {laborByProduct.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-stone-100">
                                <h2 className="text-lg font-semibold text-stone-900">
                                    Labor Variance by Product
                                </h2>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Compares the estimated labor cost (product) to the actual labor cost per completed order.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-stone-100">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 uppercase">Product</th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">Orders</th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">Estimated</th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">Actual Avg</th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">Variance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {laborByProduct.map((row) => {
                                            const over = row.variance > 0;
                                            const under = row.variance < 0;
                                            return (
                                                <tr key={row.product_id} className="hover:bg-stone-50/40">
                                                    <td className="px-6 py-3 text-sm font-medium text-stone-800">
                                                        {row.product_name}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-stone-600 text-right">
                                                        {row.orders_count}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-stone-600 text-right">
                                                        {formatPrice(row.estimated_labor)}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-stone-600 text-right">
                                                        {formatPrice(row.actual_avg)}
                                                    </td>
                                                    <td className={`px-6 py-3 text-sm font-semibold text-right ${over ? 'text-rose-600' : under ? 'text-emerald-600' : 'text-stone-400'}`}>
                                                        {over ? '+' : ''}{formatPrice(row.variance)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Recent Expenses */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-100">
                            <h2 className="text-lg font-semibold text-stone-900">
                                {RECENT_TITLES[period] ?? 'Recent Expenses'}
                            </h2>
                        </div>
                        {recentExpenses.length === 0 ? (
                            <div className="p-6 text-sm text-stone-500">
                                No expenses recorded for this period.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-stone-100">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 uppercase">Date</th>
                                            <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 uppercase">Category</th>
                                            <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 uppercase">Description</th>
                                            <th className="px-6 py-2 text-right text-xs font-medium text-stone-500 uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {recentExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-stone-50/40">
                                                <td className="px-6 py-3 text-sm text-stone-600 whitespace-nowrap">
                                                    {fmtDate(exp.expense_date)}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-stone-700 capitalize whitespace-nowrap">
                                                    {exp.category.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-stone-500 truncate max-w-md">
                                                    {exp.description || '—'}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-semibold text-rose-600 text-right whitespace-nowrap">
                                                    −{formatPrice(exp.amount)}
                                                </td>
                                            </tr>
                                        ))}
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
