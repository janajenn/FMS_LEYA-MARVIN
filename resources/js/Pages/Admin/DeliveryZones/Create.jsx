// resources/js/Pages/Admin/DeliveryZones/Create.jsx
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    PlusIcon,
    XMarkIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import MapPicker from '@/Components/MapPicker';
import LocationModal from '@/Components/LocationModal';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        fee_type: 'fixed',
        fee: '',
        estimated_days: 3,
        description: '',
        is_active: true,
        latitude: null,
        longitude: null,
        radius: null,
    });

    // Modal state
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedLat, setSelectedLat] = useState(null);
    const [selectedLng, setSelectedLng] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);

    const setLatLng = (lat, lng) => {
        setData('latitude', lat);
        setData('longitude', lng);
    };

    const handleRadiusChange = (radius) => {
        setData('radius', radius);
    };

    // Handle map click: show modal with address
    const handleLocationSelect = async (lat, lng) => {
        setSelectedLat(lat);
        setSelectedLng(lng);
        setShowLocationModal(true);
        setIsGeocoding(true);
        setSelectedAddress('');

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
                setSelectedAddress(data.display_name);
            } else {
                setSelectedAddress('Address not found');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            setSelectedAddress('Unable to fetch address');
        } finally {
            setIsGeocoding(false);
        }
    };

    const confirmLocation = () => {
        setData('name', selectedAddress || `Zone at ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`);
        setData('latitude', selectedLat);
        setData('longitude', selectedLng);
        setShowLocationModal(false);
    };

    const cancelLocation = () => {
        setShowLocationModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.delivery-zones.store'));
    };

    return (
        <AdminLayout>
            <Head title="Create Delivery Zone" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Delivery Zone</h1>
                                    <p className="mt-1 text-sm text-gray-500">Add a new delivery area with map location</p>
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
                                {/* Map with interactive radius */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Zone Location & Radius <span className="text-gray-400 text-xs">(click map to set center, drag slider to set radius)</span>
                                    </label>
                                    <MapPicker
                                        latitude={data.latitude}
                                        longitude={data.longitude}
                                        radius={data.radius}
                                        setLatLng={setLatLng}
                                        onLocationSelect={handleLocationSelect}
                                        onRadiusChange={handleRadiusChange}
                                        height="320px"
                                    />
                                    <div className="mt-2 flex gap-3 text-xs text-gray-500">
                                        <span>Lat: {data.latitude ?? '—'}</span>
                                        <span>Lng: {data.longitude ?? '—'}</span>
                                        <span>Radius: {data.radius ?? '—'} km</span>
                                    </div>
                                    {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                                    {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                                    {errors.radius && <p className="mt-1 text-sm text-red-600">{errors.radius}</p>}
                                </div>

                                {/* Location Modal */}
                                <LocationModal
                                    isOpen={showLocationModal}
                                    onClose={cancelLocation}
                                    onConfirm={confirmLocation}
                                    address={selectedAddress}
                                    lat={selectedLat}
                                    lng={selectedLng}
                                    isLoading={isGeocoding}
                                />

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

                                    {/* Description (full width) */}
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
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Creating...' : 'Create Zone'}
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
