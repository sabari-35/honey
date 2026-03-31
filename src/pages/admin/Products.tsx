import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import ProductFormModal from './../../components/admin/ProductFormModal';

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8 relative z-0">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-4xl text-gold-primary tracking-widest uppercase">Inventory Registry</h1>
          <Button onClick={handleCreate} size="lg" className="rounded-2xl gap-3"><Plus size={20}/> New Batch Extraction</Button>
        </div>

        <div className="neumorphic-panel p-2 rounded-3xl overflow-hidden">
          {isLoading ? (
            <p className="text-text-muted text-center py-24 font-display tracking-widest">Accessing Vault Dimensions...</p>
          ) : (
            <div className="overflow-x-auto rounded-3xl bg-[#1A1A1E] p-6 shadow-inner">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="text-text-secondary border-b border-glass-border">
                  <tr>
                    <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs">Origin Product</th>
                    <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs text-right">Value</th>
                    <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs text-center">Remaining Stock</th>
                    <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs text-center">Protocol Status</th>
                    <th className="pb-6 px-4 font-normal uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {products?.map((product: any) => (
                    <tr key={product.id} className="hover:bg-surface-2 transition-colors">
                      <td className="py-6 px-4 text-text-primary font-medium flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1E] border border-glass-border overflow-hidden neumorphic-inset flex shrink-0">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover mix-blend-lighten opacity-80" />
                          ) : (
                            <div className="w-full h-full bg-glass-border/10" />
                          )}
                        </div>
                        <div>
                           <p className="font-display text-lg text-gold-primary">{product.name}</p>
                           <p className="text-xs text-text-muted font-mono">{product.slug}</p>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-gold-light font-bold font-mono text-right">{formatCurrency(product.price)}</td>
                      <td className="py-6 px-4 text-center">
                        <span className={`font-mono text-lg font-bold ${product.stock_quantity <= product.low_stock_threshold ? 'text-danger animate-pulse' : 'text-success'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <Badge variant={product.is_active ? 'success' : 'neutral'}>
                           {product.is_active ? 'Active Flow' : 'Halted'}
                        </Badge>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <button onClick={() => handleEdit(product)} className="w-10 h-10 rounded-xl neumorphic-button inline-flex items-center justify-center text-text-secondary hover:text-gold-primary transition-colors cursor-pointer ml-auto">
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!products?.length && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center text-text-muted font-display tracking-widest text-lg">Inventory vault is entirely desolate.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct} 
      />
    </>
  );
}
