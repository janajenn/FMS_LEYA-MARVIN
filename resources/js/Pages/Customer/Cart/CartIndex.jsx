import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ShoppingCartIcon,
    TrashIcon,
    PlusIcon,
    MinusIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const formatPrice = (value) => `₱${Number(value).toFixed(2)}`;

export default function Cart() {
    const { props } = usePage();
    const cartItems = Array.isArray(props.cartItems) ? props.cartItems : [];
    const total = typeof props.total === 'number' ? props.total : 0;

    // State for selected item IDs
    const [selectedIds, setSelectedIds] = useState([]);
    const [updating, setUpdating] = useState(false);

    // When cart items change, reset selection to all items (or keep only existing)
    useEffect(() => {
        setSelectedIds(cartItems.map(item => item.id));
    }, [cartItems]);

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
        router.delete(
            route('customer.cart.remove'),
            { data: { cart_id: cartId } },
            {
                onFinish: () => setUpdating(false),
                preserveScroll: true,
            }
        );
    };

    // Toggle selection of a single item
    const toggleItem = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    // Toggle all items
    const toggleAll = () => {
        if (selectedIds.length === cartItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(cartItems.map(item => item.id));
        }
    };

    // Check if all items are selected
    const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

    // Get product image URL
    const getProductImage = (item) => {
        if (item.product?.images && item.product.images.length > 0) {
            return `/storage/${item.product.images[0].path}`;
        }
        return '/images/placeholder.png'; // Fallback image
    };

    // Build checkout URL with selected IDs
    const checkoutUrl = route('customer.checkout.index', {
        selected: selectedIds.join(',')
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
                                        Total: {formatPrice(total)}
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

                            {/* Items list */}
                            <div className="divide-y divide-gray-100">
                                {cartItems.map((item) => {
                                    const imageUrl = getProductImage(item);
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/40 transition"
                                        >
                                            {/* Checkbox & Image */}
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
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                                        {item.product?.name || 'Product'}
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
                                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                                        {formatPrice(item.product?.price ?? 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quantity controls & Remove */}
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
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
