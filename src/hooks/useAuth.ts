import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';

async function fetchProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, phone, default_address, created_at')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[GoldVault] Profile fetch error:', err);
    return null;
  }
}

export function useAuthInit() {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    // 1. Check for existing session immediately on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile BEFORE unlocking the UI to ensure roles are correct from the first paint
          const profile = await fetchProfile(session.user.id);
          setAuth(session.user, profile ?? null);
        } else {
          setAuth(null, null);
        }
      } catch (err) {
        console.error('[GoldVault] Session error:', err);
        setAuth(null, null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[GoldVault] Auth Event: ${event}`);
      
      if (session?.user) {
        // If we already have the profile for this user, don't set to null (Atomic update)
        const profile = await fetchProfile(session.user.id);
        setAuth(session.user, profile ?? null);
        setLoading(false);
      } else {
        setAuth(null, null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
