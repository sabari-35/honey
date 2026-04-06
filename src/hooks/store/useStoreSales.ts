import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeService } from '../../services/store/storeService';
import { supabase } from '../../config/supabase';
import { StoreProduct } from '../../types/store';
import toast from 'react-hot-toast';

export function useStoreSales() {
  const queryClient = useQueryClient();

  // 1. Fetch Products with Cache & Realtime
  const { data: products = [], isLoading: isProductsLoading } = useQuery<StoreProduct[]>({
    queryKey: ['store-products'],
    queryFn: storeService.getProducts,
    staleTime: 1000 * 60 * 60, // 1 hour (Realtime invalidates it anyway)
  });

  // 2. Fetch Sales History with Cache & Realtime
  const { data: sales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['store-sales'],
    queryFn: storeService.getSales,
    staleTime: 1000 * 60 * 60,
  });

  // 3. Fetch My Ledger for Outstanding Balances
  const { data: myLedger, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['store-ledger-me'],
    queryFn: async () => {
       const user = (await supabase.auth.getUser()).data.user;
       if (!user) return null;
       // getLedgers fetches aggregated sales & payments
       // RLS ensures storekeepers only get their own data, but Admins get all
       const allLedgers = await storeService.getLedgers();
       return allLedgers.find(l => l.storekeeper_id === user.id) || { totalRevenue: 0, totalPaid: 0, outstandingBalance: 0 };
    },
    staleTime: 1000 * 60 * 60,
  });

  // Enable Realtime Subscriptions
  useEffect(() => {
    const productsChannel = supabase
      .channel('store-products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['store-products'] });
      })
      .subscribe();

    const salesChannel = supabase
      .channel('store-sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_sales' }, () => {
        queryClient.invalidateQueries({ queryKey: ['store-sales'] });
        queryClient.invalidateQueries({ queryKey: ['store-ledger-me'] });
      })
      .subscribe();

    const ledgerChannel = supabase
      .channel('store-ledger-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_ledger' }, () => {
        queryClient.invalidateQueries({ queryKey: ['store-ledger-me'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(ledgerChannel);
    };
  }, [queryClient]);

  // Mutations
  const { mutateAsync: sellProduct } = useMutation({
    mutationFn: ({ productId, quantity, price }: { productId: string, quantity: number, price: number }) => 
      storeService.recordSale(productId, quantity, price),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['store-products'] });
      const previousProducts = queryClient.getQueryData(['store-products']);
      
      // Optimistic update for blazing fast UI
      queryClient.setQueryData(['store-products'], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => p.id === productId ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - quantity) } : p);
      });
      return { previousProducts };
    },
    onError: (err, newSale, context) => {
       toast.error('Failed to record sale');
       if (context?.previousProducts) {
         queryClient.setQueryData(['store-products'], context.previousProducts);
       }
    },
    onSuccess: () => {
       toast.success('Sale recorded');
       queryClient.invalidateQueries({ queryKey: ['store-sales'] });
       queryClient.invalidateQueries({ queryKey: ['store-ledger-me'] });
    }
  });

  const { mutateAsync: addProduct } = useMutation({
    mutationFn: storeService.addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
      toast.success('Product added successfully!');
    },
    onError: (error: any) => {
      const errorMsg = error?.message || 'Failed to create product';
      toast.error(`Error: ${errorMsg}`);
    }
  });

  const { mutateAsync: updateStock } = useMutation({
    mutationFn: ({ id, qty }: { id: string, qty: number }) => storeService.updateStock(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
      toast.success('Stock updated');
    },
    onError: () => {
      toast.error('Failed to update stock');
    }
  });

  return {
    products,
    sales,
    myLedger,
    isProductsLoading,
    isSalesLoading,
    // Methods mapped for easier consumption
    fetchProducts: () => queryClient.invalidateQueries({ queryKey: ['store-products'] }),
    fetchSales: () => queryClient.invalidateQueries({ queryKey: ['store-sales'] }),
    sellProduct: (id: string, qty: number, price: number) => sellProduct({ productId: id, quantity: qty, price }),
    addProduct,
    updateStock: (id: string, qty: number) => updateStock({ id, qty })
  };
}
