import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product: any;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.product.id === item.product.id);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.product.id === item.product.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.product.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i => i.product.id === id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'goldvault-cart-v2', // v2 forces a fresh localStorage entry, wiping stale broken state
      // Only persist items array - functions cannot be JSON serialized
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Selector helpers - use these in components instead of store functions
export const selectSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + (Number(item.product.price) || 0) * (Number(item.quantity) || 0), 0);

export const selectTotalItems = (items: CartItem[]) =>
  items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
