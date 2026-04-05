import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Phone, MapPin, Save, Link, Truck, Package, ChevronRight} from 'lucide-react';
import toast from 'react-hot-toast';


declare global {
  interface Window {
    L: any;
  }
}

export default function Profile() {
  const { user, profile, setAuth } = useAuthStore();
  const [fullName, setFullName] = useState((profile as any)?.full_name || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{ label: string; lat: number; lng: number } | null>(
    (profile as any)?.default_address || null
  );

  const [deliveryStatus, setDeliveryStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (user) {
      // Check delivery status
      supabase.from('delivery_boys').select('is_active').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          if (data.is_active) setDeliveryStatus('approved');
          else setDeliveryStatus('pending');
        }
      });
    }
  }, [user]);

  const handleRequestDelivery = async () => {
    if (!vehicleDetails.trim()) { toast.error("Please enter vehicle details to apply."); return; }
    if (!fullName || !phone) { toast.error("Please save your personal info (Name & Phone) first."); return; }
    setIsRequesting(true);
    try {
        const { error } = await supabase.from('delivery_boys').insert([{
            id: user!.id,
            full_name: fullName,
            phone: phone,
            vehicle_details: vehicleDetails,
            is_active: false
        }]);
        if (error) throw error;
        toast.success("Delivery partner request submitted!");
        setDeliveryStatus('pending');
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setIsRequesting(false);
    }
  };

  // Sync internal state when profile loads asynchronously
  useEffect(() => {
     if (profile) {
        setFullName((profile as any).full_name || '');
        setPhone((profile as any).phone || '');
        setSelectedAddress((profile as any).default_address || null);
     }
  }, [profile]);

  const [mapQuery, setMapQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = window.L;
      const initialLat = selectedAddress?.lat || 20.5937;
      const initialLng = selectedAddress?.lng || 78.9629;

      const map = L.map(mapRef.current!).setView([initialLat, initialLng], selectedAddress ? 14 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      if (selectedAddress) {
        markerRef.current = L.marker([initialLat, initialLng]).addTo(map)
          .bindPopup(selectedAddress.label).openPopup();
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const label = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup(label).openPopup();
        setSelectedAddress({ label, lat, lng });
        setMapQuery(label);
      });

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);
  }, []);

  const handleAddressSearch = async () => {
    if (!mapQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapQuery)}&format=json&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      toast.error('Address search failed. Try clicking on the map.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const L = window.L;
    if (!mapInstanceRef.current || !L) return;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name;

    mapInstanceRef.current.setView([lat, lng], 14);
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current).bindPopup(label).openPopup();
    setSelectedAddress({ label, lat, lng });
    setMapQuery(label);
    setSearchResults([]);
  };

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const toastId = toast.loading('Securing profile details...');
    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        phone,
        default_address: selectedAddress,
        // Don't overwrite role if it exists in current profile
        role: (profile as any)?.role || 'user',
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()
        .single();
      
      if (error) throw error;
      
      setAuth(user, data);
      toast.success('Identity saved to the vault.', { id: toastId });
      
      // Navigate to shop after a short delay for feedback
      setTimeout(() => navigate('/shop'), 1000);
    } catch (err: any) {
      toast.error(err.message || 'Transmission failed.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <p className="text-text-muted font-display tracking-widest">Please sign in to access your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl neumorphic-inset flex items-center justify-center overflow-hidden shrink-0">
            {(profile as any)?.avatar_url ? (
              <img src={(profile as any).avatar_url} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <User size={36} className="text-gold-primary" />
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Profile</h1>
            <p className="text-text-secondary mt-1">{user.email}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-glass-border pb-5">
            <User size={18} className="text-gold-primary" />
            <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Personal Info</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            <div>
              <label className="block text-sm text-text-secondary mb-3 uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full border border-glass-border rounded-xl px-5 py-4 bg-transparent text-text-primary placeholder-text-muted outline-none focus:border-gold-primary transition-colors font-sans neumorphic-inset"
              />
            </div>
          </div>
        </div>

        {/* Address with Map */}
        <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-glass-border pb-5">
            <MapPin size={18} className="text-gold-primary" />
            <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Delivery Address</h2>
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <input
              type="text"
              value={mapQuery}
              onChange={(e) => setMapQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
              placeholder="Search for your address..."
              className="flex-1 border border-glass-border rounded-xl px-5 py-4 bg-transparent text-text-primary placeholder-text-muted outline-none focus:border-gold-primary transition-colors font-sans neumorphic-inset"
            />
            <Button onClick={handleAddressSearch} isLoading={isSearching} variant="ghost" className="rounded-xl px-6">
              Search
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-glass-border rounded-xl overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSearchResult(r)}
                  className="w-full text-left px-5 py-3.5 text-sm text-text-secondary hover:bg-gold-primary/10 hover:text-text-primary transition-colors border-b border-glass-border last:border-b-0 cursor-pointer"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}

          {/* Map */}
          <div ref={mapRef} className="w-full h-80 rounded-2xl overflow-hidden border border-glass-border" style={{ zIndex: 0 }} />
          <p className="text-xs text-text-muted">💡 Click anywhere on the map to set your delivery pin point, or use the search bar above.</p>

          {selectedAddress && (
            <div className="neumorphic-inset p-4 rounded-xl border border-gold-primary/20">
              <p className="text-xs uppercase tracking-widest text-gold-primary mb-1">Selected Address</p>
              <p className="text-text-primary text-sm">{selectedAddress.label}</p>
            </div>
          )}
        </div>

        {/* Delivery Partner */}
        <div className="neumorphic-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-glass-border pb-5">
            <Truck size={18} className="text-gold-primary" />
            <h2 className="font-display text-xl text-text-primary tracking-widest uppercase">Partner Program</h2>
          </div>
          {deliveryStatus === 'none' && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">Earn by delivering for VRK Farms! Save your Phone/Name first, then enter your vehicle details below to request partner status.</p>
              <Input label="Vehicle Details" value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} placeholder="e.g. Honda Activa - KA01AB1234" />
              <Button onClick={handleRequestDelivery} isLoading={isRequesting} className="w-full">Submit Request</Button>
            </div>
          )}
          {deliveryStatus === 'pending' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl">
              Your request to become a delivery partner is under review by our admin team!
            </div>
          )}
          {deliveryStatus === 'approved' && (
            <div className="p-5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Partner Account Active</p>
                <p className="text-sm opacity-80 mt-1">You are an approved delivery partner!</p>
              </div>
              <Button onClick={() => navigate('/delivery/dashboard')}>Portal</Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center items-center gap-4">
          {/* <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-danger hover:text-red-400 transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button> */}
          <Button size="md" onClick={handleSave} isLoading={isSaving} className="gap-2">
            <Save size={16} /> Save Profile
          </Button>
          {/* <Link to="/store" className="text-text-primary hover:text-gold-primary font-medium tracking-wide transition-colors uppercase text-sm">
                        BEE FARM
                      </Link> */}
        </div>

      </div>
    </div>
  );
}
