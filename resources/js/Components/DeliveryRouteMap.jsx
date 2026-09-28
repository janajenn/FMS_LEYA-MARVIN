import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Truck icon (custom HTML div with animation)
const truckIcon = L.divIcon({
    html: `
        <div style="
            background: #6F4E37;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(111, 78, 55, 0.45);
            border: 3px solid #fff;
            font-size: 20px;
            animation: truckPulse 2s ease-in-out infinite;
        ">
            🚚
        </div>
        <style>
            @keyframes truckPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        </style>
    `,
    className: 'truck-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
});

function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

/**
 * Get the truck's position along the route based on the desired placement.
 * @param {Array} routeCoords - Full polyline coordinates [[lat, lng], ...]
 * @param {string} placement - 'start' | 'middle' | 'end'
 * @param {Object} store - Store { latitude, longitude }
 * @param {Object} customer - Customer { latitude, longitude }
 */
function getTruckCoords(routeCoords, placement, store, customer) {
    // Fallbacks when route hasn't loaded yet
    const storeCoord = [Number(store.latitude), Number(store.longitude)];
    const customerCoord = [Number(customer.latitude), Number(customer.longitude)];

    if (routeCoords.length === 0) {
        if (placement === 'start') return storeCoord;
        if (placement === 'end') return customerCoord;
        return [
            (storeCoord[0] + customerCoord[0]) / 2,
            (storeCoord[1] + customerCoord[1]) / 2,
        ];
    }

    if (placement === 'start') return routeCoords[0];
    if (placement === 'end') return routeCoords[routeCoords.length - 1];

    // 'middle' → pick the coordinate halfway along the route
    return routeCoords[Math.floor(routeCoords.length / 2)];
}

export default function DeliveryRouteMap({
    store,
    customer,
    height = 400,
    showTruck = false,
    truckPosition = 'middle', // ✅ 'start' | 'middle' | 'end'
}) {
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [routeError, setRouteError] = useState(null);

    const hasStore =
        store && Number.isFinite(Number(store.latitude)) && Number.isFinite(Number(store.longitude));
    const hasCustomer =
        customer &&
        Number.isFinite(Number(customer.latitude)) &&
        Number.isFinite(Number(customer.longitude));

    useEffect(() => {
        if (!hasStore || !hasCustomer) return;

        const fetchRoute = async () => {
            setLoadingRoute(true);
            setRouteError(null);
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${store.longitude},${store.latitude};${customer.longitude},${customer.latitude}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.code !== 'Ok' || !data.routes?.length) {
                    throw new Error('No route found');
                }

                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                setRouteCoords(coords);
                setRouteInfo({
                    distanceKm: (route.distance / 1000).toFixed(2),
                    durationMin: Math.round(route.duration / 60),
                });
            } catch (err) {
                console.error('Route fetch failed', err);
                setRouteError('Unable to fetch route. Showing straight line.');
                setRouteCoords([
                    [Number(store.latitude), Number(store.longitude)],
                    [Number(customer.latitude), Number(customer.longitude)],
                ]);
            } finally {
                setLoadingRoute(false);
            }
        };

        fetchRoute();
    }, [
        hasStore,
        hasCustomer,
        store?.latitude,
        store?.longitude,
        customer?.latitude,
        customer?.longitude,
    ]);

    if (!hasStore || !hasCustomer) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Map unavailable:</strong>{' '}
                {!hasStore && 'Store coordinates are missing.'}{' '}
                {!hasCustomer && 'Your location was not saved for this order.'}
            </div>
        );
    }

    const center = [
        (Number(store.latitude) + Number(customer.latitude)) / 2,
        (Number(store.longitude) + Number(customer.longitude)) / 2,
    ];

    const bounds = [
        [Number(store.latitude), Number(store.longitude)],
        [Number(customer.latitude), Number(customer.longitude)],
    ];

    // ✅ Compute truck position based on placement
    const truckCoords = getTruckCoords(routeCoords, truckPosition, store, customer);

    // ✅ Truck popup label based on position
    const truckStatusLabel =
        truckPosition === 'start'
            ? '🚚 Picked up — at the store'
            : truckPosition === 'end'
            ? '🚚 Delivered — arrived at your location'
            : '🚚 On the way to you';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
            {/* Route info bar */}
            <div className="px-4 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2 bg-stone-50/50">
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                        Store
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        You
                    </span>
                </div>
                {routeInfo && (
                    <div className="flex items-center gap-4 text-xs font-medium text-stone-700">
                        <span>🛣️ {routeInfo.distanceKm} km</span>
                        <span>⏱️ ~{routeInfo.durationMin} min</span>
                    </div>
                )}
                {loadingRoute && <span className="text-xs text-stone-500">Loading route…</span>}
            </div>

            {/* Map */}
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: `${height}px`, width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                    position={[Number(store.latitude), Number(store.longitude)]}
                    icon={storeIcon}
                >
                    <Popup>
                        <strong>{store.name || 'Store'}</strong>
                        <br />
                        {store.address || ''}
                    </Popup>
                </Marker>

                <Marker
                    position={[Number(customer.latitude), Number(customer.longitude)]}
                    icon={customerIcon}
                >
                    <Popup>
                        <strong>Your Delivery Location</strong>
                        <br />
                        {customer.address || ''}
                    </Popup>
                </Marker>

                {/* ✅ Truck marker — position varies by status */}
                {showTruck && (
                    <Marker position={truckCoords} icon={truckIcon}>
                        <Popup>
                            <strong>{truckStatusLabel}</strong>
                        </Popup>
                    </Marker>
                )}

                {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} color="#6F4E37" weight={5} opacity={0.85} />
                )}

                <FitBounds bounds={bounds} />
            </MapContainer>

            {routeError && (
                <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 border-t border-amber-100">
                    {routeError}
                </div>
            )}
        </div>
    );
}
