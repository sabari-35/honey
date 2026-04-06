import { supabase } from '../../config/supabase';
import { StoreAccessRequest, StoreAccessStatus } from '../../types/store';

export const accessService = {
  async getMyRequest(): Promise<StoreAccessRequest | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('store_access_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching access request:', error);
      return null;
    }

    return data;
  },

  async requestAccess(): Promise<StoreAccessRequest | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if there's an existing pending or approved request
    const existing = await this.getMyRequest();
    if (existing && (existing.status === 'pending' || (existing.status === 'approved' && (!existing.expires_at || new Date(existing.expires_at) > new Date())))) {
      return existing;
    }

    const { data, error } = await supabase
      .from('store_access_requests')
      .insert([
        {
          user_id: user.id,
          status: 'pending',
          requested_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error requesting access:', error);
      throw error;
    }

    return data;
  },

  async getAllRequests(): Promise<StoreAccessRequest[]> {
    const { data, error } = await supabase
      .from('store_access_requests')
      .select('*, profiles(full_name, avatar_url)')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching all requests:', error);
      throw error;
    }

    return data || [];
  },

  async updateRequestStatus(requestId: string, status: StoreAccessStatus, durationHours?: number): Promise<void> {
    const updates: any = { status };
    
    if (status === 'approved') {
      updates.approved_at = new Date().toISOString();
      if (durationHours) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);
        updates.expires_at = expiresAt.toISOString();
      }
    }

    const { error } = await supabase
      .from('store_access_requests')
      .update(updates)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }
};
