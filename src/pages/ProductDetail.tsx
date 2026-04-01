import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Button } from '../components/ui/Button';
import { ReviewSection } from '../components/products/ReviewSection';
import { ShoppingBag, ArrowLeft, ShieldCheck, Droplet, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCartStore();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
       <div className="w-12 h-12 border-2 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin"></div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-4xl text-text-primary mb-6">Vault Entry Not Found</h1>
      <Link to="/shop">
        <Button variant="ghost">Return to Shop</Button>
      </Link>
    </div>
  );

  const handleAddToCart = () => {
    addItem({ product, quantity: 1 });
    toast.success(`${product.name} secured in vault!`);
  };

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="min-h-screen bg-obsidian pt-32 pb-24 relative overflow-hidden">
      
      {/* Dynamic Backgrounds */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-gold-primary/5 blur-[200px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Breadcrumbs */}
        <Link to="/shop" className="group flex items-center gap-2 text-text-muted hover:text-gold-primary transition-all mb-12">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Back to Shop</span>
        </Link>

        {/* Product Identity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-32">
          
          {/* Visuals (Left) */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-[3rem] overflow-hidden neumorphic-panel group"
            >
              {product.images?.[0]?.url ? (
                <img 
                  src={product.images[0].url} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full bg-glass-border/10 flex items-center justify-center">
                   <Droplet size={64} className="text-text-muted opacity-20" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Details (Right) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-10">
            <div className="space-y-4">
              <span className="text-gold-primary text-[10px] font-black tracking-[0.5em] uppercase px-4 py-2 rounded-full border border-gold-primary/20 bg-gold-primary/5">
                {product.category || 'Himalayan Reserve'}
              </span>
              <h1 className="font-display text-5xl md:text-7xl text-text-primary leading-[1.1] uppercase tracking-tighter">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 text-gold-light mt-4">
                 <p className="text-3xl font-display font-bold">{formatCurrency(product.price)}</p>
                 {product.compare_price > product.price && (
                   <p className="text-lg text-text-muted line-through opacity-50">{formatCurrency(product.compare_price)}</p>
                 )}
              </div>
            </div>

            <p className="text-text-secondary text-base leading-relaxed opacity-80 font-sans tracking-wide italic">
              {product.description || 'Description not extracted.'}
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="neumorphic-inset p-6 rounded-3xl space-y-2">
                <ShieldCheck size={20} className="text-gold-primary" />
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Purity Verified</p>
                <p className="text-xs text-text-primary font-bold">100% Raw Cold-Pressed</p>
              </div>
              <div className="neumorphic-inset p-6 rounded-3xl space-y-2">
                <Star size={20} className="text-gold-primary" />
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Extraction Quality</p>
                <p className="text-xs text-text-primary font-bold">Grade A - Micro-Batch</p>
              </div>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOutOfStock ? 'bg-danger' : 'bg-success animate-pulse'}`} />
                <span className={`text-[10px] uppercase font-black tracking-[0.4em] ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
                   {isOutOfStock ? 'Sold Out / Manifest Sealed' : `${product.stock_quantity} units Available in the Vault`}
                </span>
              </div>
              <Button 
                onClick={handleAddToCart} 
                className="w-full h-16 text-lg tracking-widest font-black uppercase rounded-2xl"
                disabled={isOutOfStock}
              >
                <ShoppingBag className="mr-3" />
                {isOutOfStock ? 'Closed Manifest' : 'Add to Vault'}
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Manifest */}
        <div className="mt-32 border-t border-glass-border pt-32">
          <ReviewSection productId={product.id} />
        </div>

      </div>
    </div>
  );
}
