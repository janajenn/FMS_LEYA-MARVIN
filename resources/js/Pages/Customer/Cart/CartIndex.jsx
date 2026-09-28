import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ShoppingCartIcon,
    TrashIcon,
    PlusIcon,
    MinusIcon,
    ArrowRightIcon,
    CheckBadgeIcon,
    ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import CustomizationBreakdownModal from '@/Components/CustomizationBreakdownModal';

const formatPrice = (value) => `₱${Number(value || 0).toFixed(2)}`;

export default function CartIndex() {
    const { props } = usePage();
    const cartItems = Array.isArray(props.cartItems) ? props.cartItems : [];

    const [selectedIds, setSelectedIds] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [breakdownItem, setBreakdownItem] = useState(null);

    useEffect(() => {
        setSelectedIds(cartItems.map((item) => item.id));
    }, [cartItems]);

    /* ─────────────────────────────────────────────────────────────
     * ✅ FINAL UNIT PRICE = (variant price OR product price) + labor
     *
     * This computes from RAW fields and doesn't depend on the
     * backend's `base_price` being set. So it always shows the
     * correct variant + labor price, regardless of the backend.
     *
     * Priority:
     *   1. variant.price  (if a variant is attached to this cart line)
     *   2. product.price  (fallback for non-variant products)
     *   + product.labor_cost  (always added)
     * ───────────────────────────────────────────────────────────── */
    const getUnitPrice = (item) => {
        const variantPrice = Number(item.variant?.price ?? 0);
        const productPrice = Number(item.product?.price ?? 0);
        const basePrice = variantPrice > 0 ? variantPrice : productPrice;
        const laborCost = Number(item.product?.labor_cost ?? 0);

        return basePrice + laborCost;
    };

    const lineTotal = (item) => {
        const unit = getUnitPrice(item);
        const surcharge = Number(item.customization_surcharge ?? 0);
        return unit * item.quantity + surcharge;
    };

    const cartTotal = cartItems.reduce((sum, item) => sum + lineTotal(item), 0);

    const selectedTotal = cartItems
        .filter((item) => selectedIds.includes(item.id))
        .reduce((sum, item) => sum + lineTotal(item), 0);

    const updateQuantity = (cartId, newQuantity) => {
        if (newQuantity < 1) return;
        setUpdating(true);
        router.put(
            route('customer.cart.update'),
            { cart_id: cartId, quantity: newQuantity },
            {
                onFinish: () => setUpdating(false),
                preserveScroll: true,
            }
        );
    };

    const removeItem = (cartId) => {
        if (!confirm('Remove this item?')) return;
        setUpdating(true);
        router.delete(route('customer.cart.remove'), {
            data: { cart_id: cartId },
            onFinish: () => setUpdating(false),
            preserveScroll: true,
        });
    };

    const toggleItem = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === cartItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(cartItems.map((item) => item.id));
        }
    };

    const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

    const getItemImage = (item) => {
        if (item.display_image_path) {
            return `/storage/${item.display_image_path}`;
        }
        if (item.product?.images && item.product.images.length > 0) {
            return `/storage/${item.product.images[0].path}`;
        }
        return '/images/placeholder.png';
    };

    const checkoutUrl = route('customer.checkout.index', {
        selected: selectedIds.join(','),
    });

    return (
        <CustomerLayout>
            <Head title="Your Cart" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCartIcon className="h-6 w-6 text-[#6F4E37]" />
                        Your Cart
                    </h1>

                    {cartItems.length === 0 ? (
                        <div className="mt-8 text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500">Your cart is empty.</p>
                            <Link
                                href={route('shop.index')}
                                className="mt-4 inline-block text-[#6F4E37] hover:underline"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* SUMMARY CARDS */}
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Selected Items Total
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-[#6F4E37]">
                                                {formatPrice(selectedTotal)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {selectedIds.length} of {cartItems.length} item
                                                {cartItems.length === 1 ? '' : 's'} selected for
                                                checkout
                                            </p>
                                        </div>
                                        <div className="h-11 w-11 rounded-full bg-[#6F4E37]/10 flex items-center justify-center flex-shrink-0">
                                            <CheckBadgeIcon className="h-6 w-6 text-[#6F4E37]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Cart Total
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                                {formatPrice(cartTotal)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                All {cartItems.length} item
                                                {cartItems.length === 1 ? '' : 's'} in your cart
                                            </p>
                                        </div>
                                        <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <ReceiptPercentIcon className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Select All + Checkout Bar */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            className="h-4 w-4 text-[#6F4E37] focus:ring-[#6F4E37] rounded border-gray-300"
                                        />
                                        <span className="text-sm text-gray-600">
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({selectedIds.length} selected)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            Selected:{' '}
                                            <span className="text-[#6F4E37] font-semibold">
                                                {formatPrice(selectedTotal)}
                                            </span>
                                        </span>
                                        <Link
                                            href={checkoutUrl}
                                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition ${
                                                selectedIds.length === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B]'
                                            }`}
                                            onClick={(e) => {
                                                if (selectedIds.length === 0) {
                                                    e.preventDefault();
                                                    alert('Please select at least one item.');
                                                }
                                            }}
                                        >
                                            Proceed to Checkout
                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="divide-y divide-gray-100">
                                    {cartItems.map((item) => {
                                        const imageUrl = getItemImage(item);
                                        const unitPrice = getUnitPrice(item);
                                        const surcharge = Number(
                                            item.customization_surcharge ?? 0
                                        );
                                        const itemLineTotal = lineTotal(item);
                                        const hasSurcharge = surcharge > 0;
                                        const hasBreakdown =
                                            item.customization_breakdown &&
                                            item.customization_breakdown.length > 0;

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/40 transition"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={() => toggleItem(item.id)}
                                                        className="h-4 w-4 text-[#6F4E37] focus:ring-[#6F4E37] rounded border-gray-300 flex-shrink-0"
                                                    />
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.product?.name || 'Product'}
                                                        className="h-16 w-16 object-cover rounded-md border border-gray-200 flex-shrink-0"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                                                            <span className="truncate">
                                                                {item.product?.name || 'Product'}
                                                            </span>
                                                            {item.variant_name && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#6F4E37]/10 text-[#6F4E37] flex-shrink-0">
                                                                    {item.variant_name}
                                                                </span>
                                                            )}
                                                        </h3>

                                                        {item.finish_name && (
                                                            <p className="text-xs text-gray-500">
                                                                Finish: {item.finish_name}
                                                            </p>
                                                        )}

                                                        {item.customization_data && (
                                                            <p className="text-xs text-gray-400">
                                                                Customized
                                                            </p>
                                                        )}

                                                        {/* Price breakdown — unit price includes variant + labor */}
                                                        {hasSurcharge ? (
                                                            <div className="mt-1 space-y-0.5">
                                                                <p className="text-xs text-gray-500">
                                                                    Unit price:{' '}
                                                                    {formatPrice(unitPrice)} ×{' '}
                                                                    {item.quantity}
                                                                </p>
                                                                <p className="text-xs text-[#6F4E37] font-medium flex items-center gap-1.5">
                                                                    <span>
                                                                        + Customization:{' '}
                                                                        {formatPrice(surcharge)}
                                                                    </span>
                                                                    {hasBreakdown && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setBreakdownItem(item)
                                                                            }
                                                                            className="inline-flex items-center text-[10px] font-semibold text-[#6F4E37] underline hover:no-underline"
                                                                        >
                                                                            Why?
                                                                        </button>
                                                                    )}
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {formatPrice(itemLineTotal)}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                                                {formatPrice(itemLineTotal)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.id, item.quantity - 1)
                                                        }
                                                        disabled={updating || item.quantity <= 1}
                                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                                    >
                                                        <MinusIcon className="h-4 w-4" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.id, item.quantity + 1)
                                                        }
                                                        disabled={updating}
                                                        className="p-1 rounded hover:bg-gray-100"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        disabled={updating}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <CustomizationBreakdownModal
                isOpen={!!breakdownItem}
                onClose={() => setBreakdownItem(null)}
                item={breakdownItem}
            />
        </CustomerLayout>
    );
}
