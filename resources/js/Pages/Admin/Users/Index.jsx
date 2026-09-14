import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    UsersIcon,
    TruckIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function Index({ users, currentRole }) {
    const { flash = {} } = usePage().props;
    const { delete: destroy } = useForm();

    const tabs = [
        { key: 'manager', label: 'Managers', icon: UsersIcon },
        { key: 'driver', label: 'Delivery Riders', icon: TruckIcon },
        { key: 'customer', label: 'Customers', icon: UserGroupIcon },
    ];

    const handleTabClick = (roleKey) => {
        // Navigate to the same page with the role query parameter
        router.get(route('admin.users.index', { role: roleKey }));
    };

    const handleDelete = (id, name) => {
        if (confirm(`Delete user "${name}"?`)) {
            destroy(route('admin.users.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const getRoleIcon = (roleSlug) => {
        const map = {
            manager: UsersIcon,
            driver: TruckIcon,
            customer: UserGroupIcon,
        };
        return map[roleSlug] || UserIcon;
    };

    return (
        <AdminLayout>
            <Head title="User Management" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage system users and their roles</p>
                                </div>
                            </div>

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

                            {/* Tabs – now using links with server-side navigation */}
                            <div className="border-b border-gray-200 mb-4">
                                <nav className="flex space-x-6">
                                    {tabs.map(tab => {
                                        const Icon = tab.icon;
                                        const isActive = currentRole === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                onClick={() => handleTabClick(tab.key)}
                                                className={`
                                                    flex items-center gap-2 py-2.5 px-1 text-sm font-medium border-b-2 transition-colors duration-200
                                                    ${isActive
                                                        ? 'border-[#6F4E37] text-[#6F4E37]'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }
                                                `}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>

                            {/* Role-specific actions */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <span className="text-sm text-gray-500">
                                    {users.length} user(s) found
                                </span>
                                {currentRole !== 'customer' && (
                                    <Link
                                        href={route('admin.users.create', { role: currentRole })}
                                        className="inline-flex items-center px-3 py-1.5 bg-[#6F4E37] text-white text-sm font-medium rounded-md hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-1.5" />
                                        Add {currentRole === 'manager' ? 'Manager' : 'Delivery Rider'}
                                    </Link>
                                )}
                            </div>

                            {/* Table */}
                            {users.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No users found in this role.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {users.map((user) => {
                                                    const RoleIcon = getRoleIcon(user.role?.slug);
                                                    return (
                                                        <tr key={user.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                <div className="flex items-center">
                                                                    <div className="h-8 w-8 rounded-full bg-[#F5EDE8] flex items-center justify-center text-[#6F4E37] text-xs font-medium mr-2">
                                                                        {user.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    {user.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                                    <RoleIcon className="h-3 w-3" />
                                                                    {user.role?.name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                                {currentRole !== 'customer' ? (
                                                                    <>
                                                                        <Link
                                                                            href={route('admin.users.edit', user.id)}
                                                                            className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                                        >
                                                                            <PencilIcon className="h-4 w-4" />
                                                                            <span className="sr-only">Edit</span>
                                                                        </Link>
                                                                        <button
                                                                            onClick={() => handleDelete(user.id, user.name)}
                                                                            className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                            <span className="sr-only">Delete</span>
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">View only</span>
                                                                )}
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
