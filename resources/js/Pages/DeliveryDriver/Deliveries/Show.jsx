import DeliveryDriverLayout from '@/Layouts/DeliveryDriverLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    MapPinIcon,
    UserIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    BanknotesIcon,
    CameraIcon,
} from '@heroicons/react/24/outline';
import DeliveryRouteMap from '@/Components/DeliveryRouteMap';

const formatPrice = (v) => `₱${Number(v).toFixed(2)}`;

export default function Show({ delivery, storeLocation }) {
    // ─── Status update form ───
    const { data, setData, post, processing, errors } = useForm({
        status: delivery.status,
        proof_image: null,
    });

    // ─── Balance collection form ───
    const [collection, setCollection] = useState({
        amount: '',
        method: 'cash',
        reference_number: '',
    });
    const [collecting, setCollecting] = useState(false);
    const [collectError, setCollectError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('driver.deliveries.update-status', delivery.id), {
            forceFormData: true,
        });
    };

    const handleCollect = (e) => {
        e.preventDefault();
        setCollecting(true);
        setCollectError(null);

        router.post(
            route('driver.deliveries.collect-balance', delivery.id),
            {
                amount: collection.amount,
                method: collection.method,
                reference_number: collection.reference_number || null,
            },
            {
                onFinish: () => setCollecting(false),
                onError: (errs) => {
                    setCollectError(errs.error || errs.amount || 'Failed to record payment.');
                },
            }
        );
    };

    // ─── Derived state ───
    const statusOptions = ['picked_up', 'in_transit', 'delivered', 'failed'];

    const isDelivered = delivery.status === 'delivered';
    const isCompleted = delivery.status === 'completed';
    const isFailed = delivery.status === 'failed';

    // Payment info
    const totalPaid =
        delivery.order?.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
    const remaining = Math.max(0, Number(delivery.order?.total) - totalPaid);
    const balanceCollected = (delivery.order?.payments || []).some(
        (p) => p.type === 'remaining_balance' && p.status === 'paid'
    );

    // ✅ Only show collect panel when the delivery is already DELIVERED
    const showCollectPanel = isDelivered && !balanceCollected && remaining > 0.01;

    const customerLocation =
        delivery.order?.latitude && delivery.order?.longitude
            ? {
                  latitude: Number(delivery.order.latitude),
                  longitude: Number(delivery.order.longitude),
                  address: delivery.order.shipping_address,
              }
            : null;

    // Pre-fill amount once remaining is known
    if (collection.amount === '' && remaining > 0) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        setCollection((c) => ({ ...c, amount: remaining.toFixed(2) }));
    }

    // ✅ Proof image required only when selecting "delivered"
    const proofRequired = data.status === 'delivered';

    return (
        <DeliveryDriverLayout>
            <Head title={`Delivery #${delivery.tracking_number}`} />

            <div className="max-w-3xl mx-auto space-y-4">
                {/* ─── Header ─── */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h1 className="text-xl font-bold text-stone-900">
                                Delivery #{delivery.tracking_number}
                            </h1>
                            <p className="text-sm text-stone-500">
                                Order #{delivery.order?.order_number}
                            </p>
                        </div>
                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                                isCompleted ? 'bg-emerald-100 text-emerald-800' :
                                isDelivered ? 'bg-blue-100 text-blue-800' :
                                isFailed ? 'bg-red-100 text-red-800' :
                                delivery.status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
                                delivery.status === 'picked_up' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {delivery.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* ─── Customer & Shipping ─── */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-3">
                    <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-stone-400" /> Customer
                    </h2>
                    <p className="text-sm text-stone-700">{delivery.order?.user?.name}</p>
                    {delivery.order?.user?.email && (
                        <p className="text-xs text-stone-500">{delivery.order.user.email}</p>
                    )}

                    <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mt-4">
                        <MapPinIcon className="h-4 w-4 text-stone-400" /> Delivery Address
                    </h2>
                    <p className="text-sm text-stone-700">{delivery.order?.shipping_address}</p>
                    {delivery.zone?.name && (
                        <p className="text-xs text-stone-500">Zone: {delivery.zone.name}</p>
                    )}
                </div>

                {/* ─── Route Map ─── */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 sm:p-6">
                    <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
                        🗺️ Delivery Route
                    </h2>
                    <DeliveryRouteMap
                        store={storeLocation}
                        customer={customerLocation}
                        height={380}
                    />
                </div>

                {/* ─── Payment Summary ─── */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-2">
                    <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                        <CurrencyDollarIcon className="h-4 w-4 text-stone-400" /> Payment
                    </h2>
                    <p className="text-sm text-stone-700 flex justify-between">
                        <span>Order Total</span>
                        <span className="font-medium">{formatPrice(delivery.order?.total)}</span>
                    </p>
                    <p className="text-sm text-stone-700 flex justify-between">
                        <span>Total Paid</span>
                        <span className="font-medium text-green-600">
                            {formatPrice(totalPaid)}
                        </span>
                    </p>
                    {remaining > 0 && !balanceCollected && (
                        <p className="text-sm flex justify-between border-t border-stone-100 pt-2 mt-2">
                            <span className="text-stone-700">Remaining (Collect on Delivery)</span>
                            <span className="font-bold text-orange-600">
                                {formatPrice(remaining)}
                            </span>
                        </p>
                    )}
                    {balanceCollected && (
                        <div className="text-sm flex justify-between border-t border-stone-100 pt-2 mt-2">
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircleIcon className="h-4 w-4" />
                                Fully Paid
                            </span>
                            <span className="font-bold text-emerald-600">₱0.00 due</span>
                        </div>
                    )}
                    <p className="text-xs text-stone-500 mt-1">
                        Status:{' '}
                        <span className="font-medium capitalize">
                            {delivery.order?.payment_status}
                        </span>
                    </p>
                </div>

                {/* ─── STEP 1: Update Status (until delivered) ─── */}
                {!isDelivered && !isCompleted && !isFailed && (
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-4"
                    >
                        <div>
                            <h2 className="text-sm font-semibold text-stone-900">
                                Delivery Progress
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">
                                Update status as you go. A proof-of-delivery photo is required
                                when marking as Delivered.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Status
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full rounded-lg border-stone-300 focus:border-[#6F4E37] focus:ring-[#6F4E37]/20 text-sm"
                            >
                                <option value="picked_up">Picked Up</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered (arrived at customer)</option>
                                <option value="failed">Failed</option>
                            </select>
                            {errors.status && (
                                <div className="text-red-600 text-xs mt-1">{errors.status}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Proof of Delivery Photo{' '}
                                {proofRequired && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => setData('proof_image', e.target.files[0])}
                                className="block w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#6F4E37] file:text-white hover:file:bg-[#5A3E2B]"
                            />
                            {errors.proof_image && (
                                <div className="text-red-600 text-xs mt-1">
                                    {errors.proof_image}
                                </div>
                            )}
                            <p className="text-xs text-stone-400 mt-1">
                                Take a photo of the delivered goods at the customer's location.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50 transition"
                        >
                            <CameraIcon className="h-4 w-4 mr-2" />
                            {processing ? 'Updating...' : 'Update Status'}
                        </button>
                    </form>
                )}

                {/* ─── STEP 2: Collect Balance (only when delivered) ─── */}
                {showCollectPanel && (
                    <form
                        onSubmit={handleCollect}
                        className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <BanknotesIcon className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-stone-900">
                                    Collect Remaining Balance
                                </h2>
                                <p className="text-xs text-stone-500">
                                    Record the payment received from the customer upon delivery.
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-sm text-amber-900">
                                <strong>Amount Due:</strong>{' '}
                                <span className="text-lg font-bold">
                                    {formatPrice(remaining)}
                                </span>
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Amount Received (₱)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={collection.amount}
                                    onChange={(e) =>
                                        setCollection({
                                            ...collection,
                                            amount: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border-stone-300 focus:border-[#6F4E37] focus:ring-[#6F4E37]/20 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={collection.method}
                                    onChange={(e) =>
                                        setCollection({
                                            ...collection,
                                            method: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border-stone-300 focus:border-[#6F4E37] focus:ring-[#6F4E37]/20 text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="gcash">GCash</option>
                                    <option value="paymongo">PayMongo</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Reference Number (optional)
                            </label>
                            <input
                                type="text"
                                value={collection.reference_number}
                                onChange={(e) =>
                                    setCollection({
                                        ...collection,
                                        reference_number: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border-stone-300 focus:border-[#6F4E37] focus:ring-[#6F4E37]/20 text-sm"
                                placeholder="e.g. GCash ref number"
                            />
                        </div>

                        {collectError && (
                            <div className="text-red-600 text-sm">{collectError}</div>
                        )}

                        <button
                            type="submit"
                            disabled={collecting}
                            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
                        >
                            <BanknotesIcon className="h-4 w-4 mr-2" />
                            {collecting ? 'Recording...' : 'Confirm Payment & Complete Order'}
                        </button>

                        <p className="text-xs text-stone-500">
                            Submitting this will mark the order as{' '}
                            <strong>Fully Paid</strong> and <strong>Completed</strong>, and notify
                            the Manager &amp; Admin.
                        </p>
                    </form>
                )}

                {/* ─── STEP 3: Completed banner ─── */}
                {isCompleted && (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
                        <CheckCircleIcon className="h-12 w-12 text-emerald-600 mx-auto" />
                        <h3 className="mt-2 text-lg font-bold text-emerald-900">
                            Delivery Completed
                        </h3>
                        <p className="text-sm text-emerald-700 mt-1">
                            Order #{delivery.order?.order_number} — Fully Paid &amp; Delivered
                        </p>
                    </div>
                )}

                {/* ─── Proof of Delivery (once uploaded) ─── */}
                {delivery.proof_image && (
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                        <h2 className="text-sm font-semibold text-stone-900 mb-2">
                            Proof of Delivery
                        </h2>
                        <img
                            src={`/storage/${delivery.proof_image}`}
                            alt="Proof of delivery"
                            className="h-48 object-cover rounded-lg border border-stone-200"
                        />
                    </div>
                )}

                {/* ─── Notes ─── */}
                {delivery.order?.notes && (
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                        <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-2">
                            <DocumentTextIcon className="h-4 w-4 text-stone-400" /> Order Notes
                        </h2>
                        <p className="text-sm text-stone-700">{delivery.order.notes}</p>
                    </div>
                )}

                {/* ─── Back ─── */}
                <div>
                    <Link
                        href={route('driver.deliveries.index')}
                        className="inline-flex items-center text-sm text-stone-500 hover:text-[#6F4E37] transition"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Deliveries
                    </Link>
                </div>
            </div>
        </DeliveryDriverLayout>
    );
}
