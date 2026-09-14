import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';

export default function Index({ zones }) {
    const { flash = {} } = usePage().props;
    const { delete: destroy } = useForm();

    const handleDelete = (id, name) => {
        if (confirm(`Are you sure you want to delete delivery zone "${name}"?`)) {
            destroy(route('admin.delivery-zones.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Delivery Zones" />

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

                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Zones</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage delivery areas, fees, and locations</p>
                                </div>
                                <Link
                                    href={route('admin.delivery-zones.create')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Zone
                                </Link>
                            </div>

                            {zones.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No delivery zones found. Start by adding your first zone.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Days</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {zones.map((zone) => (
                                                <tr key={zone.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                    {/* Name column – now wraps and expands vertically */}
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs break-words">
                                                        <div>{zone.name}</div>
                                                        {zone.description && (
                                                            <div className="text-xs text-gray-400 mt-0.5">{zone.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            zone.fee_type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {zone.fee_type === 'free' ? 'Free' : 'Fixed'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                                                        {zone.fee_type === 'free' ? '—' : `₱${zone.fee}`}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">{zone.estimated_days}</td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                                                        {zone.latitude !== null && zone.longitude !== null ? (
                                                            <div className="flex items-center gap-1">
                                                                <MapPinIcon className="h-4 w-4 text-gray-400" />
                                                                <span className="text-xs">
                                                                    {Number(zone.latitude).toFixed(4)}, {Number(zone.longitude).toFixed(4)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Not set</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            zone.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {zone.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        <Link
                                                            href={route('admin.delivery-zones.edit', zone.id)}
                                                            className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(zone.id, zone.name)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center"
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
