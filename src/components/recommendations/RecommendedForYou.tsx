import { Sparkles } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { ProductCarousel } from './ProductCarousel';

export function RecommendedForYou() {
  const { data, isLoading } = useRecommendations({ mode: 'hybrid', limit: 8 });

  if (!isLoading && !data?.length) return null;

  return (
    <section className="py-12 border-t border-glass-border">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles size={18} className="text-gold-primary" />
        <span className="text-gold-primary text-xs font-bold uppercase tracking-widest">Personalized</span>
      </div>
      <ProductCarousel
        title="Recommended for You"
        subtitle="Based on your browsing pattern"
        products={data || []}
        isLoading={isLoading}
      />
    </section>
  );
}
