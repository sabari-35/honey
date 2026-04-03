import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { StarRating } from '../products/StarRating';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import toast from 'react-hot-toast';

interface RecProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  images?: { url: string }[];
  category?: string;
  tags?: string[];
  stock_quantity?: number;
  trending_score?: number;
  final_score?: number;
}

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: RecProduct[];
  isLoading?: boolean;
  onProductClick?: (productId: string) => void;
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-56 sm:w-64 neumorphic-panel rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-glass-border/20" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-glass-border/20 rounded-lg w-3/4" />
        <div className="h-3 bg-glass-border/10 rounded-lg w-1/2" />
        <div className="h-9 bg-glass-border/10 rounded-xl mt-2" />
      </div>
    </div>
  );
}

export function ProductCarousel({ title, subtitle, products, isLoading, onProductClick }: ProductCarouselProps) {
  const { addItem } = useCartStore();
  const { setCartOpen } = useUiStore();
  const { trackEvent } = useAnalytics();

  const handleAddToCart = (e: React.MouseEvent, product: RecProduct) => {
    e.preventDefault();
    if (!product.stock_quantity || product.stock_quantity <= 0) return;
    addItem({ product: product as any, quantity: 1 });
    toast.success(`${product.name} added to vault!`);
    trackEvent(product.id, 'cart');
    setCartOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="font-display text-2xl md:text-3xl text-text-primary uppercase tracking-widest">{title}</h2>
          {subtitle && <p className="text-text-muted text-xs mt-1 uppercase tracking-widest font-bold">{subtitle}</p>}
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : products.map((product, idx) => (
              <motion.div
                key={product.id}
                custom={idx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, type: 'spring', stiffness: 200, damping: 22 }}
                className="shrink-0 w-56 sm:w-64 snap-start"
              >
                <Link
                  to={`/product/${product.slug}`}
                  onClick={() => {
                    trackEvent(product.id, 'recommendation_click');
                    onProductClick?.(product.id);
                  }}
                  className="group block neumorphic-panel rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(212,175,55,0.12)]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-glass-border/10 flex items-center justify-center">
                        <Package size={32} className="text-text-muted opacity-30" />
                      </div>
                    )}
                    {product.category && (
                      <span className="absolute top-3 left-3 bg-obsidian/80 backdrop-blur-sm text-gold-primary text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-gold-primary/20">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-display text-base text-text-primary group-hover:text-gold-primary transition-colors leading-tight truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-gold-light font-mono">
                        {formatCurrency(product.price)}
                      </p>
                      {product.compare_price && product.compare_price > product.price && (
                        <p className="text-xs text-text-muted line-through">{formatCurrency(product.compare_price)}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200
                        bg-gold-primary/10 border border-gold-primary/30 text-gold-primary
                        hover:bg-gold-primary hover:text-obsidian hover:border-gold-primary
                        disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={!product.stock_quantity || product.stock_quantity <= 0}
                    >
                      <ShoppingBag size={12} />
                      {!product.stock_quantity || product.stock_quantity <= 0 ? 'Sold Out' : 'Add to Vault'}
                    </button>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
