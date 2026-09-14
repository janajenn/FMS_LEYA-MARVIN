import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    PencilIcon,
    XMarkIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import MapPicker from '@/Components/MapPicker';

export default function Edit({ zone }) {
    const { data, setData, put, processing, errors } = useForm({
        name: zone.name || '',
        fee_type: zone.fee_type || 'fixed',
        fee: zone.fee || '',
        estimated_days: zone.estimated_days || 3,
        description: zone.description || '',
        is_active: zone.is_active ?? true,
        latitude: zone.latitude ?? null,
        longitude: zone.longitude ?? null,
        radius: zone.radius ?? null,
    });

    const setLatLng = (lat, lng) => {
        setData('latitude', lat);
        setData('longitude', lng);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.delivery-zones.update', zone.id));
    };

    return (
        <AdminLayout>
            <Head title="Edit Delivery Zone" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Delivery Zone</h1>
                                    <p className="mt-1 text-sm text-gray-500">Update zone details and location</p>
                                </div>
                                <Link
                                    href={route('admin.delivery-zones.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Map */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Zone Location <span className="text-gray-400 text-xs">(click on map to set)</span>
                                    </label>
                                    <MapPicker
                                        latitude={data.latitude}
                                        longitude={data.longitude}
                                        setLatLng={setLatLng}
                                        height="320px"
                                    />
                                    <div className="mt-2 flex gap-3 text-xs text-gray-500">
                                        <span>Lat: {data.latitude ?? '—'}</span>
                                        <span>Lng: {data.longitude ?? '—'}</span>
                                    </div>
                                    {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                                    {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Zone Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPinIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="e.g. Metro Manila"
                                                required
                                            />
                                        </div>
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    {/* Fee Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fee Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="fixed"
                                                    checked={data.fee_type === 'fixed'}
                                                    onChange={e => setData('fee_type', e.target.value)}
                                                    className="h-4 w-4 text-[#6F4E37] focus:ring-[#6F4E37]"
                                                />
                                                <span className="text-sm text-gray-700">Fixed Fee</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="free"
                                                    checked={data.fee_type === 'free'}
                                                    onChange={e => setData('fee_type', e.target.value)}
                                                    className="h-4 w-4 text-[#6F4E37] focus:ring-[#6F4E37]"
                                                />
                                                <span className="text-sm text-gray-700">Free Delivery</span>
                                            </label>
                                        </div>
                                        {errors.fee_type && <p className="mt-1 text-sm text-red-600">{errors.fee_type}</p>}
                                    </div>

                                    {/* Fee (only for fixed) */}
                                    {data.fee_type === 'fixed' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Delivery Fee <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.fee}
                                                    onChange={e => setData('fee', e.target.value)}
                                                    className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                    placeholder="0.00"
                                                    required={data.fee_type === 'fixed'}
                                                />
                                            </div>
                                            {errors.fee && <p className="mt-1 text-sm text-red-600">{errors.fee}</p>}
                                        </div>
                                    )}

                                    {/* Estimated Days */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Est. Delivery Days <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={data.estimated_days}
                                                onChange={e => setData('estimated_days', parseInt(e.target.value) || 1)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="3"
                                                required
                                            />
                                        </div>
                                        {errors.estimated_days && <p className="mt-1 text-sm text-red-600">{errors.estimated_days}</p>}
                                    </div>

                                    {/* Active Checkbox */}
                                    <div className="flex items-center space-x-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37] focus:ring-offset-0"
                                        />
                                        <label htmlFor="is_active" className="text-sm text-gray-700 font-medium">
                                            Active
                                        </label>
                                    </div>

                                    {/* Radius */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Radius (km) <span className="text-gray-400 text-xs">(optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={data.radius ?? ''}
                                            onChange={e => setData('radius', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="e.g. 10"
                                        />
                                        {errors.radius && <p className="mt-1 text-sm text-red-600">{errors.radius}</p>}
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description <span className="text-gray-400 text-xs">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 pointer-events-none">
                                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <textarea
                                                value={data.description}
                                                onChange={e => setData('description', e.target.value)}
                                                rows="2"
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="Additional details..."
                                            />
                                        </div>
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PencilIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Updating...' : 'Update Zone'}
                                    </button>
                                    <Link
                                        href={route('admin.delivery-zones.index')}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <XMarkIcon className="h-5 w-5 mr-2" />
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
