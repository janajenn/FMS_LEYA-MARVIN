import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    PhoneIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function Index({ employees }) {
    const { flash = {} } = usePage().props;
    const { delete: destroy } = useForm();

    const handleDelete = (id, name) => {
        if (confirm(`Are you sure you want to delete employee "${name}"?`)) {
            destroy(route('admin.employees.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Employees" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg
                                    className="h-5 w-5 text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3 text-sm font-medium">
                                {flash.success}
                            </div>
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start shadow-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3 text-sm font-medium">
                                {flash.error}
                            </div>
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Employees
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Manage your workforce
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.employees.create')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Employee
                                </Link>
                            </div>

                            {/* Empty state */}
                            {employees.length === 0 ? (
                                <div className="text-center py-12">
                                    <UserIcon className="mx-auto h-10 w-10 text-gray-300" />
                                    <p className="mt-3 text-sm text-gray-400">
                                        No employees found. Start by adding your first
                                        employee.
                                    </p>
                                    <Link
                                        href={route('admin.employees.create')}
                                        className="mt-4 inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-1.5" />
                                        Add Employee
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Employee
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Employee #
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Contact
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Position
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Status
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {employees.map((employee) => (
                                                    <tr
                                                        key={employee.id}
                                                        className="hover:bg-gray-50/40 transition-colors duration-150"
                                                    >
                                                        {/* Name + avatar */}
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-[#F5EDE8] flex items-center justify-center text-[#6F4E37] text-xs font-semibold mr-2">
                                                                    {employee.name
                                                                        ?.charAt(0)
                                                                        .toUpperCase() || '?'}
                                                                </div>
                                                                {employee.name}
                                                            </div>
                                                        </td>

                                                        {/* Employee # */}
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                            {employee.employee_number}
                                                        </td>

                                                        {/* Contact */}
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {employee.contact_number ? (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                                                                    {employee.contact_number}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Position */}
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {employee.position ? (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400" />
                                                                    {employee.position}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    employee.is_active
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                            >
                                                                {employee.is_active
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <Link
                                                                    href={route(
                                                                        'admin.employees.edit',
                                                                        employee.id
                                                                    )}
                                                                    className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    <span className="sr-only">
                                                                        Edit
                                                                    </span>
                                                                </Link>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            employee.id,
                                                                            employee.name
                                                                        )
                                                                    }
                                                                    className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                    <span className="sr-only">
                                                                        Delete
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </td>
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
        </AdminLayout>
    );
}
