import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { supabase } from '../../config/supabase';
import { useQuery } from '@tanstack/react-query';
import { StarRating } from './StarRating';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product: initialProduct }: ProductCardProps) {
  const [product, setProduct] = useState(initialProduct);
  const { addItem } = useCartStore();
  const { setCartOpen } = useUiStore();

  // Fetch aggregate rating
  const { data: reviews } = useQuery({
    queryKey: ['product-reviews', product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', product.id);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5 // 5 min cache
  });

  const avgRating = reviews?.length 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;
  const reviewCount = reviews?.length || 0;

  // Subscribe to realtime stock changes for this product
  useEffect(() => {
    const channel = supabase
      .channel(`product-stock-${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`,
        },
        (payload) => {
          // Instantly update the local product state when stock changes
          setProduct((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock_quantity <= 0) return;
    addItem({ product, quantity: 1 });
    toast.success(`${product.name} added to vault!`);
    setCartOpen(true);
  };

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="group relative neumorphic-panel rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)] hover:-translate-y-1">
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block relative overflow-hidden aspect-square">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-glass-border/10 flex items-center justify-center">
            <Package size={48} className="text-text-muted opacity-40" />
          </div>
        )}

        {/* Overlays */}
        {product.featured && (
          <span className="absolute top-4 left-4 bg-gold-primary text-obsidian text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Featured
          </span>
        )}
        {product.compare_price > product.price && (
          <span className="absolute top-4 right-4 bg-danger text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Sale
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-obsidian/70 flex items-center justify-center">
            <span className="text-text-muted font-display text-lg tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-6 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-display text-xl text-text-primary group-hover:text-gold-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-gold-light font-mono">{formatCurrency(product.price)}</p>
            {product.compare_price > product.price && (
              <p className="text-xs text-text-muted line-through">{formatCurrency(product.compare_price)}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-text-muted text-xs leading-relaxed line-clamp-2 italic">{product.description}</p>
        )}

        {/* Rating & Stock */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <StarRating rating={avgRating} size={10} />
            <span className="text-[10px] text-text-muted font-bold">({reviewCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-danger' : isLowStock ? 'bg-warning animate-pulse' : 'bg-success'}`} />
            <span className={`text-[10px] uppercase tracking-widest font-black ${isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-success'}`}>
              {isOutOfStock ? 'Sold Out' : isLowStock ? 'Low Stock' : 'In Vault'}
            </span>
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer
            bg-gold-primary/10 border border-gold-primary/30 text-gold-primary 
            hover:bg-gold-primary hover:text-obsidian hover:border-gold-primary hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold-primary/10 disabled:hover:text-gold-primary"
        >
          <ShoppingBag size={16} />
          {isOutOfStock ? 'Sold Out' : 'Add to Vault'}
        </button>
      </div>
    </div>
  );
}
