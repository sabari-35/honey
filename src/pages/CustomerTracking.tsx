import { useParams, useNavigate } from 'react-router-dom';
import { useDeliveryTracking } from '../hooks/useDeliveryTracking';
import LiveMap from '../components/LiveMap';
import { Package, MapPin, Truck, CheckCircle, ArrowLeft, Navigation, FileText } from 'lucide-react';

export default function CustomerTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { location, status, deliveryBoy, order } = useDeliveryTracking(id!);

  // Derived progress
  let progressIdx = 0;
  if (status === 'accepted' || status === 'pending') progressIdx = 1;
  if (order?.status === 'picked') progressIdx = 2;
  if (status === 'completed' || order?.status === 'delivered') progressIdx = 3;

  return (
    <div className="min-h-screen bg-obsidian text-white pt-32 pb-12 font-sans px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <button 
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gold-primary hover:text-gold-light transition-colors font-bold uppercase tracking-widest text-sm"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </button>

        <div className="flex items-center justify-between border-b border-glass-border pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display text-gold-primary uppercase tracking-[0.15em]">Live Tracking</h1>
            {order && <p className="text-text-secondary mt-1 tracking-widest text-sm">ORDER #{order.order_number}</p>}
          </div>
          {progressIdx === 3 && (
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-bold tracking-widest text-xs uppercase flex items-center gap-2">
              <CheckCircle size={16} /> Delivered
            </div>
          )}
        </div>
        
        {/* Timeline */}
        <div className="neumorphic-panel p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex items-center justify-between relative max-w-2xl mx-auto px-4 md:px-12">
            <div className="absolute left-0 lg:left-12 top-1/2 -translate-y-1/2 w-full lg:w-[calc(100%-6rem)] h-1 bg-white/10 z-0"></div>
            <div className={`absolute left-0 lg:left-12 top-1/2 -translate-y-1/2 h-1 bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,0.5)] z-0 transition-all duration-1000 ease-in-out`} 
                 style={{ width: `${(progressIdx / 3) * 100}%` }}></div>

            {[
              { icon: Package, label: 'Assigned', idx: 0 },
              { icon: Navigation, label: 'On the Way', idx: 1 },
              { icon: Truck, label: 'Picked Up', idx: 2 },
              { icon: CheckCircle, label: 'Delivered', idx: 3 },
            ].map(({ icon: Icon, label, idx }) => (
              <div key={label} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${progressIdx >= idx ? 'bg-gold-primary text-obsidian shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-110' : 'neumorphic-inset border border-white/10 text-gray-500'}`}>
                  <Icon size={20} className={progressIdx >= idx ? 'animate-pulse' : ''} />
                </div>
                <p className={`text-[10px] md:text-xs font-bold mt-3 uppercase tracking-widest text-center transition-colors ${progressIdx >= idx ? 'text-gold-primary' : 'text-gray-500'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Details Sidebar */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Driver details */}
            <div className="neumorphic-panel p-6 md:p-8 rounded-3xl h-full">
              <h2 className="text-xl font-display text-gold-primary mb-6 uppercase tracking-widest flex items-center gap-2"><Truck size={20} /> Partner</h2>
              {deliveryBoy ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-gold-primary/30 shrink-0">
                      <span className="text-gold-primary font-display text-2xl">{deliveryBoy.full_name[0]}</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-lg text-white truncate">{deliveryBoy.full_name}</p>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{deliveryBoy.vehicle_details}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Contact</p>
                    <p className="text-gold-primary font-bold tracking-widest">{deliveryBoy.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-2 border-dashed border-gold-primary/30 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Assigning Partner...</p>
                </div>
              )}
            </div>
            
            {/* Order Invoice/Items */}
            {order && (
              <div className="neumorphic-panel p-6 md:p-8 rounded-3xl h-full">
                 <h2 className="text-xl font-display text-gold-primary mb-6 uppercase tracking-widest flex items-center gap-2"><FileText size={20} /> Manifest</h2>
                 
                 <div className="space-y-4 mb-6">
                   {order.order_items?.map((item: any) => (
                     <div key={item.id} className="flex items-center justify-between text-sm">
                       <span className="text-text-secondary truncate pr-4">{item.quantity}x {item.product?.name}</span>
                       <span className="text-white font-bold shrink-0">₹{item.price_at_time}</span>
                     </div>
                   ))}
                 </div>
                 
                 <div className="pt-4 border-t border-glass-border">
                   <div className="flex items-center justify-between text-sm mb-2">
                     <span className="text-gray-400">Status</span>
                     <span className={`uppercase text-[10px] font-black tracking-widest px-2 py-0.5 rounded ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{order.payment_status}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-text-secondary uppercase tracking-widest text-xs font-bold">Total Amount</span>
                     <span className="text-gold-primary font-display text-2xl">₹{order.total_amount}</span>
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Map Area */}
          <div className="md:col-span-2 h-[500px] min-h-[500px] neumorphic-panel rounded-3xl p-2 relative overflow-hidden">
            {status !== 'pending' && deliveryBoy ? (
              location || order?.shipping_address?.lat ? (
                <LiveMap 
                  deliveryLocation={location ? { lat: location.lat, lng: location.lng } : null} 
                  customerLocation={order?.shipping_address?.lat ? { lat: order.shipping_address.lat, lng: order.shipping_address.lng } : null}
                  customerAddress={order?.shipping_address?.label || order?.shipping_address?.addressLine || 'India'}
                />
              ) : (
                <div className="w-full h-full bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="w-12 h-12 border-2 border-dashed border-gold-primary/30 rounded-full animate-spin"></div>
                  <span className="font-display tracking-[0.2em] text-sm uppercase">Vectoring Partner GPS...</span>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-gray-400 space-y-4">
                <MapPin size={32} className="text-gold-primary/30 animate-bounce" />
                <span className="font-display tracking-[0.2em] text-sm uppercase text-center max-w-sm">Awaiting Partner Assignment...</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
