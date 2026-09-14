import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MapPinIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function LocationModal({ isOpen, onClose, onConfirm, address, lat, lng, isLoading }) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative"
                style={{ zIndex: 9999 }} // 👈 Force highest z-index
                onClose={onClose}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        style={{ zIndex: 9998 }} // 👈 One less than the dialog
                    />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                                style={{ zIndex: 9999 }}
                            >
                                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPinIcon className="h-6 w-6 text-[#6F4E37]" />
                                    Pick this location?
                                </Dialog.Title>

                                <div className="mt-4 space-y-3">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <svg
                                                className="animate-spin h-6 w-6 text-[#6F4E37]"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span className="ml-2 text-sm text-gray-500">Fetching address...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {address && (
                                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                    <p className="text-sm font-medium text-gray-700">Address</p>
                                                    <p className="text-sm text-gray-600 mt-1">{address}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Latitude</span>
                                                    <p className="font-mono text-gray-800">{lat?.toFixed(6)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Longitude</span>
                                                    <p className="font-mono text-gray-800">{lng?.toFixed(6)}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-4 w-4 mr-1.5" />
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onConfirm}
                                        disabled={isLoading || !address}
                                    >
                                        <CheckIcon className="h-4 w-4 mr-1.5" />
                                        Confirm
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
