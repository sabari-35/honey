import { create } from 'zustand';
import type { Profile } from '../types/database.types';

interface AuthState {
  user: any | null; // Supabase auth.users
  profile: Profile | null;
  setAuth: (user: any | null, profile: Profile | null) => void;
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  setAuth: (user, profile) => set({ user, profile }),
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
}));
