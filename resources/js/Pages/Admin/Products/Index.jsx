import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    TagIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

export default function Index({ products }) {
    const { flash = {} } = usePage().props;
    const { delete: destroy, processing } = useForm();

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        id: null,
        name: '',
    });

    const openDeleteModal = (id, name) => {
        setDeleteModal({ isOpen: true, id, name });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, id: null, name: '' });
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            destroy(route('admin.products.destroy', deleteModal.id), {
                preserveScroll: true,
                onSuccess: () => {
                    closeDeleteModal();
                },
                onError: () => {
                    // Close modal on error to avoid confusion
                    closeDeleteModal();
                },
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Products" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 text-sm font-medium">{flash.success}</div>
                            <button className="ml-auto -my-1.5 -mx-1.5 rounded-lg p-1.5 hover:bg-green-200/50 focus:outline-none transition-colors">
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 text-sm font-medium">{flash.error}</div>
                            <button className="ml-auto -my-1.5 -mx-1.5 rounded-lg p-1.5 hover:bg-red-200/50 focus:outline-none transition-colors">
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage your product catalog</p>
                                </div>
                                <Link
                                    href={route('admin.products.create')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Product
                                </Link>
                            </div>

                            {/* Product Grid */}
                            {products.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No products found. Start by adding your first product.</div>
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
                                                    <span className="text-lg font-bold text-[#6F4E37]">₱{product.price}</span>
                                                    <span className="text-xs text-gray-500">Stock: {product.stock_quantity}</span>
                                                </div>
                                                {product.category && (
                                                    <div className="mt-1 flex items-center text-xs text-gray-500">
                                                        <TagIcon className="h-3.5 w-3.5 mr-1" />
                                                        {product.category.name}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
                                                    <Link
                                                        href={route('admin.products.edit', product.id)}
                                                        className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(product.id, product.name)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                itemName={deleteModal.name}
                isLoading={processing}
                confirmText="Delete Product"
            />
        </AdminLayout>
    );
}
