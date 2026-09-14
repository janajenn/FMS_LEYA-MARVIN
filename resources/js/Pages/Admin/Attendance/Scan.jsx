import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    QrCodeIcon,
    ArrowPathIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function Scan() {
    const { flash = {} } = usePage().props;
    const [scanResult, setScanResult] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);
    const scannerRef = useRef(null);
    const { post, processing } = useForm();

    useEffect(() => {
        const scanner = new Html5Qrcode('reader');
        scannerRef.current = scanner;
        const config = {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
        };

        scanner
            .start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    setScanResult(decodedText);
                    setIsScanning(false);
                    setScannerReady(false);
                    scanner.stop();
                    post(route('admin.attendance.process-scan'), {
                        data: { qr_code: decodedText },
                        preserveScroll: true,
                    });
                },
                () => {}
            )
            .then(() => {
                setIsScanning(true);
                setScannerReady(true);
            })
            .catch(() => {
                setIsScanning(false);
                setScannerReady(false);
            });

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    const handleManualInput = (e) => {
        e.preventDefault();
        if (!scanResult) return;
        post(route('admin.attendance.process-scan'), {
            data: { qr_code: scanResult },
            preserveScroll: true,
        });
    };

    const restartScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
                setScannerReady(false);
                setScanResult('');
                scannerRef.current
                    .start(
                        { facingMode: 'environment' },
                        { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
                        (decodedText) => {
                            setScanResult(decodedText);
                            setIsScanning(false);
                            setScannerReady(false);
                            scannerRef.current.stop();
                            post(route('admin.attendance.process-scan'), {
                                data: { qr_code: decodedText },
                                preserveScroll: true,
                            });
                        },
                        () => {}
                    )
                    .then(() => {
                        setIsScanning(true);
                        setScannerReady(true);
                    });
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Scan QR Code" />

            <div className="py-4">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-start shadow-sm">
                            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
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
                            <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
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
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scan QR Code</h1>
                                    <p className="mt-1 text-sm text-gray-500">Position the QR code inside the frame</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`relative flex h-2.5 w-2.5`}>
                                            {isScanning ? (
                                                <>
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                </>
                                            ) : (
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">
                                            {isScanning ? 'Scanning' : scannerReady ? 'Ready' : 'Starting...'}
                                        </span>
                                    </div>
                                    {isScanning && (
                                        <button
                                            onClick={restartScanner}
                                            className="text-gray-400 hover:text-[#6F4E37] transition-colors"
                                            title="Restart Scanner"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scanner – simplified */}
                            <div className="relative flex justify-center">
                                <div className="relative w-full max-w-md">
                                    <div className="relative rounded-xl overflow-hidden bg-black/5 ring-1 ring-gray-200">
                                        <div id="reader" className="w-full aspect-square"></div>
                                        {/* Simple scanning line */}
                                        {isScanning && (
                                            <div className="absolute left-0 right-0 h-0.5 bg-[#6F4E37]/60 animate-scan-line"></div>
                                        )}
                                    </div>
                                    <p className="text-center text-xs text-gray-400 mt-3">
                                        {isScanning ? 'Scanning...' : 'Camera is initializing. Please allow camera access.'}
                                    </p>
                                </div>
                            </div>

                            {/* Manual Input */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <form onSubmit={handleManualInput} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div className="flex-1 w-full">
                                        <label htmlFor="manual_qr" className="block text-sm font-medium text-gray-700 mb-1">
                                            Or enter QR code manually
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <QrCodeIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                id="manual_qr"
                                                type="text"
                                                value={scanResult}
                                                onChange={e => setScanResult(e.target.value)}
                                                placeholder="Paste QR code here"
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing || !scanResult}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {processing ? (
                                            <>
                                                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                                Submit
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS – simple scan line animation */}
            <style>{`
                @keyframes scanLine {
                    0% { top: 5%; opacity: 1; }
                    50% { top: 90%; opacity: 1; }
                    100% { top: 5%; opacity: 1; }
                }
                .animate-scan-line {
                    animation: scanLine 2.5s ease-in-out infinite;
                }
            `}</style>
        </AdminLayout>
    );
}
