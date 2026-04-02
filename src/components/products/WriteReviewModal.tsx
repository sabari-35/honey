import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../ui/Modal';
import { StarRating } from './StarRating';
import { Button } from '../ui/Button';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function WriteReviewModal({ isOpen, onClose, productId, productName }: WriteReviewModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      setComment('');
      setRating(5);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review ${productName}`}>
      <div className="space-y-6 pt-4">
        {user ? (
          <form onSubmit={handleSubmitReview} className="space-y-6">
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
    </Modal>
  );
}
