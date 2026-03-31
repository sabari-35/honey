import type { Product } from './database.types';

export interface CartItem {
  product: Product;
  quantity: number;
}
