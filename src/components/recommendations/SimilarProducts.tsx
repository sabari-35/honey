import { LayoutGrid } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { ProductCarousel } from './ProductCarousel';

interface SimilarProductsProps {
  productId: string;
}

export function SimilarProducts({ productId }: SimilarProductsProps) {
  const { data, isLoading } = useRecommendations({
    mode: 'similar',
    productId,
    limit: 6,
  });

  if (!isLoading && !data?.length) return null;

  return (
    <section className="py-12 border-t border-glass-border">
      <div className="flex items-center gap-2 mb-8">
        <LayoutGrid size={18} className="text-gold-primary" />
        <span className="text-gold-primary text-xs font-bold uppercase tracking-widest">You May Also Like</span>
      </div>
      <ProductCarousel
        title="Similar Products"
        subtitle="Matched by flavor profile & category"
        products={data || []}
        isLoading={isLoading}
      />
    </section>
  );
}
