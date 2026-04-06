import { motion } from 'framer-motion';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStoreAccess } from '../hooks/store/useStoreAccess';
import { useRealtimeAccess } from '../hooks/store/useRealtimeAccess';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function StoreAccessPending() {
  const navigate = useNavigate();
  const { request, isApproved, isRejected, isLoading } = useStoreAccess();

  // Handle real-time updates
  useRealtimeAccess((updatedRequest) => {
    if (updatedRequest.status === 'approved') {
      toast.success('Access approved! Entering Store Mode...');
      navigate('/store-mode');
    } else if (updatedRequest.status === 'rejected') {
      toast.error('Access request was rejected.');
    }
  });

  useEffect(() => {
    if (!isLoading && isApproved) {
      navigate('/store-mode');
    }
  }, [isApproved, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-3xl neumorphic-panel flex items-center justify-center mx-auto text-gold-primary mb-8"
        >
          <ShieldAlert size={48} className="animate-pulse" />
        </motion.div>

        <div className="space-y-4">
          <h1 className="font-display text-3xl text-gold-primary tracking-widest uppercase">
            Vault Access Pending
          </h1>
          <p className="text-text-secondary">
            Your request to enter Store Mode is being reviewed by an administrator. Please wait.
          </p>
        </div>

        <div className="neumorphic-panel p-8 rounded-3xl flex flex-col items-center gap-6">
          <Loader2 className="text-gold-primary animate-spin" size={32} />
          <div className="text-xs text-text-muted uppercase tracking-[0.2em] font-black">
            Listening for approval...
          </div>
          
          {isRejected && (
            <div className="bg-danger/10 border border-danger/30 p-4 rounded-2xl text-danger text-sm font-bold w-full">
              Your request was rejected. Please contact an admin.
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 mx-auto text-text-muted hover:text-gold-primary transition-colors font-bold uppercase tracking-widest text-xs"
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>
      </div>
    </div>
  );
}
