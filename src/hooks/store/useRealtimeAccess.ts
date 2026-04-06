import { useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { StoreAccessRequest } from '../../types/store';

export function useRealtimeAccess(onRequestUpdate: (request: StoreAccessRequest) => void) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`store_access:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_access_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          onRequestUpdate(payload.new as StoreAccessRequest);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onRequestUpdate]);
}
