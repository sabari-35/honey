import { useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';

type ActivityType = 'view' | 'cart' | 'purchase' | 'search' | 'recommendation_click';

interface PendingEvent {
  product_id: string;
  activity_type: ActivityType;
  metadata?: Record<string, any>;
}

// Retrieve or create a guest session ID for cold-start tracking
function getSessionId(): string {
  let sessionId = localStorage.getItem('rec_session_id');
  if (!sessionId) {
    sessionId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem('rec_session_id', sessionId);
  }
  return sessionId;
}

export function useAnalytics() {
  const { user } = useAuthStore();
  const pendingEvents = useRef<PendingEvent[]>([]);
  const flushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const events = pendingEvents.current.splice(0);
    if (!events.length) return;

    const sessionId = getSessionId();
    const rows = events.map((event) => ({
      product_id: event.product_id,
      activity_type: event.activity_type,
      user_id: user?.id || null,
      session_id: sessionId,
      metadata: event.metadata || {},
    }));

    await supabase.from('user_activity').insert(rows);
  }, [user]);

  const trackEvent = useCallback(
    (productId: string, type: ActivityType, metadata?: Record<string, any>) => {
      // Debounce view events to prevent double-counting on re-renders
      if (type === 'view') {
        const recentViews: string[] = JSON.parse(sessionStorage.getItem('recent_views') || '[]');
        const viewKey = `${productId}-${Math.floor(Date.now() / 60000)}`; // once per minute per product
        if (recentViews.includes(viewKey)) return;
        sessionStorage.setItem('recent_views', JSON.stringify([...recentViews.slice(-50), viewKey]));
      }

      pendingEvents.current.push({ product_id: productId, activity_type: type, metadata });

      // Batch flush after 3 seconds of inactivity
      if (flushTimeout.current) clearTimeout(flushTimeout.current);
      flushTimeout.current = setTimeout(flush, 3000);

      // Force immediate flush on purchase or cart events
      if (type === 'purchase' || type === 'cart') {
        if (flushTimeout.current) clearTimeout(flushTimeout.current);
        flush();
      }
    },
    [flush]
  );

  return { trackEvent, getSessionId };
}
