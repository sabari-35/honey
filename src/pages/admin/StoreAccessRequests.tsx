import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessService } from '../../services/store/accessService';
import { format } from 'date-fns';
import { Check, X, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AccessStatusBadge } from '../../components/store/AccessStatusBadge';
import { useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function StoreAccessRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['store-access-requests'],
    queryFn: () => accessService.getAllRequests()
  });

  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_access_requests'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['store-access-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status, hours }: { id: string, status: 'approved' | 'rejected', hours?: number }) => 
      accessService.updateRequestStatus(id, status, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-access-requests'] });
      toast.success('Request updated');
    },
    onError: () => {
      toast.error('Failed to update request');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 w-full neumorphic-panel rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Access Vault</h1>
          <p className="text-text-secondary mt-2 uppercase text-[10px] tracking-[0.3em] font-black">Manage Store Mode Permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!requests || requests.length === 0 ? (
          <div className="neumorphic-panel p-12 text-center rounded-3xl">
            <p className="text-text-muted font-display tracking-widest uppercase">No access requests found</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="neumorphic-panel p-8 rounded-3xl flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl neumorphic-inset flex items-center justify-center overflow-hidden">
                  {req.profiles?.avatar_url ? (
                    <img src={req.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gold-primary/30" size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary uppercase tracking-wide">
                    {req.profiles?.full_name || 'Unknown User'}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Requested: {format(new Date(req.requested_at), 'MMM d, HH:mm')}
                    </span>
                    <AccessStatusBadge status={req.status} expiresAt={req.expires_at} />
                  </div>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => updateMutation.mutate({ id: req.id, status: 'rejected' })}
                    className="flex-1 md:flex-none h-12 px-6 rounded-2xl border border-danger/30 text-danger hover:bg-danger/10 transition-all font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => updateMutation.mutate({ id: req.id, status: 'approved', hours: 8 })}
                    className="flex-1 md:flex-none h-12 px-8 rounded-2xl neumorphic-gold text-obsidian font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Approve (8h)
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
