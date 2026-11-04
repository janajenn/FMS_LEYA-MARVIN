import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeftIcon,
    CubeIcon,
    ClockIcon,
    InformationCircleIcon,
    ChevronDownIcon,
    CalculatorIcon,
} from '@heroicons/react/24/outline';

export default function StockHistory({ material, history }) {
    const [showHelp, setShowHelp] = useState(true);

    // Calculate totals with proper numeric parsing
    const totalAdded = history
        .filter((entry) => parseFloat(entry.quantity_change) > 0)
        .reduce((sum, entry) => sum + parseFloat(entry.quantity_change), 0);

    const totalDeducted = history
        .filter((entry) => parseFloat(entry.quantity_change) < 0)
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
                                Track inventory movements for{' '}
                                <span className="font-medium text-gray-700">{material.name}</span>
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
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(material.stock_quantity)}
                            </p>
                            <p className="text-xs text-gray-400">{material.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Total Added</p>
                            <p className="text-2xl font-bold text-green-600">
                                +{formatNumber(totalAdded)}
                            </p>
                            <p className="text-xs text-gray-400">{material.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Total Deducted</p>
                            <p className="text-2xl font-bold text-red-600">
                                -{formatNumber(totalDeducted)}
                            </p>
                            <p className="text-xs text-gray-400">{material.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Last Activity</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {lastActivity
                                    ? new Date(lastActivity).toLocaleDateString()
                                    : '—'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {lastActivity
                                    ? new Date(lastActivity).toLocaleTimeString()
                                    : 'No records'}
                            </p>
                        </div>
                    </div>

                    {/* ───────── How Material Deductions Work ───────── */}
                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl shadow-sm mb-6 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowHelp((v) => !v)}
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                    <InformationCircleIcon className="h-5 w-5 text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-blue-900">
                                        How material deductions work
                                    </h2>
                                    <p className="text-xs text-blue-700/80 mt-0.5">
                                        Understand what triggers a deduction and how quantities are calculated.
                                    </p>
                                </div>
                            </div>
                            <ChevronDownIcon
                                className={`h-5 w-5 text-blue-700 shrink-0 transition-transform duration-200 ${
                                    showHelp ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {showHelp && (
                            <div className="px-5 pb-5 pt-1 border-t border-blue-200/70 space-y-4 text-sm text-blue-950">
                                {/* Overview */}
                                <p className="text-blue-900/90">
                                    Raw materials are deducted <strong>only when a customer pays for an order</strong>.
                                    Each part of the furniture contributes its own material, calculated from the
                                    dimensions the customer actually chose.
                                </p>

                                {/* Three steps */}
                                <div className="space-y-2.5">
                                    {[
                                        {
                                            title: 'Customer customizes each part',
                                            body:
                                                'On the product page, the customer picks a wood type and adjusts the dimensions of every part (Seat, Backrest, Legs, etc.) within the ranges you configured. Their exact length, width, and thickness are saved with the cart.',
                                        },
                                        {
                                            title: 'Checkout pre-checks availability',
                                            body:
                                                'When the customer clicks Place Order, the system verifies there is enough material to build the whole order. If stock is insufficient, the order is blocked before any payment is taken.',
                                        },
                                        {
                                            title: 'Deduction runs after payment',
                                            body:
                                                'Once PayMongo confirms payment, the exact material requirement is calculated and deducted from inventory, inside the same transaction that creates the order. If anything fails, the entire transaction rolls back.',
                                        },
                                    ].map((step, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 bg-white/70 rounded-lg p-3 border border-blue-200/60"
                                        >
                                            <div className="shrink-0 h-6 w-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-blue-900">
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-blue-800/80 mt-0.5 leading-relaxed">
                                                    {step.body}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Formula */}
                                <div className="bg-white rounded-lg border border-blue-200 p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <CalculatorIcon className="h-4 w-4 text-blue-700" />
                                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                                            Board-feet formula (per part)
                                        </p>
                                    </div>
                                    <pre className="text-[11px] leading-relaxed text-blue-950 bg-blue-50 rounded-md p-3 overflow-x-auto font-mono">
{`boards_needed = ceil(part_thickness / stock_thickness)
              × ceil(part_width     / stock_width)

board_feet    = boards_needed
              × (part_length × stock_width × stock_thickness) / 144

total_board_feet = sum(board_feet across every part)`}
                                    </pre>
                                    <p className="text-[11px] text-blue-800/80 mt-2">
                                        If a part was left at its default size, the standard dimension is used.
                                        Only the customer's customized dimensions count as changes.
                                    </p>
                                </div>

                                {/* Customization note */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                                        Customized dimensions matter
                                    </p>
                                    <p className="text-xs text-amber-900/90 leading-relaxed">
                                        A Seat ordered at <strong>22″</strong> instead of the standard{' '}
                                        <strong>20″</strong> consumes more wood. Using 1″×6″ Mahogany stock,
                                        the 2″ increase adds about <strong>0.33 board-feet</strong> per unit.
                                        The system deducts that extra stock — so inventory stays accurate
                                        and customization is reflected in real material cost.
                                    </p>
                                </div>

                                {/* Finish material */}
                                <div className="bg-white rounded-lg border border-blue-200 p-3">
                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                                        Finish material
                                    </p>
                                    <p className="text-xs text-blue-800/80 leading-relaxed">
                                        If the customer chooses <strong>Standard</strong> finish, exactly{' '}
                                        <strong>1 unit</strong> of the product&rsquo;s finish material (varnish) is
                                        deducted per product unit. If they choose <strong>Ordinary</strong>,
                                        no finish material is consumed.
                                    </p>
                                </div>

                                {/* Reading the log */}
                                <div className="bg-white rounded-lg border border-blue-200 p-3">
                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
                                        How to read the movement log
                                    </p>
                                    <ul className="text-xs text-blue-800/90 space-y-1 list-disc list-inside leading-relaxed">
                                        <li>
                                            <strong className="text-blue-900">Change</strong> — how much stock moved.
                                            Red = deducted, green = added.
                                        </li>
                                        <li>
                                            <strong className="text-blue-900">From → To</strong> — stock level
                                            before and after this movement.
                                        </li>
                                        <li>
                                            <strong className="text-blue-900">Note</strong> — the trigger.
                                            Entries like <em>&ldquo;Order #FMS-2026-0042 — Dining Chair&rdquo;</em>{' '}
                                            come from customer orders. Others come from manual stock-in or
                                            admin adjustments.
                                        </li>
                                        <li>
                                            <strong className="text-blue-900">Recorded By</strong> — the user
                                            who triggered the movement. Webhook-triggered deductions may show
                                            the system admin since no user is logged in at that moment.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
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
                                <div className="text-gray-400 text-sm">
                                    No stock history recorded for this material.
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
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
