import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { StarRating } from './StarRating';
import { Button } from '../ui/Button';
import { MessageSquare, Calendar, User, CornerDownRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null);

  // Fetch reviews with profile info (requires public read on profiles)
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles (full_name, avatar_url),
          product_review_replies (
            *,
            profiles (full_name, avatar_url)
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Realtime subscription for reviews
  useEffect(() => {
    const channel = supabase
      .channel(`reviews-${productId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_reviews', filter: `product_id=eq.${productId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_review_replies' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to leave a review.');
    if (!comment.trim()) return toast.error('Please add a comment.');

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim(),
      });

      if (error) throw error;

      toast.success('Review extracted to the vault! Thank you.');
      setComment('');
      setRating(5);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to reply.');
    if (!replyText[reviewId]?.trim()) return toast.error('Please add a reply.');

    try {
      setIsSubmittingReply(reviewId);
      const { error } = await supabase.from('product_review_replies').insert({
        review_id: reviewId,
        user_id: user.id,
        comment: replyText[reviewId].trim(),
      });

      if (error) throw error;

      toast.success('Reply submitted.');
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      setReplyingTo(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit reply.');
    } finally {
      setIsSubmittingReply(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Review permanently deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review.');
    }
  };

  const averageRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  return (
    <div className="space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-glass-border pb-8">
        <div>
          <h2 className="font-display text-4xl text-text-primary uppercase tracking-widest">Vault Feedback</h2>
          <p className="text-text-muted text-sm mt-1 uppercase tracking-widest font-black">Verified Purchase Intel</p>
        </div>
        <div className="flex items-center gap-4 neumorphic-panel px-6 py-4 rounded-3xl">
          <div className="text-3xl font-display text-gold-primary">{averageRating}</div>
          <div className="space-y-1">
            <StarRating rating={Number(averageRating)} size={14} />
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Based on {reviews?.length || 0} manifest logs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Review List */}
        <div className="lg:col-span-7 space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-glass-border/10 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : !reviews?.length ? (
            <div className="py-20 text-center neumorphic-inset rounded-[2.5rem] flex flex-col items-center justify-center opacity-40">
              <MessageSquare size={40} className="mb-4 text-text-muted" />
              <p className="font-display tracking-[0.2em] text-lg uppercase">Zero Manifests Recorded</p>
              <p className="text-xs text-text-muted mt-2">Become the first to verify this nectar.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div 
                key={review.id} 
                className="p-8 rounded-[2rem] bg-gradient-to-b from-surface-2/40 to-transparent border border-glass-border hover:border-gold-primary/20 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-text-primary font-bold">{review.profiles?.full_name || 'Anonymous Collector'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size={10} />
                        <span className="text-[10px] text-text-muted uppercase tracking-tighter opacity-60">Verified Extraction</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted text-[10px] uppercase font-bold tracking-widest">
                    <Calendar size={10} />
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-text-secondary leading-relaxed font-sans italic opacity-80 pl-2 border-l-2 border-gold-primary/20">
                  "{review.comment}"
                </p>

                {/* Actions */}
                <div className="mt-4 flex justify-end items-center">
                  {user?.id === review.user_id && (
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteReview(review.id)} 
                      className="text-xs uppercase tracking-widest gap-2 text-danger hover:bg-danger/10 opacity-70 hover:opacity-100 mr-2"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)} 
                    className="text-xs uppercase tracking-widest gap-2 opacity-50 hover:opacity-100"
                  >
                    <MessageSquare size={14} /> {replyingTo === review.id ? 'Cancel Reply' : 'Reply'}
                  </Button>
                </div>

                {/* Reply Form */}
                {replyingTo === review.id && (
                  <form onSubmit={(e) => handleSubmitReply(e, review.id)} className="mt-6 flex flex-col gap-3">
                     <textarea
                       value={replyText[review.id] || ''}
                       onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                       placeholder="Share your thoughts..."
                       className="w-full bg-obsidian/30 border border-glass-border focus:border-gold-primary/50 rounded-2xl p-4 min-h-[100px] text-text-primary text-sm resize-none outline-none"
                     />
                     <div className="flex justify-end pt-2">
                       <Button type="submit" isLoading={isSubmittingReply === review.id} className="h-10 px-6 text-xs uppercase tracking-widest">
                         Post Reply
                       </Button>
                     </div>
                  </form>
                )}

                {/* Nested Replies */}
                {review.product_review_replies && review.product_review_replies.length > 0 && (
                  <div className="mt-6 pl-4 md:pl-6 border-l border-glass-border/30 space-y-4">
                    {review.product_review_replies.map((reply: any) => (
                       <div key={reply.id} className="p-4 rounded-2xl bg-surface-2/20 border border-glass-border/30 relative">
                         <div className="absolute -left-4 md:-left-6 top-6 text-glass-border/50">
                           <CornerDownRight size={16} />
                         </div>
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded border border-gold-primary/20 flex items-center justify-center text-gold-primary/80">
                               <User size={12} />
                             </div>
                             <div>
                               <p className="text-xs text-text-primary font-bold">{reply.profiles?.full_name || 'Anonymous'}</p>
                             </div>
                           </div>
                           <div className="text-text-muted text-[9px] uppercase font-bold tracking-widest opacity-60">
                             {new Date(reply.created_at).toLocaleDateString()}
                           </div>
                         </div>
                         <p className="text-text-secondary leading-relaxed text-sm mt-2 font-sans pl-1">
                           {reply.comment}
                         </p>
                       </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Write Review Form */}
        <div className="lg:col-span-5">
           <div className="sticky top-32 neumorphic-panel p-10 rounded-[2.5rem] border border-gold-primary/10">
              {user ? (
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <h3 className="font-display text-xl text-text-primary uppercase tracking-widest mb-4">Post Feedback</h3>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Your Rating</p>
                    <div className="p-4 bg-obsidian/50 rounded-2xl border border-glass-border">
                      <StarRating 
                        rating={rating} 
                        editable 
                        onChange={setRating} 
                        size={24} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Observations</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your sensorial experience with this extraction..."
                      className="w-full bg-obsidian/50 border border-glass-border focus:border-gold-primary/50 rounded-2xl p-4 min-h-[140px] text-text-primary placeholder:text-text-muted outline-none transition-all font-sans text-sm resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 font-black uppercase tracking-widest"
                    isLoading={isSubmitting}
                  >
                    Seal Manifest
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8 space-y-6">
                   <div className="w-16 h-16 rounded-full bg-glass-border/10 flex items-center justify-center mx-auto opacity-40">
                      <User size={28} className="text-text-muted" />
                   </div>
                   <p className="text-text-muted text-sm uppercase tracking-widest font-black leading-relaxed">
                     Vault Authentication Required To Record Metadata.
                   </p>
                   <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/login'}>
                     Sign In
                   </Button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
