import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Package, Truck, Navigation, CheckCircle, PackageOpen } from 'lucide-react';

export default function MyOrders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchOrders = () => {
        supabase.from('orders')
          .select('*, order_items(*, product:products(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) setMyOrders(data);
            setLoading(false);
          });
      };

      fetchOrders();

      const channel = supabase.channel(`my_orders_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian pt-32 pb-16 px-4">
         <div className="text-center text-gold-primary animate-pulse font-display tracking-widest uppercase">Loading Active Transports...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Package className="w-16 h-16 text-gold-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Authentication Required</h1>
          <p className="text-text-muted">Please log in to view your Active Transports.</p>
          <Button onClick={() => navigate('/login')}>Login Now</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian pt-32 pb-16 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 border-b border-glass-border pb-6">
          <div className="w-14 h-14 rounded-2xl neumorphic-inset flex items-center justify-center overflow-hidden shrink-0">
            <Package size={24} className="text-gold-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-gold-primary tracking-[0.15em] uppercase">My Orders</h1>
            <p className="text-text-secondary mt-1 tracking-wide text-sm">Real-time status of your shipments</p>
          </div>
        </div>

        {myOrders.length === 0 ? (
          <div className="neumorphic-panel rounded-3xl p-16 text-center">
            <PackageOpen className="w-16 h-16 text-gold-primary/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl text-gold-primary tracking-widest uppercase mb-2">Vault Empty</h2>
            <p className="text-text-secondary">You haven't placed any orders yet.</p>
            <Button onClick={() => navigate('/shop')} className="mt-8">Explore Storefront</Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {myOrders.map(order => (
              <div key={order.id} className="neumorphic-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center hover:border-gold-primary/30 transition-all border border-transparent group overflow-hidden relative">
                
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                <div className="w-full md:w-auto flex-1 z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-gold-primary font-display text-xl tracking-widest">#{order.order_number}</span>
                    <span className="text-[10px] px-3 py-1 rounded bg-white/5 uppercase tracking-[0.2em] font-bold text-white border border-white/10">{order.status}</span>
                  </div>
                  <p className="text-sm text-text-muted mb-4 uppercase tracking-widest">
                    Ordered <span className="text-text-secondary font-bold">{new Date(order.created_at).toLocaleDateString()}</span> • Total <span className="text-gold-primary font-bold">₹{order.total_amount}</span>
                  </p>
                  
                  {/* Items Summary */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {order.order_items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 bg-white/5 pr-3 rounded-full border border-white/5 shrink-0 whitespace-nowrap">
                        <img src={item.product?.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-xs text-text-secondary font-medium">{item.quantity}x {item.product?.name}</span>
                      </div>
                    ))}
                    {order.order_items?.length > 3 && (
                      <span className="text-xs text-text-muted pl-2">+{order.order_items.length - 3} more</span>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-auto h-full flex flex-col justify-center gap-3 z-10 shrink-0">
                  {['shipped', 'out_for_delivery', 'assigned', 'picked'].includes(order.status) && (
                    <button onClick={() => navigate(`/order/${order.id}/track`)} className="w-full md:w-auto group/btn flex items-center justify-center gap-3 px-8 py-4 bg-gold-primary/10 border border-gold-primary/50 text-gold-primary hover:bg-gold-primary text-obsidian rounded-xl transition-all font-bold tracking-widest uppercase text-xs overflow-hidden relative cursor-pointer hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                      <div className="absolute inset-0 bg-gold-primary translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative z-10 group-hover/btn:text-obsidian flex items-center gap-2">Live Tracking <Navigation size={14} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" /></span>
                    </button>
                  )}
                  {['pending', 'confirmed', 'packed'].includes(order.status) && (
                    <button disabled className="w-full md:w-auto flex items-center justify-center px-8 py-4 border border-dashed border-text-muted text-text-muted rounded-xl cursor-not-allowed text-xs font-bold tracking-widest uppercase mix-blend-luminosity">
                      Preparing Transport
                    </button>
                  )}
                  {['delivered'].includes(order.status) && (
                    <button disabled className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-white/10 text-white/50 rounded-xl cursor-not-allowed text-xs font-bold tracking-widest uppercase">
                      Delivered <CheckCircle size={14} />
                    </button>
                  )}
                  {['cancelled'].includes(order.status) && (
                    <button disabled className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-red-500/20 text-red-400 rounded-xl cursor-not-allowed text-xs font-bold tracking-widest uppercase bg-red-500/5">
                      Cancelled
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
