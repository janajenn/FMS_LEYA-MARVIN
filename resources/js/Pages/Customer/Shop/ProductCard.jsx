import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useCart } from '@/Context/CartContext';

export default function ProductCard({ product }) {
    const { cartCount, setCartCount } = useCart();
    const [isAdding, setIsAdding] = useState(false);

    const { post, processing } = useForm({
        product_id: product.id,
        quantity: 1,
        customization: {},
    });

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.stock_quantity < 1) return;

        setIsAdding(true);
        post(route('customer.cart.quick-add'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsAdding(false);
                setCartCount(cartCount + 1);
            },
            onError: () => {
                setIsAdding(false);
            },
        });
    };

    const isOutOfStock = product.stock_quantity < 1;
    const isLowStock =
        !isOutOfStock && Number(product.stock_quantity) <= 5;

    const totalPrice = (
        Number(product.price) + Number(product.labor_cost || 0)
    ).toFixed(2);

    const busy = isAdding || processing;

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg">
            <Link
                href={route('products.show', product.slug)}
                className="flex flex-1 flex-col"
            >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
                    {product.images?.length > 0 ? (
                        <img
                            src={`/storage/${product.images[0].path}`}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase tracking-wider text-gray-400">
                            No Image
                        </div>
                    )}

                    {/* Subtle gradient overlay on hover */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Category badge */}
                    {product.category && (
                        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-700 shadow-sm backdrop-blur-sm ring-1 ring-black/5">
                            {product.category.name}
                        </span>
                    )}

                    {/* Stock badge */}
                    {isOutOfStock ? (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                            Sold out
                        </span>
                    ) : isLowStock ? (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                            Only {product.stock_quantity} left
                        </span>
                    ) : null}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                    <h2
                        className="line-clamp-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#6F4E37]"
                        title={product.name}
                    >
                        {product.name}
                    </h2>

                    <div className="mt-2 flex items-end justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                Price
                            </span>
                            <span className="text-lg font-bold tracking-tight text-[#6F4E37]">
                                ₱{totalPrice}
                            </span>
                        </div>

                        {/* View link */}
                        <span className="inline-flex items-center text-xs font-medium text-gray-500 transition-colors group-hover:text-[#6F4E37]">
                            View
                            <svg
                                className="ml-1 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </span>
                    </div>
                </div>
            </Link>

            {/* Add to cart CTA */}
            <div className="px-4 pb-4">
                <button
                    onClick={handleAddToCart}
                    disabled={busy || isOutOfStock}
                    aria-label={
                        isOutOfStock
                            ? `${product.name} is out of stock`
                            : `Add ${product.name} to cart`
                    }
                    className={`flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6F4E37]/50 ${
                        isOutOfStock
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : busy
                            ? 'cursor-wait bg-[#6F4E37]/70 text-white'
                            : 'bg-[#6F4E37] text-white shadow-sm hover:bg-[#5A3E2B] hover:shadow-md active:scale-[0.98]'
                    }`}
                    title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                >
                    {isOutOfStock ? (
                        'Out of Stock'
                    ) : busy ? (
                        <>
                            <svg
                                className="h-3.5 w-3.5 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Adding…
                        </>
                    ) : (
                        <>
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            Add to Cart
                        </>
                    )}
                </button>
            </div>
        </article>
    );
}
