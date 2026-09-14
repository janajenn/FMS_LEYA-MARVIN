import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function Show({ delivery }) {
    return (
        <GuestLayout>
            <Head title="Track Delivery" />
            <div className="bg-white shadow-sm rounded-lg p-6">
                <h1 className="text-2xl font-bold">Track Delivery</h1>
                <p><strong>Tracking Number:</strong> {delivery.tracking_number}</p>
                <p><strong>Status:</strong> {delivery.status}</p>
                <p><strong>Order:</strong> #{delivery.order.order_number}</p>
                <p><strong>Driver:</strong> {delivery.driver?.name || 'Not assigned yet'}</p>
                <p><strong>Zone:</strong> {delivery.zone?.name}</p>
                {delivery.proof_image && (
                    <div>
                        <p><strong>Proof:</strong></p>
                        <img src={`/storage/${delivery.proof_image}`} alt="Proof" className="h-32 object-cover" />
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
