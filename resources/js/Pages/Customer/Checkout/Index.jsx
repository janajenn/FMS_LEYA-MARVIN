import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    MapPinIcon, ShoppingBagIcon, CreditCardIcon,
    CurrencyDollarIcon, ArrowLeftIcon, CheckCircleIcon, WrenchIcon, TruckIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import DeliveryZoneMap from '@/Components/DeliveryZoneMap';
import LocationConfirmationModal from '@/Components/LocationConfirmationModal';

export default function Checkout({
    cartItems = [],
    subtotal = 0,
    woodSubtotal: initialWoodSubtotal = 0,
    laborSubtotal: initialLaborSubtotal = 0,
    customizationSurcharge: initialSurcharge = 0,
    deliveryFee: initialDeliveryFee = 0,
    grandTotal: initialGrandTotal = 0,
    downPayment: initialDownPayment = 0,
    selectedIds = [],
    storeLocation = null,
    estimatedDays = 3,
}) {
    const selectedIdsString = Array.isArray(selectedIds) ? selectedIds.join(',') : '';

    const [deliveryResult, setDeliveryResult] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);
    const [customizationSurcharge] = useState(initialSurcharge);
    const [grandTotal, setGrandTotal] = useState(initialGrandTotal);
    const [downPayment, setDownPayment] = useState(initialDownPayment);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [tempLat, setTempLat] = useState(null);
    const [tempLng, setTempLng] = useState(null);
    const [tempAddress, setTempAddress] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        shipping_address: '',
        notes: '',
        payment_method: 'cash_on_delivery',
        selected_ids: selectedIdsString,
        latitude: null,
        longitude: null,
    });

    const isCOD = data.payment_method === 'cash_on_delivery';
    const deliverable = deliveryResult?.deliverable ?? false;

    /* Marker position: shows temp coords while confirming, else confirmed coords */
    const markerPosition =
        (tempLat != null && tempLng != null)
            ? { lat: tempLat, lng: tempLng }
            : (data.latitude != null && data.longitude != null)
                ? { lat: data.latitude, lng: data.longitude }
                : null;

    useEffect(() => {
        const newGrandTotal = subtotal + customizationSurcharge + deliveryFee;
        setGrandTotal(newGrandTotal);
        setDownPayment(newGrandTotal * 0.5);
    }, [deliveryFee, subtotal, customizationSurcharge]);

    const handleMapClick = async (lat, lng) => {
        setTempLat(lat);
        setTempLng(lng);
        setShowConfirmationModal(true);
        setIsLoadingLocation(true);

        try {
            const geo = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            ).then((r) => r.json());
            setTempAddress(geo?.display_name || 'Address not found');

            const feeData = await fetch(
                route('customer.delivery-fee', { lat, lng })
            ).then((r) => r.json());

            setDeliveryResult(feeData);
        } catch (e) {
            console.error('Map interaction failed', e);
            setTempAddress('Unable to fetch address');
            setDeliveryResult(null);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const confirmLocation = () => {
        setData('shipping_address', tempAddress);
        setData('latitude', tempLat);
        setData('longitude', tempLng);
        setDeliveryFee(deliveryResult?.fee ?? 0);
        setShowConfirmationModal(false);
    };

    const cancelLocation = () => {
        setShowConfirmationModal(false);
        setTempLat(null);
        setTempLng(null);
        setTempAddress('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!deliverable) {
            alert('Please select a deliverable location on the map.');
            return;
        }
        post(route('customer.checkout.store'));
    };

    const getItemImage = (item) => {
        if (item.display_image_path) return `/storage/${item.display_image_path}`;
        if (item.product?.images?.length) return `/storage/${item.product.images[0].path}`;
        return '/images/placeholder.png';
    };

    const getUnitPrice = (item) => {
        if (item.base_price != null) return Number(item.base_price);
        const wood = Number(item.variant?.price ?? item.product?.price ?? 0);
        const labor = Number(item.labor_cost ?? item.product?.labor_cost ?? 0);
        return wood + labor;
    };
    const getUnitLabor = (item) => Number(item.labor_cost ?? item.product?.labor_cost ?? 0);

    const computedWoodSubtotal = initialWoodSubtotal || cartItems.reduce(
        (s, i) => s + (getUnitPrice(i) - getUnitLabor(i)) * i.quantity, 0
    );
    const computedLaborSubtotal = initialLaborSubtotal || cartItems.reduce(
        (s, i) => s + getUnitLabor(i) * i.quantity, 0
    );

  const paymentMethods = [
    { value: 'cash_on_delivery', label: 'Pay 50% Downpayment', icon: BanknotesIcon, description: 'Pay 50% when placing the order and the remaining 50% upon delivery.' },
    { value: 'gcash',            label: 'Pay 100%',            icon: CreditCardIcon, description: 'Pay the full amount upfront.' },

];

    return (
        <CustomerLayout>
            <Head title="Checkout" />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                                <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
                            </div>
                            <Link href={route('customer.cart.index')} className="text-sm text-gray-500 hover:text-[#6F4E37] flex items-center gap-1">
                                <ArrowLeftIcon className="h-4 w-4" /> Back to Cart
                            </Link>
                        </div>

                        <div className="grid lg:grid-cols-5 gap-0">
                            <div className="lg:col-span-3 p-4 sm:p-6 border-r border-gray-100">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <input type="hidden" name="selected_ids" value={data.selected_ids} />

                                    {storeLocation && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Click anywhere on the map to set your delivery location.
                                            </label>
                                            <DeliveryZoneMap
                                                storeLocation={storeLocation}
                                                userLocation={markerPosition}
                                                onMapClick={handleMapClick}
                                                onMarkerDrag={handleMapClick}
                                                height="360px"
                                            />
                                            {deliverable && (
                                                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    <strong>{deliveryResult.tier?.label}</strong>
                                                    <span className="text-gray-500">·</span>
                                                    <span>{deliveryResult.distance_km} km</span>
                                                    <span className="text-gray-500">·</span>
                                                    <span className="font-medium">
                                                        {deliveryFee === 0 ? 'Free delivery' : `₱${deliveryFee.toFixed(2)}`}
                                                    </span>
                                                </p>
                                            )}
                                            {deliveryResult && !deliverable && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                    ⚠ This location is {deliveryResult.distance_km} km away — outside our delivery range.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shipping Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3">
                                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={data.shipping_address}
                                                readOnly
                                                onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
                                                className="block w-full rounded-lg border-gray-200 bg-gray-50/60 pl-10 pr-3 py-2.5 text-sm text-gray-900 cursor-pointer focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                placeholder="Click on the map above to set your address"
                                            />
                                        </div>
                                        {errors.shipping_address && (
                                            <p className="mt-1 text-sm text-red-600">{errors.shipping_address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Order Notes <span className="text-gray-400 text-xs">(optional)</span>
                                        </label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows="2"
                                            placeholder="Special instructions, landmarks, etc."
                                            className="block w-full rounded-lg border-gray-200 bg-gray-50/60 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid gap-2">
                                            {paymentMethods.map((method) => {
                                                const Icon = method.icon;
                                                const selected = data.payment_method === method.value;
                                                return (
                                                    <label
                                                        key={method.value}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                            selected
                                                                ? 'border-[#6F4E37] bg-[#6F4E37]/5'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="payment_method"
                                                            value={method.value}
                                                            checked={selected}
                                                            onChange={(e) => setData('payment_method', e.target.value)}
                                                            className="h-4 w-4 text-[#6F4E37] focus:ring-[#6F4E37]"
                                                        />
                                                        <Icon className={`h-5 w-5 ${selected ? 'text-[#6F4E37]' : 'text-gray-400'}`} />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">{method.label}</p>
                                                            <p className="text-xs text-gray-500">{method.description}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {errors.payment_method && (
                                            <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                                        )}
                                    </div>

                                    {errors.error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                            {errors.error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={processing || !deliverable}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#6F4E37] text-white text-sm font-semibold rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Processing…
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="h-5 w-5" />
                                                {isCOD ? 'Place Order & Pay 50% Downpayment' : 'Pay 100% Now'}
                                            </>
                                        )}
                                    </button>

                                    {!deliverable && (
                                        <p className="text-xs text-center text-gray-500">
                                            Select a delivery location on the map above to enable checkout.
                                        </p>
                                    )}
                                </form>
                            </div>

                            {/* ── Right: Order Summary ── */}
                            <div className="lg:col-span-2 bg-gray-50/60 p-4 sm:p-6">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <ShoppingBagIcon className="h-5 w-5 text-[#6F4E37]" />
                                    Order Summary
                                </h2>

                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 mb-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-3 bg-white rounded-lg p-2 border border-gray-100">
                                            <img
                                                src={getItemImage(item)}
                                                alt={item.product?.name}
                                                className="w-14 h-14 rounded-md object-cover border border-gray-100"
                                                onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.product?.name}
                                                </p>
                                                {item.variant_name && (
                                                    <p className="text-xs text-gray-500 truncate">{item.variant_name}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {item.finish_name && <span>{item.finish_name} · </span>}
                                                    Qty {item.quantity}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                    ₱{(getUnitPrice(item) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <WrenchIcon className="h-3.5 w-3.5" /> Wood subtotal
                                        </span>
                                        <span>₱{computedWoodSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <WrenchIcon className="h-3.5 w-3.5" /> Labor subtotal
                                        </span>
                                        <span>₱{computedLaborSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {customizationSurcharge > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Customization</span>
                                            <span>₱{customizationSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}

                                    {deliverable && deliveryResult?.distance_km != null && (
                                        <div className="flex justify-between text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5" /> Delivery distance
                                            </span>
                                            <span className="font-mono">
                                                {Number(deliveryResult.distance_km).toFixed(2)} km
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <TruckIcon className="h-3.5 w-3.5" /> Delivery fee
                                        </span>
                                        <span>
                                            {!deliverable
                                                ? <span className="text-gray-400">—</span>
                                                : deliveryFee === 0
                                                    ? <span className="text-emerald-600 font-medium">Free</span>
                                                    : `₱${deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                        </span>
                                    </div>

                                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-base font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {isCOD && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                                            <p className="text-xs font-medium text-amber-800">
                                                Down payment (50%) due now:
                                            </p>
                                            <p className="text-sm font-bold text-amber-900 mt-0.5">
                                                ₱{downPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[11px] text-amber-700 mt-1">
                                                Remaining ₱{(grandTotal - downPayment).toLocaleString(undefined, { minimumFractionDigits: 2 })} payable on delivery.
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
    <TruckIcon className="h-3.5 w-3.5" />
    {deliverable && deliveryResult?.estimated_days != null ? (
        <>
            Estimated delivery:{' '}
            <strong className="text-gray-700">
                {deliveryResult.estimated_days} day{deliveryResult.estimated_days === 1 ? '' : 's'}
            </strong>
        </>
    ) : (
        <>Select delivery location to see estimate</>
    )}
</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <LocationConfirmationModal
                isOpen={showConfirmationModal}
                onClose={cancelLocation}
                onConfirm={confirmLocation}
                address={tempAddress}
                setAddress={setTempAddress}
                deliveryResult={deliveryResult}
                lat={tempLat}
                lng={tempLng}
                isLoading={isLoadingLocation}
            />
        </CustomerLayout>
    );
}
