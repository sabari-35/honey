import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { StarRating } from '../../components/products/StarRating';
import { Trash2, MessageSquare, Package, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles (full_name, avatar_url),
          products (name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to scrub this manifest from the vault?')) return;

    try {
      const { error } = await supabase.from('product_reviews').delete().eq('id', id);
      if (error) throw error;
      toast.success('Manifest successfully terminated.');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-glass-border/10 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl text-text-primary uppercase tracking-widest">Feedbacks</h1>
          
        </div>
        <div className="neumorphic-panel px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-2xl font-display text-gold-primary">{reviews?.length || 0}</div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Total Entries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {!reviews?.length ? (
          <div className="py-20 text-center neumorphic-inset rounded-[2.5rem] opacity-40">
            <MessageSquare size={40} className="mx-auto mb-4 text-text-muted" />
            <p className="font-display tracking-[0.2em] text-lg uppercase">Vault Is Quiet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div 
              key={review.id} 
              className="group neumorphic-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-gold-primary/30 transition-all border border-transparent"
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                {/* User Info */}
                <div className="w-12 h-12 rounded-xl neumorphic-inset flex items-center justify-center shrink-0 overflow-hidden">
                   {review.profiles?.avatar_url ? (
                     <img src={review.profiles.avatar_url} className="w-full h-full object-cover" />
                   ) : (
                     <User size={20} className="text-gold-primary" />
                   )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-text-primary font-bold truncate">{review.profiles?.full_name || 'Anonymous'}</p>
                    <StarRating rating={review.rating} size={10} />
                  </div>
                  <p className="text-text-secondary text-sm line-clamp-1 italic font-sans">"{review.comment}"</p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-gold-primary/60 text-[10px] uppercase font-black tracking-widest">
                       <Package size={12} />
                       {review.products?.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase font-bold tracking-widest">
                       <Calendar size={12} />
                       {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all group/del"
                  title="Delete Review"
                >
                  <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
