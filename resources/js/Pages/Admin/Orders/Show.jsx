import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Transition } from '@headlessui/react';
import {
    ShoppingBagIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    UserIcon,
    MapPinIcon,
    DocumentTextIcon,
    TruckIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ArrowRightIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';

const formatPrice = (value) => `₱${Number(value).toFixed(2)}`;

export default function Show({ order }) {
    // Status update form
    const { data, setData, put, processing, errors } = useForm({
        status: order.status,
    });

    const statusOptions = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'];

    const handleStatusUpdate = (e) => {
        e.preventDefault();
        put(route('admin.orders.update-status', order.id));
    };

    // Production stages
    const productionStages = ['carpentry', 'sanding', 'wood_filling', 'varnishing'];
    const stageLabels = {
        carpentry: 'Carpentry / Assembly',
        sanding: 'Sanding',
        wood_filling: 'Wood Filling / Prep',
        varnishing: 'Varnishing / Finishing',
    };
    const stageIcons = {
        carpentry: TruckIcon,
        sanding: PencilSquareIcon,
        wood_filling: DocumentTextIcon,
        varnishing: CheckCircleIcon,
    };

    const currentStage = order.production_stage;
    const isProcessing = order.status === 'processing';
    const isProductionComplete = currentStage === 'completed';

    // Helper: stage index
    const getStageIndex = (stage) => productionStages.indexOf(stage);
    const currentIndex = currentStage ? getStageIndex(currentStage) : -1;

    // Helper: is stage completed?
    const isStageCompleted = (stage) => {
        if (isProductionComplete) return true;
        const stageIndex = getStageIndex(stage);
        return stageIndex < currentIndex;
    };

    // Helper: is stage current?
    const isStageCurrent = (stage) => currentStage === stage;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);

    // Advance to next stage
    const advanceStage = (stage) => {
        router.put(
            route('admin.orders.update-production-stage', order.id),
            { stage: stage },
            { preserveScroll: true, onSuccess: () => setModalOpen(false) }
        );
    };

    // Complete production
    const completeProduction = () => {
        if (confirm('Mark production as completed? This will allow the order to be shipped.')) {
            router.post(
                route('admin.orders.complete-production', order.id),
                {},
                { preserveScroll: true, onSuccess: () => setModalOpen(false) }
            );
        }
    };

    // Determine next stage
    const getNextStage = () => {
        if (isProductionComplete) return null;
        if (currentIndex === -1) return 'carpentry';
        return productionStages[currentIndex + 1] || null;
    };
    const nextStage = getNextStage();

    // Determine if we can complete production (at last stage)
    const canCompleteProduction = currentStage === 'varnishing' && !isProductionComplete;

    return (
        <AdminLayout>
            <Head title={`Order #${order.order_number}`} />
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main card */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
                        {/* Header */}
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
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                    order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                                    'bg-stone-100 text-stone-700'
                                }`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <span className="text-lg font-bold text-stone-900">
                                    {formatPrice(order.total)}
                                </span>
                            </div>
                        </div>

                        {/* Status Update Form */}
                        <div className="p-4 sm:p-6 border-b border-stone-200/60 bg-stone-50/50">
                            <form onSubmit={handleStatusUpdate} className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="status" className="text-sm font-medium text-stone-700">
                                        Update Status:
                                    </label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="rounded-md border-stone-300 shadow-sm focus:border-[#6F4E37] focus:ring focus:ring-[#6F4E37]/20 text-sm"
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-md hover:bg-[#5A3E2B] disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/50"
                                >
                                    {processing ? 'Saving...' : 'Update Status'}
                                </button>
                                {errors.status && <p className="text-rose-600 text-xs">{errors.status}</p>}
                            </form>
                        </div>

                        {/* ─── PRODUCTION PROGRESS CARD ─── */}
                        {isProcessing && (
                            <div
                                className="p-4 sm:p-6 border-b border-stone-200/60 bg-stone-50/50 cursor-pointer hover:bg-stone-100/50 transition-colors duration-150"
                                onClick={() => setModalOpen(true)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TruckIcon className="h-5 w-5 text-[#6F4E37]" />
                                        <h2 className="text-base font-semibold text-stone-900">
                                            Production Progress
                                        </h2>
                                        {isProductionComplete ? (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                <SolidCheckCircle className="h-3 w-3 mr-1" />
                                                Completed
                                            </span>
                                        ) : (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                In Progress
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className="text-sm text-[#6F4E37] hover:text-[#5A3E2B] font-medium flex items-center gap-1"
                                        onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
                                    >
                                        Manage <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Visual progress steps */}
                                <div className="mt-4 flex items-center gap-2 overflow-x-auto">
                                    {productionStages.map((stage, idx) => {
                                        const completed = isStageCompleted(stage);
                                        const current = isStageCurrent(stage);
                                        const Icon = stageIcons[stage];
                                        const label = stageLabels[stage];
                                        return (
                                            <div key={stage} className="flex items-center flex-shrink-0">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                                                    completed ? 'bg-emerald-100 text-emerald-800' :
                                                    current ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300' :
                                                    'bg-stone-100 text-stone-400'
                                                }`}>
                                                    {completed ? (
                                                        <SolidCheckCircle className="h-4 w-4" />
                                                    ) : current ? (
                                                        <ClockIcon className="h-4 w-4 animate-pulse" />
                                                    ) : (
                                                        <ClockIcon className="h-4 w-4 opacity-40" />
                                                    )}
                                                    <span className="whitespace-nowrap">{label}</span>
                                                </div>
                                                {idx < productionStages.length - 1 && (
                                                    <ArrowRightIcon className="h-4 w-4 text-stone-300 mx-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* If not processing, show a placeholder message */}
                        {!isProcessing && order.status !== 'cancelled' && (
                            <div className="p-4 sm:p-6 border-b border-stone-200/60 bg-stone-50/50">
                                <div className="flex items-center gap-2 text-stone-500">
                                    <TruckIcon className="h-5 w-5" />
                                    <span className="text-sm">
                                        Production will start when order status is set to <strong>Processing</strong>.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Order Details Grid */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-stone-400" /> Customer
                                </h2>
                                <p className="text-sm text-stone-700">{order.user?.name}</p>
                                <p className="text-sm text-stone-500">{order.user?.email}</p>
                            </div>

                            {/* Payment Summary */}
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <CurrencyDollarIcon className="h-4 w-4 text-stone-400" /> Payment
                                </h2>
                                <p className="text-sm text-stone-700">
                                    Status: <span className="font-medium">{order.payment_status}</span>
                                </p>
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

                            {/* Shipping Address */}
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

                        {/* Order Items */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <ShoppingBagIcon className="h-4 w-4 text-stone-400" /> Items
                            </h2>
                            <div className="divide-y divide-stone-100">
                                {order.items.map((item) => (
                                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-stone-900">
                                                    {item.product?.name} × {item.quantity}
                                                </p>
                                                {item.finish_name && (
                                                    <p className="text-xs text-stone-500">Finish: {item.finish_name}</p>
                                                )}
                                                {item.customization_data && (
                                                    <p className="text-xs text-stone-400">Customized</p>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-stone-900">{formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Back button */}
                        <div className="p-4 border-t border-stone-200/60">
                            <Link
                                href={route('admin.orders.index')}
                                className="text-sm text-stone-500 hover:text-[#6F4E37] transition-colors duration-150"
                            >
                                ← Back to Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ──────────────────────────── */}
            {/* PRODUCTION MODAL */}
            {/* ──────────────────────────── */}
            <Transition show={modalOpen}>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Transition.Child
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div
                            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm"
                            onClick={() => setModalOpen(false)}
                        />
                    </Transition.Child>

                    <Transition.Child
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="scale-95 opacity-0"
                        enterTo="scale-100 opacity-100"
                        leave="transition ease-in-out duration-200 transform"
                        leaveFrom="scale-100 opacity-100"
                        leaveTo="scale-95 opacity-0"
                    >
                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal header */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TruckIcon className="h-6 w-6 text-[#6F4E37]" />
                                    <h3 className="text-lg font-bold text-stone-900">Manage Production</h3>
                                </div>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="px-6 py-6">
                                {/* Order info */}
                                <div className="mb-6 text-sm text-stone-600">
                                    <span className="font-medium">Order #{order.order_number}</span>
                                    <span className="mx-2">•</span>
                                    <span>Status: <span className="font-medium capitalize">{order.status}</span></span>
                                    <span className="mx-2">•</span>
                                    <span>Total: {formatPrice(order.total)}</span>
                                </div>

                                {/* Production progress - vertical stepper for modal */}
                                <div className="space-y-0">
                                    {productionStages.map((stage, idx) => {
                                        const completed = isStageCompleted(stage);
                                        const current = isStageCurrent(stage);
                                        const Icon = stageIcons[stage];
                                        const label = stageLabels[stage];
                                        const isLast = idx === productionStages.length - 1;
                                        const isUpcoming = !completed && !current && !isProductionComplete;

                                        return (
                                            <div key={stage} className="relative flex items-start gap-4">
                                                {/* Vertical line connector */}
                                                {!isLast && (
                                                    <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-stone-200 -ml-px" />
                                                )}

                                                {/* Icon circle */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                                                    completed ? 'bg-emerald-100 text-emerald-700' :
                                                    current ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-200' :
                                                    'bg-stone-100 text-stone-400'
                                                }`}>
                                                    {completed ? (
                                                        <SolidCheckCircle className="h-5 w-5" />
                                                    ) : current ? (
                                                        <ClockIcon className="h-5 w-5 animate-pulse" />
                                                    ) : (
                                                        <Icon className="h-5 w-5 opacity-50" />
                                                    )}
                                                </div>

                                                {/* Stage content */}
                                                <div className="flex-1 pb-6 pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`font-medium ${
                                                                completed ? 'text-stone-900' :
                                                                current ? 'text-stone-900' :
                                                                'text-stone-500'
                                                            }`}>
                                                                {label}
                                                            </p>
                                                            <p className="text-xs text-stone-500 mt-0.5">
                                                                {completed ? 'Completed' :
                                                                current ? 'In progress' :
                                                                'Pending'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            {completed && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                    <SolidCheckCircle className="h-3 w-3 mr-1" />
                                                                    Done
                                                                </span>
                                                            )}
                                                            {current && !isProductionComplete && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    <ClockIcon className="h-3 w-3 mr-1 animate-pulse" />
                                                                    Active
                                                                </span>
                                                            )}
                                                            {isUpcoming && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500">
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                            {isProductionComplete && idx === productionStages.length - 1 && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                    <SolidCheckCircle className="h-3 w-3 mr-1" />
                                                                    Done
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Action buttons */}
                                <div className="mt-8 pt-6 border-t border-stone-200/60 flex flex-wrap gap-3 justify-end">
                                    {isProductionComplete ? (
                                        <div className="text-emerald-700 font-medium text-sm flex items-center gap-2">
                                            <SolidCheckCircle className="h-5 w-5" />
                                            Production Completed
                                        </div>
                                    ) : (
                                        <>
                                            {nextStage && (
                                                <button
                                                    onClick={() => advanceStage(nextStage)}
                                                    className="px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/50"
                                                >
                                                    Advance to {stageLabels[nextStage]}
                                                </button>
                                            )}
                                            {canCompleteProduction && (
                                                <button
                                                    onClick={completeProduction}
                                                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                >
                                                    Complete Production
                                                </button>
                                            )}
                                            {!nextStage && !canCompleteProduction && (
                                                <button
                                                    onClick={() => advanceStage('carpentry')}
                                                    className="px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors"
                                                >
                                                    Start Production (Carpentry)
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Transition>
        </AdminLayout>
    );
}
