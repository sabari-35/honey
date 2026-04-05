import { useEffect, useRef } from 'react';
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
  fitBounds?: boolean;
}

// Component to handle smooth panning when location changes
function MapUpdater({ deliveryLocation, customerLocation, fitBounds = true }: LiveMapProps) {
  const map = useMap();

  useEffect(() => {
    if (!deliveryLocation) return;
    
    if (customerLocation && fitBounds) {
      const bounds = L.latLngBounds(
        [deliveryLocation.lat, deliveryLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      );
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 16 });
    } else {
      map.flyTo([deliveryLocation.lat, deliveryLocation.lng], map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [deliveryLocation, customerLocation, map, fitBounds]);

  return null;
}

export default function LiveMap({ deliveryLocation, customerLocation, fitBounds = true }: LiveMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Center of India

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
      <MapContainer 
        center={deliveryLocation ? [deliveryLocation.lat, deliveryLocation.lng] : defaultCenter} 
        zoom={defaultCenter ? 5 : 15} 
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

        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]}>
             <Popup className="font-display font-medium text-obsidian">
              Delivery Destination
            </Popup>
          </Marker>
        )}

        {deliveryLocation && customerLocation && (
          <Polyline 
            positions={[
              [deliveryLocation.lat, deliveryLocation.lng], 
              [customerLocation.lat, customerLocation.lng]
            ]} 
            color="#3b82f6" 
            weight={4} 
            dashArray="10, 10" 
            className="animate-pulse"
          />
        )}

        <MapUpdater deliveryLocation={deliveryLocation} customerLocation={customerLocation} fitBounds={fitBounds} />
      </MapContainer>
    </div>
  );
}
