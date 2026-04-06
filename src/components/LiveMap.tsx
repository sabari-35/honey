import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Delivery Icon
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830303.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface LiveMapProps {
  deliveryLocation: { lat: number; lng: number } | null;
  customerLocation?: { lat: number; lng: number } | null;
  customerAddress?: string;
  fitBounds?: boolean;
}

// Component to handle smooth panning when location changes
function MapUpdater({ deliveryLocation, finalCustomerLoc, fitBounds = true }: { deliveryLocation: any, finalCustomerLoc: any, fitBounds?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!deliveryLocation) return;
    
    if (finalCustomerLoc && fitBounds) {
      const bounds = L.latLngBounds(
        [deliveryLocation.lat, deliveryLocation.lng],
        [finalCustomerLoc.lat, finalCustomerLoc.lng]
      );
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 16 });
    } else {
      map.flyTo([deliveryLocation.lat, deliveryLocation.lng], map.getZoom() || 15, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [deliveryLocation, finalCustomerLoc, map, fitBounds]);

  return null;
}

export default function LiveMap({ deliveryLocation, customerLocation, customerAddress, fitBounds = true }: LiveMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Center of India
  const [resolvedCustomerLoc, setResolvedCustomerLoc] = useState<{lat: number, lng: number} | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  const finalCustomerLoc = customerLocation || resolvedCustomerLoc;

  // 1. Geocode if missing
  useEffect(() => {
    if (customerLocation || !customerAddress) return;
    
    const geocode = async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customerAddress)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          setResolvedCustomerLoc({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    };
    geocode();
  }, [customerLocation, customerAddress]);

  // 2. Fetch OSRM Route Road Geometries
  useEffect(() => {
    if (!deliveryLocation || !finalCustomerLoc) return;

    const fetchRoute = async () => {
      try {
        // OSRM expects coordinates as lon,lat
        const url = `https://router.project-osrm.org/route/v1/driving/${deliveryLocation.lng},${deliveryLocation.lat};${finalCustomerLoc.lng},${finalCustomerLoc.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          // GeoJSON returns [lon, lat], Leaflet wants [lat, lon]
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
          setRouteCoordinates(coords);
        }
      } catch (err) {
        console.error("OSRM Route Fetch Failed", err);
        // Fallback to straight line
        setRouteCoordinates([
          [deliveryLocation.lat, deliveryLocation.lng],
          [finalCustomerLoc.lat, finalCustomerLoc.lng]
        ]);
      }
    };

    fetchRoute();
  }, [deliveryLocation, finalCustomerLoc]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)] relative z-0">
      <MapContainer 
        center={deliveryLocation ? [deliveryLocation.lat, deliveryLocation.lng] : defaultCenter} 
        zoom={defaultCenter && !deliveryLocation ? 5 : 15} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Clean modern tiles
        />
        
        {deliveryLocation && (
          <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
            <Popup className="font-display font-medium text-obsidian">
              Delivery Partner
            </Popup>
          </Marker>
        )}

        {finalCustomerLoc && (
          <Marker position={[finalCustomerLoc.lat, finalCustomerLoc.lng]}>
             <Popup className="font-display font-medium text-obsidian">
              Delivery Destination
            </Popup>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.8}
            className="animate-pulse drop-shadow-md"
          />
        )}

        <MapUpdater deliveryLocation={deliveryLocation} finalCustomerLoc={finalCustomerLoc} fitBounds={fitBounds} />
      </MapContainer>
    </div>
  );
}
