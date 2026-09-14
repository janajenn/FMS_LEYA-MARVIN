import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head } from '@inertiajs/react';
import {
    UsersIcon,
    CalendarIcon,
    WalletIcon,
    CubeIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    // Mock data – replace with real stats from controller
    const stats = [
        { label: 'Total Employees', value: '0', icon: UsersIcon },
        { label: 'Attendance Today', value: '0', icon: ClockIcon },
        { label: 'Pending Payroll', value: '0', icon: WalletIcon },
        { label: 'Inventory Items', value: '0', icon: CubeIcon },
    ];

    const recentActivity = [
        { id: 1, action: 'New employee added', time: '2 hours ago' },
        { id: 2, action: 'Payroll approved for July', time: '1 day ago' },
        { id: 3, action: 'Inventory updated', time: '3 days ago' },
    ];

    return (
        <ManagerLayout>
            <Head title="Manager Dashboard" />

            <div className="space-y-6">
                {/* Greeting Container – matches sidebar color */}
                <div
                    className="rounded-xl shadow-lg overflow-hidden"
                    style={{ backgroundColor: '#3f301d' }}
                >
                    <div className="px-6 py-6 sm:px-8 sm:py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    Welcome back, Manager
                                </h1>
                                <p className="mt-1 text-sm text-gray-300">
                                    Here's what's happening with your team today.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#5C4E34] text-gray-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
                                    System online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards – icons use wood color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {stat.label}
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className="h-11 w-11 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                        <Icon className="h-5 w-5" style={{ color: '#3f301d' }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 lg:col-span-1">
                        <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                        <div className="mt-4 space-y-2">
                            {[
                                { label: 'View Employees', icon: UsersIcon },
                                { label: 'Take Attendance', icon: CalendarIcon },
                                { label: 'Process Payroll', icon: WalletIcon },
                                { label: 'Manage Inventory', icon: CubeIcon },
                            ].map((action) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.label}
                                        className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#F5EDE8] transition-colors text-sm font-medium text-gray-700"
                                    >
                                        <span className="flex items-center">
                                            <Icon className="h-4 w-4 mr-2" style={{ color: '#3f301d' }} />
                                            {action.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
                            <button className="text-xs text-[#6B5A3E] hover:underline">View all</button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm text-gray-700">{activity.action}</span>
                                        <span className="text-xs text-gray-400">{activity.time}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No recent activity.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendance Chart Placeholder */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Attendance Overview (This Week)</h3>
                    <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-sm text-gray-400">Chart coming soon</p>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
