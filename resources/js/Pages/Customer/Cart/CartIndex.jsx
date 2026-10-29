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
    ChevronDownIcon,
    PencilSquareIcon,
    CubeIcon,
    SparklesIcon,
    PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, memo } from 'react';
import CustomizationBreakdownModal from '@/Components/CustomizationBreakdownModal';
import { useUI } from '@/Context/UIContext';

const formatPrice = (value) => `₱${Number(value || 0).toFixed(2)}`;

/* ══════════════════════════════════════════════════════════════
 *  PART CARD — one part with reference image + selected design
 * ══════════════════════════════════════════════════════════════ */
const PartCard = memo(({ part, partData }) => {
    const selectedDesign = part.designs?.find((d) => d.id === partData?.design_id);
    const designCost =
        selectedDesign && !selectedDesign.is_default
            ? Number(selectedDesign.additional_cost || 0)
            : 0;

    const dims = (part.dimension_fields || []).map((f) => {
        const std = Number(part[`standard_${f}`] ?? 0);
        const cur = Number(partData?.[f] ?? std);
        return { field: f, standard: std, current: cur, changed: cur !== std };
    });

    const partDimCost = dims.reduce((sum, d) => {
        if (!d.changed || d.current <= d.standard) return sum;
        const rate = Number(part.dimension_pricing?.[d.field] || 0);
        return sum + (d.current - d.standard) * rate;
    }, 0);

    const hasAnything = selectedDesign || dims.length > 0;

    return (
        <div className="bg-gradient-to-br from-stone-50 via-white to-stone-50/40 rounded-xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Part header */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-stone-100/80 border-b border-stone-200">
                {part.reference_image ? (
                    <img
                        src={part.reference_image}
                        alt={part.name}
                        className="h-8 w-8 rounded-md object-cover border border-stone-300 shadow-sm"
                    />
                ) : (
                    <div className="h-8 w-8 rounded-md bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-xs shadow-sm">
                        {part.name.charAt(0)}
                    </div>
                )}
                <p className="text-sm font-bold text-stone-900">{part.name}</p>
            </div>

            {!hasAnything ? (
                <div className="p-4 text-xs text-stone-400 italic">No customization for this part.</div>
            ) : (
                <div className="flex gap-3 p-3">
                    {/* Design image — the main visual */}
                    {selectedDesign && (
                        <div className="h-28 w-28 rounded-lg overflow-hidden border-2 border-stone-200 bg-white shrink-0 shadow-sm">
                            {selectedDesign.image_path ? (
                                <img
                                    src={`/storage/${selectedDesign.image_path}`}
                                    alt={selectedDesign.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <PaintBrushIcon className="h-10 w-10 text-stone-300" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                        {selectedDesign && (
                            <div>
                                <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-0.5">
                                    Design
                                </p>
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-xs font-semibold text-stone-900 truncate">
                                        {selectedDesign.name}
                                    </p>
                                    {designCost > 0 ? (
                                        <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                                            +₱{designCost.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-stone-400 shrink-0">Included</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {dims.length > 0 && (
                            <div>
                                <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-1">
                                    Dimensions
                                </p>
                                <div className="space-y-0.5">
                                    {dims.map((d) => (
                                        <div
                                            key={d.field}
                                            className="flex items-center justify-between text-[11px] gap-2"
                                        >
                                            <span className="text-stone-500 capitalize shrink-0">
                                                {d.field}
                                            </span>
                                            <span
                                                className={`font-medium text-right ${
                                                    d.changed ? 'text-[#6F4E37]' : 'text-stone-700'
                                                }`}
                                            >
                                                {d.current}
                                                {d.changed && (
                                                    <span className="text-stone-400 ml-1.5 font-normal">
                                                        (std {d.standard})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {partDimCost > 0 && (
                                    <p className="text-[10px] font-bold text-emerald-600 mt-1.5">
                                        +₱{partDimCost.toFixed(2)} size adjustment
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

/* ══════════════════════════════════════════════════════════════
 *  EXPANDED CUSTOMIZATION DETAILS PANEL
 * ══════════════════════════════════════════════════════════════ */
const ExpandedCustomizationDetails = memo(({ item, imageUrl }) => {
    const data = item.customization_data || {};
    const parts = item.product?.parts || [];
    const hasParts = parts.length > 0;

    const surcharge = Number(item.customization_surcharge ?? 0);

    const unitPrice =
        (Number(item.variant?.price ?? 0) || Number(item.product?.price ?? 0)) +
        Number(item.product?.labor_cost ?? 0);
    const itemLineTotal = unitPrice * item.quantity + surcharge;

    const finishOpt = data.finish_option;
    const finishLabel =
        finishOpt === 'standard' ? 'Standard' : finishOpt === 'ordinary' ? 'Ordinary' : null;
    const finishMatName = item.finish_name?.includes('(')
        ? item.finish_name.substring(
              item.finish_name.indexOf('(') + 1,
              item.finish_name.lastIndexOf(')')
          )
        : null;

    return (
        <div className="px-4 pb-4 bg-stone-50/40 animate-fade-in">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                {/* ── HERO: Product image + Wood & Finish ── */}
                <div className="flex flex-col sm:flex-row gap-5 p-5 bg-gradient-to-br from-amber-50/40 via-stone-50/30 to-white border-b border-stone-100">
                    <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-100 shrink-0 shadow-md self-center sm:self-start">
                        <img
                            src={imageUrl}
                            alt={item.product?.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = '/images/placeholder.png';
                            }}
                        />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Wood Type */}
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-0.5">
                                Wood Type
                            </p>
                            <p className="text-base font-bold text-stone-900">
                                {item.variant_name || 'Standard Wood'}
                            </p>
                        </div>

                        {/* Finish */}
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-0.5">
                                Finish
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-stone-900">
                                    {finishLabel || 'Ordinary'}
                                </span>
                                {Number(item.finish_surcharge) > 0 && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                        +₱{Number(item.finish_surcharge).toFixed(2)}
                                    </span>
                                )}
                                {finishLabel === 'Ordinary' && (
                                    <span className="text-xs font-medium text-stone-500">
                                        no varnish applied
                                    </span>
                                )}
                                {finishLabel === 'Standard' && finishMatName && (
                                    <span className="text-xs font-medium text-stone-500">
                                        {finishMatName}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {surcharge > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6F4E37] bg-[#6F4E37]/10 px-2 py-1 rounded-full">
                                    <SparklesIcon className="h-3 w-3" />
                                    Customized
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                Qty: {item.quantity}
                            </span>
                            {hasParts && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                    <CubeIcon className="h-3 w-3" />
                                    {parts.length} part{parts.length === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── PARTS with images ── */}
                {hasParts && (
                    <div className="p-5 border-b border-stone-100">
                        <div className="flex items-center gap-2 mb-4">
                            <CubeIcon className="h-4 w-4 text-[#6F4E37]" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                                Customized Parts ({parts.length})
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {parts.map((part) => (
                                <PartCard
                                    key={part.id}
                                    part={part}
                                    partData={data[part.id]}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Surcharge + Line Total ── */}
                <div className="p-5 bg-gradient-to-br from-stone-50/50 to-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Surcharge breakdown */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ReceiptPercentIcon className="h-4 w-4 text-[#6F4E37]" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                                    Price Breakdown
                                </h4>
                            </div>
                            <div className="space-y-1.5 text-xs bg-white rounded-lg border border-stone-200 p-3">
                                {Number(item.material_cost_diff) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">
                                            Material cost (custom − standard)
                                        </span>
                                        <span className="font-semibold text-stone-900">
                                            +₱{Number(item.material_cost_diff).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {Number(item.finish_surcharge) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Standard finish</span>
                                        <span className="font-semibold text-stone-900">
                                            +₱{Number(item.finish_surcharge).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {Number(item.design_surcharge) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Premium designs</span>
                                        <span className="font-semibold text-stone-900">
                                            +₱{Number(item.design_surcharge).toFixed(2)}
                                        </span>
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
                                    <span className="font-bold text-[#6F4E37]">
                                        {formatPrice(surcharge)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Line total */}
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
                                    <span className="text-lg font-black text-emerald-900">
                                        {formatPrice(itemLineTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

/* ══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */
export default function CartIndex() {
    const { props } = usePage();
    const cartItems = Array.isArray(props.cartItems) ? props.cartItems : [];
    const { confirm, toast } = useUI();

    const [selectedIds, setSelectedIds] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [breakdownItem, setBreakdownItem] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        setSelectedIds(cartItems.map((item) => item.id));
    }, [cartItems]);

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

    const removeItem = async (cartId, itemName) => {
        const ok = await confirm({
            title: 'Remove Item',
            message: `Remove "${itemName || 'this item'}" from your cart?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            variant: 'error',
        });
        if (!ok) return;

        setUpdating(true);
        router.delete(route('customer.cart.remove'), {
            data: { cart_id: cartId },
            preserveScroll: true,
            onFinish: () => setUpdating(false),
            onSuccess: () => toast.success('Item removed from cart.'),
            onError: () => toast.error('Failed to remove item.'),
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

    const allSelected =
        cartItems.length > 0 && selectedIds.length === cartItems.length;

    const getItemImage = (item) => {
        if (item.display_image_path) return `/storage/${item.display_image_path}`;
        if (item.product?.images && item.product.images.length > 0) {
            return `/storage/${item.product.images[0].path}`;
        }
        return '/images/placeholder.png';
    };

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const goToEdit = (id) => {
        router.get(route('customer.cart.edit', id));
    };

    const checkoutUrl = route('customer.checkout.index', {
        selected: selectedIds.join(','),
    });

    const handleCheckoutClick = (e) => {
        if (selectedIds.length === 0) {
            e.preventDefault();
            toast.warning('Please select at least one item to checkout.');
        }
    };

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
                                                {cartItems.length === 1 ? '' : 's'} selected for checkout
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
                                            onClick={handleCheckoutClick}
                                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition ${
                                                selectedIds.length === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B]'
                                            }`}
                                        >
                                            Proceed to Checkout
                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {cartItems.map((item) => {
                                        const imageUrl = getItemImage(item);
                                        const unitPrice = getUnitPrice(item);
                                        const surcharge = Number(item.customization_surcharge ?? 0);
                                        const itemLineTotal = lineTotal(item);
                                        const hasSurcharge = surcharge > 0;
                                        const hasBreakdown =
                                            item.customization_breakdown &&
                                            item.customization_breakdown.length > 0;
                                        const isExpanded = expandedId === item.id;

                                        const finishOpt = item.customization_data?.finish_option;
                                        const finishLabel =
                                            finishOpt === 'standard'
                                                ? 'Standard'
                                                : finishOpt === 'ordinary'
                                                ? 'Ordinary'
                                                : null;

                                        const hasParts = (item.product?.parts?.length || 0) > 0;

                                        return (
                                            <div key={item.id}>
                                                {/* ── Main row ── */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/40 transition">
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

                                                            {finishLabel && (
                                                                <p className="text-xs text-gray-600 mt-0.5">
                                                                    Finish:{' '}
                                                                    <span className="font-medium">
                                                                        {finishLabel}
                                                                    </span>
                                                                    {item.finish_name?.includes('(') && (
                                                                        <span className="text-gray-400">
                                                                            {' '}
                                                                            {item.finish_name.substring(
                                                                                item.finish_name.indexOf('(')
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            )}

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

                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(item.id)}
                                                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#6F4E37] hover:underline"
                                                            >
                                                                <ChevronDownIcon
                                                                    className={`h-3.5 w-3.5 transition-transform ${
                                                                        isExpanded ? 'rotate-180' : ''
                                                                    }`}
                                                                />
                                                                {isExpanded ? 'Hide' : 'Show'} customization
                                                                details
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {hasParts && (
                                                            <button
                                                                onClick={() => goToEdit(item.id)}
                                                                disabled={updating}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#6F4E37] border border-[#6F4E37]/30 rounded-md hover:bg-[#6F4E37]/5 transition disabled:opacity-50"
                                                                title="Edit customization"
                                                            >
                                                                <PencilSquareIcon className="h-3.5 w-3.5" />
                                                                Edit
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    item.quantity - 1
                                                                )
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
                                                                updateQuantity(
                                                                    item.id,
                                                                    item.quantity + 1
                                                                )
                                                            }
                                                            disabled={updating}
                                                            className="p-1 rounded hover:bg-gray-100"
                                                        >
                                                            <PlusIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id,
                                                                    item.product?.name
                                                                )
                                                            }
                                                            disabled={updating}
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* ── Expanded panel ── */}
                                                {isExpanded && (
                                                    <ExpandedCustomizationDetails
                                                        item={item}
                                                        imageUrl={imageUrl}
                                                    />
                                                )}
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
