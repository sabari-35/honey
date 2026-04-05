import { supabase } from '../config/supabase';

export const TrackingService = {
  /**
   * Pushes the delivery boy's current location to the database
   */
  async updateLocation(data: {
    delivery_boy_id: string;
    order_id: string;
    lat: number;
    lng: number;
    speed?: number | null;
    heading?: number | null;
  }) {
    const { error } = await supabase.from('delivery_locations').insert([
      {
        delivery_boy_id: data.delivery_boy_id,
        order_id: data.order_id,
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        heading: data.heading,
      },
    ]);
    
    if (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  /**
   * Sets delivery boy status to offline/idle/on_delivery
   */
  async setDeliveryBoyStatus(deliveryBoyId: string, status: 'offline' | 'idle' | 'on_delivery') {
    const { error } = await supabase
      .from('delivery_boys')
      .update({ status, is_active: status !== 'offline' })
      .eq('id', deliveryBoyId);
      
    if (error) {
      console.error('Error setting status:', error);
      throw error;
    }
  },

  /**
   * Updates an order status from the delivery boy side
   */
  async updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }

    // Also inject order status history
    await supabase.from('order_status_history').insert([{
      order_id: orderId,
      status,
      note: `Status updated to ${status} by Delivery Service`,
    }]);
  }
};
