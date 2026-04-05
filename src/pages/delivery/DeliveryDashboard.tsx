import { useState, useEffect } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { TrackingService } from '../../services/trackingService';
import { supabase } from '../../config/supabase';
import { Loader2, MapPin, Package, CheckCircle, Navigation, Play, XSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import LiveMap from '../../components/LiveMap';

export default function DeliveryDashboard() {
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [deliveryBoy, setDeliveryBoy] = useState<any>(null);
  const { coords, error } = useGeolocation();

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (activeOrder && deliveryBoy && coords) {
      // Push location every throttle cycle
      TrackingService.updateLocation({
        delivery_boy_id: deliveryBoy.id,
        order_id: activeOrder.id,
        lat: coords.lat,
        lng: coords.lng,
        speed: coords.speed,
        heading: coords.heading
      }).catch(console.error);
    }
  }, [coords, activeOrder, deliveryBoy]);

  const fetchSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Handle auth redirect outside or via guard

    const { data: boyData } = await supabase.from('delivery_boys').select('*').eq('id', user.id).single();
    if (boyData) setDeliveryBoy(boyData);

    const { data: assignmentData } = await supabase
      .from('delivery_assignments')
      .select('*, order:orders(*)')
      .eq('delivery_boy_id', user.id)
      .in('status', ['pending', 'accepted'])
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single();

    if (assignmentData) {
      setActiveOrder(assignmentData);
    }
  };

  const handleAccept = async () => {
    if (!activeOrder) return;
    try {
      await supabase.from('delivery_assignments').update({ status: 'accepted', accepted_at: new Date() }).eq('id', activeOrder.id);
      await TrackingService.setDeliveryBoyStatus(deliveryBoy.id, 'on_delivery');
      setActiveOrder({ ...activeOrder, status: 'accepted' });
      toast.success('Order accepted! Head towards pickup.');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlePickUp = async () => {
    if (!activeOrder) return;
    try {
      await TrackingService.updateOrderStatus(activeOrder.order_id, 'picked');
      setActiveOrder({ ...activeOrder, order: { ...activeOrder.order, status: 'picked' } });
      toast.success('Order picked up! Deliver to customer.');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeliver = async () => {
    if (!activeOrder) return;
    try {
      await TrackingService.updateOrderStatus(activeOrder.order_id, 'delivered');
      await supabase.from('delivery_assignments').update({ status: 'completed', completed_at: new Date() }).eq('id', activeOrder.id);
      await TrackingService.setDeliveryBoyStatus(deliveryBoy.id, 'idle');
      setActiveOrder(null);
      toast.success('Delivery Completed Successfully!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!deliveryBoy) {
    return <div className="min-h-screen flex items-center justify-center text-gold-primary tracking-widest"><Loader2 className="animate-spin mr-2"/> Loading Portal</div>;
  }

  return (
    <div className="min-h-screen bg-obsidian text-white p-6 pb-24 md:pb-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between border-b border-gold-primary/20 pb-4">
          <div>
            <h1 className="text-2xl font-display text-gold-primary">Delivery Partner Hub</h1>
            <p className="text-gray-400 text-sm">{deliveryBoy.full_name} • {deliveryBoy.vehicle_details}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${deliveryBoy.status === 'offline' ? 'bg-red-400' : 'bg-green-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${deliveryBoy.status === 'offline' ? 'bg-red-500' : 'bg-green-500'}`}></span>
            </span>
            <span className="uppercase text-xs tracking-wider">{deliveryBoy.status}</span>
          </div>
        </header>

        {!activeOrder ? (
          <div className="text-center py-24 bg-white/5 rounded-xl border border-white/10">
            <Package className="w-16 h-16 text-gold-primary/50 mx-auto mb-4" />
            <h2 className="text-xl font-display text-gold-primary mb-2">No Active Orders</h2>
            <p className="text-gray-400 max-w-md mx-auto">You are currently idle. Wait for new assignment popups.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tracking Card */}
            <div className="bg-white/5 p-6 rounded-xl border border-gold-primary/20 space-y-6 shadow-lg shadow-gold-primary/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-gold-primary font-display">
                    <Package size={20} />
                    <span className="text-lg">Order #{activeOrder.order.order_number}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest text-[10px]">Current Status</p>
                  <p className="font-semibold text-lg uppercase">{activeOrder.order.status === 'pending' ? 'Pending Acceptance' : activeOrder.order.status}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gold-primary shrink-0 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-400">Delivery Address</p>
                      <p className="text-base">{activeOrder.order.shipping_address?.address}, {activeOrder.order.shipping_address?.city}</p>
                      <p className="text-sm text-gray-500">{activeOrder.order.shipping_address?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {activeOrder.status === 'pending' && (
                  <button onClick={handleAccept} className="w-full py-4 bg-gold-primary text-obsidian rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gold-light transition-colors">
                    <Play size={20} /> Accept Delivery
                  </button>
                )}
                
                {activeOrder.status === 'accepted' && activeOrder.order.status !== 'picked' && (
                  <button onClick={handlePickUp} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors">
                    <Package size={20} /> Mark as Picked Up
                  </button>
                )}

                {activeOrder.order.status === 'picked' && (
                  <button onClick={handleDeliver} className="w-full py-4 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
                    <CheckCircle size={20} /> Complete Delivery
                  </button>
                )}
              </div>
            </div>

            {/* Live Map Area */}
            <div className="h-[400px] md:h-auto min-h-[400px]">
              <LiveMap 
                deliveryLocation={coords ? { lat: coords.lat, lng: coords.lng } : null} 
              />
              {!coords && !error && <p className="text-sm text-center text-gray-400 mt-2 animate-pulse">Acquiring GPS Signal...</p>}
              {error && <p className="text-sm text-center text-red-400 mt-2">GPS Error: {error}</p>}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
