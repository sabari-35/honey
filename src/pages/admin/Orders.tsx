import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { Badge } from '../../components/ui/Badge';
import { Download, ChevronDown, ChevronUp, MapPin, Phone, Package, User, CheckCircle2, Clock, Banknote, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { generateInvoice } from '../../utils/generateInvoice';

export default function Orders() {
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // Deep fetch including items and profile info
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products(*)
          ),
          profiles (full_name, phone)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.success('Ledger updated in real-time');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleMarkCODPaid = async (orderId: string) => {
    const { error } = await supabase.rpc('mark_cod_collected', { p_order_id: orderId });
    if (error) { toast.error('Failed to mark as paid'); return; }
    toast.success('COD payment collected and order confirmed!');
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  };



  const handleDownloadInvoice = async (order: any) => {
    try {
      const toastId = toast.loading('Extracting Vault Document...');
      await generateInvoice(order);
      toast.success('Document extruded successfully', { id: toastId });
    } catch (error) {
      toast.error('Extraction failed');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Order Ledger</h1>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-2">Real-time Transaction Monitoring</p>
        </div>
      </div>

      <div className="neumorphic-panel p-2 rounded-3xl overflow-hidden border border-glass-border">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-12 h-12 border-2 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin"></div>
             <p className="text-text-muted font-display tracking-[0.2em] text-sm uppercase">Syncing Distributed Ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-[#0F0F12] p-4 md:p-6">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-text-secondary border-b border-glass-border">
                <tr>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px]">Order ID</th>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px]">Customer</th>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Total</th>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Order Status</th>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Payment</th>
                  <th className="pb-6 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/30">
                {orders?.map((order: any) => (
                  <React.Fragment key={order.id}>
                    <tr className={`hover:bg-gold-primary/5 transition-all group ${expandedOrderId === order.id ? 'bg-gold-primary/5' : ''}`}>
                      <td className="py-6 px-4 text-text-primary font-mono text-[11px] font-bold tracking-tighter">
                        {order.order_number}
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex flex-col">
                          <span className="text-text-primary font-bold text-sm">{order.shipping_address?.full_name || 'Anonymous'}</span>
                          <span className="text-text-muted text-[10px] flex items-center gap-1">
                            <Phone size={10} /> {order.shipping_address?.phone || 'No Contact'}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-text-muted text-[11px] font-mono">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-6 px-4 text-gold-primary font-bold text-right font-mono text-base">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'gold'}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <PaymentBadge status={order.payment_status} />
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {order.payment_status === 'cod_pending' && (
                            <button
                              onClick={() => handleMarkCODPaid(order.id)}
                              className="h-9 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                              title="Mark COD as Collected"
                            >
                              <Banknote size={12} /> Collect
                            </button>
                          )}
                          <button 
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className="w-10 h-10 rounded-xl neumorphic-panel flex items-center justify-center text-text-secondary hover:text-gold-primary transition-all cursor-pointer"
                          >
                            {expandedOrderId === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDownloadInvoice(order)} 
                            className="w-10 h-10 rounded-xl neumorphic-panel flex items-center justify-center text-text-secondary hover:text-gold-primary transition-all cursor-pointer"
                            title="Download Invoice"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedOrderId === order.id && (
                      <tr className="bg-gold-primary/[0.02]">
                        <td colSpan={7} className="p-8 border-t border-glass-border/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-top-2 duration-300">
                            
                            {/* Shipping Intel */}
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 border-b border-glass-border pb-4">
                                <Package size={18} className="text-gold-primary" />
                                <h3 className="font-display text-lg text-text-primary uppercase tracking-widest">Transaction Intel</h3>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-gold-primary shrink-0">
                                    <User size={14} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Customer Profile</p>
                                    <p className="text-sm font-bold text-text-primary">{order.shipping_address?.full_name}</p>
                                    <p className="text-xs text-text-muted">{order.shipping_address?.phone}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-gold-primary shrink-0">
                                    <MapPin size={14} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Target Address</p>
                                    <p className="text-sm font-bold text-text-primary leading-relaxed">
                                      {order.shipping_address?.label}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Itemized Manifest */}
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 border-b border-glass-border pb-4">
                                <ShoppingBag size={18} className="text-gold-primary" />
                                <h3 className="font-display text-lg text-text-primary uppercase tracking-widest">Purchase Manifest</h3>
                              </div>
                              <div className="space-y-3">
                                {order.order_items?.map((item: any) => (
                                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-glass-border hover:border-gold-primary/30 transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden neumorphic-inset">
                                        <img src={item.product_snapshot?.image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-text-primary">{item.product_snapshot?.name}</p>
                                        <p className="text-xs text-text-muted">{item.quantity} units @ {formatCurrency(item.unit_price)}</p>
                                      </div>
                                    </div>
                                    <p className="font-mono text-sm font-bold text-gold-light">{formatCurrency(item.total_price)}</p>
                                  </div>
                                ))}
                                <div className="flex justify-between pt-4 border-t border-glass-border text-text-primary">
                                  <span className="text-xs uppercase font-bold tracking-widest text-text-muted">Total Value Locked</span>
                                  <span className="font-display text-xl text-gold-primary">{formatCurrency(order.total_amount)}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!orders?.length && (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <ShieldAlert size={48} className="text-text-muted" />
                        <p className="text-text-muted font-display tracking-[0.3em] text-lg uppercase">Zero Data Reconstructed.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Fixed missing icon imports in the main block
import { ShoppingBag, ShieldAlert } from 'lucide-react';
import React from 'react';

function PaymentBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    paid:            { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={11} />, label: 'Paid' },
    verified:        { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={11} />, label: 'Verified' },
    cod_pending:     { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',   icon: <Banknote size={11} />,      label: 'COD Pending' },
    pending:         { color: 'text-text-muted bg-glass-border/10 border-glass-border', icon: <Clock size={11} />,         label: 'Pending' },
    awaiting_payment:{ color: 'text-red-400 bg-red-500/10 border-red-500/30',          icon: <AlertCircle size={11} />,   label: 'Abandoned' },
    failed:          { color: 'text-red-400 bg-red-500/10 border-red-500/30',          icon: <AlertCircle size={11} />,   label: 'Failed' },
  };
  const v = variants[status] || variants.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${v.color}`}>
      {v.icon} {v.label}
    </span>
  );
}
