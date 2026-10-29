import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Transition } from '@headlessui/react';
import {
    ShoppingBagIcon,
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
    WrenchScrewdriverIcon,
    ChevronDownIcon,
    PaintBrushIcon,
    CubeIcon,
    SparklesIcon,
    ReceiptPercentIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';

const formatPrice = (value) => `₱${Number(value || 0).toFixed(2)}`;

const STAGE_ICONS = {
    carpentry:    TruckIcon,
    wood_filling: DocumentTextIcon,
    sanding:      PencilSquareIcon,
    varnishing:   CheckCircleIcon,
};

export default function Show({ order, employees = [], productionStages = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        status: order.status,
    });

    const statusOptions = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'];

    const handleStatusUpdate = (e) => {
        e.preventDefault();
        put(route('admin.orders.update-status', order.id));
    };

    /* ── Production stages ── */
    const stages = productionStages.map((s) => s.key);
    const stageLabels = Object.fromEntries(productionStages.map((s) => [s.key, s.label]));

    const currentStage = order.production_stage;
    const isProcessing = order.status === 'processing';
    const isProductionComplete = currentStage === 'completed';

    const getStageIndex = (stage) => stages.indexOf(stage);
    const currentIndex = currentStage ? getStageIndex(currentStage) : -1;

    const isStageCompleted = (stage) => {
        if (isProductionComplete) return true;
        return getStageIndex(stage) < currentIndex;
    };
    const isStageCurrent = (stage) => currentStage === stage;

    const [modalOpen, setModalOpen] = useState(false);

    const advanceStage = (stage) => {
        router.put(route('admin.orders.update-production-stage', order.id),
            { stage }, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
    };

    const completeProduction = () => {
        if (confirm('Mark production as completed? This will allow the order to be shipped.')) {
            router.post(route('admin.orders.complete-production', order.id), {},
                { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const getNextStage = () => {
        if (isProductionComplete) return null;
        if (currentIndex === -1) return stages[0] || null;
        return stages[currentIndex + 1] || null;
    };
    const nextStage = getNextStage();
    const canCompleteProduction = currentStage === stages[stages.length - 1] && !isProductionComplete;

    /* ── Labor handlers ── */
    const assignWorker = (orderItemId, employeeId) => {
        router.put(route('admin.orders.items.assign', orderItemId),
            { assigned_employee_id: employeeId || null },
            { preserveScroll: true, preserveState: true });
    };
    const updateLaborCost = (orderItemId, value) => {
        router.put(route('admin.orders.items.labor-cost', orderItemId),
            { labor_cost: value === '' ? null : value },
            { preserveScroll: true, preserveState: true });
    };
    const completeLabor = (orderItemId) => {
        router.post(route('admin.orders.items.complete', orderItemId), {},
            { preserveScroll: true, preserveState: true });
    };

    const laborStatusClasses = {
        pending:     'bg-stone-100 text-stone-700',
        assigned:    'bg-amber-100 text-amber-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed:   'bg-emerald-100 text-emerald-800',
    };

    const pendingAssignmentCount = (order.items || []).filter(
        (i) => i.labor_status === 'pending' || !i.assigned_employee_id
    ).length;

    return (
        <AdminLayout>
            <Head title={`Order #${order.order_number}`} />
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                    Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                                    {new Date(order.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                    order.status === 'accepted'  ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'processing'? 'bg-amber-100 text-amber-800' :
                                    'bg-stone-100 text-stone-700'
                                }`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <span className="text-lg font-bold text-stone-900">
                                    {formatPrice(order.total)}
                                </span>
                            </div>
                        </div>

                        {/* Status form */}
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
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-md hover:bg-[#5A3E2B] disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Update Status'}
                                </button>
                                {errors.status && <p className="text-rose-600 text-xs">{errors.status}</p>}
                            </form>
                        </div>

                        {/* Production progress */}
                        {isProcessing && (
                            <div
                                className="p-4 sm:p-6 border-b border-stone-200/60 bg-stone-50/50 cursor-pointer hover:bg-stone-100/50"
                                onClick={() => setModalOpen(true)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TruckIcon className="h-5 w-5 text-[#6F4E37]" />
                                        <h2 className="text-base font-semibold text-stone-900">Production Progress</h2>
                                        {isProductionComplete ? (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                <SolidCheckCircle className="h-3 w-3 mr-1" /> Completed
                                            </span>
                                        ) : (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <ClockIcon className="h-3 w-3 mr-1" /> In Progress
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

                                <div className="mt-4 flex items-center gap-2 overflow-x-auto">
                                    {stages.map((stage, idx) => {
                                        const completed = isStageCompleted(stage);
                                        const current = isStageCurrent(stage);
                                        const label = stageLabels[stage] || stage;
                                        return (
                                            <div key={stage} className="flex items-center flex-shrink-0">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                                                    completed ? 'bg-emerald-100 text-emerald-800' :
                                                    current   ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300' :
                                                    'bg-stone-100 text-stone-400'
                                                }`}>
                                                    {completed ? <SolidCheckCircle className="h-4 w-4" /> :
                                                     current   ? <ClockIcon className="h-4 w-4 animate-pulse" /> :
                                                     <ClockIcon className="h-4 w-4 opacity-40" />}
                                                    <span className="whitespace-nowrap">{label}</span>
                                                </div>
                                                {idx < stages.length - 1 && (
                                                    <ArrowRightIcon className="h-4 w-4 text-stone-300 mx-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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

                        {/* Order details grid */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-stone-400" /> Customer
                                </h2>
                                <p className="text-sm text-stone-700">{order.user?.name}</p>
                                <p className="text-sm text-stone-500">{order.user?.email}</p>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                    <CurrencyDollarIcon className="h-4 w-4 text-stone-400" /> Payment
                                </h2>
                                <p className="text-sm text-stone-700">
                                    Status: <span className="font-medium">{order.payment_status}</span>
                                </p>
                                {order.payments.map((p) => (
                                    <div key={p.id} className="text-sm text-stone-600 border-t border-stone-50 pt-1 mt-1">
                                        <span>{p.type === 'down_payment' ? 'Down Payment' : 'Full Payment'} – {p.method}</span>
                                        <span className="ml-2 font-medium">{formatPrice(p.amount)}</span>
                                        <span className="ml-2 capitalize text-xs text-stone-400">{p.status}</span>
                                    </div>
                                ))}
                            </div>

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

                        {/* Items — rich cards matching cart breakdown */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60">
                            <h2 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <ShoppingBagIcon className="h-4 w-4 text-stone-400" /> Items ({order.items.length})
                            </h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <OrderItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>

                        {/* Production assignment */}
                        <div className="p-4 sm:p-6 border-t border-stone-200/60 bg-stone-50/30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-[#6F4E37]" />
                                    <h2 className="text-base font-semibold text-stone-900">Production Assignment</h2>
                                </div>
                                <span className="text-xs text-stone-500">{pendingAssignmentCount} pending</span>
                            </div>

                            <div className="space-y-3">
                                {order.items.map((item) => {
                                    const statusClass = laborStatusClasses[item.labor_status] || laborStatusClasses.pending;
                                    const isCompleted = item.labor_status === 'completed';
                                    return (
                                        <div key={`assign-${item.id}`} className="bg-white rounded-lg border border-stone-200 p-3">
                                            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-stone-900 truncate">
                                                        {item.product?.name}
                                                        {item.variant && (
                                                            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#6F4E37]/10 text-[#6F4E37] uppercase tracking-wide">
                                                                {item.variant.name}
                                                            </span>
                                                        )}
                                                        <span className="text-stone-400 font-normal ml-1">× {item.quantity}</span>
                                                    </p>
                                                    {item.assignedEmployee && (
                                                        <p className="text-[11px] text-stone-500 mt-0.5">
                                                            Assigned to <strong>{item.assignedEmployee.name}</strong>
                                                            {item.assigned_at && ` on ${new Date(item.assigned_at).toLocaleDateString()}`}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <select
                                                        value={item.assigned_employee_id || ''}
                                                        onChange={(e) => assignWorker(item.id, e.target.value)}
                                                        disabled={isCompleted}
                                                        className="rounded-lg border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] disabled:bg-stone-100 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="">— Unassigned —</option>
                                                        {employees.map((emp) => (
                                                            <option key={emp.id} value={emp.id}>
                                                                {emp.name}{emp.position ? ` · ${emp.position}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">₱</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="Labor cost"
                                                            defaultValue={item.labor_cost || ''}
                                                            disabled={isCompleted}
                                                            onBlur={(e) => updateLaborCost(item.id, e.target.value)}
                                                            className="w-32 rounded-lg border-stone-300 bg-white pl-7 pr-2 py-1.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] disabled:bg-stone-100 disabled:cursor-not-allowed"
                                                        />
                                                    </div>

                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}>
                                                        {item.labor_status.replace('_', ' ')}
                                                    </span>

                                                    {!isCompleted && item.assigned_employee_id && (
                                                        <button
                                                            onClick={() => completeLabor(item.id)}
                                                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition"
                                                        >
                                                            <CheckCircleIcon className="h-3.5 w-3.5 mr-1" /> Mark Done
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

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

            {/* Production modal */}
            <Transition show={modalOpen}>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Transition.Child
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0" enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100" leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    </Transition.Child>
                    <Transition.Child
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="scale-95 opacity-0" enterTo="scale-100 opacity-100"
                        leave="transition ease-in-out duration-200 transform"
                        leaveFrom="scale-100 opacity-100" leaveTo="scale-95 opacity-0"
                    >
                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TruckIcon className="h-6 w-6 text-[#6F4E37]" />
                                    <h3 className="text-lg font-bold text-stone-900">Manage Production</h3>
                                </div>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="px-6 py-6">
                                <div className="mb-6 text-sm text-stone-600">
                                    <span className="font-medium">Order #{order.order_number}</span>
                                    <span className="mx-2">•</span>
                                    <span>Status: <span className="font-medium capitalize">{order.status}</span></span>
                                    <span className="mx-2">•</span>
                                    <span>Total: {formatPrice(order.total)}</span>
                                </div>

                                <div className="space-y-0">
                                    {stages.map((stage, idx) => {
                                        const completed = isStageCompleted(stage);
                                        const current = isStageCurrent(stage);
                                        const Icon = STAGE_ICONS[stage] || CheckCircleIcon;
                                        const label = stageLabels[stage] || stage;
                                        const isLast = idx === stages.length - 1;
                                        const isUpcoming = !completed && !current && !isProductionComplete;
                                        return (
                                            <div key={stage} className="relative flex items-start gap-4">
                                                {!isLast && (
                                                    <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-stone-200 -ml-px" />
                                                )}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                                                    completed ? 'bg-emerald-100 text-emerald-700' :
                                                    current   ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-200' :
                                                    'bg-stone-100 text-stone-400'
                                                }`}>
                                                    {completed ? <SolidCheckCircle className="h-5 w-5" /> :
                                                     current   ? <ClockIcon className="h-5 w-5 animate-pulse" /> :
                                                     <Icon className="h-5 w-5 opacity-50" />}
                                                </div>
                                                <div className="flex-1 pb-6 pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`font-medium ${completed || current ? 'text-stone-900' : 'text-stone-500'}`}>
                                                                {label}
                                                            </p>
                                                            <p className="text-xs text-stone-500 mt-0.5">
                                                                {completed ? 'Completed' : current ? 'In progress' : 'Pending'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            {completed && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                    <SolidCheckCircle className="h-3 w-3 mr-1" /> Done
                                                                </span>
                                                            )}
                                                            {current && !isProductionComplete && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    <ClockIcon className="h-3 w-3 mr-1 animate-pulse" /> Active
                                                                </span>
                                                            )}
                                                            {isUpcoming && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500">
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 pt-6 border-t border-stone-200/60 flex flex-wrap gap-3 justify-end">
                                    {isProductionComplete ? (
                                        <div className="text-emerald-700 font-medium text-sm flex items-center gap-2">
                                            <SolidCheckCircle className="h-5 w-5" /> Production Completed
                                        </div>
                                    ) : (
                                        <>
                                            {nextStage && (
                                                <button onClick={() => advanceStage(nextStage)}
                                                    className="px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B]">
                                                    Advance to {stageLabels[nextStage] || nextStage}
                                                </button>
                                            )}
                                            {canCompleteProduction && (
                                                <button onClick={completeProduction}
                                                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
                                                    Complete Production
                                                </button>
                                            )}
                                            {!nextStage && !canCompleteProduction && (
                                                <button onClick={() => advanceStage(stages[0])}
                                                    className="px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B]">
                                                    Start Production ({stageLabels[stages[0]] || stages[0]})
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

/* ══════════════════════════════════════════════════════════════
 *  ORDER ITEM CARD
 *  Compact hero row + expandable detailed breakdown
 *  Mirrors the cart page's ExpandedCustomizationDetails component
 * ══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
 *  ORDER ITEM CARD
 *  Compact row + expanded breakdown that matches the cart layout
 * ══════════════════════════════════════════════════════════════ */
function OrderItemCard({ item }) {
    const [expanded, setExpanded] = useState(false);

    const heroImage = item.display_image_path ? `/storage/${item.display_image_path}` : null;
    const surcharge = Number(item.customization_surcharge_total ?? item.customization_surcharge ?? 0);
    const unitPrice = Number(item.unit_price_with_labor ?? item.price ?? 0);
    const lineTotal = Number(item.line_total ?? (unitPrice * item.quantity + surcharge));

    const parts = item.parts_breakdown || [];
    const customizedCount = Number(item.customized_parts_count ?? 0);
    const finishSurcharge  = Number(item.finish_surcharge ?? 0);
    const designSurcharge  = Number(item.design_surcharge ?? 0);
    const materialCostDiff = Number(item.material_cost_diff ?? 0);
    const finishOption     = item.finish_option_resolved || (item.finish_option ?? 'ordinary');

    return (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {/* ══════════ COMPACT HERO ROW ══════════ */}
            <div className="flex gap-4 p-4">
                <div className="h-24 w-24 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                    {heroImage ? (
                        <img src={heroImage} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <ShoppingBagIcon className="h-8 w-8" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900">
                                {item.product?.name}
                                <span className="text-stone-400 font-normal ml-1">× {item.quantity}</span>
                            </p>
                            {item.variant && (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#6F4E37]/10 text-[#6F4E37]">
                                    {item.variant.name}
                                </span>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-stone-900">{formatPrice(lineTotal)}</p>
                            {surcharge > 0 && (
                                <p className="text-[10px] text-stone-500 mt-0.5">
                                    {formatPrice(unitPrice)} × {item.quantity} + {formatPrice(surcharge)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 ring-1 ring-amber-100">
                            {item.finish_label}
                        </span>
                        {parts.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-700 ring-1 ring-stone-200">
                                <CubeIcon className="h-3 w-3" />
                                {parts.length} part{parts.length === 1 ? '' : 's'}
                            </span>
                        )}
                        {customizedCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-800 ring-1 ring-blue-100">
                                <PencilSquareIcon className="h-3 w-3" />
                                {customizedCount} customized
                            </span>
                        )}
                        {surcharge > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
                                +{formatPrice(surcharge)} customization
                            </span>
                        )}
                    </div>

                    {/* Expand toggle — always visible now */}
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#6F4E37] hover:underline"
                    >
                        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        {expanded ? 'Hide' : 'Show'} full breakdown
                    </button>
                </div>
            </div>

            {/* ══════════ EXPANDED — full breakdown ══════════ */}
            {expanded && (
                <div className="px-4 pb-4 bg-stone-50/40">
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">

                        {/* HERO: image + wood + finish */}
                        <div className="flex flex-col sm:flex-row gap-5 p-5 bg-gradient-to-br from-amber-50/40 via-stone-50/30 to-white border-b border-stone-100">
                            <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-100 shrink-0 shadow-md self-center sm:self-start">
                                {heroImage ? (
                                    <img src={heroImage} alt={item.product?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                                        <CubeIcon className="h-10 w-10" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-3">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-0.5">
                                        Wood Type
                                    </p>
                                    <p className="text-base font-bold text-stone-900">
                                        {item.variant?.name || 'Standard Wood'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-0.5">
                                        Finish
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-stone-900">
                                            {finishOption === 'standard' ? 'Standard' : 'Ordinary'}
                                        </span>
                                        {finishSurcharge > 0 && (
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                +₱{finishSurcharge.toFixed(2)}
                                            </span>
                                        )}
                                        {finishOption === 'ordinary' && (
                                            <span className="text-xs font-medium text-stone-500">no varnish applied</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {surcharge > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6F4E37] bg-[#6F4E37]/10 px-2 py-1 rounded-full">
                                            <SparklesIcon className="h-3 w-3" /> Customized
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                        Qty: {item.quantity}
                                    </span>
                                    {parts.length > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                            <CubeIcon className="h-3 w-3" /> {parts.length} part{parts.length === 1 ? '' : 's'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ALL PARTS */}
                        {parts.length > 0 ? (
                            <div className="p-5 border-b border-stone-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <CubeIcon className="h-4 w-4 text-[#6F4E37]" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                                        Furniture Parts ({parts.length})
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {parts.map((part) => (
                                        <PartDetailCard key={part.part_id} part={part} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 border-b border-stone-100">
                                <div className="text-xs text-stone-500 italic">
                                    No parts configured for this product.
                                </div>
                            </div>
                        )}

                        {/* PRICE BREAKDOWN */}
                        <div className="p-5 bg-gradient-to-br from-stone-50/50 to-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ReceiptPercentIcon className="h-4 w-4 text-[#6F4E37]" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                                            Price Breakdown
                                        </h4>
                                    </div>
                                    <div className="space-y-1.5 text-xs bg-white rounded-lg border border-stone-200 p-3">
                                        {materialCostDiff > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-600">Material cost (custom − standard)</span>
                                                <span className="font-semibold text-stone-900">+₱{materialCostDiff.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {finishSurcharge > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-600">Standard finish</span>
                                                <span className="font-semibold text-stone-900">+₱{finishSurcharge.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {designSurcharge > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-600">Premium designs</span>
                                                <span className="font-semibold text-stone-900">+₱{designSurcharge.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {surcharge === 0 && (
                                            <div className="flex justify-between text-stone-400">
                                                <span>No customization surcharge</span>
                                                <span>₱0.00</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 mt-2 border-t border-stone-200">
                                            <span className="font-bold text-stone-900">Total Surcharge</span>
                                            <span className="font-bold text-[#6F4E37]">{formatPrice(surcharge)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckBadgeIcon className="h-4 w-4 text-emerald-600" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                                            Line Total
                                        </h4>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between text-emerald-800">
                                                <span>Unit price</span>
                                                <span className="font-medium">{formatPrice(unitPrice)}</span>
                                            </div>
                                            <div className="flex justify-between text-emerald-800">
                                                <span>Quantity</span>
                                                <span className="font-medium">× {item.quantity}</span>
                                            </div>
                                            <div className="flex justify-between text-emerald-800">
                                                <span>Customization surcharge</span>
                                                <span className="font-medium">+ {formatPrice(surcharge)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-between items-baseline">
                                            <span className="text-sm font-bold text-emerald-900">Total</span>
                                            <span className="text-lg font-black text-emerald-900">{formatPrice(lineTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
 *  PART DETAIL CARD — shows EVERY part with Standard/Customized badge
 * ══════════════════════════════════════════════════════════════ */
function PartDetailCard({ part }) {
    const refImage = part.reference_image;
    const designImage = part.design_image_path ? `/storage/${part.design_image_path}` : null;
    const dims = part.dimensions || [];
    const isCustomized = !!part.is_customized;

    return (
        <div className={`rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
            isCustomized
                ? 'bg-gradient-to-br from-amber-50/50 via-white to-stone-50/40 border-[#6F4E37]/30 ring-1 ring-[#6F4E37]/10'
                : 'bg-gradient-to-br from-stone-50 via-white to-stone-50/40 border-stone-200'
        }`}>
            {/* Header */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b ${
                isCustomized ? 'bg-amber-100/60 border-amber-200' : 'bg-stone-100/80 border-stone-200'
            }`}>
                {refImage ? (
                    <img src={refImage} alt={part.part_name}
                         className="h-8 w-8 rounded-md object-cover border border-stone-300 shadow-sm" />
                ) : (
                    <div className="h-8 w-8 rounded-md bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-xs shadow-sm">
                        {part.part_name.charAt(0)}
                    </div>
                )}
                <p className="text-sm font-bold text-stone-900 flex-1 min-w-0 truncate">
                    {part.part_name}
                </p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shrink-0 ${
                    isCustomized
                        ? 'bg-[#6F4E37] text-white'
                        : 'bg-stone-200 text-stone-600'
                }`}>
                    {isCustomized ? 'Customized' : 'Standard'}
                </span>
            </div>

            {/* Body */}
            <div className="flex gap-3 p-3">
                {/* Design image */}
                {designImage ? (
                    <div className="h-28 w-28 rounded-lg overflow-hidden border-2 border-stone-200 bg-white shrink-0 shadow-sm">
                        <img src={designImage} alt={part.design_name} className="h-full w-full object-cover" />
                    </div>
                ) : part.design_name ? (
                    <div className="h-28 w-28 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 border-2 border-stone-200">
                        <PaintBrushIcon className="h-10 w-10 text-stone-300" />
                    </div>
                ) : null}

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2.5">
                    {part.design_name ? (
                        <div>
                            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-0.5">
                                Design
                            </p>
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="text-xs font-semibold text-stone-900 truncate">
                                    {part.design_name}
                                    {part.design_is_default && (
                                        <span className="ml-1 text-[9px] text-stone-400 font-normal">(default)</span>
                                    )}
                                </p>
                                {part.design_cost > 0 ? (
                                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                                        +₱{part.design_cost.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-stone-400 shrink-0">Included</span>
                                )}
                            </div>
                        </div>
                    ) : part.allow_design ? (
                        <div>
                            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-0.5">
                                Design
                            </p>
                            <p className="text-xs text-stone-400 italic">No design selected</p>
                        </div>
                    ) : null}

                    {dims.length > 0 ? (
                        <div>
                            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-1">
                                Dimensions
                            </p>
                            <div className="space-y-0.5">
                                {dims.map((d) => (
                                    <div key={d.field} className="flex items-baseline justify-between text-[11px] gap-2">
                                        <span className="text-stone-500 capitalize shrink-0">{d.field}</span>
                                        <span className={`font-medium text-right ${d.changed ? 'text-[#6F4E37] font-bold' : 'text-stone-700'}`}>
                                            {d.custom ?? d.standard ?? '—'}
                                            {d.changed && d.standard !== null && (
                                                <span className="text-stone-400 ml-1.5 font-normal">
                                                    (std {d.standard})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {part.dimension_cost > 0 && (
                                <p className="text-[10px] font-bold text-emerald-600 mt-1.5">
                                    +₱{part.dimension_cost.toFixed(2)} size adjustment
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-0.5">
                                Dimensions
                            </p>
                            <p className="text-xs text-stone-400 italic">No dimensions configured</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
