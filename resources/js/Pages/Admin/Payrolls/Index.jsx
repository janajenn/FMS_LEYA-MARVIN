import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    PlusIcon,
    EyeIcon,
    CheckCircleIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';

export default function Index({ payrolls }) {
    const { flash = {} } = usePage().props;

    return (
        <AdminLayout>
            <Head title="Payrolls" />

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
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Records</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage employee payrolls</p>
                                </div>
                                <Link
                                    href={route('admin.payrolls.create')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Generate Payroll
                                </Link>
                            </div>

                            {/* Table */}
                            {payrolls.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No payroll records found. Generate your first payroll.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {payrolls.map((payroll) => (
                                                    <tr key={payroll.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {payroll.user?.name || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {payroll.period_start} – {payroll.period_end}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {payroll.total_days_worked}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                                                            ₱{payroll.gross_salary}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-[#6F4E37]">
                                                            ₱{payroll.net_salary}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {payroll.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                            <Link
                                                                href={route('admin.payrolls.show', payroll.id)}
                                                                className="text-gray-400 hover:text-[#6F4E37] transition-colors inline-flex items-center"
                                                                title="View"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                                <span className="sr-only">View</span>
                                                            </Link>
                                                            {payroll.status === 'pending' && (
                                                                <Link
                                                                    href={route('admin.payrolls.approve', payroll.id)}
                                                                    method="post"
                                                                    as="button"
                                                                    className="text-gray-400 hover:text-green-600 transition-colors inline-flex items-center"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircleIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Approve</span>
                                                                </Link>
                                                            )}
                                                            {payroll.status === 'approved' && (
                                                                <Link
                                                                    href={route('admin.payrolls.paid', payroll.id)}
                                                                    method="post"
                                                                    as="button"
                                                                    className="text-gray-400 hover:text-indigo-600 transition-colors inline-flex items-center"
                                                                    title="Mark Paid"
                                                                >
                                                                    <CreditCardIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Mark Paid</span>
                                                                </Link>
                                                            )}
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
