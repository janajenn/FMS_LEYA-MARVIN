import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Index({ categories }) {
    return (
        <ManagerLayout>
            <Head title="Product Categories" />

            <div className="py-4">
                <div className="w-full">
                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Categories</h1>
                                    <p className="mt-1 text-sm text-gray-500">View all product categories</p>
                                </div>
                                <Link
                                    href={route('manager.dashboard')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                                    Back to Dashboard
                                </Link>
                            </div>

                            {/* Table */}
                            {categories.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No categories found.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {categories.map((category) => (
                                                    <tr key={category.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-[#F5EDE8] flex items-center justify-center text-[#3f301d] text-xs font-medium mr-2">
                                                                    {category.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                {category.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{category.slug}</td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{category.description || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
