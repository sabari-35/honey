import { UserRole } from './database.types';

export type StoreAccessStatus = 'pending' | 'approved' | 'rejected';

export interface StoreAccessRequest {
  id: string;
  user_id: string;
  status: StoreAccessStatus;
  requested_at: string;
  approved_at?: string | null;
  expires_at?: string | null;
  // Join with profile
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface StoreSale {
  id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  price_at_sale: number;
  created_at: string;
  // Join with product
  products?: {
    name: string;
    images?: any;
  };
}

export interface StoreProduct {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  images: any;
  slug: string;
}
