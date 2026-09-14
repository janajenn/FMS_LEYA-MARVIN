import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    QrCodeIcon,
    CalendarIcon,
    UserIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

export default function Index({ logs }) {
    const { flash = {} } = usePage().props;
    const [filter, setFilter] = useState('all'); // all, today, week

    // In a real implementation, you would filter logs based on the selected filter
    const filteredLogs = logs;

    return (
        <AdminLayout>
            <Head title="Attendance Logs" />

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
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Logs</h1>
                                    <p className="mt-1 text-sm text-gray-500">View employee attendance records</p>
                                </div>
                                <Link
                                    href={route('admin.attendance.scan')}
                                    className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                >
                                    <QrCodeIcon className="h-5 w-5 mr-1.5" />
                                    Scan QR
                                </Link>
                            </div>

                            {/* Filters */}
                            <div className="mb-6 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                        filter === 'all'
                                            ? 'bg-[#6F4E37] text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('today')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                        filter === 'today'
                                            ? 'bg-[#6F4E37] text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setFilter('week')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                        filter === 'week'
                                            ? 'bg-[#6F4E37] text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    This Week
                                </button>
                            </div>

                            {/* Table */}
                            {filteredLogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-sm">No attendance records found.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late (min)</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime (min)</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {filteredLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs mr-2">
                                                                    {log.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                                {log.user?.name || 'Unknown'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {log.time_in ? new Date(log.time_in).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {log.time_in ? new Date(log.time_in).toLocaleTimeString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {log.time_out ? new Date(log.time_out).toLocaleTimeString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {log.late_minutes || 0}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                                            {log.overtime_minutes || 0}
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            {log.time_in && log.time_out ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Complete
                                                                </span>
                                                            ) : log.time_in && !log.time_out ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    In Progress
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                    Absent
                                                                </span>
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
