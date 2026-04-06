import { useState, useEffect, useCallback } from 'react';
import { accessService } from '../../services/store/accessService';
import { StoreAccessRequest } from '../../types/store';
import { useAuthStore } from '../../store/authStore';

export function useStoreAccess() {
  const [request, setRequest] = useState<StoreAccessRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchRequest = useCallback(async () => {
    if (!user) return;
    try {
      const data = await accessService.getMyRequest();
      setRequest(data);
    } catch (error) {
      console.error('Failed to fetch store access request:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const requestAccess = async () => {
    setIsLoading(true);
    try {
      const newRequest = await accessService.requestAccess();
      setRequest(newRequest);
      return newRequest;
    } catch (error) {
      console.error('Failed to request store access:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isApproved = request?.status === 'approved' && (!request.expires_at || new Date(request.expires_at) > new Date());
  const isPending = request?.status === 'pending';
  const isRejected = request?.status === 'rejected';
  const isExpired = request?.expires_at && new Date(request.expires_at) <= new Date();

  return {
    request,
    isLoading,
    isApproved,
    isPending,
    isRejected,
    isExpired,
    requestAccess,
    refresh: fetchRequest,
  };
}
