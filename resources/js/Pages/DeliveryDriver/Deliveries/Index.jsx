import DeliveryDriverLayout from '@/Layouts/DeliveryDriverLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ deliveries }) {
    return (
        <DeliveryDriverLayout>
            <Head title="My Deliveries" />
            <div className="bg-white shadow-sm rounded-lg p-6">
                <h1 className="text-2xl font-bold">My Deliveries</h1>
                {deliveries.length === 0 ? (
                    <p className="mt-4">No deliveries assigned yet.</p>
                ) : (
                    <div className="mt-4 space-y-4">
                        {deliveries.map(delivery => (
                            <div key={delivery.id} className="border p-4 rounded">
                                <div className="flex justify-between">
                                    <div>
                                        <p><strong>Order:</strong> #{delivery.order.order_number}</p>
                                        <p><strong>Tracking:</strong> {delivery.tracking_number}</p>
                                        <p><strong>Status:</strong> {delivery.status}</p>
                                        <p><strong>Customer:</strong> {delivery.order.user.name}</p>
                                        <p><strong>Zone:</strong> {delivery.zone?.name}</p>
                                    </div>
                                    <Link href={route('driver.deliveries.show', delivery.id)} className="bg-blue-500 text-white px-3 py-1 rounded">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DeliveryDriverLayout>
    );
}
