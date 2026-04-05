import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Package, Navigation, CheckCircle, PackageOpen, Box, Calendar, Clock, MapPin } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'text-warning bg-warning/10 border-warning/20';
    case 'confirmed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'packed': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'shipped': 
    case 'assigned': 
    case 'picked': 
    case 'out_for_delivery': return 'text-gold-primary bg-gold-primary/10 border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]';
    case 'delivered': return 'text-success bg-success/10 border-success/20';
    case 'cancelled': return 'text-danger bg-danger/10 border-danger/20';
    default: return 'text-text-muted bg-white/5 border-white/10';
  }
};

const formatStatus = (status: string) => status.replace(/_/g, ' ').toUpperCase();

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
      <div className="min-h-screen bg-obsidian pt-32 pb-16 px-4 flex items-center justify-center">
         <div className="w-12 h-12 border-2 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto text-center neumorphic-panel p-12 rounded-[2.5rem]">
          <Package className="w-16 h-16 text-gold-primary/50 mx-auto mb-6" />
          <h1 className="font-display text-2xl text-gold-primary tracking-widest uppercase mb-4">Vault Locked</h1>
          <p className="text-text-muted text-sm mb-8">Authentication is required to view your secure manifests.</p>
          <Button onClick={() => navigate('/login')} className="w-full h-14">Authenticate</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-gold-primary/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-glass-border pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-gold-primary" size={24} />
              <h1 className="font-display text-4xl text-text-primary tracking-widest uppercase">My Orders</h1>
            </div>
            <p className="text-text-muted text-sm uppercase tracking-widest font-black opacity-60 ml-9">Secure Transport Manifests</p>
          </div>
          <div className="text-right ml-9 md:ml-0">
             <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-text-muted">Active Count</p>
             <p className="font-display text-3xl tracking-widest text-gold-primary">{myOrders.length}</p>
          </div>
        </div>

        {myOrders.length === 0 ? (
          <div className="neumorphic-inset rounded-[3rem] p-24 text-center border border-white/5 relative overflow-hidden">
            <PackageOpen className="w-20 h-20 text-gold-primary/20 mx-auto mb-6 relative z-10" />
            <h2 className="font-display text-3xl text-gold-primary tracking-widest uppercase mb-4 relative z-10">Vault Empty</h2>
            <p className="text-text-secondary max-w-sm mx-auto relative z-10">You have no active or past transports. Your manifests will appear here once secured.</p>
            <Button onClick={() => navigate('/shop')} className="mt-10 h-14 px-10 tracking-widest uppercase font-black relative z-10">
              Enter The Vault
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map(order => {
               const isActiveTracking = ['shipped', 'out_for_delivery', 'assigned', 'picked'].includes(order.status);
               
               return (
                 <div key={order.id} className="neumorphic-panel rounded-3xl md:rounded-[2.5rem] bg-gradient-to-br from-surface-2/40 to-transparent border border-glass-border hover:border-gold-primary/30 transition-all duration-500 overflow-hidden group">
                   
                   {/* Top Bar */}
                   <div className="border-b border-glass-border bg-obsidian/30 p-6 md:px-10 md:py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <h3 className="font-display text-2xl text-gold-light tracking-widest">#{order.order_number}</h3>
                          <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                             {formatStatus(order.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] text-text-muted font-black tracking-widest uppercase opacity-70">
                           <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}</div>
                           <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(order.created_at).toLocaleTimeString()}</div>
                        </div>
                     </div>
                     <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1">Total Valuation</p>
                        <p className="text-2xl font-bold font-mono tracking-wider text-text-primary">{formatCurrency(order.total_amount)}</p>
                     </div>
                   </div>

                   {/* Body */}
                   <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-10 lg:items-center">
                     
                     {/* Items List */}
                     <div className="flex-1 space-y-4">
                       <p className="text-[10px] uppercase tracking-[0.3em] font-black text-text-secondary opacity-60 mb-4">Secured Extracts</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {order.order_items?.map((item: any) => (
                           <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl border border-glass-border bg-surface-2/20">
                             <div className="w-12 h-12 rounded-xl bg-obsidian/50 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                               {item.product?.images?.[0]?.url ? (
                                 <img src={item.product?.images[0].url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <Box size={20} className="text-text-muted opacity-30" />
                               )}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-text-primary truncate">{item.product?.name}</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">QTY: {item.quantity} × {formatCurrency(item.price)}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>

                     {/* Action Controls */}
                     <div className="shrink-0 lg:w-64 space-y-3">
                       {isActiveTracking && (
                         <div className="p-1 rounded-2xl bg-gradient-to-r from-gold-primary to-gold-light relative group/btn">
                           <button 
                             onClick={() => navigate(`/order/${order.id}/track`)} 
                             className="w-full h-14 bg-obsidian text-gold-primary rounded-xl flex items-center justify-center gap-3 font-bold tracking-widest uppercase text-[10px] transition-all hover:bg-transparent hover:text-obsidian"
                           >
                             <MapPin size={16} /> Live Tracking 
                           </button>
                         </div>
                       )}

                       {['pending', 'confirmed', 'packed'].includes(order.status) && (
                         <div className="w-full h-14 rounded-2xl border border-dashed border-text-muted/30 flex items-center justify-center gap-3 text-[10px] uppercase font-black tracking-widest text-text-muted bg-surface-2/10 cursor-not-allowed">
                           Preparing Manifest
                         </div>
                       )}

                       {['delivered'].includes(order.status) && (
                         <div className="w-full h-14 rounded-2xl border border-success/30 flex items-center justify-center gap-3 text-[10px] uppercase font-black tracking-widest text-success bg-success/5 cursor-not-allowed">
                           <CheckCircle size={16} /> Extraction Secured
                         </div>
                       )}
                       
                       {['cancelled'].includes(order.status) && (
                         <div className="w-full h-14 rounded-2xl border border-danger/30 flex items-center justify-center gap-3 text-[10px] uppercase font-black tracking-widest text-danger bg-danger/5 cursor-not-allowed">
                           Transport Aborted
                         </div>
                       )}
                     </div>

                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
