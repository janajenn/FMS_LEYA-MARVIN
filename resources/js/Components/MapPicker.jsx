// resources/js/Components/MapPicker.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onLocationSelect }) {
    const map = useMapEvents({
        click(e) {
            const latlng = e.latlng;
            setPosition(latlng);
            if (onLocationSelect) {
                onLocationSelect(latlng.lat, latlng.lng);
            }
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, 13);
        }
    }, [position, map]);

    return position ? (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const latlng = e.target.getLatLng();
                    setPosition(latlng);
                    if (onLocationSelect) {
                        onLocationSelect(latlng.lat, latlng.lng);
                    }
                },
            }}
        />
    ) : null;
}

export default function MapPicker({
    latitude,
    longitude,
    radius = 0,
    setLatLng,
    onLocationSelect,
    onRadiusChange,
    height = '320px',
}) {
    const [position, setPosition] = useState(
        latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : null
    );
    const [currentRadius, setCurrentRadius] = useState(radius || 0);

    const handlePositionChange = (latlng) => {
        setPosition(latlng);
        setLatLng(latlng.lat, latlng.lng);
    };

    const handleLocationSelect = (lat, lng) => {
        setPosition({ lat, lng });
        setLatLng(lat, lng);
        if (onLocationSelect) {
            onLocationSelect(lat, lng);
        }
    };

    const handleRadiusChange = (e) => {
        const newRadius = parseFloat(e.target.value) || 0;
        setCurrentRadius(newRadius);
        if (onRadiusChange) {
            onRadiusChange(newRadius);
        }
    };

    const defaultCenter = [14.5995, 120.9842]; // Manila
    const center = position ? [position.lat, position.lng] : defaultCenter;

    return (
        <div className="space-y-3">
            <div className="relative" style={{ height, width: '100%' }}>
                <MapContainer
                    center={center}
                    zoom={position ? 13 : 11}
                    style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={handlePositionChange}
                        onLocationSelect={handleLocationSelect}
                    />
                    {position && currentRadius > 0 && (
                        <Circle
                            center={[position.lat, position.lng]}
                            radius={currentRadius * 1000} // convert km to meters
                            pathOptions={{ color: '#6F4E37', fillColor: '#6F4E37', fillOpacity: 0.15 }}
                        />
                    )}
                </MapContainer>
                {!position && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg pointer-events-none">
                        <span className="text-sm text-gray-500 bg-white/80 px-3 py-1 rounded-full">
                            Click on the map to set zone location
                        </span>
                    </div>
                )}
            </div>

            {/* Radius Slider */}
            <div className="flex items-center gap-4">
                <label htmlFor="radius-slider" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Radius: <span className="font-bold text-[#6F4E37]">{currentRadius.toFixed(1)} km</span>
                </label>
                <input
                    id="radius-slider"
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={currentRadius}
                    onChange={handleRadiusChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6F4E37]"
                />
                <span className="text-xs text-gray-400">50 km</span>
            </div>
        </div>
    );
}
