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
                setCartCount(cartCount + 1); // increment by 1 (quantity is always 1)
            },
            onError: () => {
                setIsAdding(false);
            },
        });
    };

    const isOutOfStock = product.stock_quantity < 1;

    return (
        <div className="group bg-white rounded-xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <Link href={route('products.show', product.slug)} className="block">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    {product.images?.length > 0 ? (
                        <img
                            src={`/storage/${product.images[0].path}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No Image
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h2>
                    <div className="mt-1 flex items-center justify-between">
                        <span className="text-lg font-bold text-[#6F4E37]">₱{product.price}</span>
                        {product.category && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {product.category.name}
                            </span>
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="inline-flex items-center text-sm font-medium text-[#6F4E37] group-hover:text-[#5A3E2B] transition-colors">
                            View Product
                            <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </span>
                    </div>
                </div>
            </Link>

            {/* Quick Add Button – absolute bottom-right */}
            <div className="absolute bottom-4 right-4">
                <button
                    onClick={handleAddToCart}
                    disabled={processing || isAdding || isOutOfStock}
                    className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full shadow-sm transition-colors ${
                        isOutOfStock
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : isAdding || processing
                            ? 'bg-gray-300 text-gray-600 cursor-wait'
                            : 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B] focus:ring-2 focus:ring-[#6F4E37]/40'
                    }`}
                    title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                >
                    {isOutOfStock ? (
                        'Out of Stock'
                    ) : isAdding || processing ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
