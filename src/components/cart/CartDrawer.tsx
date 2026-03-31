import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, selectSubtotal, selectTotalItems } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUiStore();
  const { items, updateQuantity, removeItem } = useCartStore();
  const navigate = useNavigate();

  // Compute inline from items array — avoids any serialization issues
  const computedSubtotal = selectSubtotal(items);
  const computedTotalItems = selectTotalItems(items);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[45] bg-obsidian/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0F0F12] border-l border-glass-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-gold-primary" />
                <h2 className="font-display text-xl text-gold-primary tracking-widest uppercase">
                  Your Vault Cart
                </h2>
                {computedTotalItems > 0 && (
                  <span className="bg-gold-primary text-obsidian text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {computedTotalItems}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setCartOpen(false)} 
                className="p-2 -mr-2 text-text-secondary hover:text-gold-primary transition-all duration-300 cursor-pointer rounded-full hover:bg-gold-primary/10"
                aria-label="Close cart"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                  <div className="w-20 h-20 rounded-2xl neumorphic-inset flex items-center justify-center">
                    <ShoppingBag size={32} className="text-text-muted opacity-50" />
                  </div>
                  <div>
                    <p className="text-text-muted font-display text-lg tracking-widest mb-2">Vault is Empty</p>
                    <p className="text-text-muted text-sm">Add items from the shop to get started.</p>
                  </div>
                  <Button variant="ghost" onClick={() => { setCartOpen(false); navigate('/shop'); }}>
                    Explore the Vault
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 neumorphic-panel rounded-2xl">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 neumorphic-inset">
                      <img
                        src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="text-sm font-bold text-text-primary truncate">{item.product.name}</h3>
                        <p className="text-sm font-bold text-gold-primary shrink-0">
                          {formatCurrency(Number(item.product.price) * item.quantity)}
                        </p>
                      </div>
                      <p className="text-xs text-text-muted">{formatCurrency(Number(item.product.price))} each</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 border border-glass-border rounded-xl bg-obsidian overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="p-2 text-text-secondary hover:text-gold-light hover:bg-gold-primary/10 transition-colors cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-4 text-sm text-text-primary font-bold min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-2 text-text-secondary hover:text-gold-light hover:bg-gold-primary/10 transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-text-muted hover:text-danger p-2 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-glass-border bg-[#1A1A1E]">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Subtotal ({computedTotalItems} items)</span>
                    <span className="text-2xl font-display text-gold-primary">{formatCurrency(computedSubtotal)}</span>
                  </div>
                  <p className="text-xs text-text-muted">Shipping & taxes calculated at checkout.</p>
                </div>
                <Button
                  className="w-full h-14 text-base font-bold tracking-widest"
                  size="lg"
                  onClick={() => {
                    setCartOpen(false);
                    navigate('/checkout');
                  }}
                >
                  Proceed to Checkout — {formatCurrency(computedSubtotal)}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
