import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { ProductCard } from '../components/products/ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const queryClient = useQueryClient();

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products', sortBy],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-obsidian pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold-primary text-xs tracking-[0.4em] uppercase mb-4 font-bold">Reserve Collection</p>
          {/* <h1 className="font-display text-5xl md:text-6xl text-text-primary mb-6">The Vault</h1> */}
          {/* <p className="text-text-secondary max-w-xl mx-auto tracking-wide">
            Explore our curated selection of premium, raw, cold-pressed honey — ethically sourced and delivered from the hive.
          </p> */}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search the vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full neumorphic-inset pl-12 pr-6 py-4 text-text-primary placeholder-text-muted outline-none focus:border-gold-primary/50 border border-glass-border rounded-2xl transition-colors font-sans"
            />
          </div>
          <div className="relative flex items-center gap-3 neumorphic-inset border border-glass-border rounded-2xl px-5">
            <SlidersHorizontal size={16} className="text-text-muted shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-text-secondary text-sm py-4 outline-none cursor-pointer min-w-[160px]"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="neumorphic-panel rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-glass-border/20" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-glass-border/20 rounded-lg w-3/4" />
                  <div className="h-4 bg-glass-border/10 rounded-lg w-1/2" />
                  <div className="h-10 bg-glass-border/10 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-24">
            <p className="text-danger font-display text-xl tracking-widest">Failed to load the vault. Check your connection.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {filteredProducts?.length === 0 ? (
              <div className="text-center py-32 space-y-4">
                <p className="font-display text-3xl text-text-muted tracking-widest uppercase">
                  {searchQuery ? 'No matches found' : 'The vault is empty'}
                </p>
                <p className="text-text-secondary">
                  {searchQuery ? `No products match "${searchQuery}"` : 'Products will appear here once added by the vault keeper.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-text-muted text-sm mb-8 tracking-widest uppercase">
                  {filteredProducts?.length} {filteredProducts?.length === 1 ? 'Extract' : 'Extracts'} Available
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredProducts?.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
