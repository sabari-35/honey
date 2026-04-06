import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Package, User, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDeliveries() {
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime changes just in case
    const channel = supabase.channel('admin-deliveries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_boys' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch delivery personnel
      const { data: boysData } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      if (boysData) setDeliveryBoys(boysData);

      // Fetch pending/confirmed/packed orders that need delivery
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_assignments(id, delivery_boy_id, status)
        `)
        .in('status', ['confirmed', 'packed', 'assigned', 'picked', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (ordersData) setOrders(ordersData);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const assignDeliveryBoy = async (orderId: string, deliveryBoyId: string) => {
    try {
      if (!deliveryBoyId) return;

      // Upsert assignment record (if one exists for order, update it, else insert)
      // Actually we just insert a new one, or if order already assigned, handle appropriately.
      // Since order has one active assignment usually.
      const existingAssignment = orders.find(o => o.id === orderId)?.delivery_assignments?.[0];

      if (existingAssignment) {
        await supabase.from('delivery_assignments').update({ delivery_boy_id: deliveryBoyId, status: 'pending' }).eq('id', existingAssignment.id);
      } else {
        await supabase.from('delivery_assignments').insert([{ order_id: orderId, delivery_boy_id: deliveryBoyId }]);
      }

      // Update order status to assigned
      await supabase.from('orders').update({ status: 'assigned' }).eq('id', orderId);
      
      // Look up target order & driver for email payload
      const order = orders.find(o => o.id === orderId);
      const driver = deliveryBoys.find(d => d.id === deliveryBoyId);
      
      if (order?.shipping_address?.email && driver) {
         supabase.functions.invoke('brevo-email', {
           body: {
             template: 'delivery_assigned',
             payload: {
               orderId: order.order_number,
               customerName: order.shipping_address.full_name,
               customerEmail: order.shipping_address.email,
               driverName: driver.full_name,
               driverVehicle: driver.vehicle_details
             }
           }
         }).catch(e => console.error("Admin Email Delivery Trigger Failed:", e));
      }

      toast.success('Assigned order to delivery partner successfully.');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const approvePartner = async (id: string) => {
    try {
      await supabase.from('delivery_boys').update({ is_active: true, status: 'offline' }).eq('id', id);
      toast.success('Partner application approved!');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const rejectPartner = async (id: string) => {
    try {
      await supabase.from('delivery_boys').delete().eq('id', id);
      toast.success('Partner application rejected and removed.');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="p-8 text-gold-primary animate-pulse">Loading Delivery Management...</div>;

  const activeStaff = deliveryBoys.filter(b => b.is_active);
  const pendingRequests = deliveryBoys.filter(b => !b.is_active);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-display text-gold-primary">Delivery Management</h1>
        <p className="text-gray-400 text-sm mt-1">Assign orders and monitor delivery personnel</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Staff List */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-lg text-yellow-500 border-b border-yellow-500/20 pb-2 mb-4">Partner Applications</h2>
              <div className="space-y-3">
                {pendingRequests.map(boy => (
                  <div key={boy.id} className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl space-y-3">
                    <div>
                      <p className="font-semibold text-white">{boy.full_name}</p>
                      <p className="text-sm text-gray-400">Phone: {boy.phone}</p>
                      <p className="text-sm text-gray-400 mt-1 uppercase text-xs tracking-wide">Vehicle: {boy.vehicle_details}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <button onClick={() => approvePartner(boy.id)} className="flex-1 bg-green-500/20 text-green-500 py-1.5 rounded font-medium text-sm hover:bg-green-500/30 transition-colors">Approve</button>
                      <button onClick={() => rejectPartner(boy.id)} className="flex-1 bg-red-500/20 text-red-500 py-1.5 rounded font-medium text-sm hover:bg-red-500/30 transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-display text-lg text-white border-b border-white/10 pb-2">Active Staff</h2>
          {activeStaff.map(boy => (
            <div key={boy.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-gold-primary">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-white">{boy.full_name}</p>
                  <p className="text-xs text-gray-400">{boy.status === 'idle' ? '🟢 Available' : boy.status === 'offline' ? '🔴 Offline' : '🟡 On Delivery'}</p>
                </div>
              </div>
            </div>
          ))}
          {activeStaff.length === 0 && <p className="text-gray-500 text-sm">No active delivery staff available.</p>}
        </div>

        {/* Orders needing assignment */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-lg text-white border-b border-white/10 pb-2">Orders for Delivery</h2>
          
          <div className="space-y-3">
            {orders.map(order => {
              const currentAssignment = order.delivery_assignments?.[0];
              const isAssigned = !!currentAssignment;

              return (
                <div key={order.id} className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-gold-primary mb-1">
                      <Package size={16} />
                      <span className="font-display tracking-wider">#{order.order_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white uppercase">{order.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                       <MapPin size={14} className="shrink-0" />
                       <span className="truncate">{order.shipping_address?.city || order.shipping_address?.label || order.shipping_address?.address || 'Unknown Address'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      className="bg-black/30 text-sm text-white px-3 py-2 rounded border border-white/10 focus:border-gold-primary outline-none flex-grow sm:flex-grow-0"
                      onChange={(e) => assignDeliveryBoy(order.id, e.target.value)}
                      value={currentAssignment?.delivery_boy_id || ''}
                      disabled={['picked', 'out_for_delivery'].includes(order.status)}
                    >
                      <option value="">Select Partner</option>
                      {activeStaff.map(boy => (
                        <option key={boy.id} value={boy.id}>{boy.full_name} ({boy.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && <p className="text-gray-500 text-sm">No active orders requiring delivery right now.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
