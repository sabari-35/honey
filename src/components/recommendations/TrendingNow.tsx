import { TrendingUp } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { ProductCarousel } from './ProductCarousel';

export function TrendingNow() {
  const { data, isLoading } = useRecommendations({ mode: 'trending', limit: 8 });

  if (!isLoading && !data?.length) return null;

  return (
    <section className="py-12 border-t border-glass-border">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp size={18} className="text-gold-primary" />
        <span className="text-gold-primary text-xs font-bold uppercase tracking-widest">Live Data</span>
      </div>
      <ProductCarousel
        title="Trending Now"
        subtitle="Real-time intelligence"
        products={data || []}
        isLoading={isLoading}
      />
    </section>
  );
}
