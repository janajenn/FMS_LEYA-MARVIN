// resources/js/Pages/Customer/Checkout/Index.jsx
import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    MapPinIcon,
    PencilSquareIcon,
    ShoppingBagIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import DeliveryZoneMap from '@/Components/DeliveryZoneMap';
import LocationConfirmationModal from '@/Components/LocationConfirmationModal';

export default function Checkout({
    cartItems = [],
    subtotal = 0,
    deliveryFee: initialDeliveryFee = 0,
    grandTotal: initialGrandTotal = 0,
    downPayment: initialDownPayment = 0,
    selectedIds = [],
    deliveryZones = [],
}) {
    const selectedIdsString = Array.isArray(selectedIds) ? selectedIds.join(',') : '';

    const [selectedZone, setSelectedZone] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);
    const [grandTotal, setGrandTotal] = useState(initialGrandTotal);
    const [downPayment, setDownPayment] = useState(initialDownPayment);

    // Modal state
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [tempLat, setTempLat] = useState(null);
    const [tempLng, setTempLng] = useState(null);
    const [tempAddress, setTempAddress] = useState('');
    const [tempZone, setTempZone] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        shipping_address: '',
        delivery_zone: '',
        notes: '',
        payment_method: 'cash_on_delivery',
        selected_ids: selectedIdsString,
    });

    // Sync selectedZone with form and delivery fee
    useEffect(() => {
        if (selectedZone) {
            setData('delivery_zone', selectedZone.name);
            const fee = selectedZone.fee_type === 'free' ? 0 : parseFloat(selectedZone.fee);
            setDeliveryFee(fee);
        }
    }, [selectedZone]);

    // Recalculate totals when delivery fee changes
    useEffect(() => {
        const newGrandTotal = subtotal + deliveryFee;
        setGrandTotal(newGrandTotal);
        setDownPayment(newGrandTotal * 0.5);
    }, [deliveryFee, subtotal]);

    // ---- Map click handler – shows confirmation modal ----
    const handleMapClick = async (lat, lng) => {
        setTempLat(lat);
        setTempLng(lng);
        setShowConfirmationModal(true);
        setIsLoadingLocation(true);

        try {
            // 1. Reverse geocode (address)
            const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const geoData = await geoResponse.json();
            const address = geoData?.display_name || 'Address not found';
            setTempAddress(address);

            // 2. Find zone using radius‑based detection (backend)
            const zoneResponse = await fetch(`/customer/zone-by-coordinates?lat=${lat}&lng=${lng}`);
            const zoneData = await zoneResponse.json();
            setTempZone(zoneData.zone || null);
        } catch (error) {
            console.error('Error fetching location details:', error);
            setTempAddress('Unable to fetch address');
            setTempZone(null);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const confirmLocation = () => {
        if (tempZone) {
            setSelectedZone(tempZone);
        }
        setData('shipping_address', tempAddress);
        setShowConfirmationModal(false);
    };

    const cancelLocation = () => {
        setShowConfirmationModal(false);
        setTempLat(null);
        setTempLng(null);
        setTempAddress('');
        setTempZone(null);
    };

    // Zone selection from map (marker click) – just sets the active zone
    const handleZoneSelect = (zone) => {
        setSelectedZone(zone);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('customer.checkout.store'));
    };

    const paymentMethods = [
        {
            value: 'cash_on_delivery',
            label: 'Cash on Delivery',
            icon: CurrencyDollarIcon,
            description: 'Pay 50% down payment upon delivery',
        },
        {
            value: 'gcash',
            label: 'GCash',
            icon: CreditCardIcon,
            description: '50% down payment via GCash',
        },
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
                            <Link
                                href={route('customer.cart.index')}
                                className="text-sm text-gray-500 hover:text-[#6F4E37] transition-colors flex items-center gap-1"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                Back to Cart
                            </Link>
                        </div>

                        <div className="grid lg:grid-cols-5 gap-0">
                            <div className="lg:col-span-3 p-4 sm:p-6 border-r border-gray-100">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <input type="hidden" name="selected_ids" value={data.selected_ids} />

                                    {/* Delivery Zone Map */}
                                    {deliveryZones.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Click a pin to select a zone, then click inside the circle to set your exact address.
                                            </label>
                                            <DeliveryZoneMap
                                                zones={deliveryZones}
                                                onZoneSelect={handleZoneSelect}
                                                onMapClick={handleMapClick}
                                                selectedZoneId={selectedZone?.id}
                                            />
                                            {selectedZone && (
                                                <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Selected: <strong>{selectedZone.name}</strong>
                                                    {selectedZone.fee_type === 'free' ? (
                                                        <span className="text-green-600 font-medium"> (Free Delivery)</span>
                                                    ) : (
                                                        <span className="text-blue-600 font-medium"> (₱{selectedZone.fee} fee)</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Shipping Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shipping Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3">
                                                <MapPinIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <textarea
                                                value={data.shipping_address}
                                                onChange={e => setData('shipping_address', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/60 pl-9 pr-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all"
                                                rows="3"
                                                placeholder="Click inside the zone circle on the map to auto-fill your address"
                                                required
                                                readOnly={!!data.shipping_address}
                                            />
                                        </div>
                                        {!data.shipping_address && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                💡 Tip: Click a zone pin first, then click inside the circle to set your exact address.
                                            </p>
                                        )}
                                        {errors.shipping_address && (
                                            <p className="mt-1 text-sm text-red-600">{errors.shipping_address}</p>
                                        )}
                                    </div>

                                    {/* Delivery Zone & Notes */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Delivery Zone
                                            </label>
                                            <input
                                                type="text"
                                                value={data.delivery_zone}
                                                onChange={e => setData('delivery_zone', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/60 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all"
                                                placeholder="Auto-selected from map"
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Order Notes <span className="text-gray-400 text-xs">(optional)</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute top-2.5 left-3">
                                                    <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={data.notes}
                                                    onChange={e => setData('notes', e.target.value)}
                                                    className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/60 pl-9 pr-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all"
                                                    placeholder="Special instructions..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {paymentMethods.map((method) => {
                                                const Icon = method.icon;
                                                const isChecked = data.payment_method === method.value;
                                                return (
                                                    <label
                                                        key={method.value}
                                                        className={`relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                            isChecked
                                                                ? 'border-[#6F4E37] bg-[#F5EDE8]/30'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            value={method.value}
                                                            checked={isChecked}
                                                            onChange={e => setData('payment_method', e.target.value)}
                                                            className="mt-0.5 form-radio text-[#6F4E37] focus:ring-[#6F4E37] focus:ring-offset-0"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <Icon className={`h-5 w-5 ${isChecked ? 'text-[#6F4E37]' : 'text-gray-400'}`} />
                                                                <span className={`font-medium text-sm ${isChecked ? 'text-[#6F4E37]' : 'text-gray-700'}`}>
                                                                    {method.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                                                        </div>
                                                        {isChecked && (
                                                            <div className="absolute -top-2 -right-2">
                                                                <CheckCircleIcon className="h-5 w-5 text-[#6F4E37] bg-white rounded-full" />
                                                            </div>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {errors.payment_method && (
                                            <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing || !data.shipping_address}
                                        className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-[#6F4E37] text-white text-sm font-semibold rounded-lg hover:bg-[#5A3E2B] transition-colors shadow-sm focus:ring-2 focus:ring-[#6F4E37]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                Place Order (50% Down Payment)
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-2 p-4 sm:p-6 bg-gray-50/30">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                                    Order Summary
                                </h2>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-gray-700 truncate max-w-[60%]">
                                                {item.product.name} <span className="text-gray-400">×{item.quantity}</span>
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                ₱{(item.product.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 mt-3 pt-3 space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-900">₱{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Delivery Fee</span>
                                        <span className="text-gray-900">₱{deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-gray-900">₱{grandTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold text-[#6F4E37] bg-[#F5EDE8] rounded-lg px-3 py-2 -mx-3">
                                        <span>Down Payment (50%)</span>
                                        <span>₱{downPayment.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6F4E37] mr-1"></span>
                                        You will be contacted to complete the down payment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Confirmation Modal */}
            <LocationConfirmationModal
                isOpen={showConfirmationModal}
                onClose={cancelLocation}
                onConfirm={confirmLocation}
                address={tempAddress}
                setAddress={setTempAddress}
                zone={tempZone}
                lat={tempLat}
                lng={tempLng}
                isLoading={isLoadingLocation}
            />
        </CustomerLayout>
    );
}
