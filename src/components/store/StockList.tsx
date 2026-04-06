import { StoreProduct } from '../../types/store';
import { ProductSellCard } from './ProductSellCard';

interface StockListProps {
  products: StoreProduct[];
  onSell: (productId: string, price: number, qty: number) => void;
  isLoading: boolean;
}

export function StockList({ products, onSell, isLoading }: StockListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 w-full neumorphic-panel rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-text-muted font-display tracking-widest uppercase text-sm">No inventory found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h3 className="text-xs text-text-muted uppercase tracking-[0.2em] font-black mb-2 ml-2">Available Stock</h3>
      {products.map(product => (
        <ProductSellCard 
          key={product.id} 
          product={product} 
          onSell={onSell} 
        />
      ))}
    </div>
  );
}
