import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export interface LocationData {
  id: string;
  delivery_boy_id: string;
  order_id: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

export function useDeliveryTracking(orderId: string) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [deliveryBoy, setDeliveryBoy] = useState<{ full_name: string; phone: string; vehicle_details: string } | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial assignment & boy details if any
    const fetchInitialData = async () => {
      const { data: assignmentData } = await supabase
        .from('delivery_assignments')
        .select('*, delivery_boy:delivery_boys(full_name, phone, vehicle_details)')
        .eq('order_id', orderId)
        .eq('status', 'accepted')
        .single();

      if (assignmentData) {
        setStatus(assignmentData.status);
        setDeliveryBoy(assignmentData.delivery_boy as any);
      }

      // Fetch latest location
      const { data: locationData } = await supabase
        .from('delivery_locations')
        .select('*')
        .eq('order_id', orderId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (locationData) {
        setLocation(locationData as LocationData);
      }
    };

    fetchInitialData();

    // Subscribe to realtime location updates
    const locationChannel = supabase
      .channel(`delivery_locations:order_id=eq.${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setLocation(payload.new as LocationData);
        }
      )
      .subscribe();

    // Subscribe to delivery_assignments changes to detect when it's assigned/completed
    const assignmentChannel = supabase
      .channel(`delivery_assignments:order_id=eq.${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${orderId}`,
        },
        async (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setStatus(payload.new.status);
            if (payload.new.delivery_boy_id && !deliveryBoy) {
              const { data } = await supabase
                .from('delivery_boys')
                .select('full_name, phone, vehicle_details')
                .eq('id', payload.new.delivery_boy_id)
                .single();
              setDeliveryBoy(data as any);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(assignmentChannel);
    };
  }, [orderId]);

  return { location, status, deliveryBoy };
}
