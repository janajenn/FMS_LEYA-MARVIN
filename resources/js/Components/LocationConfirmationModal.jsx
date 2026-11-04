import { useState } from 'react';
import { MapPinIcon, XMarkIcon, CheckIcon, PencilIcon, TruckIcon } from '@heroicons/react/24/outline';
import ModalPortal from './ModalPortal';

export default function LocationConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    address,
    setAddress,
    deliveryResult = null,   // { distance_km, fee, tier, deliverable, estimated_days }
    lat,
    lng,
    isLoading,
}) {
    const [isEditing, setIsEditing] = useState(false);
    if (!isOpen) return null;

    const deliverable = deliveryResult?.deliverable ?? false;

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="h-6 w-6 text-[#6F4E37]" />
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Delivery Location</h3>
                    </div>

                    <div className="mt-4 space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <svg className="animate-spin h-6 w-6 text-[#6F4E37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="ml-2 text-sm text-gray-500">Calculating distance…</span>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="text-xs text-[#6F4E37] hover:text-[#5A3E2B] flex items-center gap-1"
                                        >
                                            <PencilIcon className="h-3 w-3" />
                                            {isEditing ? 'Cancel' : 'Edit'}
                                        </button>
                                    </div>
                                    {isEditing ? (
                                        <textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            rows="2"
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/60 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                        />
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-200">
                                            {address || 'Address not found'}
                                        </p>
                                    )}
                                </div>

                                {deliverable ? (
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                        <div className="flex items-center gap-2">
                                            <TruckIcon className="h-5 w-5 text-emerald-600" />
                                            <span className="text-sm font-semibold text-emerald-900">
                                                {deliveryResult.tier?.label || 'Delivery Available'}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-emerald-700">Distance</span>
                                                <p className="font-bold text-emerald-900">{deliveryResult.distance_km} km</p>
                                            </div>
                                            <div>
                                                <span className="text-emerald-700">Delivery Fee</span>
                                                <p className="font-bold text-emerald-900">
                                                    {deliveryResult.fee === 0 ? 'Free' : `₱${Number(deliveryResult.fee).toFixed(2)}`}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-emerald-700 mt-1.5">
                                            Est. delivery: {deliveryResult.estimated_days} day{deliveryResult.estimated_days === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        <p className="text-sm font-semibold text-red-800">Outside delivery range</p>
                                        <p className="text-xs text-red-700 mt-1">
                                            This location is <strong>{deliveryResult?.distance_km ?? '?'} km</strong> from our store,
                                            which is outside our delivery area. Please pick a closer location.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                                    <div>
                                        <span>Latitude</span>
                                        <p className="font-mono text-gray-700">{lat?.toFixed(6)}</p>
                                    </div>
                                    <div>
                                        <span>Longitude</span>
                                        <p className="font-mono text-gray-700">{lng?.toFixed(6)}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            <XMarkIcon className="h-4 w-4 mr-1.5" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={onConfirm}
                            disabled={isLoading || !deliverable}
                        >
                            <CheckIcon className="h-4 w-4 mr-1.5" />
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
