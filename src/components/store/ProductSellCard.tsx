import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Package, ShoppingCart } from 'lucide-react';
import { StoreProduct } from '../../types/store';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuthStore } from '../../store/authStore';

interface ProductSellCardProps {
  product: StoreProduct;
  onSell: (productId: string, price: number, qty: number) => void;
}

export function ProductSellCard({ product, onSell }: ProductSellCardProps) {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  const isOutOfStock = product.stock_quantity <= 0;
  const [qty, setQty] = useState(1);

  const handleSell = () => {
    if (isAdmin) return; // Admins cannot sell
    if (qty > 0 && qty <= product.stock_quantity) {
      onSell(product.id, product.price, qty);
      setQty(1); // reset after selling
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="neumorphic-panel px-4 py-5 rounded-3xl flex flex-col gap-4 group block"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl neumorphic-inset flex items-center justify-center overflow-hidden shrink-0">
          {product.images && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="text-gold-primary/30" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-text-primary font-bold truncate text-sm uppercase tracking-wider">{product.name}</h4>
          <p className="text-gold-primary font-black text-sm">{formatCurrency(product.price)}</p>
          <p className={`text-[10px] mt-1 font-bold ${isOutOfStock ? 'text-danger' : 'text-text-muted'}`}>
            STOCK: {product.stock_quantity}
          </p>
        </div>
      </div>

      {!isOutOfStock && (
        <div className="flex items-center justify-between border-t border-glass-border pt-4 mt-1">
          {/* Qty Selector */}
          <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-glass-border shadow-inner">
             <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-gold-primary transition-colors"
             >
                <Minus size={14} />
             </button>
             <span className="font-mono text-sm font-bold min-w-[20px] text-center text-text-primary">{qty}</span>
             <button 
                onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-gold-primary transition-colors"
             >
                <Plus size={14} />
             </button>
          </div>

          {/* Sell Button */}
          {isAdmin ? (
            <div className="h-10 px-6 rounded-xl bg-black/20 flex items-center gap-2 text-text-muted text-[10px] uppercase font-black tracking-widest border border-glass-border">
              Admin View Only
            </div>
          ) : (
            <button 
              onClick={handleSell}
              className="h-10 px-6 rounded-xl neumorphic-gold flex items-center gap-2 text-obsidian text-[10px] uppercase font-black tracking-widest active:scale-95 transition-all"
            >
              <ShoppingCart size={14} /> Sell {qty} 
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
