import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useEffect } from 'react';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderNumber, total } = location.state || {};

  useEffect(() => {
    if (!orderNumber) {
      navigate('/shop');
    }
  }, [orderNumber, navigate]);

  if (!orderNumber) return null;

  return (
    <div 
      className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 relative bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/success-bg.jpg)' }}
    >
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-[3px] pointer-events-none" />
      <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
        {/* Animated Checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8, bounce: 0.5 }}
          className="w-32 h-32 bg-gold-primary/10 rounded-full flex items-center justify-center mx-auto border border-gold-primary/30 relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <CheckCircle2 size={64} className="text-gold-primary" />
          </motion.div>
          
          {/* Animated rings */}
          <motion.div 
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 border border-gold-primary rounded-full"
          />
        </motion.div>

        <div className="space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl text-text-primary uppercase tracking-[0.15em]">Order Placed Successfully</h1>
          {/* <p className="text-text-secondary tracking-widest uppercase text-sm">Your extract from the vault is being prepared.</p> */}
        </div>

        {/* Order Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="neumorphic-panel p-8 rounded-3xl border border-glass-border space-y-6 max-w-md mx-auto"
        >
          <div className="flex justify-between items-center border-b border-glass-border pb-4">
            <span className="text-text-muted text-xs uppercase tracking-widest">Order ID</span>
            <span className="text-gold-primary font-mono font-bold">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center border-b border-glass-border pb-4">
            <span className="text-text-muted text-xs uppercase tracking-widest">Status</span>
            <span className="bg-success/20 text-success text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Confirmed</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted text-xs uppercase tracking-widest">Total Value</span>
            <span className="text-text-primary font-display text-2xl font-bold">₹{total}</span>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link to="/shop">
            <Button variant="ghost" className="gap-2 group">
              <ShoppingBag size={18} />
              Return to Shop
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </Link>
          <Link to="/orders">
            <Button className="gap-2">
              <Package size={18} />
              Track Package
            </Button>
          </Link>
        </div>

        <p className="text-text-muted text-xs tracking-widest uppercase pt-12">
          An encrypted receipt has been sent to your registered email.
        </p>

      </div>
    </div>
  );
}
