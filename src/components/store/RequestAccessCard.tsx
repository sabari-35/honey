import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStoreAccess } from '../../hooks/store/useStoreAccess';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function RequestAccessCard() {
  const { requestAccess, isLoading, request } = useStoreAccess();
  const navigate = useNavigate();

  const handleRequest = async () => {
    try {
      await requestAccess();
      toast.success('Access request submitted');
      navigate('/store-access-pending');
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  if (request?.status === 'pending') {
    return (
      <Button 
        variant="ghost" 
        onClick={() => navigate('/store-access-pending')}
        className="w-full justify-between"
      >
        <span>Access Pending</span>
        <ArrowRight size={18} />
      </Button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neumorphic-panel p-6 rounded-3xl space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl neumorphic-inset flex items-center justify-center text-gold-primary">
          <ShieldCheck size={18} />
        </div>
        <div>
          
          <h3 className="text-text-primary font-bold">Secured</h3>
          
        </div>
      </div>
      
      <Button 
        variant="gold" 
        onClick={handleRequest} 
        disabled={isLoading}
        className="w-full flex items-center gap-2"
      >
        <span>{isLoading ? 'Requesting...' : 'Enter Store Mode'}</span>
        <ArrowRight size={18} />
      </Button>
    </motion.div>
  );
}
