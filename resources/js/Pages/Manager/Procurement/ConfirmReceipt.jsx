import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ConfirmReceipt({ receipt }) {
    const { post, processing } = useForm();
    const isPending = receipt.status === 'pending_confirmation';

    const handleConfirm = () => {
        if (confirm('Confirm this goods receipt? This will finalize the transaction.')) {
            post(route('manager.procurement.confirm.process', receipt.id));
        }
    };

    const statusColors = {
        pending_confirmation: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
    };

    const statusLabels = {
        pending_confirmation: 'Pending Confirmation',
        confirmed: 'Confirmed',
    };

    return (
        <ManagerLayout>
            <Head title={`Confirm Receipt #${receipt.gr_number}`} />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <Link
                                    href={route('manager.procurement.confirm.index')}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Goods Receipt #{receipt.gr_number}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        PO: {receipt.purchase_order?.po_number} | Supplier: {receipt.purchase_order?.supplier?.name}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 rounded-lg mb-6">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Received Date</span>
                                    <p className="text-sm font-medium text-gray-700">{new Date(receipt.received_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Received By</span>
                                    <p className="text-sm font-medium text-gray-700">{receipt.receiver?.name}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase">Status</span>
                                    <p className={`text-sm font-medium ${receipt.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {statusLabels[receipt.status] || receipt.status}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Received Items</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Accepted</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Damaged</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Condition</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Damage Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {receipt.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.purchase_order_item?.material?.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.purchase_order_item?.ordered_quantity}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.received_quantity}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-green-700">{item.accepted_quantity}</td>
                                                <td className="px-4 py-3 text-sm text-red-600">{item.damaged_quantity || 0}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.condition === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {item.condition}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{item.damage_reason || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Confirm Button – only shown if pending */}
                            {isPending ? (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Confirming...' : 'Confirm Receipt'}
                                    </button>
                                    <Link
                                        href={route('manager.procurement.confirm.index')}
                                        className="ml-3 inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Back to List
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">This receipt has already been confirmed.</p>
                                    <Link
                                        href={route('manager.procurement.confirm.index')}
                                        className="mt-3 inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Back to List
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
