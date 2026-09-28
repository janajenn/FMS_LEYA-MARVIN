import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    PlusIcon,
    XMarkIcon,
    UserIcon,
    PhoneIcon,
    BriefcaseIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        contact_number: '',
        position: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.employees.store'));
    };

    return (
        <AdminLayout>
            <Head title="Add Employee" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Add Employee
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Record a team member. No login account is created.
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.employees.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <UserIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="e.g. Juan Dela Cruz"
                                                required
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Contact Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Number
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <PhoneIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={data.contact_number}
                                                onChange={(e) =>
                                                    setData('contact_number', e.target.value)
                                                }
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="e.g. 0917 123 4567"
                                            />
                                        </div>
                                        {errors.contact_number && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.contact_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Position */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Position / Job Description
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={data.position}
                                                onChange={(e) =>
                                                    setData('position', e.target.value)
                                                }
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="e.g. Carpenter"
                                            />
                                        </div>
                                        {errors.position && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.position}
                                            </p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes{' '}
                                            <span className="text-gray-400 text-xs">
                                                (optional)
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <textarea
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                rows={3}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors resize-none"
                                                placeholder="Any additional info about this employee"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Creating...' : 'Add Employee'}
                                    </button>
                                    <Link
                                        href={route('admin.employees.index')}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <XMarkIcon className="h-5 w-5 mr-2" />
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
