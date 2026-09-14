import React, { useRef, useEffect, useState } from 'react'; // ✅ import React
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const freeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const fixedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const activeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export default function DeliveryZoneMap({ zones, onZoneSelect, onMapClick, selectedZoneId }) {
    const mapRef = useRef();
    const [activeZoneId, setActiveZoneId] = useState(selectedZoneId);

    const defaultCenter = [14.5995, 120.9842];
    const center = zones.length > 0 && zones[0].latitude && zones[0].longitude
        ? [parseFloat(zones[0].latitude), parseFloat(zones[0].longitude)]
        : defaultCenter;

    useEffect(() => {
        setActiveZoneId(selectedZoneId);
    }, [selectedZoneId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleMapClick = (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            if (activeZoneId) {
                const activeZone = zones.find(z => z.id === activeZoneId);
                if (activeZone && activeZone.latitude && activeZone.longitude && activeZone.radius) {
                    const distance = haversineDistance(
                        lat,
                        lng,
                        parseFloat(activeZone.latitude),
                        parseFloat(activeZone.longitude)
                    );
                    if (distance <= activeZone.radius) {
                        if (onMapClick) {
                            onMapClick(lat, lng);
                        }
                    } else {
                        alert(`Your selected location is outside the "${activeZone.name}" coverage area. Please click inside the circle.`);
                    }
                } else {
                    if (onMapClick) {
                        onMapClick(lat, lng);
                    }
                }
            } else {
                alert('Please click a zone pin first to select a delivery area.');
            }
        };

        map.on('click', handleMapClick);
        return () => {
            map.off('click', handleMapClick);
        };
    }, [activeZoneId, zones, onMapClick]);

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    return (
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-sm pointer-events-auto">
            <MapContainer
                center={center}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                ref={mapRef}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {zones.map((zone) => {
                    if (!zone.latitude || !zone.longitude) return null;
                    const isActive = activeZoneId === zone.id;
                    const isSelected = selectedZoneId === zone.id;
                    const icon = isActive ? activeIcon : (zone.fee_type === 'free' ? freeIcon : fixedIcon);
                    const lat = parseFloat(zone.latitude);
                    const lng = parseFloat(zone.longitude);
                    const radius = zone.radius ? parseFloat(zone.radius) * 1000 : 0; // km to meters

                    return (
                        <React.Fragment key={zone.id}>
                            {radius > 0 && (
                                <Circle
                                    center={[lat, lng]}
                                    radius={radius}
                                    pathOptions={{
                                        color: isActive ? '#D4A017' : '#6F4E37',
                                        fillColor: isActive ? '#D4A017' : '#6F4E37',
                                        fillOpacity: isActive ? 0.2 : 0.08,
                                        weight: isActive ? 3 : 1,
                                        dashArray: isActive ? null : '5, 5',
                                    }}
                                />
                            )}
                            <Marker
                                position={[lat, lng]}
                                icon={icon}
                                eventHandlers={{
                                    click: () => {
                                        setActiveZoneId(zone.id);
                                        if (onZoneSelect) {
                                            onZoneSelect(zone);
                                        }
                                    },
                                }}
                            >
                                <Popup>
                                    <div className="min-w-[200px] p-1">
                                        <h3 className="font-semibold text-gray-900 text-base">{zone.name}</h3>
                                        <div className="mt-1 space-y-1 text-sm">
                                            <p>
                                                <span className="text-gray-500">Fee:</span>{' '}
                                                {zone.fee_type === 'free' ? (
                                                    <span className="text-green-600 font-medium">Free Delivery</span>
                                                ) : (
                                                    <span className="text-blue-600 font-medium">₱{zone.fee}</span>
                                                )}
                                            </p>
                                            <p>
                                                <span className="text-gray-500">Est. delivery:</span>{' '}
                                                {zone.estimated_days} {zone.estimated_days === 1 ? 'day' : 'days'}
                                            </p>
                                            {zone.radius && (
                                                <p>
                                                    <span className="text-gray-500">Coverage:</span>{' '}
                                                    <span className="font-medium">{zone.radius} km</span>
                                                </p>
                                            )}
                                            {zone.description && (
                                                <p className="text-gray-500 text-xs">{zone.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setActiveZoneId(zone.id);
                                                if (onZoneSelect) {
                                                    onZoneSelect(zone);
                                                }
                                            }}
                                            className={`mt-3 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                isSelected
                                                    ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                                                    : 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B]'
                                            }`}
                                            disabled={isSelected}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                                    Selected
                                                </>
                                            ) : (
                                                'Select This Zone'
                                            )}
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs text-gray-600 border border-gray-200/50 pointer-events-none">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span> Free
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span> Fixed
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span> Active
                    </span>
                </div>
                <div className="mt-1 text-gray-400">
                    <span className="font-medium text-gray-600">Step 1:</span> Click a pin to select a zone.
                    <br />
                    <span className="font-medium text-gray-600">Step 2:</span> Click inside the circle to set your address.
                </div>
            </div>
        </div>
    );
}
