import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShoppingBagIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    DocumentTextIcon,
    XMarkIcon,
    PrinterIcon,
    TruckIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';

const formatPrice = (value) => `₱${Number(value).toFixed(2)}`;

export default function Show({ order }) {
    const [showReceipt, setShowReceipt] = useState(false);

    // Helper to format dimensions
    const formatDimensions = (dims) => {
        const parts = [];
        if (dims.length) parts.push(`${dims.length}" L`);
        if (dims.width) parts.push(`${dims.width}" W`);
        if (dims.height) parts.push(`${dims.height}" H`);
        if (dims.thickness) parts.push(`${dims.thickness}" T`);
        return parts.join(' × ') || 'N/A';
    };

    // Payment info
    const payment = order.payments?.find(p => p.status === 'paid') || order.payments?.[0];
    const isDownPayment = payment?.type === 'down_payment';
    const remainingBalance = isDownPayment ? order.total - payment.amount : 0;
    const paymentMethod = isDownPayment ? 'Cash on Delivery (50% Downpayment)' : 'GCash (Full Payment)';
    const paymentDate = payment?.paid_at ? new Date(payment.paid_at) : (payment?.created_at ? new Date(payment.created_at) : null);

    const handlePrint = () => window.print();

    // ─── Production Stages ───
    const productionStages = ['carpentry', 'sanding', 'wood_filling', 'varnishing'];
    const stageLabels = {
        carpentry: 'Carpentry / Assembly',
        sanding: 'Sanding',
        wood_filling: 'Wood Filling / Prep',
        varnishing: 'Varnishing / Finishing',
    };
    const stageIcons = {
        carpentry: TruckIcon,
        sanding: CheckCircleIcon,
        wood_filling: DocumentTextIcon,
        varnishing: CheckCircleIcon,
    };

    const currentStage = order.production_stage;
    const isProductionComplete = currentStage === 'completed';

    const getStageIndex = (stage) => productionStages.indexOf(stage);
    const currentIndex = currentStage ? getStageIndex(currentStage) : -1;

    const isStageCompleted = (stage) => {
        if (isProductionComplete) return true;
        const idx = getStageIndex(stage);
        return idx < currentIndex;
    };
    const isStageCurrent = (stage) => currentStage === stage;

    const showProgress = ['processing', 'shipped', 'delivered'].includes(order.status);

    // Determine progress label
    let progressLabel = '';
    if (isProductionComplete) {
        progressLabel = 'Production Completed';
    } else if (currentStage) {
        progressLabel = `In Progress: ${stageLabels[currentStage]}`;
    } else {
        progressLabel = 'Awaiting Production';
    }

    return (
        <CustomerLayout>
            <Head title={`Order #${order.order_number}`} />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
                        {/* ─── HEADER ─── */}
                        <div className="p-4 sm:p-6 border-b border-stone-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                                    <h1 className="text-xl font-bold text-stone-900">
                                        Order #{order.order_number}
                                    </h1>
                                </div>
                                <p className="text-sm text-stone-500 mt-1">
                                    Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                    order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                    'bg-stone-100 text-stone-700'
                                }`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                    order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                    order.payment_status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.payment_status === 'partially_paid' ? 'Partially Paid' : order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                </span>
                                <span className="text-lg font-bold text-stone-900">
                                    {formatPrice(order.total)}
                                </span>
                                <button
                                    onClick={() => setShowReceipt(true)}
                                    className="inline-flex items-center px-3.5 py-1.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/50"
                                >
                                    <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                                    Receipt
                                </button>
                            </div>
                        </div>

                        {/* ─── PRODUCTION PROGRESS ─── */}
                        {showProgress && (
                            <div className="p-4 sm:p-6 border-b border-stone-200/60 bg-stone-50/40">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                        <TruckIcon className="h-5 w-5 text-[#6F4E37]" />
                                        Production Progress
                                    </h2>
                                    <span className="text-sm font-medium text-stone-600">
                                        {progressLabel}
                                    </span>
                                </div>

                                {/* Horizontal stepper */}
                                <div className="flex items-center gap-2 overflow-x-auto py-1">
                                    {productionStages.map((stage, idx) => {
                                        const completed = isStageCompleted(stage);
                                        const current = isStageCurrent(stage);
                                        const Icon = stageIcons[stage];
                                        const label = stageLabels[stage];
                                        const isLast = idx === productionStages.length - 1;

                                        return (
                                            <div key={stage} className="flex items-center flex-shrink-0">
                                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                    completed ? 'bg-emerald-100 text-emerald-800' :
                                                    current ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300' :
                                                    'bg-stone-100 text-stone-400'
                                                }`}>
                                                    {completed ? (
                                                        <SolidCheckCircle className="h-4 w-4" />
                                                    ) : current ? (
                                                        <ClockIcon className="h-4 w-4 animate-pulse" />
                                                    ) : (
                                                        <Icon className="h-4 w-4 opacity-40" />
                                                    )}
                                                    <span className="whitespace-nowrap">{label}</span>
                                                </div>
                                                {!isLast && (
                                                    <ArrowRightIcon className="h-4 w-4 text-stone-300 mx-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Additional info text */}
                                {order.status === 'processing' && (
                                    <div className="mt-3 text-sm text-stone-600">
                                        {isProductionComplete ? (
                                            <p className="text-emerald-700 font-medium flex items-center gap-1">
                                                <SolidCheckCircle className="h-4 w-4" />
                                                Production completed! Your order will be shipped soon.
                                            </p>
                                        ) : currentStage ? (
                                            <p>
                                                Current: <strong>{stageLabels[currentStage]}</strong>
                                                {(() => {
                                                    const nextIdx = currentIndex + 1;
                                                    if (nextIdx < productionStages.length) {
                                                        return ` → Next: ${stageLabels[productionStages[nextIdx]]}`;
                                                    }
                                                    return ' (final stage)';
                                                })()}
                                            </p>
                                        ) : (
                                            <p>Production will begin shortly.</p>
                                        )}
                                    </div>
                                )}
                                {(order.status === 'shipped' || order.status === 'delivered') && (
                                    <div className="mt-3 text-sm text-emerald-700 font-medium flex items-center gap-1">
                                        <SolidCheckCircle className="h-4 w-4" />
                                        All production stages completed – order has been {order.status}.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── ITEMS ─── */}
                        <div className="p-4 sm:p-6">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <ShoppingBagIcon className="h-4 w-4 text-stone-400" />
                                Items
                            </h2>
                            <div className="divide-y divide-stone-100">
                                {order.items.map((item) => (
                                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-stone-900">
                                                    {item.product.name} × {item.quantity}
                                                </p>
                                                {item.finish_name && (
                                                    <p className="text-xs text-stone-500 mt-0.5">
                                                        Finish: {item.finish_name}
                                                    </p>
                                                )}
                                                {item.customization_data?.parts && (
                                                    <div className="mt-1">
                                                        <p className="text-xs font-medium text-stone-600">Custom Dimensions:</p>
                                                        <div className="ml-2 space-y-0.5">
                                                            {Object.entries(item.customization_data.parts).map(([partId, dims]) => {
                                                                const part = item.product?.parts?.find(p => p.id == partId);
                                                                return (
                                                                    <div key={partId} className="text-xs text-stone-500">
                                                                        {part?.name || 'Part'}: {formatDimensions(dims)}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                {item.calculated_materials && (
                                                    <p className="text-xs text-stone-400 mt-0.5">
                                                        Material consumption calculated
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-stone-900 whitespace-nowrap">
                                                {formatPrice(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── PAYMENT SUMMARY ─── */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <CurrencyDollarIcon className="h-4 w-4 text-stone-400" />
                                Payment Summary
                            </h2>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-stone-600">Payment Status</span>
                                    <span className="font-medium capitalize">{order.payment_status}</span>
                                </div>
                                {order.payments.map((payment) => (
                                    <div key={payment.id} className="flex justify-between text-sm border-t border-stone-50 pt-1 mt-1">
                                        <span className="text-stone-600">
                                            {payment.type === 'down_payment' ? 'Down Payment' : 'Full Payment'} – {payment.method}
                                        </span>
                                        <span className="font-medium">{formatPrice(payment.amount)}</span>
                                        <span className="capitalize text-stone-500">{payment.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── SHIPPING ADDRESS ─── */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4 text-stone-400" />
                                Shipping Address
                            </h2>
                            <div className="text-sm text-stone-700 space-y-1">
                                <p>{order.shipping_address}</p>
                                {order.delivery_zone && <p>Zone: {order.delivery_zone}</p>}
                                {order.notes && (
                                    <div className="mt-2 flex items-start gap-1 text-stone-500">
                                        <DocumentTextIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                        <p>{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── BACK BUTTON ─── */}
                        <div className="p-4 border-t border-stone-200/60">
                            <Link
                                href={route('customer.orders.index')}
                                className="inline-flex items-center text-sm text-stone-500 hover:text-[#6F4E37] transition-colors"
                            >
                                ← Back to Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── RECEIPT MODAL ─── */}
            {showReceipt && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowReceipt(false)}
                            aria-hidden="true"
                        />

                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                            <div className="absolute top-0 right-0 pt-4 pr-4 no-print">
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="bg-white rounded-md text-stone-400 hover:text-stone-600 focus:outline-none"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="px-6 py-8 sm:p-8 receipt-content">
                                <style>
                                    {`
                                        @media print {
                                            body * { visibility: hidden; }
                                            .receipt-content, .receipt-content * { visibility: visible; }
                                            .receipt-content { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 40px; }
                                            .no-print { display: none !important; }
                                        }
                                    `}
                                </style>

                                <div className="text-center border-b border-stone-200 pb-4">
                                    <h2 className="text-2xl font-bold text-stone-900">Payment Receipt</h2>
                                    <p className="text-sm text-stone-500">Official Receipt of Payment</p>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Order Number</span>
                                        <span className="font-medium text-stone-900">#{order.order_number}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Customer</span>
                                        <span className="font-medium text-stone-900">{order.user?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Email</span>
                                        <span className="font-medium text-stone-900">{order.user?.email || 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between text-sm border-t border-stone-200 pt-3">
                                        <span className="text-stone-600">Order Total</span>
                                        <span className="font-bold text-stone-900">{formatPrice(order.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Payment Method</span>
                                        <span className="font-medium text-stone-900">{paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Amount Paid</span>
                                        <span className="font-medium text-emerald-600">{formatPrice(payment?.amount || 0)}</span>
                                    </div>
                                    {isDownPayment && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-stone-600">Remaining Balance</span>
                                            <span className="font-medium text-amber-600">{formatPrice(remainingBalance)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Payment Status</span>
                                        <span className="font-medium text-emerald-600 capitalize">{payment?.status || 'Paid'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-stone-200 pt-3">
                                        <span className="text-stone-600">Date & Time</span>
                                        <span className="font-medium text-stone-900">
                                            {paymentDate ? paymentDate.toLocaleString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-stone-200 text-center text-xs text-stone-400">
                                    <p>Thank you for your order!</p>
                                    <p className="mt-0.5">This receipt serves as proof of payment.</p>
                                </div>

                                <div className="mt-6 flex justify-center gap-4 no-print">
                                    <button
                                        onClick={handlePrint}
                                        className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/50"
                                    >
                                        <PrinterIcon className="h-4 w-4 mr-2" />
                                        Print Receipt
                                    </button>
                                    <button
                                        onClick={() => setShowReceipt(false)}
                                        className="inline-flex items-center px-4 py-2 bg-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-300 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CustomerLayout>
    );
}
