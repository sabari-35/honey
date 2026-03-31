import { create } from 'zustand';

interface UiState {
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCartOpen: false,
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
}));
