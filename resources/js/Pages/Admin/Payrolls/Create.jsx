import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    PlusIcon,
    XMarkIcon,
    UserIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

export default function Create({ employees }) {
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        period_start: '',
        period_end: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.payrolls.generate'));
    };

    return (
        <AdminLayout>
            <Head title="Generate Payroll" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Generate Payroll</h1>
                                    <p className="mt-1 text-sm text-gray-500">Create a new payroll record for an employee</p>
                                </div>
                                <Link
                                    href={route('admin.payrolls.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Employee */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Employee <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <UserIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <select
                                                value={data.employee_id}
                                                onChange={e => setData('employee_id', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors appearance-none"
                                                required
                                            >
                                                <option value="">Select Employee</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.employee_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                                        )}
                                    </div>

                                    {/* Period Start */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Period Start <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="date"
                                                value={data.period_start}
                                                onChange={e => setData('period_start', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                required
                                            />
                                        </div>
                                        {errors.period_start && (
                                            <p className="mt-1 text-sm text-red-600">{errors.period_start}</p>
                                        )}
                                    </div>

                                    {/* Period End */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Period End <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="date"
                                                value={data.period_end}
                                                onChange={e => setData('period_end', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                required
                                            />
                                        </div>
                                        {errors.period_end && (
                                            <p className="mt-1 text-sm text-red-600">{errors.period_end}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Generating...' : 'Generate Payroll'}
                                    </button>
                                    <Link
                                        href={route('admin.payrolls.index')}
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
