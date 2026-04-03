import { ShoppingCart } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { ProductCarousel } from './ProductCarousel';

interface FrequentlyBoughtTogetherProps {
  productId: string;
}

export function FrequentlyBoughtTogether({ productId }: FrequentlyBoughtTogetherProps) {
  const { data, isLoading } = useRecommendations({
    mode: 'frequently_bought',
    productId,
    limit: 4,
  });

  if (!isLoading && !data?.length) return null;

  return (
    <section className="py-12 border-t border-glass-border">
      <div className="flex items-center gap-2 mb-8">
        <ShoppingCart size={18} className="text-gold-primary" />
        <span className="text-gold-primary text-xs font-bold uppercase tracking-widest">Bundle Intelligence</span>
      </div>
      <ProductCarousel
        title="Frequently Bought Together"
        subtitle="Vault collectors also picked these"
        products={data || []}
        isLoading={isLoading}
      />
    </section>
  );
}
