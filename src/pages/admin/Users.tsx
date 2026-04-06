import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { Badge } from '../../components/ui/Badge';
import { Shield, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';

export default function Users() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Clients</h1>
      </div>

      <div className="neumorphic-panel p-2 rounded-3xl overflow-hidden">
        {isLoading ? (
          <p className="text-text-muted text-center py-24 font-display tracking-widest">Scanning Identities...</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-surface-1 p-6">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-text-secondary border-b border-glass-border">
                <tr>
                  <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs">Client's Identity</th>
                  <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs">Contact</th>
                  <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs text-center">Role</th>
                  <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs text-right">Joined at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-6 px-4 text-text-primary font-medium flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-obsidian border border-glass-border overflow-hidden neumorphic-inset flex items-center justify-center text-gold-primary">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <Shield size={18} />}
                      </div>
                      <span className="font-display tracking-widest">{user.full_name || 'Classified Identity'}</span>
                    </td>
                    <td className="py-6 px-4 text-text-muted font-mono text-xs">{user.phone || 'No Signal'}</td>
                    <td className="py-6 px-4 text-center">
                      {user.role === 'admin' ? (
                        <div className="inline-flex items-center gap-2 text-gold-primary border border-gold-primary/30 bg-gold-primary/5 px-3 py-1 rounded">
                           <ShieldAlert size={14} /> Admin
                        </div>
                      ) : (
                        <Badge variant="neutral">Client</Badge>
                      )}
                    </td>
                    <td className="py-6 px-4 text-right text-text-muted font-mono text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!users?.length && (
                  <tr>
                    <td colSpan={4} className="py-24 text-center text-text-muted font-display tracking-widest text-lg">No identities registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
