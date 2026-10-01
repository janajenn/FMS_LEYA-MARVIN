import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useUI } from '@/Context/UIContext';

export default function Index({ categories }) {
    const { flash = {} } = usePage().props;
    const { confirm, toast } = useUI();

    const handleDelete = async (id, name, productCount) => {
        if (productCount > 0) {
            toast.error(
                `Cannot delete "${name}" — ${productCount} ${
                    productCount === 1 ? 'product is' : 'products are'
                } using this category.`,
                'Delete blocked'
            );
            return;
        }

        const ok = await confirm({
            title: 'Delete Product Category',
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'error',
        });

        if (!ok) return;

        router.delete(route('admin.product-categories.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Category deleted successfully.'),
            onError: () => toast.error('Failed to delete category.'),
        });
    };

    return (
        <AdminLayout>
            <Head title="Product Categories" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm font-medium">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-medium">
                            {flash.error}
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Product Categories
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Manage your product categories
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.product-categories.create')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Category
                                </Link>
                            </div>

                            {/* Table */}
                            {categories.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">
                                        No categories found. Start by adding your
                                        first category.
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Slug
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Description
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Products
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {categories.map((category) => {
                                                    const hasProducts =
                                                        category.products_count > 0;
                                                    return (
                                                        <tr
                                                            key={category.id}
                                                            className="hover:bg-gray-50/40 transition-colors duration-150"
                                                        >
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {category.name}
                                                            </td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                                                                {category.slug}
                                                            </td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                                                                {category.description || '-'}
                                                            </td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-center">
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        hasProducts
                                                                            ? 'bg-blue-100 text-blue-800'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}
                                                                >
                                                                    {category.products_count}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                                <Link
                                                                    href={route(
                                                                        'admin.product-categories.edit',
                                                                        category.id
                                                                    )}
                                                                    className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            category.id,
                                                                            category.name,
                                                                            category.products_count
                                                                        )
                                                                    }
                                                                    className={`transition-colors inline-flex items-center ${
                                                                        hasProducts
                                                                            ? 'text-gray-300 cursor-not-allowed'
                                                                            : 'text-gray-400 hover:text-red-600'
                                                                    }`}
                                                                    title={
                                                                        hasProducts
                                                                            ? 'Cannot delete — products are using this category'
                                                                            : 'Delete category'
                                                                    }
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
