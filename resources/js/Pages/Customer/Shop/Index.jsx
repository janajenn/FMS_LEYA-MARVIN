import GuestLayout from '@/Layouts/GuestLayout';
import { Head, usePage } from '@inertiajs/react';
import ProductCard from './ProductCard';

export default function Index({ products }) {
    const { flash } = usePage().props;
    const productCount = products.length;

    return (
        <GuestLayout>
            <Head title="Shop" />

            {/* Hero / Page header */}
            <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-stone-50 to-white">
                {/* soft decorative glows */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-stone-200/40 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-600 backdrop-blur">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            New Season
                        </span>

                        <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                            Our Collection
                        </h1>

                        <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
                            Discover handcrafted furniture designed for your home.
                        </p>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                {/* Flash messages */}
                {(flash?.success || flash?.error) && (
                    <div className="mb-8 space-y-3">
                        {flash.success && (
                            <div
                                role="status"
                                className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm"
                            >
                                <svg
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                </svg>
                                <span className="font-medium">{flash.success}</span>
                            </div>
                        )}

                        {flash.error && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm"
                            >
                                <svg
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                </svg>
                                <span className="font-medium">{flash.error}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <p className="text-sm text-gray-500">
                        Showing{' '}
                        <span className="font-semibold text-gray-900">
                            {productCount}
                        </span>{' '}
                        {productCount === 1 ? 'product' : 'products'}
                    </p>

                    <p className="hidden text-xs uppercase tracking-wider text-gray-400 sm:block">
                        Handcrafted ·
                    </p>
                </div>

                {/* Product grid */}
                {productCount > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-20 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                            <svg
                                className="h-7 w-7 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12A1.125 1.125 0 0 1 19.75 21.75H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                                />
                            </svg>
                        </div>

                        <h2 className="mt-5 text-lg font-semibold text-gray-900">
                            No products yet
                        </h2>
                        <p className="mt-1.5 max-w-sm text-sm text-gray-500">
                            We're restocking our shelves. Check back soon for new
                            handcrafted pieces.
                        </p>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
