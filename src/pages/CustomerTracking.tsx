import { useParams, useNavigate } from 'react-router-dom';
import { useDeliveryTracking } from '../hooks/useDeliveryTracking';
import LiveMap from '../components/LiveMap';
import { Package, MapPin, Truck, CheckCircle, ArrowLeft } from 'lucide-react';

export default function CustomerTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { location, status, deliveryBoy } = useDeliveryTracking(id!);

  // Derived progress
  let progressIdx = 0;
  if (status === 'accepted') progressIdx = 1;
  // If order status itself is handled we can augment this but we'll stick to delivery tracking status
  // since `status` from hook is `delivery_assignments` status: 'pending', 'accepted', 'completed' (or 'rejected').
  if (status === 'completed') progressIdx = 3;

  return (
    <div className="min-h-screen bg-obsidian text-white pt-24 pb-12 font-sans px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gold-primary hover:text-gold-light transition-colors"
        >
          <ArrowLeft size={18} /> Back to Orders
        </button>

        <h1 className="text-3xl font-display text-gold-primary">Live Tracking</h1>
        
        {/* Timeline */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 z-0"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold-primary z-0 transition-all duration-1000`} 
                 style={{ width: `${(progressIdx / 3) * 100}%` }}></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progressIdx >= 0 ? 'bg-gold-primary text-obsidian' : 'bg-obsidian border-2 border-gray-600 text-gray-600'}`}>
                <Package size={16} />
              </div>
              <p className="text-xs font-semibold mt-2 hidden sm:block">Assigned</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progressIdx >= 1 ? 'bg-gold-primary text-obsidian' : 'bg-obsidian border-2 border-gray-600 text-gray-600'}`}>
                <Truck size={16} />
              </div>
              <p className="text-xs font-semibold mt-2 hidden sm:block">On the Way</p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progressIdx >= 3 ? 'bg-gold-primary text-obsidian' : 'bg-obsidian border-2 border-gray-600 text-gray-600'}`}>
                <CheckCircle size={16} />
              </div>
              <p className="text-xs font-semibold mt-2 hidden sm:block">Delivered</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Driver details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-gold-primary/20">
              <h2 className="text-xl font-display text-gold-primary mb-4">Partner Details</h2>
              {deliveryBoy ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-gold-primary/30">
                      <span className="text-gold-primary font-bold text-lg">{deliveryBoy.full_name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{deliveryBoy.full_name}</p>
                      <p className="text-sm text-gray-400">{deliveryBoy.vehicle_details}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <p className="text-sm text-gray-400">Contact</p>
                    <p className="text-white hover:text-gold-primary cursor-pointer">{deliveryBoy.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Assigning a partner momentarily...</p>
              )}
            </div>
          </div>

          {/* Map Area */}
          <div className="md:col-span-2 h-[500px] min-h-[500px]">
            {status !== 'pending' && deliveryBoy ? (
              <LiveMap 
                deliveryLocation={location ? { lat: location.lat, lng: location.lng } : null} 
              />
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-xl border border-white/10 flex items-center justify-center text-gray-400 font-display tracking-widest">
                Waiting for route details...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
