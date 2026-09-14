import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingBagIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    UserIcon,
    MapPinIcon,
    DocumentTextIcon,
    TruckIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';

const formatPrice = (value) => `₱${Number(value).toFixed(2)}`;

export default function Show({ order }) {
    // ─── Production Stages (read-only) ───
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
    const showProgress = ['processing', 'shipped', 'delivered'].includes(order.status);

    const getStageIndex = (stage) => productionStages.indexOf(stage);
    const currentIndex = currentStage ? getStageIndex(currentStage) : -1;

    const isStageCompleted = (stage) => {
        if (isProductionComplete) return true;
        const idx = getStageIndex(stage);
        return idx < currentIndex;
    };
    const isStageCurrent = (stage) => currentStage === stage;

    // ─── Payment Summary ───
    const totalPaid = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const remainingBalance = order.total - totalPaid;

    // ─── Helper ───
    const formatDimensions = (dims) => {
        const parts = [];
        if (dims.length) parts.push(`${dims.length}" L`);
        if (dims.width) parts.push(`${dims.width}" W`);
        if (dims.height) parts.push(`${dims.height}" H`);
        if (dims.thickness) parts.push(`${dims.thickness}" T`);
        return parts.join(' × ') || 'N/A';
    };

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
        <ManagerLayout>
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
                            </div>
                        </div>

                        {/* ─── PRODUCTION PROGRESS (read-only) ─── */}
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

                                {/* Additional info */}
                                {order.status === 'processing' && (
                                    <div className="mt-3 text-sm text-stone-600">
                                        {isProductionComplete ? (
                                            <p className="text-emerald-700 font-medium flex items-center gap-1">
                                                <SolidCheckCircle className="h-4 w-4" />
                                                Production completed – order is ready for shipping.
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

                        {/* ─── ORDER DETAILS GRID ─── */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-stone-400" /> Customer
                                </h2>
                                <p className="text-sm text-stone-700">{order.user?.name || 'N/A'}</p>
                                <p className="text-sm text-stone-500">{order.user?.email || 'N/A'}</p>
                            </div>

                            {/* Payment Summary */}
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <CurrencyDollarIcon className="h-4 w-4 text-stone-400" /> Payment
                                </h2>
                                <div className="space-y-0.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Order Total</span>
                                        <span className="font-medium text-stone-900">{formatPrice(order.total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Total Paid</span>
                                        <span className="font-medium text-emerald-600">{formatPrice(totalPaid)}</span>
                                    </div>
                                    {remainingBalance > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-600">Remaining</span>
                                            <span className="font-medium text-amber-600">{formatPrice(remainingBalance)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Status</span>
                                        <span className="font-medium capitalize">{order.payment_status}</span>
                                    </div>
                                </div>
                                {order.payments.map((payment) => (
                                    <div key={payment.id} className="text-sm text-stone-600 border-t border-stone-50 pt-1 mt-1">
                                        <span>
                                            {payment.type === 'down_payment' ? 'Down Payment' : 'Full Payment'} – {payment.method}
                                        </span>
                                        <span className="ml-2 font-medium">{formatPrice(payment.amount)}</span>
                                        <span className="ml-2 capitalize text-xs text-stone-400">{payment.status}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Shipping */}
                            <div className="space-y-1 lg:col-span-2">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-stone-400" /> Shipping Address
                                </h2>
                                <p className="text-sm text-stone-700">{order.shipping_address}</p>
                                {order.delivery_zone && (
                                    <p className="text-sm text-stone-500">Zone: {order.delivery_zone}</p>
                                )}
                                {order.notes && (
                                    <div className="flex items-start gap-1 text-stone-500 text-sm mt-2">
                                        <DocumentTextIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                        <p>{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── ITEMS ─── */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <ShoppingBagIcon className="h-4 w-4 text-stone-400" /> Items
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
                                                    <p className="text-xs text-stone-500 mt-0.5">Finish: {item.finish_name}</p>
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
                                            </div>
                                            <p className="text-sm font-medium text-stone-900 whitespace-nowrap">
                                                {formatPrice(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── BACK BUTTON ─── */}
                        <div className="p-4 border-t border-stone-200/60">
                            <Link
                                href={route('manager.orders.index')}
                                className="inline-flex items-center text-sm text-stone-500 hover:text-[#6F4E37] transition-colors"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                Back to Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
