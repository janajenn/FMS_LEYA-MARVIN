import DeliveryDriverLayout from '@/Layouts/DeliveryDriverLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Show({ delivery }) {
    const { data, setData, post, processing, errors } = useForm({
        status: delivery.status,
        proof_image: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('driver.deliveries.update-status', delivery.id), {
            forceFormData: true,
        });
    };

    const statusOptions = ['picked_up', 'in_transit', 'delivered', 'failed'];

    return (
        <DeliveryDriverLayout>
            <Head title={`Delivery ${delivery.tracking_number}`} />
            <div className="bg-white shadow-sm rounded-lg p-6">
                <h1 className="text-2xl font-bold">Delivery #{delivery.tracking_number}</h1>
                <p><strong>Order:</strong> #{delivery.order.order_number}</p>
                <p><strong>Customer:</strong> {delivery.order.user.name}</p>
                <p><strong>Address:</strong> {delivery.order.shipping_address}</p>
                <p><strong>Zone:</strong> {delivery.zone?.name}</p>
                <p><strong>Current Status:</strong> <span className="capitalize">{delivery.status}</span></p>
                {delivery.proof_image && (
                    <div>
                        <p><strong>Proof:</strong></p>
                        <img src={`/storage/${delivery.proof_image}`} alt="Proof" className="h-32 object-cover" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block">Update Status</label>
                        <select
                            value={data.status}
                            onChange={e => setData('status', e.target.value)}
                            className="border rounded px-2 py-1"
                        >
                            {statusOptions.map(s => (
                                <option key={s} value={s} disabled={delivery.status === 'delivered' || delivery.status === 'failed'}>
                                    {s.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        {errors.status && <div className="text-red-600">{errors.status}</div>}
                    </div>
                    <div>
                        <label className="block">Upload Proof (photo)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setData('proof_image', e.target.files[0])}
                            className="border rounded"
                        />
                        {errors.proof_image && <div className="text-red-600">{errors.proof_image}</div>}
                    </div>
                    <button type="submit" disabled={processing || delivery.status === 'delivered' || delivery.status === 'failed'} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Update
                    </button>
                </form>
                <Link href={route('driver.deliveries.index')} className="mt-4 inline-block text-blue-600">← Back</Link>
            </div>
        </DeliveryDriverLayout>
    );
}
