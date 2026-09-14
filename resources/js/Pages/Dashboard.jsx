import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ user }) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-4">Welcome back, {user.name}!</h1>
                            <p className="mb-2">Role: <span className="font-semibold">{user.role?.name || 'No role assigned'}</span></p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                {/* Placeholder stats cards */}
                                <div className="bg-blue-50 p-4 rounded-lg shadow">
                                    <p className="text-sm text-blue-600">Total Products</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg shadow">
                                    <p className="text-sm text-green-600">Pending Orders</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg shadow">
                                    <p className="text-sm text-yellow-600">Low Stock Items</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg shadow">
                                    <p className="text-sm text-red-600">Deliveries Today</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
