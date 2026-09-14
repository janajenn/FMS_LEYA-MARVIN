 import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, CubeIcon } from '@heroicons/react/24/outline';

export default function Index({ products }) {
    return (
        <ManagerLayout>
            <Head title="Products" />

            <div className="py-4">
                <div className="w-full">
                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
                                    <p className="mt-1 text-sm text-gray-500">View all products in your inventory</p>
                                </div>
                                <Link
                                    href={route('manager.dashboard')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                                    Back to Dashboard
                                </Link>
                            </div>

                            {/* Product Grid */}
                            {products.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No products found.</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                        >
                                            {/* Image */}
                                            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                                {product.images?.length > 0 ? (
                                                    <img
                                                        src={`/storage/${product.images[0].path}`}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-gray-400">
                                                        <CubeIcon className="h-12 w-12" />
                                                    </div>
                                                )}
                                                {/* Status badge */}
                                                <div className="absolute top-2 right-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        product.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {product.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-4">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="text-lg font-bold" style={{ color: '#3f301d' }}>
                                                        ₱{product.price}
                                                    </span>
                                                    <span className="text-xs text-gray-500">Stock: {product.stock_quantity}</span>
                                                </div>
                                                {product.category && (
                                                    <div className="mt-1 flex items-center text-xs text-gray-500">
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3f301d] mr-1.5"></span>
                                                        {product.category.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
