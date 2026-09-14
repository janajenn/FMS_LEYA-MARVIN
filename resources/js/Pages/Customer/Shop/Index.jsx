import GuestLayout from '@/Layouts/GuestLayout';
import { Head, usePage } from '@inertiajs/react';
import ProductCard from './ProductCard';

export default function Index({ products }) {
    const { flash } = usePage().props;

    return (
        <GuestLayout>
            <Head title="Shop" />

            <div className="py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center sm:text-left mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                            Our Collection
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Discover handcrafted furniture designed for your home.
                        </p>
                        {flash.success && (
                            <div className="mt-4 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-sm border border-green-200 animate-pulse">
                                {flash.success}
                            </div>
                        )}
                        {flash.error && (
                            <div className="mt-4 inline-block bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-sm border border-red-200">
                                {flash.error}
                            </div>
                        )}
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Empty state */}
                    {products.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No products available at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
