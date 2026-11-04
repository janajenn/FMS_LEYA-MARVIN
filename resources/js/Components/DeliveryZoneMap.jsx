import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
    iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize:   [25, 41],
    iconAnchor: [12, 41],
    popupAnchor:[1, -34],
    shadowSize: [41, 41],
});

const userIcon = new L.Icon({
    iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize:   [25, 41],
    iconAnchor: [12, 41],
    popupAnchor:[1, -34],
    shadowSize: [41, 41],
});

/** Guaranteed to have a live map — children of MapContainer always do. */
function MapEvents({ onMapClick }) {
    const map = useMap();

    useEffect(() => {
        const handler = (e) => onMapClick?.(e.latlng.lat, e.latlng.lng);
        map.on('click', handler);
        return () => map.off('click', handler);
    }, [map, onMapClick]);

    return null;
}

/** Pans to the user's marker when it moves. */
function PanToUser({ userLocation }) {
    const map = useMap();

    useEffect(() => {
        if (userLocation) {
            map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 13));
        }
    }, [map, userLocation]);

    return null;
}

export default function DeliveryZoneMap({
    storeLocation,
    userLocation = null,
    onMapClick,
    onMarkerDrag,
    height = '400px',
}) {
    const center = storeLocation
        ? [storeLocation.latitude, storeLocation.longitude]
        : [14.5995, 120.9842];

    return (
        <div
            id="map-section"
            className="relative w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm"
            style={{ height }}
        >
            <MapContainer
                center={center}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents onMapClick={onMapClick} />
                <PanToUser userLocation={userLocation} />

                {storeLocation && (
                    <Marker
                        position={[storeLocation.latitude, storeLocation.longitude]}
                        icon={storeIcon}
                    >
                        <Popup>
                            <div className="min-w-[180px] p-1">
                                <h3 className="font-semibold text-gray-900">{storeLocation.name}</h3>
                                <p className="text-xs text-gray-600 mt-1">{storeLocation.address}</p>
                                <p className="text-xs text-gray-500 mt-2 italic">Our store — deliveries start here.</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {userLocation && (
                    <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userIcon}
                        draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const { lat, lng } = e.target.getLatLng();
                                onMarkerDrag?.(lat, lng);
                            },
                        }}
                    >
                        <Popup>Your delivery location — drag to fine-tune</Popup>
                    </Marker>
                )}
            </MapContainer>

            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs text-gray-600 border border-gray-200/50 pointer-events-none">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" /> Store
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-blue-500" /> Your Location
                    </span>
                </div>
                <div className="mt-1 text-gray-500">
                    Click anywhere to place · drag the blue pin to adjust
                </div>
            </div>
        </div>
    );
}
