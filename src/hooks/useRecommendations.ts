import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';
import { useAnalytics } from './useAnalytics';

type RecommendationMode = 'trending' | 'hybrid' | 'similar' | 'frequently_bought' | 'featured';

interface UseRecommendationsOptions {
  mode: RecommendationMode;
  productId?: string; // used for 'similar' and 'frequently_bought'
  limit?: number;
  enabled?: boolean;
}

export function useRecommendations({ mode, productId, limit = 6, enabled = true }: UseRecommendationsOptions) {
  const { user } = useAuthStore();
  const { getSessionId } = useAnalytics();
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['recommendations', mode, productId, user?.id],
    queryFn: async () => {
      const sessionId = getSessionId();

      if (mode === 'trending') {
        const { data, error } = await supabase.rpc('get_trending_products', { p_limit: limit });
        if (error) throw error;
        if (!data?.length) return getTrendingFallback(limit);
        return data;
      }

      if (mode === 'hybrid') {
        const { data, error } = await supabase.rpc('get_hybrid_recommendations', {
          p_user_id: user?.id || null,
          p_session_id: sessionId,
          p_limit: limit,
        });
        if (error) throw error;
        if (!data?.length) return getFeaturedFallback(limit);
        return data;
      }

      if (mode === 'similar' && productId) {
        const { data, error } = await supabase.rpc('get_similar_products', {
          p_product_id: productId,
          p_limit: limit,
        });
        if (error) throw error;
        return data || [];
      }

      if (mode === 'frequently_bought' && productId) {
        const { data, error } = await supabase.rpc('get_frequently_bought_together', {
          p_product_id: productId,
          p_limit: limit,
        });
        if (error) throw error;
        return data || [];
      }

      if (mode === 'featured') {
        return getFeaturedFallback(limit);
      }

      return [];
    },
    staleTime: mode === 'trending' ? 1000 * 60 * 5 : 1000 * 60 * 2, // trending: 5min cache, hybrid: 2min
    enabled,
  });

  // Real-time debounced subscription to user_activity changes
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel(`recommendations-realtime-${mode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activity' },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', mode] });
          }, 5000); // 5 second debounce to avoid thrashing
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [mode, queryClient]);

  return result;
}

async function getTrendingFallback(limit: number) {
  const { data } = await supabase.rpc('get_featured_fallback', { p_limit: limit });
  return data || [];
}

async function getFeaturedFallback(limit: number) {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, images, category, tags, stock_quantity, featured')
    .eq('is_active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
