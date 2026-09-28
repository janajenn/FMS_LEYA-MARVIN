import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShoppingBagIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    DocumentTextIcon,
    XMarkIcon,
    PrinterIcon,
    TruckIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowRightIcon,
    BanknotesIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';
import DeliveryRouteMap from '@/Components/DeliveryRouteMap';

const formatPrice = (value) =>
    `₱${Number(value || 0).toFixed(2)}`;

/* ──────────────────────────────────────────────────────────────
 * Variant badge styles — Ordinary (neutral) vs Standard (accent)
 * ────────────────────────────────────────────────────────────── */
const VARIANT_BADGE_CLASSES = {
    ordinary: 'bg-stone-100 text-stone-700 border-stone-200',
    standard: 'bg-amber-50 text-amber-800 border-amber-200',
    default: 'bg-[#6F4E37]/10 text-[#6F4E37] border-[#6F4E37]/20',
};

function getVariantBadgeClass(slug) {
    return VARIANT_BADGE_CLASSES[slug] || VARIANT_BADGE_CLASSES.default;
}

/* ──────────────────────────────────────────────────────────────
 * Receipt body — inline styles only, shared by modal and print
 * ────────────────────────────────────────────────────────────── */
function ReceiptBody({
    order,
    payment,
    isDownPayment,
    remainingBalance,
    paymentMethod,
    paymentDate,
}) {
    const row = {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        padding: '4px 0',
    };
    const label = { color: '#57534e' };
    const value = { color: '#1c1917', fontWeight: 500 };
    const divider = { borderTop: '1px solid #e7e5e4', margin: '12px 0' };

    return (
        <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#1c1917' }}>
            <div
                style={{
                    textAlign: 'center',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e7e5e4',
                }}
            >
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                    Payment Receipt
                </h2>
                <p style={{ fontSize: '12px', color: '#78716c', margin: '4px 0 0' }}>
                    Official Receipt of Payment
                </p>
            </div>

            <div style={{ marginTop: '20px' }}>
                <div style={row}>
                    <span style={label}>Order Number</span>
                    <span style={value}>#{order.order_number}</span>
                </div>
                <div style={row}>
                    <span style={label}>Customer</span>
                    <span style={value}>{order.user?.name || 'N/A'}</span>
                </div>
                <div style={row}>
                    <span style={label}>Email</span>
                    <span style={value}>{order.user?.email || 'N/A'}</span>
                </div>

                <div style={divider} />

                <div style={{ marginBottom: '8px' }}>
                    <p
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#57534e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: '0 0 6px 0',
                        }}
                    >
                        Items
                    </p>
                    {order.items?.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                padding: '4px 0',
                                borderBottom: '1px dashed #e7e5e4',
                            }}
                        >
                            <span style={{ color: '#1c1917' }}>
                                {item.product?.name || 'Product'}
                                {item.variant?.name && (
                                    <span
                                        style={{
                                            marginLeft: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '1px 6px',
                                            borderRadius: '999px',
                                            background:
                                                item.variant.slug === 'standard'
                                                    ? '#fef3c7'
                                                    : '#f5f5f4',
                                            color:
                                                item.variant.slug === 'standard'
                                                    ? '#92400e'
                                                    : '#44403c',
                                        }}
                                    >
                                        {item.variant.name}
                                    </span>
                                )}
                                <span style={{ color: '#78716c' }}>
                                    {' '}
                                    × {item.quantity}
                                </span>
                            </span>
                            <span style={{ ...value, whiteSpace: 'nowrap' }}>
                                {formatPrice(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={divider} />

                <div style={row}>
                    <span style={label}>Order Total</span>
                    <span style={{ ...value, fontWeight: 700 }}>
                        {formatPrice(order.total)}
                    </span>
                </div>
                <div style={row}>
                    <span style={label}>Payment Method</span>
                    <span style={value}>{paymentMethod}</span>
                </div>
                <div style={row}>
                    <span style={label}>Amount Paid</span>
                    <span style={{ ...value, color: '#059669' }}>
                        {formatPrice(payment?.amount || 0)}
                    </span>
                </div>
                {isDownPayment && (
                    <div style={row}>
                        <span style={label}>Remaining Balance</span>
                        <span style={{ ...value, color: '#d97706' }}>
                            {formatPrice(remainingBalance)}
                        </span>
                    </div>
                )}
                <div style={row}>
                    <span style={label}>Payment Status</span>
                    <span
                        style={{
                            ...value,
                            color: '#059669',
                            textTransform: 'capitalize',
                        }}
                    >
                        {payment?.status || 'Paid'}
                    </span>
                </div>

                <div style={divider} />

                <div style={row}>
                    <span style={label}>Date &amp; Time</span>
                    <span style={value}>
                        {paymentDate ? paymentDate.toLocaleString() : 'N/A'}
                    </span>
                </div>
            </div>

            <div
                style={{
                    marginTop: '24px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e7e5e4',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#a8a29e',
                }}
            >
                <p style={{ margin: 0 }}>Thank you for your order!</p>
                <p style={{ margin: '2px 0 0' }}>This receipt serves as proof of payment.</p>
            </div>
        </div>
    );
}

export default function Show({ order, storeLocation, delivery }) {
    const [showReceipt, setShowReceipt] = useState(false);

    const formatDimensions = (dims) => {
        const parts = [];
        if (dims.length) parts.push(`${dims.length}" L`);
        if (dims.width) parts.push(`${dims.width}" W`);
        if (dims.height) parts.push(`${dims.height}" H`);
        if (dims.thickness) parts.push(`${dims.thickness}" T`);
        return parts.join(' × ') || 'N/A';
    };

    /* ─── Payment resolution ─── */
    const paidPayments = (order.payments || []).filter((p) => p.status === 'paid');
    const primaryPayment = paidPayments[0] || order.payments?.[0] || null;
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const isDownPayment = primaryPayment?.type === 'down_payment';
    const remainingBalance = Math.max(0, Number(order.total || 0) - totalPaid);

    // Payment method label
    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case 'paymongo':
            case 'gcash':
                return 'GCash / PayMongo';
            case 'cash':
            case 'cash_on_delivery':
                return 'Cash on Delivery';
            case 'paymaya':
                return 'PayMaya';
            case 'card':
                return 'Credit / Debit Card';
            default:
                return method
                    ? method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    : 'N/A';
        }
    };

    const paymentMethodLabel = primaryPayment
        ? getPaymentMethodLabel(primaryPayment.method)
        : 'N/A';

    const paymentDate = primaryPayment?.paid_at
        ? new Date(primaryPayment.paid_at)
        : primaryPayment?.created_at
        ? new Date(primaryPayment.created_at)
        : null;

    /* ─── Pricing breakdown ─── */
    const itemsSubtotal = (order.items || []).reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
    );
    const customizationTotal = (order.items || []).reduce(
        (sum, item) => sum + Number(item.customization_surcharge || 0),
        0
    );
    const deliveryFee = Number(order.delivery_fee || 0);
    const orderTotal = Number(order.total || 0);

    /* ─── Print handler ─── */
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) {
            alert('Please allow pop-ups to print the receipt.');
            return;
        }

        const holder = document.createElement('div');
        holder.innerHTML = document.getElementById('receipt-source')?.innerHTML || '';

        printWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Receipt - Order #${order.order_number}</title>
                    <style>
                        * { box-sizing: border-box; }
                        body {
                            margin: 0;
                            padding: 40px;
                            background: #ffffff;
                            color: #1c1917;
                            font-family: Arial, Helvetica, sans-serif;
                        }
                        @page { margin: 20mm; }
                    </style>
                </head>
                <body>${holder.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
    };

    /* ─── Production progress ─── */
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

    let progressLabel = '';
    if (isProductionComplete) {
        progressLabel = 'Production Completed';
    } else if (currentStage) {
        progressLabel = `In Progress: ${stageLabels[currentStage]}`;
    } else {
        progressLabel = 'Awaiting Production';
    }

    /* ─── Delivery map helpers ─── */
    const customerLocation =
        order.latitude && order.longitude
            ? {
                  latitude: Number(order.latitude),
                  longitude: Number(order.longitude),
                  address: order.shipping_address,
              }
            : null;

    const getTruckPlacement = (status) => {
        switch (status) {
            case 'picked_up':
                return 'start';
            case 'in_transit':
                return 'middle';
            case 'delivered':
                return 'end';
            case 'failed':
                return 'start';
            default:
                return 'start';
        }
    };

    const truckPlacement = getTruckPlacement(delivery?.status);

    const getDeliveryLabel = (status) => {
        switch (status) {
            case 'picked_up':
                return 'Picked Up — awaiting dispatch';
            case 'in_transit':
                return 'In Transit — on the way to you';
            case 'delivered':
                return 'Delivered — arrived at your location';
            case 'failed':
                return 'Delivery Failed';
            default:
                return 'Preparing for delivery';
        }
    };

    const getDeliveryBadgeColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-emerald-100 text-emerald-800';
            case 'in_transit':
                return 'bg-blue-100 text-blue-800';
            case 'picked_up':
                return 'bg-amber-100 text-amber-800';
            case 'failed':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-stone-100 text-stone-700';
        }
    };

    /* ─── Item image helper ─── */
    const getItemImage = (item) => {
        if (item.variant?.images?.length > 0) {
            return `/storage/${item.variant.images[0].path}`;
        }
        if (item.product?.images?.length > 0) {
            return `/storage/${item.product.images[0].path}`;
        }
        return null;
    };

    /* ─── Order status badge class ─── */
    const statusBadgeClass =
        order.status === 'delivered'
            ? 'bg-emerald-100 text-emerald-800'
            : order.status === 'cancelled'
            ? 'bg-rose-100 text-rose-800'
            : order.status === 'processing'
            ? 'bg-amber-100 text-amber-800'
            : order.status === 'shipped'
            ? 'bg-blue-100 text-blue-800'
            : order.status === 'accepted'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-stone-100 text-stone-700';

    const paymentStatusBadgeClass =
        order.payment_status === 'paid'
            ? 'bg-emerald-100 text-emerald-800'
            : order.payment_status === 'partially_paid'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-yellow-100 text-yellow-800';

    return (
        <CustomerLayout>
            <Head title={`Order #${order.order_number}`} />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
                        {/* ─── HEADER ─── */}
                        <div className="p-4 sm:p-6 border-b border-stone-200/60">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                                        <h1 className="text-xl font-bold text-stone-900">
                                            Order #{order.order_number}
                                        </h1>
                                    </div>
                                    <p className="text-sm text-stone-500 mt-1">
                                        Placed on{' '}
                                        {new Date(order.created_at).toLocaleDateString('en-PH', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}{' '}
                                        at{' '}
                                        {new Date(order.created_at).toLocaleTimeString('en-PH', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowReceipt(true)}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/50 self-start sm:self-auto"
                                >
                                    <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                                    View Receipt
                                </button>
                            </div>

                            {/* Status chips */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeClass}`}
                                >
                                    Order: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <span
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${paymentStatusBadgeClass}`}
                                >
                                    Payment:{' '}
                                    {order.payment_status === 'partially_paid'
                                        ? 'Partially Paid'
                                        : order.payment_status.charAt(0).toUpperCase() +
                                          order.payment_status.slice(1)}
                                </span>
                                {primaryPayment && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                                        {primaryPayment.method === 'paymongo' ||
                                        primaryPayment.method === 'gcash' ? (
                                            <CreditCardIcon className="h-3.5 w-3.5" />
                                        ) : (
                                            <BanknotesIcon className="h-3.5 w-3.5" />
                                        )}
                                        {paymentMethodLabel}
                                    </span>
                                )}
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

                                <div className="flex items-center gap-2 overflow-x-auto py-1">
                                    {productionStages.map((stage, idx) => {
                                        const completed = isStageCompleted(stage);
                                        const current = isStageCurrent(stage);
                                        const Icon = stageIcons[stage];
                                        const label = stageLabels[stage];
                                        const isLast = idx === productionStages.length - 1;

                                        return (
                                            <div
                                                key={stage}
                                                className="flex items-center flex-shrink-0"
                                            >
                                                <div
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                        completed
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : current
                                                            ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                                                            : 'bg-stone-100 text-stone-400'
                                                    }`}
                                                >
                                                    {completed ? (
                                                        <SolidCheckCircle className="h-4 w-4" />
                                                    ) : current ? (
                                                        <ClockIcon className="h-4 w-4 animate-pulse" />
                                                    ) : (
                                                        <Icon className="h-4 w-4 opacity-40" />
                                                    )}
                                                    <span className="whitespace-nowrap">
                                                        {label}
                                                    </span>
                                                </div>
                                                {!isLast && (
                                                    <ArrowRightIcon className="h-4 w-4 text-stone-300 mx-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {order.status === 'processing' && (
                                    <div className="mt-3 text-sm text-stone-600">
                                        {isProductionComplete ? (
                                            <p className="text-emerald-700 font-medium flex items-center gap-1">
                                                <SolidCheckCircle className="h-4 w-4" />
                                                Production completed! Your order will be
                                                shipped soon.
                                            </p>
                                        ) : currentStage ? (
                                            <p>
                                                Current:{' '}
                                                <strong>{stageLabels[currentStage]}</strong>
                                                {(() => {
                                                    const nextIdx = currentIndex + 1;
                                                    if (nextIdx < productionStages.length) {
                                                        return ` → Next: ${
                                                            stageLabels[
                                                                productionStages[nextIdx]
                                                            ]
                                                        }`;
                                                    }
                                                    return ' (final stage)';
                                                })()}
                                            </p>
                                        ) : (
                                            <p>Production will begin shortly.</p>
                                        )}
                                    </div>
                                )}
                                {(order.status === 'shipped' ||
                                    order.status === 'delivered') && (
                                    <div className="mt-3 text-sm text-emerald-700 font-medium flex items-center gap-1">
                                        <SolidCheckCircle className="h-4 w-4" />
                                        All production stages completed – order has been{' '}
                                        {order.status}.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── DELIVERY ROUTE MAP (unchanged) ─── */}
                        {customerLocation && (
                            <div className="p-4 sm:p-6 border-b border-stone-200/60">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                        <MapPinIcon className="h-5 w-5 text-[#6F4E37]" />
                                        Delivery Route
                                    </h2>
                                    <span className="text-xs text-stone-500">
                                        From our store to your location
                                    </span>
                                </div>

                                {delivery && (
                                    <div
                                        className={`mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getDeliveryBadgeColor(
                                            delivery.status
                                        )}`}
                                    >
                                        <TruckIcon className="h-3.5 w-3.5" />
                                        {getDeliveryLabel(delivery.status)}
                                    </div>
                                )}

                                <DeliveryRouteMap
                                    store={storeLocation}
                                    customer={customerLocation}
                                    height={360}
                                    showTruck={true}
                                    truckPosition={truckPlacement}
                                />
                            </div>
                        )}

                        {/* ─── ORDER ITEMS (receipt-style) ─── */}
                        <div className="p-4 sm:p-6 border-b border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
                                <ShoppingBagIcon className="h-4 w-4 text-stone-400" />
                                Items Ordered
                            </h2>

                            <div className="border border-stone-200 rounded-lg overflow-hidden">
                                {/* Header row */}
                                <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                    <div className="col-span-6">Item</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-2 text-right">Unit Price</div>
                                    <div className="col-span-2 text-right">Total</div>
                                </div>

                                {/* Item rows */}
                                <div className="divide-y divide-stone-100">
                                    {order.items.map((item) => {
                                        const imageUrl = getItemImage(item);
                                        const unitPrice = Number(item.price || 0);
                                        const qty = Number(item.quantity || 0);
                                        const lineTotal = unitPrice * qty;
                                        const surcharge = Number(
                                            item.customization_surcharge || 0
                                        );

                                        return (
                                            <div key={item.id} className="px-4 py-4">
                                                {/* Desktop layout */}
                                                <div className="hidden sm:grid grid-cols-12 gap-3 items-start">
                                                    <div className="col-span-6 flex items-start gap-3 min-w-0">
                                                        {imageUrl && (
                                                            <img
                                                                src={imageUrl}
                                                                alt={item.product?.name}
                                                                className="h-14 w-14 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                                                            />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-stone-900 flex flex-wrap items-center gap-2">
                                                                <span className="truncate">
                                                                    {item.product?.name ||
                                                                        'Product'}
                                                                </span>
                                                                {item.variant?.name && (
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${getVariantBadgeClass(
                                                                            item.variant.slug
                                                                        )}`}
                                                                    >
                                                                        {item.variant.name}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {item.variant?.description && (
                                                                <p className="text-xs text-stone-500 mt-0.5 italic">
                                                                    {item.variant.description}
                                                                </p>
                                                            )}
                                                            {item.finish_name && (
                                                                <p className="text-xs text-stone-500 mt-0.5">
                                                                    Finish: {item.finish_name}
                                                                </p>
                                                            )}
                                                            {item.customization_data?.parts && (
                                                                <div className="mt-1">
                                                                    <p className="text-xs font-medium text-stone-600">
                                                                        Custom Dimensions:
                                                                    </p>
                                                                    <div className="ml-2 space-y-0.5">
                                                                        {Object.entries(
                                                                            item.customization_data
                                                                                .parts
                                                                        ).map(
                                                                            ([partId, dims]) => {
                                                                                const part =
                                                                                    item.product?.parts?.find(
                                                                                        (p) =>
                                                                                            p.id ==
                                                                                            partId
                                                                                    );
                                                                                return (
                                                                                    <div
                                                                                        key={
                                                                                            partId
                                                                                        }
                                                                                        className="text-xs text-stone-500"
                                                                                    >
                                                                                        {part?.name ||
                                                                                            'Part'}
                                                                                        :{' '}
                                                                                        {formatDimensions(
                                                                                            dims
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 text-center text-sm text-stone-700 self-center">
                                                        {qty}
                                                    </div>
                                                    <div className="col-span-2 text-right text-sm text-stone-700 self-center">
                                                        {formatPrice(unitPrice)}
                                                    </div>
                                                    <div className="col-span-2 text-right text-sm font-semibold text-stone-900 self-center">
                                                        {formatPrice(lineTotal)}
                                                    </div>
                                                </div>

                                                {/* Mobile layout */}
                                                <div className="sm:hidden flex items-start gap-3">
                                                    {imageUrl && (
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.product?.name}
                                                            className="h-14 w-14 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-stone-900 flex flex-wrap items-center gap-2">
                                                            <span>
                                                                {item.product?.name ||
                                                                    'Product'}
                                                            </span>
                                                            {item.variant?.name && (
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${getVariantBadgeClass(
                                                                        item.variant.slug
                                                                    )}`}
                                                                >
                                                                    {item.variant.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {item.finish_name && (
                                                            <p className="text-xs text-stone-500 mt-0.5">
                                                                Finish: {item.finish_name}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-stone-500 mt-1">
                                                            {formatPrice(unitPrice)} × {qty}
                                                        </p>
                                                        <p className="text-sm font-semibold text-stone-900 mt-1">
                                                            {formatPrice(lineTotal)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Customization surcharge row (if any) */}
                                                {surcharge > 0 && (
                                                    <div className="mt-2 sm:ml-[68px] text-xs text-[#6F4E37] flex items-center justify-between sm:justify-start sm:gap-2">
                                                        <span>
                                                            + Customization surcharge
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatPrice(surcharge)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ─── PRICING SUMMARY (receipt-style) ─── */}
                        <div className="p-4 sm:p-6 border-b border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
                                <CurrencyDollarIcon className="h-4 w-4 text-stone-400" />
                                Payment Summary
                            </h2>

                            <div className="max-w-md ml-auto">
                                {/* Pricing breakdown */}
                                <div className="border border-stone-200 rounded-lg overflow-hidden">
                                    <div className="divide-y divide-stone-100 text-sm">
                                        <div className="flex justify-between px-4 py-2.5">
                                            <span className="text-stone-600">
                                                Subtotal ({order.items.length} item
                                                {order.items.length === 1 ? '' : 's'})
                                            </span>
                                            <span className="text-stone-900 font-medium">
                                                {formatPrice(itemsSubtotal)}
                                            </span>
                                        </div>

                                        {customizationTotal > 0 && (
                                            <div className="flex justify-between px-4 py-2.5">
                                                <span className="text-stone-600">
                                                    Customization
                                                </span>
                                                <span className="text-[#6F4E37] font-medium">
                                                    + {formatPrice(customizationTotal)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between px-4 py-2.5">
                                            <span className="text-stone-600">
                                                Delivery Fee
                                            </span>
                                            <span className="text-stone-900 font-medium">
                                                + {formatPrice(deliveryFee)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between px-4 py-3 bg-stone-50">
                                            <span className="text-stone-900 font-semibold">
                                                Order Total
                                            </span>
                                            <span className="text-stone-900 font-bold text-base">
                                                {formatPrice(orderTotal)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between px-4 py-2.5">
                                            <span className="text-stone-600">
                                                Amount Paid
                                            </span>
                                            <span className="text-emerald-700 font-semibold">
                                                − {formatPrice(totalPaid)}
                                            </span>
                                        </div>

                                        <div
                                            className={`flex justify-between px-4 py-3 ${
                                                remainingBalance > 0
                                                    ? 'bg-amber-50'
                                                    : 'bg-emerald-50'
                                            }`}
                                        >
                                            <span
                                                className={`font-semibold ${
                                                    remainingBalance > 0
                                                        ? 'text-amber-900'
                                                        : 'text-emerald-900'
                                                }`}
                                            >
                                                {remainingBalance > 0
                                                    ? 'Remaining Balance'
                                                    : 'Fully Paid'}
                                            </span>
                                            <span
                                                className={`font-bold text-base ${
                                                    remainingBalance > 0
                                                        ? 'text-amber-700'
                                                        : 'text-emerald-700'
                                                }`}
                                            >
                                                {remainingBalance > 0
                                                    ? formatPrice(remainingBalance)
                                                    : '✓'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment method + date */}
                                {primaryPayment && (
                                    <div className="mt-3 text-xs text-stone-500 space-y-1">
                                        <p>
                                            <span className="font-medium text-stone-600">
                                                Payment method:{' '}
                                            </span>
                                            {paymentMethodLabel}
                                        </p>
                                        {paymentDate && (
                                            <p>
                                                <span className="font-medium text-stone-600">
                                                    Paid on:{' '}
                                                </span>
                                                {paymentDate.toLocaleString('en-PH', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        )}
                                        {isDownPayment && remainingBalance > 0 && (
                                            <p className="text-amber-700 font-medium mt-2">
                                                A 50% down payment was made. The remaining
                                                balance is due upon delivery.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Receipt button */}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setShowReceipt(true)}
                                        className="inline-flex items-center px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition"
                                    >
                                        <PrinterIcon className="h-4 w-4 mr-2" />
                                        View / Print Receipt
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ─── ALL PAYMENTS (if multiple) ─── */}
                        {order.payments.length > 1 && (
                            <div className="p-4 sm:p-6 border-t border-stone-200/60">
                                <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                    <BanknotesIcon className="h-4 w-4 text-stone-400" />
                                    Payment History
                                </h2>
                                <div className="border border-stone-200 rounded-lg overflow-hidden">
                                    <div className="divide-y divide-stone-100 text-sm">
                                        {order.payments.map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex justify-between items-center px-4 py-2.5"
                                            >
                                                <div>
                                                    <p className="font-medium text-stone-900 capitalize">
                                                        {p.type === 'down_payment'
                                                            ? 'Down Payment'
                                                            : 'Full Payment'}
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        {getPaymentMethodLabel(p.method)}
                                                        {p.paid_at &&
                                                            ` · ${new Date(
                                                                p.paid_at
                                                            ).toLocaleDateString('en-PH', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-stone-900">
                                                        {formatPrice(p.amount)}
                                                    </p>
                                                    <p
                                                        className={`text-xs font-medium capitalize ${
                                                            p.status === 'paid'
                                                                ? 'text-emerald-600'
                                                                : 'text-stone-500'
                                                        }`}
                                                    >
                                                        {p.status}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── SHIPPING ADDRESS ─── */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4 text-stone-400" />
                                Shipping Address
                            </h2>
                            <div className="text-sm text-stone-700 space-y-1">
                                <p>{order.shipping_address}</p>
                                {order.delivery_zone && (
                                    <p className="text-stone-500">
                                        Zone: {order.delivery_zone}
                                    </p>
                                )}
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
                <div
                    className="fixed inset-0 isolate"
                    style={{ zIndex: 99999 }}
                    aria-labelledby="modal-title"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowReceipt(false)}
                            aria-hidden="true"
                        />

                        <div
                            className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
                            style={{ zIndex: 100000 }}
                        >
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="bg-white rounded-md text-stone-400 hover:text-stone-600 focus:outline-none"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="px-6 py-8 sm:p-8">
                                <div id="receipt-source">
                                    <ReceiptBody
                                        order={order}
                                        payment={primaryPayment}
                                        isDownPayment={isDownPayment}
                                        remainingBalance={remainingBalance}
                                        paymentMethod={paymentMethodLabel}
                                        paymentDate={paymentDate}
                                    />
                                </div>

                                <div className="mt-6 flex justify-center gap-4">
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
