import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    PlusIcon,
    ArrowUpTrayIcon,
    PencilIcon,
    ClockIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

export default function Index({ materials }) {
    const { flash = {} } = usePage().props;

    return (
        <AdminLayout>
            <Head title="Materials" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="ml-3 text-sm font-medium">{flash.success}</div>
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="ml-3 text-sm font-medium">{flash.error}</div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Raw Materials</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage your inventory of raw materials</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={route('admin.materials.create')}
                                        className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-1.5" />
                                        Add Material
                                    </Link>

                                </div>
                            </div>

                            {/* Table */}
                            {materials.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No materials found. Start by adding your first material.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {materials.map((material) => (
                                                <tr key={material.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {material.name}
                                                        {material.attributes?.thickness && (
                                                            <span className="text-xs text-gray-400 block">
                                                                {material.attributes.thickness}" × {material.attributes.width || '?'}" × {material.attributes.length || '?'}'
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">{material.category?.name}</td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">{material.unit}</td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">₱{material.cost}</td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            material.stock_quantity <= 0 ? 'bg-red-100 text-red-800' :
                                                            material.stock_quantity <= (material.reorder_level || 5) ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {material.stock_quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        {material.reorder_level || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            material.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {material.status || 'active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        <Link
                                                            href={route('admin.materials.edit', material.id)}
                                                            className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Link>
                                                        <Link
                                                            href={route('admin.materials.stock-history', material.id)}
                                                            className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                        >
                                                            <ClockIcon className="h-4 w-4" />
                                                            <span className="sr-only">History</span>
                                                        </Link>
                                                        <button
                                                            className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this material?')) {
                                                                    window.location.href = route('admin.materials.destroy', material.id);
                                                                }
                                                            }}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
